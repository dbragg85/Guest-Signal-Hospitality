#!/usr/bin/env node
/**
 * Lead intake → restaurant + Yelp rubric snapshot + portal scorecard.
 *
 * 1. Picks pending rows from public.lead_intake_submissions (default: inquiry_plan = free_snapshot).
 * 2. Optionally pulls live Yelp reviews via Apify when APIFY_TOKEN + APIFY_YELP_ACTOR_ID +
 *    LEAD_INTAKE_APIFY_YELP_URL are set and the run succeeds with in-period reviews.
 * 3. On Apify failure, empty dataset, zero parsed reviews, or missing credentials:
 *    uses 15 synthetic reviews (guest-signal-rubric.mjs) scored with the same rubric.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
 *   LEAD_INTAKE_ID — process a single row
 *   LEAD_INTAKE_ALL_PLANS=1 — not only free_snapshot
 *   LEAD_INTAKE_APIFY_YELP_URL — Yelp biz URL used when testing Apify (intake form has no Yelp field)
 *   APIFY_TOKEN, APIFY_YELP_ACTOR_ID — same as monthly pipeline
 *   DRY_RUN=1 — no writes
 *   FORCE_REPROCESS=1 — re-run even if restaurant_id is set
 */
import { createClient } from "@supabase/supabase-js";
import { pullYelpReviewsViaApify } from "./lib/apify-yelp-actor.mjs";
import {
  buildFifteenMockApifyItems,
  computeRubricCategoryScores,
  confidenceLevelFromReviewCount,
  getEnv,
  lastCompletedMonthWindow,
  monthLabelFromDate,
  normalizeApifyItem,
  overallGuestSignalFromPillars,
  parseNumber,
  singleCategoryScore,
  toIsoDate,
  weightedPillarFromMerged,
  RUBRIC_SUBWEIGHTS,
} from "./lib/guest-signal-rubric.mjs";

function slugifyBase(name) {
  const s = String(name || "venue")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return s || "venue";
}

async function ensureUniqueSlug(supabase, base) {
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    const suffix = Math.random().toString(36).slice(2, 8);
    candidate = `${base}-${suffix}`.slice(0, 80);
  }
  throw new Error("Could not allocate unique restaurant slug");
}

function formatAddress(lead) {
  const parts = [lead.street_address, lead.city, lead.state, lead.zip].filter(
    (p) => p && String(p).trim() && String(p).trim() !== "—"
  );
  return parts.length ? parts.join(", ") : null;
}

async function persistSnapshotFromReviews({
  supabase,
  restaurant,
  periodReviews,
  periodLabel,
  periodStartIso,
  periodEndIso,
  dryRun,
  reviewSourceNote,
}) {
  const googleCount = 0;
  const yelpCount = periodReviews.length;
  const totalReviews = googleCount + yelpCount;
  const confidenceLevel = confidenceLevelFromReviewCount(totalReviews);

  if (!dryRun && periodReviews.length) {
    const inserts = periodReviews.map((review) => ({
      restaurant_id: restaurant.id,
      ...review,
    }));
    const { error: insertError } = await supabase
      .from("review_observations")
      .upsert(inserts, { onConflict: "restaurant_id,source,external_review_id", ignoreDuplicates: false });
    if (insertError) throw insertError;
  }

  const yelpScores = computeRubricCategoryScores(periodReviews);

  const { data: existingSnapshot, error: snapshotFetchError } = await supabase
    .from("snapshots")
    .select("id, guest_signal_score, total_reviews_analyzed, google_reviews_analyzed, yelp_reviews_analyzed")
    .eq("restaurant_id", restaurant.id)
    .eq("period_label", periodLabel)
    .maybeSingle();
  if (snapshotFetchError) throw snapshotFetchError;

  const snapshotId = existingSnapshot?.id ?? crypto.randomUUID();

  const { data: existingCategoryRows, error: categoryFetchError } = await supabase
    .from("snapshot_category_scores")
    .select("category, score, mentions")
    .eq("snapshot_id", snapshotId);
  if (categoryFetchError) throw categoryFetchError;

  const existingByCategory = new Map();
  for (const row of existingCategoryRows ?? []) {
    if (!row?.category || row.score == null) continue;
    const mentionsRaw = Number(row.mentions ?? 0);
    const mentions = Number.isFinite(mentionsRaw) && mentionsRaw > 0 ? mentionsRaw : 0;
    existingByCategory.set(String(row.category), { score: Number(row.score), mentions });
  }

  const merged = new Map();
  const allCategories = new Set([...existingByCategory.keys(), ...yelpScores.keys()]);
  for (const category of allCategories) {
    const existing = existingByCategory.get(category) ?? null;
    const incoming = yelpScores.get(category) ?? null;
    if (!existing && incoming) {
      merged.set(category, incoming);
      continue;
    }
    if (existing && !incoming) {
      merged.set(category, existing);
      continue;
    }
    const mergedMentions = existing.mentions + incoming.mentions;
    const mergedScore =
      mergedMentions > 0
        ? Math.round((existing.score * existing.mentions + incoming.score * incoming.mentions) / mergedMentions)
        : incoming.score;
    merged.set(category, { score: mergedScore, mentions: mergedMentions });
  }

  const mergedRows = [...merged.entries()].map(([category, row]) => ({
    snapshot_id: snapshotId,
    category,
    score: row.score,
    mentions: row.mentions,
  }));

  const pillarScores = {
    experience_quality: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.experience_quality),
    operational_reliability: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.operational_reliability),
    emotional_connection: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.emotional_connection),
  };

  const overallScore = overallGuestSignalFromPillars(pillarScores);
  const existingOverallScore = parseNumber(existingSnapshot?.guest_signal_score);
  const effectiveOverallScore = overallScore ?? existingOverallScore;
  const canPersistSnapshot = effectiveOverallScore != null;

  const categoryScoresPayload = [...merged.entries()].map(([category, row]) => ({
    category,
    score: row.score,
    mentions: row.mentions,
  }));

  const scorecardData = {
    review_scoring_model: "guest_signal_rubric_v1",
    confidence_level: confidenceLevel,
    category_scores: categoryScoresPayload,
    total_reviews_analyzed: totalReviews,
    google_reviews_analyzed: googleCount,
    yelp_reviews_analyzed: yelpCount,
    experience_quality: pillarScores.experience_quality,
    service_hospitality: singleCategoryScore(merged, "service"),
    food_beverage: singleCategoryScore(merged, "food"),
    operational_reliability: pillarScores.operational_reliability,
    emotional_connection: pillarScores.emotional_connection,
    intake_automation: true,
    review_source_note: reviewSourceNote,
    total_score_breakdown: {
      scorecard_total_score: overallScore,
      category_average:
        categoryScoresPayload.length > 0
          ? Number(
              (categoryScoresPayload.reduce((sum, row) => sum + row.score, 0) / categoryScoresPayload.length).toFixed(1)
            )
          : null,
      category_count: categoryScoresPayload.length,
      variance: null,
      source:
        "Guest Signal rubric v1 — mentioned categories only; star-mapped 95/85/70/50/30; pillar weights per board spec",
    },
    ...pillarScores,
  };

  if (dryRun) {
    console.log(JSON.stringify({ snapshotId, effectiveOverallScore, pillarScores, categoryScoresPayload, reviewSourceNote }, null, 2));
    return Boolean(canPersistSnapshot);
  }

  if (!canPersistSnapshot) {
    console.warn(`Skipping snapshot for ${restaurant.slug}: no score derived from reviews.`);
    return false;
  }

  if (!existingSnapshot) {
    const { error: snapshotInsertError } = await supabase.from("snapshots").insert({
      id: snapshotId,
      restaurant_id: restaurant.id,
      period_label: periodLabel,
      period_start: periodStartIso,
      period_end: periodEndIso,
      guest_signal_score: effectiveOverallScore,
      written_review_score: effectiveOverallScore,
      confidence_level: confidenceLevel,
      total_reviews_analyzed: totalReviews,
      google_reviews_analyzed: googleCount,
      yelp_reviews_analyzed: yelpCount,
      pillar_experience_quality: pillarScores.experience_quality,
      pillar_operational_reliability: pillarScores.operational_reliability,
      pillar_emotional_connection: pillarScores.emotional_connection,
    });
    if (snapshotInsertError) throw snapshotInsertError;
  } else {
    const { error: snapshotUpdateError } = await supabase
      .from("snapshots")
      .update({
        period_start: periodStartIso,
        period_end: periodEndIso,
        guest_signal_score: effectiveOverallScore,
        written_review_score: effectiveOverallScore,
        confidence_level: confidenceLevel,
        total_reviews_analyzed: totalReviews,
        google_reviews_analyzed: googleCount,
        yelp_reviews_analyzed: yelpCount,
        pillar_experience_quality: pillarScores.experience_quality,
        pillar_operational_reliability: pillarScores.operational_reliability,
        pillar_emotional_connection: pillarScores.emotional_connection,
      })
      .eq("id", snapshotId);
    if (snapshotUpdateError) throw snapshotUpdateError;
  }

  if (mergedRows.length) {
    const { error: categoryUpsertError } = await supabase
      .from("snapshot_category_scores")
      .upsert(mergedRows, { onConflict: "snapshot_id,category" });
    if (categoryUpsertError) throw categoryUpsertError;
  }

  const { data: existingScorecard, error: scorecardFetchError } = await supabase
    .from("scorecards")
    .select("id, data")
    .eq("restaurant_id", restaurant.id)
    .eq("period", periodLabel)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (scorecardFetchError) throw scorecardFetchError;

  if (!existingScorecard) {
    const { error: scorecardInsertError } = await supabase.from("scorecards").insert({
      restaurant_id: restaurant.id,
      period: periodLabel,
      score: effectiveOverallScore,
      headline: `Guest Signal snapshot (${periodLabel})`,
      data: {
        snapshot_id: snapshotId,
        ...scorecardData,
      },
    });
    if (scorecardInsertError) throw scorecardInsertError;
  } else {
    const existingData =
      existingScorecard.data && typeof existingScorecard.data === "object" ? existingScorecard.data : {};
    const { error: scorecardUpdateError } = await supabase
      .from("scorecards")
      .update({
        score: effectiveOverallScore,
        data: {
          ...existingData,
          snapshot_id: snapshotId,
          ...scorecardData,
        },
      })
      .eq("id", existingScorecard.id);
    if (scorecardUpdateError) throw scorecardUpdateError;
  }

  console.log(`[${restaurant.slug}] Snapshot + scorecard saved (${reviewSourceNote}).`);
  return true;
}

async function loadReviewsForLead(periodStartIso, periodEndIso) {
  const token = getEnv("APIFY_TOKEN", { fallback: "" });
  const actorId = getEnv("APIFY_YELP_ACTOR_ID", { fallback: "" });
  const yelpUrl = getEnv("LEAD_INTAKE_APIFY_YELP_URL", { fallback: "" });

  let rawItems = [];
  let sourceNote = "mock_15_rubric_fallback";

  if (token && actorId && yelpUrl) {
    try {
      console.log("Attempting Apify Yelp pull…");
      rawItems = await pullYelpReviewsViaApify({ yelpUrl, token, actorId });
      sourceNote = "apify_yelp_live";
    } catch (e) {
      console.warn("Apify Yelp pull failed:", e?.message || e);
      sourceNote = "apify_failed_mock_15";
    }
  } else {
    console.log("Skipping Apify (missing APIFY_TOKEN / APIFY_YELP_ACTOR_ID / Yelp URL).");
  }

  let parsed = rawItems.map(normalizeApifyItem).filter(Boolean);
  let periodReviews = parsed.filter((review) => {
    if (!review.review_date) return false;
    return review.review_date >= periodStartIso && review.review_date <= periodEndIso;
  });

  if (rawItems.length > 0 && parsed.length === 0) {
    console.warn("Apify returned rows but none normalized to reviews — using mock dataset.");
    sourceNote = "apify_unparsed_mock_15";
  }

  if (!periodReviews.length) {
    console.log("Using 15-review mock dataset (same Guest Signal rubric scoring).");
    const mockItems = buildFifteenMockApifyItems(periodStartIso, periodEndIso);
    periodReviews = mockItems.map(normalizeApifyItem).filter(Boolean);
    if (sourceNote === "apify_yelp_live") sourceNote = "apify_empty_period_mock_15";
  }

  return { periodReviews, sourceNote };
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());
  const force = ["1", "true", "yes"].includes((getEnv("FORCE_REPROCESS", { fallback: "0" }) || "").toLowerCase());
  const allPlans = ["1", "true", "yes"].includes((getEnv("LEAD_INTAKE_ALL_PLANS", { fallback: "0" }) || "").toLowerCase());
  const singleId = getEnv("LEAD_INTAKE_ID", { fallback: "" });

  const { start, end } = lastCompletedMonthWindow();
  const periodStartIso = toIsoDate(start);
  const periodEndIso = toIsoDate(end);
  const periodLabel = getEnv("PERIOD_LABEL", { fallback: monthLabelFromDate(start) });

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from("lead_intake_submissions")
    .select("*")
    .eq("processing_status", "pending")
    .order("created_at", { ascending: true });

  if (!allPlans) {
    query = query.eq("inquiry_plan", "free_snapshot");
  }

  if (singleId) {
    query = query.eq("id", singleId);
  }

  const { data: leads, error: leadsError } = await query;
  if (leadsError) throw leadsError;

  const list = (leads ?? []).filter((row) => force || !row.restaurant_id);
  if (!list.length) {
    console.log("No pending lead_intake_submissions to process.");
    return;
  }

  console.log(`Processing ${list.length} lead(s); period ${periodLabel} (${periodStartIso} → ${periodEndIso})`);

  for (const lead of list) {
    console.log(`\n--- Lead ${lead.id} (${lead.business}) ---`);
    const baseSlug = slugifyBase(lead.business);

    let restaurant;
    if (lead.restaurant_id) {
      if (dryRun) {
        restaurant = {
          id: lead.restaurant_id,
          slug: `${baseSlug}-existing`,
          name: lead.business,
        };
      } else {
        const { data: row, error: fetchErr } = await supabase
          .from("restaurants")
          .select("id, slug, name")
          .eq("id", lead.restaurant_id)
          .single();
        if (fetchErr) throw fetchErr;
        restaurant = row;
      }
    } else {
      const slug = await ensureUniqueSlug(supabase, baseSlug);
      if (dryRun) {
        restaurant = { id: crypto.randomUUID(), slug, name: lead.business };
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("restaurants")
          .insert({
            slug,
            name: lead.business.trim(),
            address: formatAddress(lead),
          })
          .select("id, slug, name")
          .single();
        if (insErr) throw insErr;
        restaurant = ins;
      }
    }

    const { periodReviews, sourceNote } = await loadReviewsForLead(periodStartIso, periodEndIso);

    const persisted = await persistSnapshotFromReviews({
      supabase,
      restaurant,
      periodReviews,
      periodLabel,
      periodStartIso,
      periodEndIso,
      dryRun,
      reviewSourceNote: sourceNote,
    });

    if (!dryRun && persisted) {
      const { error: upErr } = await supabase
        .from("lead_intake_submissions")
        .update({
          restaurant_id: restaurant.id,
          processing_status: "converted",
        })
        .eq("id", lead.id);
      if (upErr) throw upErr;
    }
  }

  console.log("\nLead intake snapshot run complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
