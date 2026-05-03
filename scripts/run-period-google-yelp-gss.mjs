#!/usr/bin/env node
/**
 * One-off / CI helper: Google Apify ingest → Yelp observations only → GSS scorecard
 * for RESTAURANT_SLUGS (comma-separated) and PERIOD_*.
 *
 * Usage:
 *   node scripts/run-period-google-yelp-gss.mjs
 *   RESTAURANT_SLUGS=my-slug PERIOD_START=2026-04-01 PERIOD_END=2026-04-30 PERIOD_LABEL="Apr 2026" node ...
 *
 * Requires .env.local in cwd (same keys as other pipeline scripts) or env already set.
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

console.log(`\n=== 3/3 GSS scorecard (sources=google,yelp) (${slug}) ===\n`);
run(process.execPath, [resolve(ROOT, "scripts/run-google-gss-monthly.mjs")], {
  ...common,
  GSS_REVIEW_SOURCES: "google,yelp",
});

console.log(`\nDone. Scorecard period "${periodLabel}" for slug "${slug}".\n`);
