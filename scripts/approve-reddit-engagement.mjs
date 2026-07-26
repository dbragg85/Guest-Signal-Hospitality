#!/usr/bin/env node
/**
 * Approve or deny a Reddit engagement draft.
 *
 *   npm run growth:reddit-approve -- --id=rd_xxx
 *   npm run growth:reddit-deny -- --id=rd_xxx
 *   npm run growth:reddit-approve -- --all
 */

import { listDrafts, setDraftStatus } from "./lib/reddit-draft-store.mjs";

function parseArgs(argv) {
  const out = { id: "", all: false, action: "approve" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--id" && argv[i + 1]) out.id = argv[++i];
    else if (a.startsWith("--id=")) out.id = a.slice(5);
    else if (a === "--all") out.all = true;
    else if (a === "--deny") out.action = "deny";
  }
  // package.json scripts may pass deny via env
  if (["1", "true", "deny"].includes((process.env.REDDIT_ACTION || "").toLowerCase())) {
    out.action = "deny";
  }
  if (process.argv[1]?.includes("deny-reddit")) out.action = "deny";
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const nextStatus = args.action === "deny" ? "denied" : "approved";
  let ids = [];

  if (args.all) {
    ids = listDrafts({ status: "approval_required" }).map((d) => d.id);
  } else if (args.id) {
    ids = [args.id];
  } else {
    console.error("Usage: --id=<draftId> or --all");
    process.exit(1);
  }

  if (!ids.length) {
    console.log(JSON.stringify({ ok: true, updated: 0, message: "No drafts to update" }));
    return;
  }

  const updated = ids.map((id) =>
    setDraftStatus(id, nextStatus, {
      decidedAt: new Date().toISOString(),
      decidedBy: "cli",
    }),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: nextStatus,
        updated: updated.length,
        ids: updated.map((d) => d.id),
        next:
          nextStatus === "approved"
            ? "Run: npm run growth:reddit-publish"
            : "Draft(s) denied",
      },
      null,
      2,
    ),
  );
}

main();
