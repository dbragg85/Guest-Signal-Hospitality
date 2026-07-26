#!/usr/bin/env node
/**
 * Collect restaurant / local-market Reddit signals via Apify.
 *
 * Usage:
 *   npm run growth:reddit-signals
 *   APIFY_REDDIT_MODE=searches APIFY_REDDIT_MAX_ITEMS=25 npm run growth:reddit-signals
 *
 * Credentials:
 *   APIFY_TOKEN (required)
 *   REDDIT_USERNAME / REDDIT_PASSWORD — stored for account ownership; NOT sent to Apify.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizeRedditSignals,
  pullRedditRestaurantSignalsViaApify,
  redditSignalsToTrendTerms,
} from "./lib/apify-reddit.mjs";

function dayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const username = (process.env.REDDIT_USERNAME || "").trim();
  if (username) {
    console.log(`Reddit account on file: u/${username} (not used for Apify login)`);
  } else {
    console.warn("REDDIT_USERNAME not set — continuing with public Apify scrape only");
  }

  const mode = (process.env.APIFY_REDDIT_MODE || "both").trim().toLowerCase();
  const maxItems = Number(process.env.APIFY_REDDIT_MAX_ITEMS || 40);
  const outDir = join(process.cwd(), ".operator", "reddit-signals");
  mkdirSync(outDir, { recursive: true });

  const batches = mode === "both" ? ["subreddits", "searches"] : [mode];
  const allItems = [];
  const runs = [];

  for (const batchMode of batches) {
    console.log(`Starting Apify Reddit run mode=${batchMode} maxItems=${maxItems}`);
    const result = await pullRedditRestaurantSignalsViaApify({
      mode: /** @type {"subreddits"|"searches"} */ (batchMode),
      maxItems: Math.ceil(maxItems / batches.length),
    });
    runs.push({
      mode: batchMode,
      runId: result.runId,
      actorId: result.actorId,
      itemCount: result.itemCount,
    });
    allItems.push(...result.items);
    console.log(`  run ${result.runId}: ${result.itemCount} items`);
  }

  const signals = normalizeRedditSignals(allItems);
  const trends = redditSignalsToTrendTerms(signals, 20);
  const stamp = dayStamp();
  const payload = {
    collectedAt: new Date().toISOString(),
    account: username ? `u/${username}` : null,
    source: "apify_reddit",
    runs,
    signalCount: signals.length,
    trends,
    signals,
  };

  const outPath = join(outDir, `${stamp}.json`);
  const latestPath = join(outDir, "latest.json");
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  writeFileSync(latestPath, JSON.stringify(payload, null, 2));

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath,
        signalCount: signals.length,
        topCommunities: trends.filter((t) => t.term.startsWith("r/")).slice(0, 8),
        sampleTitles: signals
          .map((s) => s.title)
          .filter(Boolean)
          .slice(0, 5),
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
