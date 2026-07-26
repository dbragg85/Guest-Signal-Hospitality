#!/usr/bin/env node
/**
 * Draft Reddit comments (and optional value posts) from latest Apify signals.
 * Never publishes — creates approval_required drafts + ntfy Approve/Deny prompts.
 *
 *   npm run growth:reddit-draft
 *   REDDIT_DRAFT_INCLUDE_POST=1 npm run growth:reddit-draft
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  draftCommentForSignal,
  draftValuePost,
  isEngagementCandidate,
} from "./lib/reddit-engagement-copy.mjs";
import { postFullnameFromUrl } from "./lib/reddit-api.mjs";
import { listDrafts, newDraftId, saveDraft, draftsRoot } from "./lib/reddit-draft-store.mjs";

function envFlag(name) {
  return ["1", "true", "yes"].includes((process.env[name] || "").toLowerCase());
}

function loadLatestSignals() {
  const path = join(process.cwd(), ".operator", "reddit-signals", "latest.json");
  if (!existsSync(path)) {
    throw new Error("No Reddit signals yet. Run: npm run growth:reddit-signals");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

async function notifyDraft(draft) {
  const topic = (process.env.NTFY_TOPIC || "Guest_Signal").trim();
  const server = (process.env.NTFY_SERVER_URL || "https://ntfy.sh").replace(/\/+$/, "");
  const preview =
    draft.kind === "post"
      ? `${draft.title}\n\n${String(draft.text || "").slice(0, 500)}`
      : String(draft.text || "").slice(0, 700);

  const message = [
    `Account: u/${process.env.REDDIT_USERNAME || "GuestSignalHosp"}`,
    draft.kind === "comment"
      ? `Comment on r/${draft.subreddit}: ${draft.targetTitle || ""}`
      : `Post to r/${draft.subreddit}`,
    draft.targetUrl || "",
    "",
    preview,
    "",
    `Approve: npm run growth:reddit-approve -- --id=${draft.id}`,
    `Deny:    npm run growth:reddit-deny -- --id=${draft.id}`,
    `Publish approved: npm run growth:reddit-publish`,
  ]
    .filter(Boolean)
    .join("\n");

  /** @type {Record<string, string>} */
  const headers = {
    Title: `Reddit ${draft.kind} draft: r/${draft.subreddit}`,
    Priority: "default",
    Tags: "speech_balloon,reddit",
    "Content-Type": "text/plain",
  };
  const ntfyToken = process.env.NTFY_ACCESS_TOKEN?.trim();
  if (ntfyToken) headers.Authorization = `Bearer ${ntfyToken}`;

  const res = await fetch(`${server}/${topic}`, {
    method: "POST",
    headers,
    body: message,
  });
  if (!res.ok) {
    console.warn(`ntfy failed (${res.status}) for ${draft.id}`);
    return false;
  }
  return true;
}

async function main() {
  const maxDrafts = Math.max(1, Number(process.env.REDDIT_DRAFT_LIMIT || 3));
  const includePost = envFlag("REDDIT_DRAFT_INCLUDE_POST");
  const payload = loadLatestSignals();
  const signals = Array.isArray(payload.signals) ? payload.signals : [];

  const existing = listDrafts();
  const usedTargets = new Set(
    existing
      .filter((d) => ["approval_required", "approved", "published"].includes(d.status))
      .map((d) => d.targetUrl || d.parentFullname)
      .filter(Boolean),
  );

  const created = [];

  for (const signal of signals) {
    if (created.length >= maxDrafts) break;
    if (!isEngagementCandidate(signal)) continue;
    const parent = postFullnameFromUrl(signal.url || "");
    if (!parent) continue;
    if (usedTargets.has(signal.url) || usedTargets.has(parent)) continue;

    const copy = draftCommentForSignal(signal);
    if (!copy) continue;

    const draft = saveDraft({
      id: newDraftId(),
      status: "approval_required",
      kind: "comment",
      angle: copy.angle,
      subreddit: signal.community || "restaurant",
      parentFullname: parent,
      targetUrl: signal.url,
      targetTitle: signal.title,
      text: copy.text,
      account: process.env.REDDIT_USERNAME || "GuestSignalHosp",
      sourceSignalCollectedAt: payload.collectedAt || null,
    });
    usedTargets.add(signal.url);
    created.push(draft);
  }

  if (includePost && created.length < maxDrafts) {
    const post = draftValuePost(process.env.REDDIT_VALUE_SUBREDDIT || "restaurateurs");
    const fingerprint = createHash("sha1")
      .update(`${post.subreddit}:${post.title}`)
      .digest("hex")
      .slice(0, 12);
    const already = existing.some(
      (d) => d.kind === "post" && d.title === post.title && d.status !== "denied",
    );
    if (!already) {
      const draft = saveDraft({
        id: newDraftId(),
        status: "approval_required",
        kind: "post",
        angle: post.angle,
        subreddit: post.subreddit,
        title: post.title,
        text: post.text,
        fingerprint,
        account: process.env.REDDIT_USERNAME || "GuestSignalHosp",
      });
      created.push(draft);
    }
  }

  mkdirSync(draftsRoot(), { recursive: true });
  writeFileSync(
    join(draftsRoot(), "latest-batch.json"),
    JSON.stringify(
      {
        draftedAt: new Date().toISOString(),
        count: created.length,
        ids: created.map((d) => d.id),
      },
      null,
      2,
    ),
  );

  let notified = 0;
  if (!envFlag("REDDIT_DRAFT_SKIP_NTFY")) {
    for (const draft of created) {
      if (await notifyDraft(draft)) notified += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        drafted: created.length,
        notified,
        drafts: created.map((d) => ({
          id: d.id,
          kind: d.kind,
          subreddit: d.subreddit,
          angle: d.angle,
          targetUrl: d.targetUrl || null,
          title: d.title || d.targetTitle || null,
        })),
        next:
          created.length > 0
            ? "Approve with npm run growth:reddit-approve -- --id=<id> then npm run growth:reddit-publish"
            : "No new candidates (need review/ops threads in latest signals)",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
