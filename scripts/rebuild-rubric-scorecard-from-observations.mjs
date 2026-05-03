#!/usr/bin/env node
/**
 * Recompute Guest Signal rubric v1 snapshot + scorecard from existing review_observations
 * (no Apify). Use after Google/Yelp ingest so the portal shows pillars + category_scores from the rubric.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PERIOD_START, PERIOD_END, PERIOD_LABEL,
 *      RESTAURANT_SLUGS (one slug or comma list — first used),
 *      RUBRIC_REVIEW_SOURCES (default google,yelp; optional tripadvisor,facebook,doordash,ubereats), DRY_RUN=1,
 *      RUBRIC_INQUIRY_PLAN (optional; default free_snapshot),
 *      RUBRIC_REVIEW_SOURCE_NOTE (optional).
 */
import { createClient } from "@supabase/supabase-js";
import { getEnv, parseRating, RUBRIC_ALLOWED_REVIEW_SOURCES } from "./lib/guest-signal-rubric.mjs";
import { persistRubricSnapshotFromPeriodReviews } from "./lib/rubric-scorecard-persist.mjs";

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function lastCompletedMonthWindowUtc() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth(), 0));
  return { start, end };
}

function monthLabelFromDate(date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function periodSourcesLabel(sources) {
  return sources.join(",");
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());

  const providedStart = getEnv("PERIOD_START", { fallback: "" });
  const providedEnd = getEnv("PERIOD_END", { fallback: "" });
  const defaultWindow = lastCompletedMonthWindowUtc();
  const periodStart = parseDateOnly(providedStart) ?? defaultWindow.start;
  const periodEnd = parseDateOnly(providedEnd) ?? defaultWindow.end;
  if (periodEnd < periodStart) {
    throw new Error("PERIOD_END must be on/after PERIOD_START");
  }
  const periodStartIso = toIsoDate(periodStart);
  const periodEndIso = toIsoDate(periodEnd);
  const periodLabel = getEnv("PERIOD_LABEL", { fallback: monthLabelFromDate(periodStart) });

  const slug =
    process.argv[2]?.trim() ||
    getEnv("RESTAURANT_SLUGS", { fallback: "" }).split(",")[0]?.trim();
  if (!slug) {
    throw new Error("Pass a slug as argv[1] or set RESTAURANT_SLUGS.");
  }

  const reviewSources = getEnv("RUBRIC_REVIEW_SOURCES", { fallback: "google,yelp" })
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set(RUBRIC_ALLOWED_REVIEW_SOURCES);
  for (const s of reviewSources) {
    if (!allowed.has(s)) throw new Error(`RUBRIC_REVIEW_SOURCES: unknown "${s}" (allowed: ${RUBRIC_ALLOWED_REVIEW_SOURCES.join(",")})`);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (rErr) throw rErr;
  if (!restaurant) {
    throw new Error(`No restaurant with slug "${slug}".`);
  }

  const { data: rows, error: oErr } = await supabase
    .from("review_observations")
    .select("id, source, review_text, rating, review_date, external_review_id")
    .eq("restaurant_id", restaurant.id)
    .in("source", reviewSources)
    .gte("review_date", periodStartIso)
    .lte("review_date", periodEndIso)
    .order("review_date", { ascending: false });

  if (oErr) throw oErr;
  const periodReviews = (rows ?? []).map((r) => ({
    id: r.id,
    source: String(r.source ?? ""),
    review_text: r.review_text,
    rating: parseRating(r.rating),
    review_date: r.review_date,
    external_review_id: r.external_review_id,
  }));

  console.log(
    `[${slug}] Rubric rebuild from DB: ${periodReviews.length} observation(s) in [${periodSourcesLabel(reviewSources)}] for ${periodLabel} (${periodStartIso}…${periodEndIso}).`,
  );

  const note =
    getEnv("RUBRIC_REVIEW_SOURCE_NOTE", { fallback: "" }) ||
    `rubric_rebuild_observations; sources=${reviewSources.join(",")}`;

  const ok = await persistRubricSnapshotFromPeriodReviews({
    supabase,
    restaurant,
    periodReviews,
    periodLabel,
    periodStartIso,
    periodEndIso,
    dryRun,
    reviewSourceNote: note,
    inquiryPlan: getEnv("RUBRIC_INQUIRY_PLAN", { fallback: "free_snapshot" }),
    skipObservationUpsert: true,
    ignoreExistingCategoryScores: true,
    rubricAttributionReviewSources: reviewSources,
  });

  if (!ok && !dryRun) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
