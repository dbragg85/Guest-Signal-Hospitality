/**
 * Guest Signal Hospitality rubric (board): shared by Yelp pipeline + lead-intake automation.
 * Score only mentioned categories; scale 95 / 85 / 70 / 50 / 30.
 */

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

export function normalizeApifyItem(item) {
  if (!item || typeof item !== "object") return null;
  const reviewText = firstNonEmptyString(item, [
    "text",
    "reviewText",
    "review.text",
    "comment",
    "review",
    "content",
    "reviewDescription",
    "review_data.text",
    "payload.text",
  ]);
  if (!reviewText) return null;

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

  const dateRaw = firstNonNull(item, [
    "publishedDate",
    "date",
    "createdAt",
    "time",
    "publishedAt",
    "review.date",
    "review_data.date",
    "payload.date",
  ]);
  const reviewDate = parseDateOnly(dateRaw);

  const externalReviewId = String(
    firstNonNull(item, [
      "reviewId",
      "id",
      "reviewUrl",
      "url",
      "review.id",
      "review.url",
      "review_data.id",
      "payload.id",
    ]) ?? `${reviewText.slice(0, 32)}:${dateRaw ?? ""}`
  );

  return {
    source: "yelp",
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
export function buildFifteenMockApifyItems(periodStartIso, periodEndIso) {
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

  return texts.map((row, i) => ({
    text: row.text,
    rating: row.rating,
    publishedDate: pickDay(i),
    reviewId: `mock-intake-${i + 1}`,
    demo: true,
    mock_fallback: true,
  }));
}
