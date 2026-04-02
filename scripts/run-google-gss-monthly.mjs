#!/usr/bin/env node
/**
 * Guest Signal Score™ — Google monthly methodology (board spec).
 * Uses review_observations within PERIOD_START..PERIOD_END (default source: google only).
 * Optional GSS_REVIEW_SOURCES=google,yelp when Google rows are empty but Yelp text exists.
 *
 * Sentiment per category per review: only when category is mentioned in text; else 0.
 * Star rating maps to Strong +2 … Strong −2 for mentioned categories.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PERIOD_START, PERIOD_END (YYYY-MM-DD),
 *      PERIOD_LABEL (e.g. Mar 2026), optional RESTAURANT_SLUGS, GSS_REVIEW_SOURCES, DRY_RUN=1
 */
import { createClient } from "@supabase/supabase-js";

const GSS_CATEGORY_KEYS = ["food", "service", "cleanliness", "speed", "atmosphere"];

const GSS_CATEGORY_WEIGHTS = {
  food: 0.25,
  service: 0.2,
  cleanliness: 0.15,
  speed: 0.15,
  atmosphere: 0.15,
};

const CATEGORY_KEYWORDS = {
  food: [
    "food",
    "meal",
    "dish",
    "menu",
    "taste",
    "flavor",
    "drink",
    "delicious",
    "tasty",
    "overcooked",
    "undercooked",
  ],
  service: ["service", "server", "staff", "host", "manager", "waiter", "waitress", "friendly", "rude"],
  cleanliness: ["clean", "dirty", "hygiene", "sanitary", "bathroom", "restroom", "messy"],
  speed: ["fast", "slow", "wait", "quick", "timely", "late", "delay", "minutes"],
  atmosphere: ["atmosphere", "ambience", "ambiance", "vibe", "music", "noise", "decor", "noisy", "quiet"],
};

const MONTH_INDEX = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

function previousMonthLabel(periodLabel) {
  const trimmed = periodLabel.trim();
  const m = /^([a-z]+)\s+(\d{4})$/i.exec(trimmed);
  if (!m) return null;
  const mk = m[1].toLowerCase();
  const year = Number(m[2]);
  const monthNum = MONTH_INDEX[mk];
  if (!monthNum) return null;
  let prevM = monthNum - 1;
  let prevY = year;
  if (prevM < 1) {
    prevM = 12;
    prevY -= 1;
  }
  return `${MONTH_NAMES[prevM - 1]} ${prevY}`;
}

function normalizeText(input) {
  return String(input ?? "").toLowerCase();
}

function mentionsCategory(text, category) {
  const normalized = normalizeText(text);
  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  return keywords.some((k) => normalized.includes(k));
}

function parseRating(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function starToSentiment(rating) {
  const r = rating == null ? NaN : Math.round(Number(rating));
  if (!Number.isFinite(r)) return 0;
  if (r >= 5) return 2;
  if (r === 4) return 1;
  if (r === 3) return 0;
  if (r === 2) return -1;
  return -2;
}

function categoryScoreFromSentiments(totalSentiment, reviewCount) {
  if (!reviewCount) return null;
  const ratio = totalSentiment / (reviewCount * 2);
  return Math.round(50 + ratio * 50);
}

/** Mention-only categories; renormalize weights over scored categories (no neutral 50s for silence). */
function weightedGuestSignalRenormalized(scoresByCategory) {
  let sum = 0;
  let wSum = 0;
  for (const key of GSS_CATEGORY_KEYS) {
    const s = scoresByCategory[key];
    if (s == null) continue;
    sum += s * GSS_CATEGORY_WEIGHTS[key];
    wSum += GSS_CATEGORY_WEIGHTS[key];
  }
  if (!wSum) return null;
  return Math.round(sum / wSum);
}

function trendModifier(delta) {
  if (delta >= 3) return 3;
  if (delta >= 2) return 2;
  if (delta >= 1) return 1;
  if (delta > -1) return 0;
  if (delta >= -2) return -1;
  if (delta >= -3) return -2;
  return -3;
}

function legacyPillarsFromGssCategories(c) {
  const food = c.food;
  const service = c.service;
  const speed = c.speed;
  const cleanliness = c.cleanliness;
  const atmosphere = c.atmosphere;
  let experience = null;
  if (food != null && service != null) {
    experience = Math.round((food * 0.25 + service * 0.2) / 0.45);
  } else if (food != null) {
    experience = food;
  } else if (service != null) {
    experience = service;
  }
  let operational = null;
  if (speed != null && cleanliness != null) {
    operational = Math.round((speed * 0.15 + cleanliness * 0.15) / 0.3);
  } else if (speed != null) {
    operational = speed;
  } else if (cleanliness != null) {
    operational = cleanliness;
  }
  return {
    experience_quality: experience,
    operational_reliability: operational,
    emotional_connection: atmosphere,
  };
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());

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
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const reviewSources = getEnv("GSS_REVIEW_SOURCES", { fallback: "google" })
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allowedSources = new Set(["google", "yelp"]);
  for (const s of reviewSources) {
    if (!allowedSources.has(s)) {
      throw new Error(`GSS_REVIEW_SOURCES: unknown source "${s}" (allowed: google, yelp)`);
    }
  }
  if (!reviewSources.length) {
    throw new Error("GSS_REVIEW_SOURCES must list at least one of: google, yelp");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurants, error: rErr } = await supabase.from("restaurants").select("id, slug, name").order("name");
  if (rErr) throw rErr;

  const candidates = (restaurants ?? []).filter((row) => {
    if (!slugFilter.size) return true;
    return slugFilter.has(String(row.slug));
  });

  const prevPeriod = previousMonthLabel(periodLabel);

  console.log(
    `Google GSS pipeline — ${periodLabel} (${periodStartIso} → ${periodEndIso}), sources=[${reviewSources.join(",")}], prior period: ${prevPeriod ?? "n/a"}`,
  );

  for (const restaurant of candidates) {
    const { data: rows, error: oErr } = await supabase
      .from("review_observations")
      .select("source, review_text, rating, review_date, external_review_id")
      .eq("restaurant_id", restaurant.id)
      .in("source", reviewSources)
      .gte("review_date", periodStartIso)
      .lte("review_date", periodEndIso)
      .order("review_date", { ascending: false });

    if (oErr) throw oErr;
    const reviews = (rows ?? []).map((r) => ({
      source: String(r.source ?? ""),
      review_text: r.review_text,
      rating: parseRating(r.rating),
      review_date: r.review_date,
      external_review_id: r.external_review_id,
    }));

    const n = reviews.length;
    const googleInWindow = reviews.filter((r) => r.source === "google").length;
    const yelpInWindow = reviews.filter((r) => r.source === "yelp").length;
    console.log(
      `\n[${restaurant.slug}] ${n} reviews in window (google=${googleInWindow}, yelp=${yelpInWindow})`,
    );

    if (!n) {
      console.warn(
        `[${restaurant.slug}] No review_observations rows for sources [${reviewSources.join(",")}] in this window; skipping.`,
      );
      continue;
    }

    const sentimentTotals = Object.fromEntries(GSS_CATEGORY_KEYS.map((k) => [k, 0]));
    const mentionCounts = Object.fromEntries(GSS_CATEGORY_KEYS.map((k) => [k, 0]));
    for (const rev of reviews) {
      for (const cat of GSS_CATEGORY_KEYS) {
        if (mentionsCategory(rev.review_text, cat)) {
          sentimentTotals[cat] += starToSentiment(rev.rating);
          mentionCounts[cat] += 1;
        }
      }
    }

    const categoryScores = {};
    for (const cat of GSS_CATEGORY_KEYS) {
      const mc = mentionCounts[cat];
      categoryScores[cat] =
        mc > 0 ? categoryScoreFromSentiments(sentimentTotals[cat], mc) : null;
    }

    const gssBase = weightedGuestSignalRenormalized(categoryScores);
    if (gssBase == null) {
      console.warn(
        `[${restaurant.slug}] No category keyword mentions in this window; skipping GSS write.`,
      );
      continue;
    }

    let prevBase = null;
    if (prevPeriod) {
      const { data: prevRow, error: pErr } = await supabase
        .from("scorecards")
        .select("score, data")
        .eq("restaurant_id", restaurant.id)
        .eq("period", prevPeriod)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pErr) console.warn("prev scorecard fetch:", pErr.message);
      if (prevRow) {
        const d = prevRow.data && typeof prevRow.data === "object" ? prevRow.data : {};
        prevBase = typeof d.gss_google_base === "number" ? d.gss_google_base : prevRow.score;
      }
    }

    const delta = prevBase == null ? 0 : gssBase - prevBase;
    const trend = prevBase == null ? 0 : trendModifier(delta);
    const gssFinal = Math.min(100, Math.max(0, gssBase + trend));

    const pillars = legacyPillarsFromGssCategories(categoryScores);

    const { data: existingSnapshot, error: sErr } = await supabase
      .from("snapshots")
      .select("id, yelp_reviews_analyzed, google_reviews_analyzed")
      .eq("restaurant_id", restaurant.id)
      .eq("period_label", periodLabel)
      .maybeSingle();
    if (sErr) throw sErr;

    const snapshotId = existingSnapshot?.id ?? crypto.randomUUID();
    const totalReviews = n;

    const { data: existingCategoryRows, error: cErr } = await supabase
      .from("snapshot_category_scores")
      .select("category, score, mentions")
      .eq("snapshot_id", snapshotId);
    if (cErr) throw cErr;

    const mergedByCategory = new Map();
    for (const row of existingCategoryRows ?? []) {
      if (!row?.category || row.score == null) continue;
      mergedByCategory.set(String(row.category), {
        score: Number(row.score),
        mentions: Number(row.mentions ?? 0) || 0,
      });
    }

    for (const cat of GSS_CATEGORY_KEYS) {
      const s = categoryScores[cat];
      const mc = mentionCounts[cat];
      if (s != null && mc > 0) {
        mergedByCategory.set(cat, { score: s, mentions: mc });
      }
    }

    const mergedRows = [...mergedByCategory.entries()]
      .filter(([, row]) => row.score != null && Number.isFinite(Number(row.score)))
      .map(([category, row]) => ({
        snapshot_id: snapshotId,
        category,
        score: row.score,
        mentions: row.mentions,
      }));

    const categoryScoresPayload = GSS_CATEGORY_KEYS.filter((cat) => categoryScores[cat] != null).map(
      (cat) => ({
        category: cat,
        score: categoryScores[cat],
        mentions: mentionCounts[cat],
      }),
    );

    let weightedNumerator = 0;
    let weightedDenominator = 0;
    for (const key of GSS_CATEGORY_KEYS) {
      const s = categoryScores[key];
      if (s == null) continue;
      weightedNumerator += s * GSS_CATEGORY_WEIGHTS[key];
      weightedDenominator += GSS_CATEGORY_WEIGHTS[key];
    }

    const scorecardData = {
      review_scoring_model: "guest_signal_google_gss_v1",
      gss_review_sources_used: reviewSources,
      gss_google_base: gssBase,
      gss_google_trend_delta_vs_prior: prevBase == null ? null : Number(delta.toFixed(2)),
      gss_google_trend_modifier: trend,
      gss_google_final: gssFinal,
      gss_sentiment_totals: sentimentTotals,
      gss_category_weights: GSS_CATEGORY_WEIGHTS,
      category_scores: [...categoryScoresPayload],
      total_reviews_analyzed: totalReviews,
      google_reviews_analyzed: googleInWindow,
      yelp_reviews_analyzed: yelpInWindow,
      experience_quality: pillars.experience_quality,
      service_hospitality: categoryScores.service,
      food_beverage: categoryScores.food,
      operational_reliability: pillars.operational_reliability,
      emotional_connection: pillars.emotional_connection,
      pillar_experience_quality: pillars.experience_quality,
      pillar_operational_reliability: pillars.operational_reliability,
      pillar_emotional_connection: pillars.emotional_connection,
      total_score_breakdown: {
        scorecard_total_score: gssFinal,
        weighted_category_numerator: Number(weightedNumerator.toFixed(4)),
        weighted_category_weight_sum: Number(weightedDenominator.toFixed(4)),
        source:
          reviewSources.length === 1 && reviewSources[0] === "google"
            ? "Guest Signal Score™ Google methodology (board): per-category sentiment ÷(2×mention count); weighted mean over mentioned categories only; trend vs prior"
            : `Guest Signal Score™ methodology on sources [${reviewSources.join(",")}] (board math); mentioned categories only; prefer pure google when available`,
      },
    };

    if (dryRun) {
      console.log(`[${restaurant.slug}] DRY_RUN`, JSON.stringify({ gssBase, trend, gssFinal, categoryScores, pillars }, null, 2));
      continue;
    }

    const confidenceLevel = n >= 50 ? "high" : n >= 20 ? "medium" : "low";

    if (!existingSnapshot) {
      const { error: insErr } = await supabase.from("snapshots").insert({
        id: snapshotId,
        restaurant_id: restaurant.id,
        period_label: periodLabel,
        period_start: periodStartIso,
        period_end: periodEndIso,
        guest_signal_score: gssFinal,
        written_review_score: gssBase,
        confidence_level: confidenceLevel,
        total_reviews_analyzed: totalReviews,
        google_reviews_analyzed: googleInWindow,
        yelp_reviews_analyzed: yelpInWindow,
        pillar_experience_quality: pillars.experience_quality,
        pillar_operational_reliability: pillars.operational_reliability,
        pillar_emotional_connection: pillars.emotional_connection,
      });
      if (insErr) throw insErr;
    } else {
      const { error: updErr } = await supabase
        .from("snapshots")
        .update({
          period_start: periodStartIso,
          period_end: periodEndIso,
          guest_signal_score: gssFinal,
          written_review_score: gssBase,
          confidence_level: confidenceLevel,
          total_reviews_analyzed: totalReviews,
          google_reviews_analyzed: googleInWindow,
          yelp_reviews_analyzed: yelpInWindow,
          pillar_experience_quality: pillars.experience_quality,
          pillar_operational_reliability: pillars.operational_reliability,
          pillar_emotional_connection: pillars.emotional_connection,
        })
        .eq("id", snapshotId);
      if (updErr) throw updErr;
    }

    if (mergedRows.length) {
      const { error: uErr } = await supabase
        .from("snapshot_category_scores")
        .upsert(mergedRows, { onConflict: "snapshot_id,category" });
      if (uErr) throw uErr;
    }

    const { data: existingScorecard, error: scErr } = await supabase
      .from("scorecards")
      .select("id, data")
      .eq("restaurant_id", restaurant.id)
      .eq("period", periodLabel)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (scErr) throw scErr;

    if (!existingScorecard) {
      const { error: sciErr } = await supabase.from("scorecards").insert({
        restaurant_id: restaurant.id,
        period: periodLabel,
        score: gssFinal,
        headline:
          reviewSources.length === 1 && reviewSources[0] === "google"
            ? `Guest Signal Score™ (${periodLabel}, Google window)`
            : `Guest Signal Score™ (${periodLabel}, ${reviewSources.join("+")} window)`,
        data: {
          snapshot_id: snapshotId,
          ...scorecardData,
        },
      });
      if (sciErr) throw sciErr;
    } else {
      const existingData =
        existingScorecard.data && typeof existingScorecard.data === "object" ? existingScorecard.data : {};
      const { error: scuErr } = await supabase
        .from("scorecards")
        .update({
          score: gssFinal,
          data: {
            ...existingData,
            snapshot_id: snapshotId,
            ...scorecardData,
          },
        })
        .eq("id", existingScorecard.id);
      if (scuErr) throw scuErr;
    }

    console.log(`[${restaurant.slug}] Updated snapshot + scorecard (Google GSS). Final=${gssFinal} base=${gssBase} trend=${trend}`);
  }

  console.log("\nGoogle GSS pipeline complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
