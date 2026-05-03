/**
 * Portal scorecard persistence for Guest Signal rubric v1 (same math as lead intake).
 * Used by lead intake and by `rebuild-rubric-scorecard-from-observations.mjs`.
 */
import { randomUUID } from "node:crypto";
import {
  computeRubricCategoryScores,
  confidenceLevelFromReviewCount,
  overallGuestSignalFromPillars,
  parseNumber,
  singleCategoryScore,
  weightedPillarFromMerged,
  RUBRIC_SUBWEIGHTS,
} from "./guest-signal-rubric.mjs";

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
          "Full onboarding layers Google coverage, executive summary, and your prioritized action plan.",
        ],
      };
  }
}

/**
 * @param {object} params
 * @param {boolean} [params.skipObservationUpsert] - Do not write review_observations (already persisted).
 * @param {boolean} [params.ignoreExistingCategoryScores] - Ignore snapshot_category_scores rows; rubric-only merge.
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
  skipObservationUpsert = false,
  ignoreExistingCategoryScores = false,
}) {
  const planPresentation = intakePlanPresentation(inquiryPlan);
  const scorecardHeadline = `Guest Signal snapshot (${periodLabel})${planPresentation.headlineTag}`;

  const googleCount = periodReviews.filter((r) => r.source === "google").length;
  const yelpCount = periodReviews.filter((r) => r.source === "yelp").length;
  const totalReviews = googleCount + yelpCount;
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

  const rubricScores = computeRubricCategoryScores(periodReviews);

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

  console.log(`[${restaurant.slug}] Rubric snapshot + scorecard saved (${reviewSourceNote}).`);
  return true;
}
