/**
 * Portal scorecard persistence for Guest Signal rubric v1 (same math as lead intake).
 * Used by lead intake and by `rebuild-rubric-scorecard-from-observations.mjs`.
 */
import { randomUUID } from "node:crypto";
import {
  computeRubricCategoryScores,
  computeBlendedRubricDisplay,
  confidenceLevelFromReviewCount,
  parseNumber,
  splitWrittenAndStarOnlyReviews,
  RUBRIC_ALLOWED_REVIEW_SOURCES,
  RUBRIC_SCORING_MODEL_V1,
  buildRubricReviewAttributionRows,
} from "./guest-signal-rubric.mjs";
import { buildSnapshotDeliverablesForScorecard } from "./snapshot-deliverables.mjs";

export const SERVICE_INQUIRY_PLANS = [
  "free_snapshot",
  "signal_monitor",
  "signal_growth",
  "signal_elevate",
];

export function normalizeInquiryPlan(raw) {
  const s = String(raw ?? "").trim();
  if (SERVICE_INQUIRY_PLANS.includes(s)) return s;
  return "free_snapshot";
}

/**
 * Replace `rubric_review_attributions` for a snapshot from live `review_observations` in the scoring window.
 * Call after snapshot + category scores are saved. Uses DB rows (all sources in window) so callers
 * that only pass Yelp-shaped `periodReviews` still persist full audit coverage.
 *
 * @param {string[]} [params.reviewSources] - Defaults to `RUBRIC_ALLOWED_REVIEW_SOURCES`.
 * @returns {number} rows inserted
 */
export async function replaceRubricReviewAttributionsForSnapshot({
  supabase,
  snapshotId,
  restaurantId,
  periodLabel,
  periodStartIso,
  periodEndIso,
  reviewSources,
}) {
  const sources = (reviewSources?.length ? reviewSources : RUBRIC_ALLOWED_REVIEW_SOURCES).map(String);
  const { data: obs, error } = await supabase
    .from("review_observations")
    .select("id, source, external_review_id, review_date, rating, review_text")
    .eq("restaurant_id", restaurantId)
    .gte("review_date", periodStartIso)
    .lte("review_date", periodEndIso)
    .in("source", sources);
  if (error) throw error;

  const built = buildRubricReviewAttributionRows(obs ?? []);
  const { error: delErr } = await supabase.from("rubric_review_attributions").delete().eq("snapshot_id", snapshotId);
  if (delErr) throw delErr;
  if (!built.length) return 0;

  const rows = built.map((b) => ({
    snapshot_id: snapshotId,
    restaurant_id: restaurantId,
    period_label: periodLabel,
    scoring_model: RUBRIC_SCORING_MODEL_V1,
    ...b,
  }));
  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error: insErr } = await supabase.from("rubric_review_attributions").insert(slice);
    if (insErr) throw insErr;
  }
  return rows.length;
}

export function intakePlanPresentation(planKey) {
  const pk = normalizeInquiryPlan(planKey);
  switch (pk) {
    case "signal_monitor":
      return {
        headlineTag: " — Signal Monitor preview",
        humanLabel: "Signal Monitor",
        callouts: [
          "Monitor includes monthly scorecards, Google sentiment trends, and 72-hour risk alerts in production.",
          "This preview still uses the prior completed month’s Yelp-style rubric window so scores stay comparable across tiers.",
        ],
      };
    case "signal_growth":
      return {
        headlineTag: " — Signal Growth preview",
        humanLabel: "Signal Growth",
        callouts: [
          "Growth adds tracking for up to three local peers—curate the competitors array on this scorecard to mirror production tiles.",
          "You also get weekly category breakdowns and 48-hour priority alerts once the live subscription is active.",
        ],
      };
    case "signal_elevate":
      return {
        headlineTag: " — Signal Elevate preview",
        humanLabel: "Signal Elevate",
        callouts: [
          "Elevate adds drafted review responses, weekly coaching notes, and social + review cross-signals in production.",
          "The score below uses the same prior-month review rubric as other tiers so leadership can compare apples to apples.",
        ],
      };
    case "free_snapshot":
    default:
      return {
        headlineTag: " — Free snapshot",
        humanLabel: "Free Guest Signal Snapshot",
        callouts: [
          "This intake preview reflects the prior completed calendar month only (e.g. March when you run in April).",
          "Scroll to Snapshot deliverables below for GBP notes, website health, SEO opportunities, top priorities, and plan fit.",
        ],
      };
  }
}

/**
 * @param {object} params
 * @param {boolean} [params.skipObservationUpsert] - Do not write review_observations (already persisted).
 * @param {boolean} [params.ignoreExistingCategoryScores] - Ignore snapshot_category_scores rows; rubric-only merge.
 * @param {string[]} [params.rubricAttributionReviewSources] - Sources included in `rubric_review_attributions` (default all allowed).
 */
export async function persistRubricSnapshotFromPeriodReviews({
  supabase,
  restaurant,
  periodReviews,
  periodLabel,
  periodStartIso,
  periodEndIso,
  dryRun = false,
  reviewSourceNote,
  inquiryPlan,
  lead = null,
  skipObservationUpsert = false,
  ignoreExistingCategoryScores = false,
  rubricAttributionReviewSources,
}) {
  const planPresentation = intakePlanPresentation(inquiryPlan);
  const scorecardHeadline = `Guest Signal snapshot (${periodLabel})${planPresentation.headlineTag}`;

  const googleCount = periodReviews.filter((r) => r.source === "google").length;
  const yelpCount = periodReviews.filter((r) => r.source === "yelp").length;
  const totalReviews = periodReviews.length;
  const confidenceLevel = confidenceLevelFromReviewCount(totalReviews);

  if (!skipObservationUpsert && !dryRun && periodReviews.length) {
    const inserts = periodReviews.map((review) => ({
      restaurant_id: restaurant.id,
      ...review,
    }));
    const { error: insertError } = await supabase
      .from("review_observations")
      .upsert(inserts, { onConflict: "restaurant_id,source,external_review_id", ignoreDuplicates: false });
    if (insertError) throw insertError;
  }

  const { written, starOnly } = splitWrittenAndStarOnlyReviews(periodReviews);
  const rubricScores = computeRubricCategoryScores(written);

  const { data: existingSnapshot, error: snapshotFetchError } = await supabase
    .from("snapshots")
    .select("id, guest_signal_score, total_reviews_analyzed, google_reviews_analyzed, yelp_reviews_analyzed")
    .eq("restaurant_id", restaurant.id)
    .eq("period_label", periodLabel)
    .maybeSingle();
  if (snapshotFetchError) throw snapshotFetchError;

  const snapshotId = existingSnapshot?.id ?? randomUUID();

  const existingByCategory = new Map();
  if (!ignoreExistingCategoryScores) {
    const { data: existingCategoryRows, error: categoryFetchError } = await supabase
      .from("snapshot_category_scores")
      .select("category, score, mentions")
      .eq("snapshot_id", snapshotId);
    if (categoryFetchError) throw categoryFetchError;
    for (const row of existingCategoryRows ?? []) {
      if (!row?.category || row.score == null) continue;
      const mentionsRaw = Number(row.mentions ?? 0);
      const mentions = Number.isFinite(mentionsRaw) && mentionsRaw > 0 ? mentionsRaw : 0;
      existingByCategory.set(String(row.category), { score: Number(row.score), mentions });
    }
  }

  const merged = new Map();
  const allCategories = new Set([...existingByCategory.keys(), ...rubricScores.keys()]);
  for (const category of allCategories) {
    const existing = existingByCategory.get(category) ?? null;
    const incoming = rubricScores.get(category) ?? null;
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

  const { displayScores, overallScore, pillarScoresRaw, starOnlyCount, starOnlyAvg } = computeBlendedRubricDisplay(
    merged,
    starOnly,
  );
  const existingOverallScore = parseNumber(existingSnapshot?.guest_signal_score);
  const effectiveOverallScore = overallScore ?? existingOverallScore;
  const canPersistSnapshot = effectiveOverallScore != null;

  const categoryScoresPayload = [...merged.entries()].map(([category, row]) => ({
    category,
    score: row.score,
    mentions: row.mentions,
  }));

  let scorecardData = {
    review_scoring_model: "guest_signal_rubric_v1",
    confidence_level: confidenceLevel,
    category_scores: categoryScoresPayload,
    total_reviews_analyzed: totalReviews,
    google_reviews_analyzed: googleCount,
    yelp_reviews_analyzed: yelpCount,
    // Always persist JSON nulls for missing pillars so portal never keeps stale tiles from prior merges.
    experience_quality: displayScores.experience_quality ?? null,
    service_hospitality: displayScores.service_hospitality ?? null,
    food_beverage: displayScores.food_beverage ?? null,
    operational_reliability: displayScores.operational_reliability ?? null,
    emotional_connection: displayScores.emotional_connection ?? null,
    intake_automation: true,
    intake_inquiry_plan: normalizeInquiryPlan(inquiryPlan),
    intake_plan_label: planPresentation.humanLabel,
    scoring_period_label: periodLabel,
    scoring_period_start: periodStartIso,
    scoring_period_end: periodEndIso,
    scoring_period_note: `Review window: ${periodLabel} (${periodStartIso} through ${periodEndIso} UTC) — the most recently completed calendar month. Reviews outside this range are excluded before scoring.`,
    intake_plan_callouts: planPresentation.callouts,
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
        "Guest Signal rubric v1 — written reviews drive mention+star category scores per category; each pillar/tile blends 80% mention-based leg + 20% mean star→rubric from textless reviews only when that pillar/tile has a written score; unmentioned dimensions stay null. Overall uses pillar weights on non-null pillars; if all pillars are null but textless reviews exist, overall falls back to mean star→rubric.",
      pillar_written_weight: 0.8,
      pillar_star_only_weight: 0.2,
      written_review_count_rubric: written.length,
      star_only_review_count: starOnlyCount,
      star_only_rubric_avg: starOnlyAvg != null ? Number(starOnlyAvg.toFixed(2)) : null,
      pillar_scores_written_leg: pillarScoresRaw,
    },
  };

  const planNorm = normalizeInquiryPlan(inquiryPlan);
  if (lead && planNorm === "free_snapshot" && canPersistSnapshot) {
    const pillarsForDeliverables = [
      { key: "experience_quality", label: "Experience", score: displayScores.experience_quality },
      { key: "operational_reliability", label: "Operational", score: displayScores.operational_reliability },
      { key: "emotional_connection", label: "Emotional", score: displayScores.emotional_connection },
    ];
    let competitors = [];
    if (Array.isArray(restaurant?.competitors)) {
      competitors = restaurant.competitors;
    } else if (typeof restaurant?.competitors === "string") {
      try {
        competitors = JSON.parse(restaurant.competitors);
      } catch {
        competitors = [];
      }
    }
    const { snapshot_deliverables, swot } = await buildSnapshotDeliverablesForScorecard({
      lead,
      overallScore: effectiveOverallScore,
      categoryScores: categoryScoresPayload,
      pillars: pillarsForDeliverables,
      googleCount,
      periodLabel,
      competitors,
    });
    scorecardData = {
      ...scorecardData,
      snapshot_deliverables,
      swot,
    };
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          snapshotId,
          effectiveOverallScore,
          pillarScoresWrittenLeg: pillarScoresRaw,
          pillarScoresDisplay: displayScores,
          starOnlyCount,
          starOnlyAvg,
          categoryScoresPayload,
          reviewSourceNote,
        },
        null,
        2,
      ),
    );
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
      pillar_experience_quality: displayScores.experience_quality,
      pillar_operational_reliability: displayScores.operational_reliability,
      pillar_emotional_connection: displayScores.emotional_connection,
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
        pillar_experience_quality: displayScores.experience_quality,
        pillar_operational_reliability: displayScores.operational_reliability,
        pillar_emotional_connection: displayScores.emotional_connection,
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

  const prunedExisting =
    existingScorecard?.data && typeof existingScorecard.data === "object"
      ? Object.fromEntries(
          Object.entries(existingScorecard.data).filter(
            ([k]) =>
              !String(k).startsWith("gss_") &&
              k !== "review_scoring_model" &&
              k !== "gss_review_sources_used" &&
              k !== "review_batch_id",
          ),
        )
      : {};

  if (!existingScorecard) {
    const { error: scorecardInsertError } = await supabase.from("scorecards").insert({
      restaurant_id: restaurant.id,
      period: periodLabel,
      score: effectiveOverallScore,
      headline: scorecardHeadline,
      data: {
        snapshot_id: snapshotId,
        ...scorecardData,
      },
    });
    if (scorecardInsertError) throw scorecardInsertError;
  } else {
    const { error: scorecardUpdateError } = await supabase
      .from("scorecards")
      .update({
        score: effectiveOverallScore,
        headline: scorecardHeadline,
        data: {
          ...prunedExisting,
          snapshot_id: snapshotId,
          ...scorecardData,
        },
      })
      .eq("id", existingScorecard.id);
    if (scorecardUpdateError) throw scorecardUpdateError;
  }

  if (!dryRun && canPersistSnapshot && snapshotId) {
    const attrSources =
      rubricAttributionReviewSources?.length > 0 ? rubricAttributionReviewSources : RUBRIC_ALLOWED_REVIEW_SOURCES;
    try {
      const n = await replaceRubricReviewAttributionsForSnapshot({
        supabase,
        snapshotId,
        restaurantId: restaurant.id,
        periodLabel,
        periodStartIso,
        periodEndIso,
        reviewSources: attrSources,
      });
      console.log(`[${restaurant.slug}] rubric_review_attributions rows=${n} (${reviewSourceNote}).`);
    } catch (e) {
      console.warn(`[${restaurant.slug}] rubric_review_attributions skipped:`, e?.message || e);
    }
  }

  console.log(`[${restaurant.slug}] Rubric snapshot + scorecard saved (${reviewSourceNote}).`);
  return true;
}
