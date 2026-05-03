/**
 * Guest Signal Hospitality rubric (board): shared by Yelp pipeline + lead-intake automation.
 * Score only mentioned categories; scale 95 / 85 / 70 / 50 / 30.
 */

/** DB `review_observations.source` + `RUBRIC_REVIEW_SOURCES` allow-list (see migration 023). */
export const RUBRIC_ALLOWED_REVIEW_SOURCES = [
  "google",
  "yelp",
  "tripadvisor",
  "facebook",
  "doordash",
  "ubereats",
];

/**
 * tri_angle/restaurant-review-aggregator dataset `provider` → our `source` slug.
 * @see https://apify.com/tri_angle/restaurant-review-aggregator
 */
export const AGGREGATOR_PROVIDER_TO_SOURCE = {
  "google-maps": "google",
  yelp: "yelp",
  tripadvisor: "tripadvisor",
  facebook: "facebook",
  "door-dash": "doordash",
  "uber-eats": "ubereats",
};

export const CATEGORY_KEYWORDS = {
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

export const RETURN_INTENT_HINTS =
  /\b(return|be back|come back|go back|never again|not coming back|will be back|revisit|recommend|second time|visit again)\b/i;

export const RUBRIC_SUBWEIGHTS = {
  experience_quality: { food: 27 / 45, service: 18 / 45 },
  operational_reliability: { speed: 15 / 30, cleanliness: 15 / 30 },
  emotional_connection: { atmosphere: 15 / 25, return_intent: 10 / 25 },
};

export const RUBRIC_PILLAR_WEIGHTS = {
  experience_quality: 0.45,
  operational_reliability: 0.3,
  emotional_connection: 0.25,
};

export function getEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required) throw new Error(`Missing required env var: ${name}`);
  return fallback;
}

export function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function lastCompletedMonthWindow() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth(), 0));
  return { start, end };
}

/**
 * Prior completed calendar month in a named IANA timezone (default America/New_York).
 * Date boundaries are calendar dates in that zone, returned as UTC midnight instants for {start,end}.
 */
export function lastCompletedMonthWindowInTimeZone(tz = "America/New_York") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const mo = Number(parts.find((p) => p.type === "month")?.value);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) {
    return lastCompletedMonthWindow();
  }
  let prevM = mo - 1;
  let prevY = y;
  if (prevM <= 0) {
    prevM = 12;
    prevY = y - 1;
  }
  const start = new Date(Date.UTC(prevY, prevM - 1, 1));
  const lastDay = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
  const end = new Date(Date.UTC(prevY, prevM - 1, lastDay));
  return { start, end };
}

export function monthLabelFromDate(date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function normalizeText(input) {
  return String(input ?? "").toLowerCase();
}

export function detectMentionedCategories(text) {
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

export function starToRubricScore(rating) {
  const r = rating == null ? NaN : Math.round(Number(rating));
  if (!Number.isFinite(r)) return 70;
  if (r >= 5) return 95;
  if (r === 4) return 85;
  if (r === 3) return 70;
  if (r === 2) return 50;
  return 30;
}

export function returnIntentDelta(text) {
  const t = String(text ?? "");
  if (/(never again|won't be back|will not return|not coming back)/i.test(t)) return -2;
  if (/(probably won't|wouldn't rush back|not worth a return)/i.test(t)) return -1;
  if (/(definitely (be back|return)|can't wait to (go back|return)|will be back)/i.test(t)) return 2;
  if (/(would (come|go) again|would return|visit again)/i.test(t)) return 1;
  return 0;
}

export function scoreReturnIntent(text, rating) {
  if (!RETURN_INTENT_HINTS.test(String(text ?? ""))) return null;
  const d = returnIntentDelta(text);
  if (d === 2) return 95;
  if (d === 1) return 85;
  if (d === -2) return 30;
  if (d === -1) return 50;
  return starToRubricScore(rating);
}

export function weightedPillarFromMerged(merged, weights) {
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

export function overallGuestSignalFromPillars(pillars) {
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

export function singleCategoryScore(map, cat) {
  const row = map.get(cat);
  if (!row || !row.mentions) return null;
  return row.score;
}

/** When a pillar/tile has a mention-based score, display blends 80% that score + 20% mean star→rubric from textless reviews; pillars with no mention signal stay null (no star imputation). */
export const RUBRIC_WRITTEN_PILLAR_WEIGHT = 0.8;
export const RUBRIC_STAR_ONLY_PILLAR_WEIGHT = 0.2;

export function hasWrittenReviewText(review) {
  return String(review?.review_text ?? "").trim().length > 0;
}

export function splitWrittenAndStarOnlyReviews(reviews) {
  const written = [];
  const starOnly = [];
  for (const r of reviews ?? []) {
    if (hasWrittenReviewText(r)) written.push(r);
    else if (parseRating(r?.rating) != null) starOnly.push(r);
  }
  return { written, starOnly };
}

/** Mean rubric band score (95/85/70/50/30) from star ratings alone. */
export function averageStarRubricScore(reviews) {
  const vals = [];
  for (const r of reviews ?? []) {
    const s = starToRubricScore(parseRating(r?.rating));
    if (Number.isFinite(s)) vals.push(s);
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Blend one pillar/tile score: when there is a written (mention-based) component, mix 80% written + 20% mean
 * star→rubric from textless reviews. When there is **no** written component for that pillar/tile, return
 * **null** — we do not impute the global star-only average into missing dimensions (that produced uniform
 * pillar scores whenever operational or emotional had zero keyword hits).
 */
export function blendPillarWithStarOnlyRubric(writtenComponent, starOnlyAverage, starOnlyReviewCount) {
  const n = Number(starOnlyReviewCount) || 0;
  if (writtenComponent == null || !Number.isFinite(writtenComponent)) {
    return null;
  }
  if (!n || starOnlyAverage == null || !Number.isFinite(starOnlyAverage)) {
    return Math.round(writtenComponent);
  }
  return Math.round(
    RUBRIC_WRITTEN_PILLAR_WEIGHT * writtenComponent + RUBRIC_STAR_ONLY_PILLAR_WEIGHT * starOnlyAverage,
  );
}

export function blendAllPillarDisplayScores(pillarScoresRaw, serviceScore, foodScore, starOnlyAvg, starOnlyCount) {
  const blend = (w) => blendPillarWithStarOnlyRubric(w, starOnlyAvg, starOnlyCount);
  return {
    experience_quality: blend(pillarScoresRaw.experience_quality),
    operational_reliability: blend(pillarScoresRaw.operational_reliability),
    emotional_connection: blend(pillarScoresRaw.emotional_connection),
    service_hospitality: blend(serviceScore),
    food_beverage: blend(foodScore),
  };
}

/**
 * Written leg = category map merge; star-only nudges pillars **that already have** a written score (80/20).
 * Overall = weighted mean of non-null display pillars; if none, fall back to mean star→rubric when only
 * star-only reviews exist (headline score without fabricating per-pillar breakdown).
 */
export function computeBlendedRubricDisplay(merged, starOnlyReviews) {
  const pillarScoresRaw = {
    experience_quality: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.experience_quality),
    operational_reliability: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.operational_reliability),
    emotional_connection: weightedPillarFromMerged(merged, RUBRIC_SUBWEIGHTS.emotional_connection),
  };
  const serviceScore = singleCategoryScore(merged, "service");
  const foodScore = singleCategoryScore(merged, "food");
  const starAvg = averageStarRubricScore(starOnlyReviews);
  const starOnlyCount = (starOnlyReviews ?? []).length;
  const displayScores = blendAllPillarDisplayScores(pillarScoresRaw, serviceScore, foodScore, starAvg, starOnlyCount);
  let overallScore = overallGuestSignalFromPillars({
    experience_quality: displayScores.experience_quality,
    operational_reliability: displayScores.operational_reliability,
    emotional_connection: displayScores.emotional_connection,
  });
  if (overallScore == null && starAvg != null && Number.isFinite(starAvg) && starOnlyCount > 0) {
    overallScore = Math.round(starAvg);
  }
  return {
    displayScores,
    overallScore,
    pillarScoresRaw,
    starOnlyCount,
    starOnlyAvg: starAvg,
  };
}

export const RUBRIC_SCORING_MODEL_V1 = "guest_signal_rubric_v1";

/**
 * One row per `review_observations` row for `rubric_review_attributions` (frozen audit).
 * @param {Array<{ id: string, source?: string, external_review_id?: string, review_date?: string, rating?: unknown, review_text?: string }>} observations
 * @returns {Array<object>}
 */
export function buildRubricReviewAttributionRows(observations) {
  const rows = [];
  for (const rev of observations ?? []) {
    if (!rev?.id) continue;
    const text = rev.review_text ?? "";
    const hasText = hasWrittenReviewText(rev);
    const cats = hasText ? [...detectMentionedCategories(text)] : [];
    const rubricByCat = {};
    const mentioned = [];
    const rating = parseRating(rev.rating);
    for (const cat of cats) {
      let sc;
      if (cat === "return_intent") {
        sc = scoreReturnIntent(text, rating);
        if (sc == null) continue;
      } else {
        sc = starToRubricScore(rating);
      }
      rubricByCat[cat] = sc;
      mentioned.push(cat);
    }
    let rubric_role;
    if (!hasText && rating != null && Number.isFinite(Number(rating))) {
      rubric_role = "star_only";
    } else if (hasText && !mentioned.length) {
      rubric_role = "written_uncategorized";
    } else {
      rubric_role = "mention_scored";
    }
    rows.push({
      review_observation_id: rev.id,
      source: String(rev.source ?? ""),
      external_review_id: String(rev.external_review_id ?? ""),
      review_date: rev.review_date ?? null,
      rating,
      review_text_snapshot: String(text).slice(0, 20000),
      categories_mentioned: mentioned,
      rubric_score_by_category: rubricByCat,
      rubric_role,
    });
  }
  return rows;
}

export function computeRubricCategoryScores(reviews) {
  const sums = new Map();
  for (const review of reviews) {
    const text = review.review_text ?? "";
    const rating = review.rating;
    const mentioned = detectMentionedCategories(text);
    for (const cat of mentioned) {
      let score;
      if (cat === "return_intent") {
        score = scoreReturnIntent(text, rating);
        if (score == null) continue;
      } else {
        score = starToRubricScore(rating);
      }
      const cur = sums.get(cat) ?? { sum: 0, count: 0 };
      cur.sum += score;
      cur.count += 1;
      sums.set(cat, cur);
    }
  }
  const result = new Map();
  for (const [cat, { sum, count }] of sums.entries()) {
    if (!count) continue;
    result.set(cat, { score: Math.round(sum / count), mentions: count });
  }
  return result;
}

export function parseRating(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function parseNumber(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function readPath(input, path) {
  if (!input || typeof input !== "object") return null;
  const parts = path.split(".");
  let current = input;
  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part];
  }
  return current ?? null;
}

export function firstNonEmptyString(input, paths) {
  for (const path of paths) {
    const value = readPath(input, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function firstNonNull(input, paths) {
  for (const path of paths) {
    const value = readPath(input, path);
    if (value != null) return value;
  }
  return null;
}

export function confidenceLevelFromReviewCount(totalReviews) {
  if (totalReviews >= 50) return "high";
  if (totalReviews >= 20) return "medium";
  return "low";
}

export function normalizeApifyItem(item, reviewSource = "yelp") {
  if (!item || typeof item !== "object") return null;
  const rating = parseRating(
    firstNonNull(item, [
      "rating",
      "stars",
      "starRating",
      "reviewRating",
      "score",
      "review.rating",
      "review.stars",
      "review_data.rating",
      "payload.rating",
    ])
  );

  let reviewText = firstNonEmptyString(item, [
    "text",
    "message",
    "reviewText",
    "review.text",
    "comment",
    "content",
    "reviewDescription",
    "review_data.text",
    "payload.text",
    "fullText",
    "reviewContent",
    "body",
    "reviewTitle",
  ]);
  if (!reviewText && typeof item.review === "string" && item.review.trim()) {
    reviewText = item.review.trim();
  }
  if (!reviewText) {
    if (rating == null || !Number.isFinite(Number(rating))) return null;
    reviewText = "";
  }

  // Prefer machine-parseable dates first; Compass/Google uses publishAt (relative) + publishedAtDate (ISO).
  const dateRaw = firstNonNull(item, [
    "publishedAtDate",
    "publishedDate",
    "datePublished",
    "publishedAt",
    "date",
    "createdAt",
    "time",
    "publishAt",
    "reviewDate",
    "review.date",
    "review_data.date",
    "payload.date",
  ]);
  let reviewDate = parseDateOnly(dateRaw);
  if (!reviewDate) {
    const ts = firstNonNull(item, ["publishedAtTimestamp", "reviewTimestamp", "timestamp"]);
    if (typeof ts === "number" && Number.isFinite(ts)) {
      const ms = ts > 1e12 ? ts : ts * 1000;
      reviewDate = parseDateOnly(new Date(ms).toISOString());
    } else if (typeof ts === "string" && /^\d{10,13}$/.test(ts.trim())) {
      const n = Number(ts);
      const ms = n > 1e12 ? n : n * 1000;
      reviewDate = parseDateOnly(new Date(ms).toISOString());
    }
  }

  const providerRaw = typeof item.provider === "string" ? item.provider.trim() : "";
  const sourceFromAggregator =
    reviewSource === "restaurant-aggregator" && providerRaw
      ? AGGREGATOR_PROVIDER_TO_SOURCE[providerRaw] ?? null
      : null;
  if (reviewSource === "restaurant-aggregator" && !sourceFromAggregator) {
    return null;
  }

  const baseExternalId =
    firstNonNull(item, [
      "reviewId",
      "id",
      "reviewUrl",
      "url",
      "review.id",
      "review.url",
      "review_data.id",
      "payload.id",
    ]) ??
    (reviewText.trim()
      ? `${reviewText.slice(0, 32)}:${dateRaw ?? ""}`
      : `rating-only:${String(rating ?? "")}:${dateRaw ?? "nodate"}`);

  const externalReviewId =
    reviewSource === "restaurant-aggregator" && providerRaw
      ? `${providerRaw}:${String(baseExternalId)}`
      : String(baseExternalId);

  let source;
  if (reviewSource === "google") source = "google";
  else if (reviewSource === "yelp") source = "yelp";
  else if (sourceFromAggregator) source = sourceFromAggregator;
  else source = "yelp";

  return {
    source,
    external_review_id: externalReviewId,
    review_date: reviewDate ? toIsoDate(reviewDate) : null,
    rating,
    review_text: reviewText,
    raw: item,
  };
}

/**
 * Fifteen synthetic Yelp-shaped reviews (diverse rubric coverage) when Apify is unavailable.
 * Dates are spread across [periodStartIso, periodEndIso] (inclusive).
 */
export function buildFifteenMockApifyItems(periodStartIso, periodEndIso, reviewSource = "yelp") {
  const start = new Date(`${periodStartIso}T12:00:00.000Z`).getTime();
  const end = new Date(`${periodEndIso}T12:00:00.000Z`).getTime();
  const dayMs = 86400000;
  const span = Math.max(dayMs, end - start);

  const pickDay = (i) => {
    const t = start + Math.floor((span * (i + 0.5)) / 15);
    return new Date(t).toISOString().slice(0, 10);
  };

  const texts = [
    { text: "The food was delicious and our server was incredibly friendly. Great menu and cocktails.", rating: 5 },
    { text: "Slow service during the rush — we waited twenty minutes for drinks. Food was fine.", rating: 3 },
    { text: "Bathroom was messy and tables felt sticky. Not sanitary for a restaurant.", rating: 2 },
    { text: "Loved the patio vibe and music. Atmosphere was perfect for a date night.", rating: 5 },
    { text: "We will definitely be back — hospitality was on point and the meal was memorable.", rating: 5 },
    { text: "Never again. Rude host and long delay. Would not recommend.", rating: 1 },
    { text: "Fast and tasty lunch. Quick service and clean dining room.", rating: 4 },
    { text: "Wine list impressed us. Portions were generous and plating looked great.", rating: 5 },
    { text: "Noisy and crowded but the staff handled the rush well. Food came out timely.", rating: 4 },
    { text: "Quiet ambiance on a Tuesday. Decor is dated but food made up for it.", rating: 4 },
    { text: "Probably won't rush back — okay meal but nothing special for the price.", rating: 3 },
    { text: "Spotless kitchen vibes from the open layout. Friendly waiter and hot food.", rating: 5 },
    { text: "Undercooked chicken sent back. Manager apologized and comped dessert.", rating: 3 },
    { text: "Can't wait to go back for brunch — patio and hospitality were excellent.", rating: 5 },
    { text: "Average experience: decent food, slow wait, clean enough restroom.", rating: 3 },
  ];

  const prefix = reviewSource === "google" ? "mock-google-intake" : "mock-intake";

  return texts.map((row, i) => ({
    text: row.text,
    rating: row.rating,
    publishedDate: pickDay(i),
    reviewId: `${prefix}-${i + 1}`,
    demo: true,
    mock_fallback: true,
  }));
}
