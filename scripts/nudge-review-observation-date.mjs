#!/usr/bin/env node
/**
 * Dev/admin: move a review_observations row into a scoring window (e.g. May → 2026-04-30)
 * and optionally append text so rubric keywords pick up the star rating.
 *
 * Apify often returns one more row than lands in `review_observations`: out-of-month rows are
 * filtered before upsert, so there may be no DB row to "nudge". In that case use
 * `--upsert-dev-two-star` to insert a stable 2★ dev row (idempotent upsert) dated `--to=…`
 * with mention-rich text so `starToRubricScore(2) → 50` flows into food/service/speed categories.
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (KEY=value line parser).
 *
 * Examples:
 *   # Simulate the excluded May 2★ as an April 30 row (insert/overwrite dev key):
 *   node scripts/nudge-review-observation-date.mjs ivory-house --upsert-dev-two-star --to=2026-04-30
 *
 *   # If you already have a low-star row outside the window:
 *   node scripts/nudge-review-observation-date.mjs ivory-house \
 *     --to=2026-04-30 --rating=2 --pick=outside-window --period-start=2026-04-01 --period-end=2026-04-30 \
 *     --seed-mentions
 *
 * Then rebuild rubric (no Apify):
 *   RESTAURANT_SLUGS=ivory-house PERIOD_START=2026-04-01 PERIOD_END=2026-04-30 PERIOD_LABEL="Apr 2026" \
 *     npm run pipeline:rebuild:rubric-from-observations -- ivory-house
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const DEV_TWO_STAR_EXTERNAL_ID = "guest_signal_dev_two_star";

function loadDotEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const MENTION_SEED_APPEND =
  "\n\n[dev_seed] Food was disappointing and the service was slow — not what we expected.";

const DEV_TWO_STAR_TEXT =
  "[dev_seed] Food was disappointing and the service was slow — not what we expected.";

function parseArgs(argv) {
  const out = { _: [] };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) out[a.slice(2)] = true;
      else out[a.slice(2, eq)] = a.slice(eq + 1);
    } else out._.push(a);
  }
  return out;
}

function numRating(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function printRebuild(slug, periodStart, periodEnd) {
  console.log(
    "\nRebuild rubric from DB:\n" +
      `  RESTAURANT_SLUGS=${slug} PERIOD_START=${periodStart} PERIOD_END=${periodEnd} PERIOD_LABEL="Apr 2026" \\\n` +
      `    npm run pipeline:rebuild:rubric-from-observations -- ${slug}\n`,
  );
}

loadDotEnvLocal();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(2);
}

const args = parseArgs(process.argv.slice(2));
const slug = args._[0]?.trim();
const toDate = String(args.to || "").trim();
const upsertDevTwoStar = Boolean(args["upsert-dev-two-star"]);
const ratingFilter = args.rating != null ? numRating(args.rating) : null;
const source = String(args.source || "google").trim().toLowerCase();
const pick = String(args["pick"] || "outside-window").trim().toLowerCase();
const periodStart = String(args["period-start"] || "2026-04-01").trim();
const periodEnd = String(args["period-end"] || "2026-04-30").trim();
const seedMentions = Boolean(args["seed-mentions"]);

if (!slug || !toDate) {
  console.error(
    "Usage:\n" +
      "  node scripts/nudge-review-observation-date.mjs <slug> --upsert-dev-two-star --to=YYYY-MM-DD\n" +
      "  node scripts/nudge-review-observation-date.mjs <slug> --to=YYYY-MM-DD [--rating=2] [--source=google] [--pick=outside-window|newest] [--period-start=…] [--period-end=…] [--seed-mentions]",
  );
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: restaurant, error: rErr } = await supabase
  .from("restaurants")
  .select("id, slug, name")
  .eq("slug", slug)
  .maybeSingle();
if (rErr) throw rErr;
if (!restaurant) {
  console.error(`No restaurant with slug "${slug}".`);
  process.exit(1);
}

if (upsertDevTwoStar) {
  const row = {
    restaurant_id: restaurant.id,
    source,
    external_review_id: DEV_TWO_STAR_EXTERNAL_ID,
    rating: 2,
    review_date: toDate,
    review_text: DEV_TWO_STAR_TEXT,
    raw: {},
  };
  const { data: up, error: uErr } = await supabase
    .from("review_observations")
    .upsert(row, { onConflict: "restaurant_id,source,external_review_id" })
    .select("id, rating, review_date, review_text, external_review_id")
    .single();
  if (uErr) throw uErr;
  console.log("Upserted dev 2★ observation:", JSON.stringify(up, null, 2));
  printRebuild(slug, periodStart, periodEnd);
  process.exit(0);
}

let q = supabase
  .from("review_observations")
  .select("id, rating, review_date, review_text, external_review_id, source")
  .eq("restaurant_id", restaurant.id)
  .eq("source", source);

if (ratingFilter != null) {
  q = q.gte("rating", ratingFilter - 0.25).lte("rating", ratingFilter + 0.25);
}

const { data: rows, error: oErr } = await q.order("review_date", { ascending: false });
if (oErr) throw oErr;
const list = rows ?? [];
if (!list.length) {
  console.error(
    `No ${source} observations${ratingFilter != null ? ` near rating=${ratingFilter}` : ""} for ${slug}.`,
  );
  console.error(`Hint: out-of-window Apify rows are never upserted — try --upsert-dev-two-star --to=${toDate || "2026-04-30"}`);
  process.exit(1);
}

let candidates = list;
if (pick === "outside-window" || pick === "outside") {
  candidates = list.filter(
    (r) =>
      !r.review_date ||
      String(r.review_date) < periodStart ||
      String(r.review_date) > periodEnd,
  );
}
if (!candidates.length) {
  console.error(
    `No rows matched pick="${pick}" for window [${periodStart}…${periodEnd}]. Try --pick=newest or --upsert-dev-two-star.`,
  );
  console.error("Available rows:", list.map((r) => `${r.id} rating=${r.rating} date=${r.review_date}`).join("\n"));
  process.exit(1);
}

const row = candidates[0];
let newText = row.review_text ?? "";
if (seedMentions) {
  if (!newText.includes("[dev_seed]")) {
    newText = `${String(newText).trimEnd()}${MENTION_SEED_APPEND}`;
  }
}

const patch = {
  review_date: toDate,
  ...(seedMentions ? { review_text: newText } : {}),
};

const { data: updated, error: uErr } = await supabase
  .from("review_observations")
  .update(patch)
  .eq("id", row.id)
  .select("id, rating, review_date, review_text, external_review_id")
  .single();
if (uErr) throw uErr;

console.log("Updated review_observation:", JSON.stringify(updated, null, 2));
printRebuild(slug, periodStart, periodEnd);
