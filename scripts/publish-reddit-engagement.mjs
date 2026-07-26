#!/usr/bin/env node
/**
 * Publish approved Reddit drafts via official API.
 *
 * Requires REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET + username/password.
 * Safety: only publishes status=approved; max REDDIT_PUBLISH_LIMIT (default 1).
 *
 *   npm run growth:reddit-publish
 *   npm run growth:reddit-publish -- --dry-run
 */

import {
  getRedditMe,
  redditApiConfigured,
  submitRedditComment,
  submitRedditTextPost,
} from "./lib/reddit-api.mjs";
import { listDrafts, setDraftStatus } from "./lib/reddit-draft-store.mjs";

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run") || ["1", "true", "yes"].includes((process.env.REDDIT_DRY_RUN || "").toLowerCase()),
    id: (() => {
      const eq = argv.find((a) => a.startsWith("--id="));
      if (eq) return eq.slice(5);
      const i = argv.indexOf("--id");
      return i >= 0 ? argv[i + 1] : "";
    })(),
  };
}

async function notifyPublished(draft, result) {
  const topic = (process.env.NTFY_TOPIC || "Guest_Signal").trim();
  const server = (process.env.NTFY_SERVER_URL || "https://ntfy.sh").replace(/\/+$/, "");
  const url = result.url || result.permalink || draft.targetUrl || "";
  const body = [
    `Published ${draft.kind} as u/${draft.account || process.env.REDDIT_USERNAME}`,
    `r/${draft.subreddit}`,
    url,
  ].join("\n");
  await fetch(`${server}/${topic}`, {
    method: "POST",
    headers: {
      Title: `Reddit ${draft.kind} published`,
      Tags: "white_check_mark,reddit",
      "Content-Type": "text/plain",
    },
    body,
  }).catch(() => {});
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = Math.max(1, Number(process.env.REDDIT_PUBLISH_LIMIT || 1));

  if (!redditApiConfigured()) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: "Reddit API not configured",
          need: [
            "Create a script app at https://www.reddit.com/prefs/apps",
            "Set REDDIT_CLIENT_ID (under app name) and REDDIT_CLIENT_SECRET",
            "Keep REDDIT_USERNAME / REDDIT_PASSWORD in .env.local + GitHub secrets",
          ],
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const me = await getRedditMe();
  console.log(`Authenticated as u/${me.name || process.env.REDDIT_USERNAME}`);

  let approved = listDrafts({ status: "approved" });
  if (args.id) approved = approved.filter((d) => d.id === args.id);
  approved = approved.slice(0, limit);

  if (!approved.length) {
    console.log(JSON.stringify({ ok: true, published: 0, message: "No approved drafts" }));
    return;
  }

  const results = [];
  for (const draft of approved) {
    if (args.dryRun) {
      results.push({ id: draft.id, dryRun: true, kind: draft.kind });
      continue;
    }

    try {
      let result;
      if (draft.kind === "post") {
        result = await submitRedditTextPost({
          subreddit: draft.subreddit,
          title: draft.title,
          text: draft.text,
        });
      } else {
        result = await submitRedditComment({
          parentFullname: draft.parentFullname,
          text: draft.text,
        });
      }

      const saved = setDraftStatus(draft.id, "published", {
        publishedAt: new Date().toISOString(),
        publishResult: {
          id: result.id,
          name: result.name,
          url: result.url || result.permalink || null,
        },
      });
      await notifyPublished(saved, result);
      results.push({
        id: draft.id,
        kind: draft.kind,
        url: result.url || result.permalink || null,
      });

      // Be kind to Reddit rate limits / anti-spam
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      setDraftStatus(draft.id, "failed", {
        failedAt: new Date().toISOString(),
        error: err?.message || String(err),
      });
      results.push({ id: draft.id, error: err?.message || String(err) });
    }
  }

  console.log(JSON.stringify({ ok: true, dryRun: args.dryRun, results }, null, 2));
  if (results.some((r) => r.error)) process.exit(1);
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
