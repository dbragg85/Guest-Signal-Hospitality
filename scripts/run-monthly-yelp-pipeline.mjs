#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  buildApifyInput,
  startApifyRun,
  waitForApifyRun,
  fetchApifyDatasetItems,
  yelpMaxItemsPerRun,
} from "./lib/apify-yelp-actor.mjs";
import {
  normalizeApifyItem,
  computeRubricCategoryScores,
  computeBlendedRubricDisplay,
  splitWrittenAndStarOnlyReviews,
  RUBRIC_ALLOWED_REVIEW_SOURCES,
} from "./lib/guest-signal-rubric.mjs";
import { replaceRubricReviewAttributionsForSnapshot } from "./lib/rubric-scorecard-persist.mjs";

// Guest Signal Hospitality rubric (board): score only mentioned categories; scale
// 95 / 85 / 70 / 50 / 30. Pillars: Experience (Food+Service), Operational (Speed+Cleanliness),
// Emotional (Atmosphere+Return intent). Weights below match the issued rubric percents.
const CATEGORY_KEYWORDS = {
  food: [
    "food",
    "meal",
    "dish",
    "menu",
    "taste",
    "flavor",
    "drink",
    "cocktail",
    "beer",
    "wine",
    "delicious",
    "tasty",
    "yummy",
    "overcooked",
    "undercooked",
    "portion",
    "plating",
  ],
  service: [
    "service",
    "server",
    "staff",
    "host",
    "manager",
    "waiter",
    "waitress",
    "friendly",
    "rude",
    "helpful",
    "hospitality",
  ],
  speed: ["fast", "slow", "wait", "quick", "timely", "late", "delay", "minutes", "long wait", "rush"],
  cleanliness: ["clean", "dirty", "hygiene", "sanitary", "bathroom", "restroom", "messy", "spotless"],
  atmosphere: [
    "atmosphere",
    "ambience",
    "ambiance",
    "vibe",
    "music",
    "noise",
    "decor",
    "noisy",
    "quiet",
    "crowded",
    "patio",
  ],
};

const RETURN_INTENT_HINTS =
  /\b(return|be back|come back|go back|never again|not coming back|will be back|revisit|recommend|second time|visit again)\b/i;

const RUBRIC_SUBWEIGHTS = {
  experience_quality: { food: 27 / 45, service: 18 / 45 },
  operational_reliability: { speed: 15 / 30, cleanliness: 15 / 30 },
  emotional_connection: { atmosphere: 15 / 25, return_intent: 10 / 25 },
};

const RUBRIC_PILLAR_WEIGHTS = {
  experience_quality: 0.45,
  operational_reliability: 0.3,
  emotional_connection: 0.25,
};

function getEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required) throw new Error(`Missing required env var: ${name}`);
  return fallback;
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function lastCompletedMonthWindow() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth(), 0));
  return { start, end };
}

function monthLabelFromDate(date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function normalizeText(input) {
  return String(input ?? "").toLowerCase();
}

function detectMentionedCategories(text) {
  const normalized = normalizeText(text);
  const out = new Set();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      out.add(category);
    }
  }
  if (RETURN_INTENT_HINTS.test(String(text ?? ""))) {
    out.add("return_intent");
  }
  return out;
}

function starToRubricScore(rating) {
  const r = rating == null ? NaN : Math.round(Number(rating));
  if (!Number.isFinite(r)) return 70;
  if (r >= 5) return 95;
  if (r === 4) return 85;
  if (r === 3) return 70;
  if (r === 2) return 50;
  return 30;
}

function returnIntentDelta(text) {
  const t = String(text ?? "");
  if (/(never again|won't be back|will not return|not coming back)/i.test(t)) return -2;
  if (/(probably won't|wouldn't rush back|not worth a return)/i.test(t)) return -1;
  if (/(definitely (be back|return)|can't wait to (go back|return)|will be back)/i.test(t)) return 2;
  if (/(would (come|go) again|would return|visit again)/i.test(t)) return 1;
  return 0;
}

function scoreReturnIntent(text, rating) {
  if (!RETURN_INTENT_HINTS.test(String(text ?? ""))) return null;
  const d = returnIntentDelta(text);
  if (d === 2) return 95;
  if (d === 1) return 85;
  if (d === -2) return 30;
  if (d === -1) return 50;
  return starToRubricScore(rating);
}

function weightedPillarFromMerged(merged, weights) {
  let num = 0;
  let den = 0;
  for (const [cat, w] of Object.entries(weights)) {
    const row = merged.get(cat);
    if (row && row.mentions > 0) {
      num += row.score * w;
      den += w;
    }
  }
  if (!den) return null;
  return Math.round(num / den);
}

function overallGuestSignalFromPillars(pillars) {
  let num = 0;
  let den = 0;
  for (const [key, w] of Object.entries(RUBRIC_PILLAR_WEIGHTS)) {
    const v = pillars[key];
    if (v != null) {
      num += v * w;
      den += w;
    }
  }
  if (!den) return null;
  return Math.round(num / den);
}

function singleCategoryScore(map, cat) {
  const row = map.get(cat);
  if (!row || !row.mentions) return null;
  return row.score;
}

function rubricReviewPreviewRows(reviews, limit = 8) {
  return reviews.slice(0, limit).map((review) => {
    const mentioned = [...detectMentionedCategories(review.review_text ?? "")];
    const row = {
      review_id: String(review.external_review_id ?? "").slice(0, 12),
      rating: review.rating ?? "",
      mentioned: mentioned.join(",") || "(none)",
    };
    for (const cat of mentioned) {
      if (cat === "return_intent") {
        row.return_intent = scoreReturnIntent(review.review_text ?? "", review.rating) ?? "";
      } else {
        row[cat] = starToRubricScore(review.rating);
      }
    }
    return row;
  });
}

function parseRating(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseNumber(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function readPath(input, path) {
  if (!input || typeof input !== "object") return null;
  const parts = path.split(".");
  let current = input;
  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part];
  }
  return current ?? null;
}

function firstNonEmptyString(input, paths) {
  for (const path of paths) {
    const value = readPath(input, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function firstNonNull(input, paths) {
  for (const path of paths) {
    const value = readPath(input, path);
    if (value != null) return value;
  }
  return null;
}

function confidenceLevelFromReviewCount(totalReviews) {
  if (totalReviews >= 50) return "high";
  if (totalReviews >= 20) return "medium";
  return "low";
}

function loadMockDatasetFromEnv() {
  const rawJson = getEnv("APIFY_MOCK_DATASET_JSON", { fallback: "" });
  const filePath = getEnv("APIFY_MOCK_DATASET_FILE", { fallback: "" });
  if (!rawJson && !filePath) return null;

  const raw = rawJson || readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) return { defaultItems: parsed };
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Mock dataset must be an array or object.");
  }
  if (Array.isArray(parsed.items)) return { defaultItems: parsed.items };

  const bySlug = {};
  const entries = Object.entries(parsed.bySlug ?? {});
  for (const [slug, items] of entries) {
    if (!Array.isArray(items)) {
      throw new Error(`Mock dataset bySlug.${slug} must be an array.`);
    }
    bySlug[slug] = items;
  }
  if (!entries.length) {
    throw new Error("Mock dataset object must include either items[] or bySlug{slug:[]}.");
  }
  return { bySlug };
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const mockDataset = loadMockDatasetFromEnv();
  const apifyToken = mockDataset ? null : getEnv("APIFY_TOKEN", { required: true });
  const apifyActorId = mockDataset ? null : getEnv("APIFY_YELP_ACTOR_ID", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());
  const ingestOnly = ["1", "true", "yes"].includes(
    (getEnv("YELP_MONTHLY_INGEST_ONLY", { fallback: "0" }) || "").toLowerCase(),
  );

  const providedStart = getEnv("PERIOD_START", { fallback: "" });
  const providedEnd = getEnv("PERIOD_END", { fallback: "" });
  const defaultWindow = lastCompletedMonthWindow();

  const periodStart = parseDateOnly(providedStart) ?? defaultWindow.start;
  const periodEnd = parseDateOnly(providedEnd) ?? defaultWindow.end;
  if (periodEnd < periodStart) {
    throw new Error("PERIOD_END must be on/after PERIOD_START");
  }

  const periodLabel = getEnv("PERIOD_LABEL", { fallback: monthLabelFromDate(periodStart) });
  const periodStartIso = toIsoDate(periodStart);
  const periodEndIso = toIsoDate(periodEnd);

  const slugFilterRaw = getEnv("RESTAURANT_SLUGS", { fallback: "" });
  const slugFilter = new Set(
    slugFilterRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurants, error: restaurantsError } = await supabase
    .from("restaurants")
    .select("id, slug, name, yelp_url")
    .not("yelp_url", "is", null)
    .order("name", { ascending: true });

  if (restaurantsError) throw restaurantsError;

  const candidates = (restaurants ?? []).filter((row) => {
    if (!row?.yelp_url) return false;
    if (!slugFilter.size) return true;
    return slugFilter.has(String(row.slug));
  });

  if (!candidates.length) {
    console.log("No restaurants found with yelp_url for this run.");
    return;
  }

  if (mockDataset) {
    console.log("Running in mock Yelp dataset mode (no live Apify actor calls).");
  }

  console.log(
    `Running period ${periodLabel} (${periodStartIso} → ${periodEndIso}) for ${candidates.length} restaurant(s)${ingestOnly ? " — YELP_MONTHLY_INGEST_ONLY (review_observations only)" : ""}`,
  );

  for (const restaurant of candidates) {
    let rawItems = [];
    if (mockDataset) {
      rawItems = mockDataset.bySlug?.[restaurant.slug] ?? mockDataset.defaultItems ?? [];
      console.log(`\n[${restaurant.slug}] Loaded ${rawItems.length} mock Yelp review rows.`);
    } else {
      console.log(`\n[${restaurant.slug}] Pulling Yelp reviews from Apify...`);
      const input = buildApifyInput(restaurant.yelp_url, {
        periodStartIso,
        periodEndIso,
        actorId: apifyActorId,
      });
      const cap = yelpMaxItemsPerRun();
      const addRunMaxQuery = !["0", "false", "no"].includes(
        (getEnv("APIFY_YELP_RUN_MAX_ITEMS_QUERY", { fallback: "1" }) || "").toLowerCase(),
      );
      const run = await startApifyRun({
        token: apifyToken,
        actorId: apifyActorId,
        input,
        runQuery: addRunMaxQuery ? { maxItems: cap } : {},
      });
      const finalRun = await waitForApifyRun({ token: apifyToken, runId: run.id });
      if (finalRun.status !== "SUCCEEDED") {
        throw new Error(`[${restaurant.slug}] Apify run ${run.id} ended with status ${finalRun.status}`);
      }
      const datasetClean = !["0", "false", "no"].includes(
        (getEnv("YELP_DATASET_CLEAN", { fallback: "false" }) || "").toLowerCase(),
      );
      rawItems = await fetchApifyDatasetItems({
        token: apifyToken,
        datasetId: finalRun.defaultDatasetId,
        clean: datasetClean,
      });
    }
    const rawFiltered = (rawItems ?? []).filter(
      (row) => row && typeof row === "object" && !row.demo && !row.isDemo && !row.demoMode,
    );
    const parsed = rawFiltered.map((row) => normalizeApifyItem(row, "yelp")).filter(Boolean);
    if ((rawItems ?? []).length > 0 && parsed.length === 0) {
      const sample = rawFiltered[0] ?? rawItems[0] ?? {};
      const sampleKeys = Object.keys(sample).slice(0, 20);
      const demoFlag = Boolean(sample.demo || sample.isDemo || sample.demoMode);
      const msg = [
        `[${restaurant.slug}] Apify dataset returned ${rawItems.length} row(s) but none matched expected review fields.`,
        `Sample keys: ${sampleKeys.join(", ") || "(none)"}`,
        demoFlag ? "Sample row indicates demo mode; check APIFY_YELP_ACTOR_ID / Yelp access or set APIFY_YELP_INPUT_TEMPLATE_JSON." : "",
      ]
        .filter(Boolean)
        .join(" ");
      if (ingestOnly) {
        console.warn(msg);
        if (demoFlag) {
          console.warn(
            `[${restaurant.slug}] Apify returned demo placeholder rows only (typical on Free plan). Subscribe for live Yelp data: https://apify.com/pricing`,
          );
        }
        console.warn(
          `[${restaurant.slug}] YELP_MONTHLY_INGEST_ONLY: continuing with 0 Yelp rows (rubric/GSS can use Google only).`,
        );
        continue;
      }
      throw new Error(msg);
    }

    // Apify may return maxItems (e.g. 10 newest) wider than the scoring month — only rows with
    // review_date in [PERIOD_START, PERIOD_END] are upserted and used in rubric/GSS.
    const inScoringMonth = (review) =>
      Boolean(
        review.review_date &&
          review.review_date >= periodStartIso &&
          review.review_date <= periodEndIso,
      );
    const periodReviews = parsed.filter(inScoringMonth);
    const droppedOutsideMonth = parsed.filter(
      (r) => r.review_date && !inScoringMonth(r),
    ).length;
    const droppedNoDate = parsed.filter((r) => !r.review_date).length;

    console.log(
      `[${restaurant.slug}] Yelp: normalized ${parsed.length} from Apify; kept ${periodReviews.length} in scoring month [${periodStartIso}…${periodEndIso}] (${droppedOutsideMonth} discarded outside window, ${droppedNoDate} no parseable date).`,
    );

    if (!dryRun && periodReviews.length) {
      const inserts = periodReviews.map((review) => ({
        restaurant_id: restaurant.id,
        ...review,
      }));
      const { error: insertError } = await supabase
        .from("review_observations")
        .upsert(inserts, { onConflict: "restaurant_id,source,external_review_id", ignoreDuplicates: false });
      if (insertError) throw insertError;
      console.log(`[${restaurant.slug}] Upserted ${inserts.length} Yelp review_observations row(s).`);
    }

    if (ingestOnly) {
      if (dryRun && periodReviews.length) {
        console.log(`[${restaurant.slug}] DRY_RUN (ingest-only): would upsert ${periodReviews.length} Yelp review(s) in window.`);
        console.table(rubricReviewPreviewRows(periodReviews));
      } else if (dryRun) {
        console.log(`[${restaurant.slug}] DRY_RUN (ingest-only): 0 Yelp reviews in window.`);
      } else if (!periodReviews.length) {
        console.warn(`[${restaurant.slug}] Ingest-only: 0 Yelp reviews in window; nothing upserted.`);
      }
      console.log(
        `[${restaurant.slug}] YELP_MONTHLY_INGEST_ONLY=1 — skipped rubric snapshot/scorecard (run pipeline:google:gss with GSS_REVIEW_SOURCES=google,yelp).`,
      );
      continue;
    }

    const { written, starOnly } = splitWrittenAndStarOnlyReviews(periodReviews);
    const yelpScores = computeRubricCategoryScores(written);

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

    const googleCount = Number(existingSnapshot?.google_reviews_analyzed ?? 0);
    const yelpCount = periodReviews.length;
    const totalReviews = googleCount + yelpCount;
    const confidenceLevel = confidenceLevelFromReviewCount(totalReviews);

    const { displayScores, displayCategoryScores, overallScore, pillarScoresRaw, starOnlyCount, starOnlyAvg } =
      computeBlendedRubricDisplay(merged, starOnly);
    const existingOverallScore = parseNumber(existingSnapshot?.guest_signal_score);
    const effectiveOverallScore = overallScore ?? existingOverallScore;
    const canPersistSnapshot = effectiveOverallScore != null;

    const categoryScoresPayload = displayCategoryScores;

    const mergedRows = categoryScoresPayload.map((row) => ({
      snapshot_id: snapshotId,
      category: row.category,
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
      experience_quality: displayScores.experience_quality,
      service_hospitality: displayScores.service_hospitality,
      food_beverage: displayScores.food_beverage,
      operational_reliability: displayScores.operational_reliability,
      emotional_connection: displayScores.emotional_connection,
      total_score_breakdown: {
        scorecard_total_score: overallScore,
        category_average:
          categoryScoresPayload.length > 0
            ? Number((categoryScoresPayload.reduce((sum, row) => sum + row.score, 0) / categoryScoresPayload.length).toFixed(1))
            : null,
        category_count: categoryScoresPayload.length,
        variance: null,
        source:
          "Guest Signal rubric v1 — category rows and pillar tiles share the same 80% mention-based + 20% textless-review blend when textless reviews exist; overall uses pillar weights (45/30/25).",
        pillar_written_weight: 0.8,
        pillar_star_only_weight: 0.2,
        written_review_count_rubric: written.length,
        star_only_review_count: starOnlyCount,
        star_only_rubric_avg: starOnlyAvg != null ? Number(starOnlyAvg.toFixed(2)) : null,
        pillar_scores_written_leg: pillarScoresRaw,
      },
    };

    if (dryRun) {
      console.log(`[${restaurant.slug}] DRY_RUN`);
      if (periodReviews.length) {
        console.log(`[${restaurant.slug}] Per-review rubric preview (first rows):`);
        console.table(rubricReviewPreviewRows(periodReviews));
      }
      console.log(JSON.stringify({
        snapshotId,
        overallScore: effectiveOverallScore,
        totalReviews,
        googleCount,
        yelpCount,
        pillarScoresWrittenLeg: pillarScoresRaw,
        pillarScoresDisplay: displayScores,
        starOnlyCount,
        starOnlyAvg,
        categories: categoryScoresPayload,
      }, null, 2));
      continue;
    }

    if (!canPersistSnapshot) {
      console.warn(
        `[${restaurant.slug}] Skipping snapshot/scorecard write for ${periodLabel}: no mention-weighted score available yet (0 parsed mentions).`
      );
      continue;
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
        existingScorecard.data && typeof existingScorecard.data === "object"
          ? existingScorecard.data
          : {};
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

    try {
      const n = await replaceRubricReviewAttributionsForSnapshot({
        supabase,
        snapshotId,
        restaurantId: restaurant.id,
        periodLabel,
        periodStartIso,
        periodEndIso,
        reviewSources: RUBRIC_ALLOWED_REVIEW_SOURCES,
      });
      console.log(`[${restaurant.slug}] rubric_review_attributions rows=${n}`);
    } catch (e) {
      console.warn(`[${restaurant.slug}] rubric_review_attributions:`, e?.message || e);
    }

    console.log(`[${restaurant.slug}] Updated snapshot + scorecard with Yelp source coverage.`);
  }

  console.log("\nPipeline run complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
