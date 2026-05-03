#!/usr/bin/env node
/**
 * Google Apify ingest → Yelp observations only → rubric v1 scorecard (portal pillars)
 * for one slug + PERIOD_*. Dashboard orders scorecards by created_at; this updates the
 * existing row for period_label so the latest card shows rubric + Yelp + Google counts.
 *
 * Usage: node scripts/run-period-google-yelp-rubric.mjs [slug]
 * Env: same as run-google-apify-monthly-ingest + Yelp actor; PERIOD_* optional (defaults Apr 2026).
 * Yelp: `APIFY_YELP_ACTOR_ID=c7MfRDqfYvZWOtMrJ` uses [agents/yelp-reviews](https://apify.com/agents/yelp-reviews) input (`maxItems`, `sortBy`, string `startUrls`). Month window is applied when saving observations, not in actor input. `YELP_MAX_ITEMS` (default 10) caps each run.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");

function loadDotEnvLocal() {
  if (!existsSync(ENV_FILE)) return;
  const keys = new Set([
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APIFY_TOKEN",
    "APIFY_GOOGLE_ACTOR_ID",
    "APIFY_YELP_ACTOR_ID",
    "LEAD_INTAKE_MAX_REVIEWS",
    "GOOGLE_INGEST_MAX_APIFY_REVIEWS",
    "APIFY_GOOGLE_SCORING_PERIOD_FILTER",
    "GOOGLE_INGEST_THROTTLE_MS",
    "YELP_MAX_ITEMS",
    "YELP_SORT_BY",
    "YELP_INPUT_STYLE",
    "APIFY_YELP_RUN_MAX_ITEMS_QUERY",
    "YELP_DATASET_CLEAN",
  ]);
  const text = readFileSync(ENV_FILE, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    if (!keys.has(k)) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

function run(cmd, args, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  const r = spawnSync(cmd, args, { cwd: ROOT, env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

loadDotEnvLocal();

const slug =
  process.argv[2]?.trim() ||
  process.env.RESTAURANT_SLUGS?.split(",")[0]?.trim() ||
  "west-shine-family-restaurant";

const periodStart = process.env.PERIOD_START || "2026-04-01";
const periodEnd = process.env.PERIOD_END || "2026-04-30";
const periodLabel = process.env.PERIOD_LABEL || "Apr 2026";

const common = {
  RESTAURANT_SLUGS: slug,
  PERIOD_START: periodStart,
  PERIOD_END: periodEnd,
  PERIOD_LABEL: periodLabel,
};

console.log(`\n=== 1/3 Google Apify ingest (${slug}) ===\n`);
run(process.execPath, [resolve(ROOT, "scripts/run-google-apify-monthly-ingest.mjs")], {
  ...common,
  GOOGLE_INGEST_MAX_APIFY_REVIEWS: process.env.GOOGLE_INGEST_MAX_APIFY_REVIEWS || "250",
  GOOGLE_INGEST_THROTTLE_MS: process.env.GOOGLE_INGEST_THROTTLE_MS || "1500",
});

console.log(`\n=== 2/3 Yelp → review_observations only (${slug}) ===\n`);
run(process.execPath, [resolve(ROOT, "scripts/run-monthly-yelp-pipeline.mjs")], {
  ...common,
  YELP_MONTHLY_INGEST_ONLY: "1",
});

console.log(`\n=== 3/3 Rubric scorecard from observations (${slug}) ===\n`);
run(process.execPath, [resolve(ROOT, "scripts/rebuild-rubric-scorecard-from-observations.mjs"), slug], {
  ...common,
});

console.log(`\nDone. Rubric scorecard for "${periodLabel}" (${slug}). Refresh the portal dashboard.\n`);
