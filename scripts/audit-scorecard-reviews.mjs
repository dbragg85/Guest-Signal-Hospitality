#!/usr/bin/env node
/**
 * For a restaurant + scorecard period: list each raw review in the snapshot window
 * and show how the Yelp-style rubric would attribute categories (keyword mentions +
 * star→rubric mapping). Also lists GSS keyword mentions for comparison.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
 *   RESTAURANT_SLUG (required)
 *   PERIOD_LABEL (required unless PERIOD_START+PERIOD_END set), e.g. "Apr 2026"
 *   PERIOD_START, PERIOD_END (optional YYYY-MM-DD) — skip snapshot lookup if both set (then set PERIOD_LABEL to match scorecards.period)
 *
 * Usage:
 *   RESTAURANT_SLUG=boca PERIOD_LABEL="Q1 2026" node scripts/audit-scorecard-reviews.mjs
 *
 * End of run: prints rubric v1 re-aggregate from review_observations vs scorecards.score (verify pipeline).
 * When migration 024 is applied, prints `rubric_review_attributions` frozen rows for the snapshot (audit trail).
 */
import { createClient } from "@supabase/supabase-js";
import {
  computeRubricCategoryScores,
  computeBlendedRubricDisplay,
  parseRating,
  splitWrittenAndStarOnlyReviews,
} from "./lib/guest-signal-rubric.mjs";

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

const GSS_KEYWORDS = {
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
    "yummy",
    "overcooked",
    "undercooked",
  ],
  service: ["service", "server", "staff", "host", "manager", "waiter", "waitress", "friendly", "rude"],
  cleanliness: ["clean", "dirty", "hygiene", "sanitary", "bathroom", "restroom", "messy"],
  speed: ["fast", "slow", "wait", "quick", "timely", "late", "delay", "minutes"],
  atmosphere: ["atmosphere", "ambience", "ambiance", "vibe", "music", "noise", "decor", "noisy", "quiet"],
};

function getEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required) throw new Error(`Missing required env var: ${name}`);
  return fallback;
}

function normalizeText(input) {
  return String(input ?? "").toLowerCase();
}

function detectYelpCategories(text) {
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

function detectGssCategories(text) {
  const normalized = normalizeText(text);
  const out = new Set();
  for (const [category, keywords] of Object.entries(GSS_KEYWORDS)) {
    if (keywords.some((k) => normalized.includes(k))) {
      out.add(category);
    }
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

function rubricLinesForReview(text, rating) {
  const mentioned = [...detectYelpCategories(text)];
  const lines = [];
  for (const cat of mentioned) {
    if (cat === "return_intent") {
      const s = scoreReturnIntent(text, rating);
      if (s != null) lines.push(`return_intent → rubric ${s} (return-intent phrases + star fallback)`);
    } else {
      lines.push(`${cat} → rubric ${starToRubricScore(rating)} (star band for mentioned category)`);
    }
  }
  if (!lines.length) {
    lines.push("(no Yelp-rubric keyword hits — this review would not add category mention mass)");
  }
  return lines;
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const slug = getEnv("RESTAURANT_SLUG", { required: true });
  const periodLabel = getEnv("PERIOD_LABEL", { fallback: "" });
  const forcedStart = getEnv("PERIOD_START", { fallback: "" });
  const forcedEnd = getEnv("PERIOD_END", { fallback: "" });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (rErr) throw rErr;
  if (!restaurant) throw new Error(`No restaurant with slug: ${slug}`);

  let periodStart = forcedStart || null;
  let periodEnd = forcedEnd || null;
  let label = periodLabel || `${periodStart}–${periodEnd}`;
  let snapshotIdForAudit = null;

  if (!periodStart || !periodEnd) {
    if (!periodLabel?.trim()) {
      throw new Error("Set PERIOD_LABEL or both PERIOD_START and PERIOD_END");
    }
    const { data: snap, error: sErr } = await supabase
      .from("snapshots")
      .select("period_label, period_start, period_end, guest_signal_score, id")
      .eq("restaurant_id", restaurant.id)
      .eq("period_label", periodLabel)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!snap?.period_start || !snap?.period_end) {
      throw new Error(`No snapshot for ${slug} / ${periodLabel} (or missing period_start/end)`);
    }
    periodStart = snap.period_start;
    periodEnd = snap.period_end;
    label = snap.period_label ?? periodLabel;
    snapshotIdForAudit = snap.id;
    console.log(`Snapshot ${snap.id} guest_signal_score=${snap.guest_signal_score ?? "null"}`);
  }

  if (forcedStart && forcedEnd && !periodLabel?.trim()) {
    console.warn(
      "# Tip: set PERIOD_LABEL (e.g. Apr 2026) to match scorecards.period so the script can verify scorecards.score.",
    );
  }

  if (!snapshotIdForAudit && periodStart && periodEnd) {
    const { data: snapOverlap, error: ovErr } = await supabase
      .from("snapshots")
      .select("id, period_label")
      .eq("restaurant_id", restaurant.id)
      .lte("period_start", periodEnd)
      .gte("period_end", periodStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ovErr) throw ovErr;
    if (snapOverlap?.id) {
      snapshotIdForAudit = snapOverlap.id;
      console.log(`# Matched snapshot ${snapshotIdForAudit} by overlapping period (${snapOverlap.period_label ?? ""}).`);
    }
  }

  const { data: reviews, error: oErr } = await supabase
    .from("review_observations")
    .select("id, source, external_review_id, review_date, rating, review_text")
    .eq("restaurant_id", restaurant.id)
    .gte("review_date", periodStart)
    .lte("review_date", periodEnd)
    .order("review_date", { ascending: true });
  if (oErr) throw oErr;

  const list = reviews ?? [];
  console.log("");
  console.log(`# ${restaurant.name} (${restaurant.slug})`);
  console.log(`# Window: ${label}  (${periodStart} … ${periodEnd})`);
  console.log(`# Reviews in review_observations: ${list.length}`);
  console.log("");

  list.forEach((row, i) => {
    const text = row.review_text ?? "";
    const yelpCats = [...detectYelpCategories(text)];
    const gssCats = [...detectGssCategories(text)];
    console.log(`---`);
    console.log(`## ${i + 1}. ${row.source} · ${row.review_date ?? "no date"} · rating ${row.rating ?? "—"}`);
    console.log(`external_review_id: ${row.external_review_id ?? "—"}`);
    console.log("");
    console.log("### Raw text");
    console.log(text.trim() || "(empty)");
    console.log("");
    console.log("### Reasoning (Yelp rubric v1 — same keyword list as monthly pipeline)");
    rubricLinesForReview(text, row.rating).forEach((l) => console.log(`- ${l}`));
    console.log(`- Detected categories: ${yelpCats.length ? yelpCats.join(", ") : "(none)"}`);
    console.log("");
    console.log("### GSS-style keyword mentions (Google pipeline lexicon)");
    console.log(`- ${gssCats.length ? gssCats.join(", ") : "(none)"}`);
    console.log("");
  });

  if (!list.length) {
    console.log("No rows — check source ingests and that dates fall inside the snapshot window.");
    return;
  }

  const googleN = list.filter((r) => r.source === "google").length;
  const yelpN = list.filter((r) => r.source === "yelp").length;
  console.log("");
  console.log("# Summary — counts are rows in review_observations inside the window (not Apify raw batch size).");
  console.log(`# total=${list.length} google=${googleN} yelp=${yelpN}`);
  if (yelpN === 0) {
    console.log(
      "# Yelp=0: no source=yelp rows in-window (set restaurants.yelp_url, run Yelp ingest, check review_date parsing).",
    );
  }

  const periodReviews = list.map((r) => ({
    source: String(r.source ?? ""),
    review_text: r.review_text,
    rating: parseRating(r.rating),
    review_date: r.review_date,
    external_review_id: r.external_review_id,
  }));
  const { written, starOnly } = splitWrittenAndStarOnlyReviews(periodReviews);
  const rubricMap = computeRubricCategoryScores(written);
  const merged = new Map(rubricMap);
  const { displayScores, overallScore: overallRecomputed, pillarScoresRaw, starOnlyCount, starOnlyAvg } =
    computeBlendedRubricDisplay(merged, starOnly);
  console.log("");
  console.log(
    "# Rubric v1 (pipeline parity): categories from written reviews only; pillars/tiles blend star-only only when a written pillar/tile score exists.",
  );
  console.log(
    JSON.stringify(
      {
        overall: overallRecomputed,
        pillars_display: {
          experience_quality: displayScores.experience_quality,
          operational_reliability: displayScores.operational_reliability,
          emotional_connection: displayScores.emotional_connection,
          service_hospitality: displayScores.service_hospitality,
          food_beverage: displayScores.food_beverage,
        },
        pillars_written_leg_only: pillarScoresRaw,
        star_only_review_count: starOnlyCount,
        star_only_rubric_avg: starOnlyAvg != null ? Number(starOnlyAvg.toFixed(2)) : null,
        written_review_count_for_categories: written.length,
        category_rows: [...merged.entries()].map(([category, row]) => ({ category, ...row })),
      },
      null,
      2,
    ),
  );

  const scorecardPeriod = periodLabel?.trim() || label;
  const { data: scRow, error: scErr } = await supabase
    .from("scorecards")
    .select("id, period, score, data")
    .eq("restaurant_id", restaurant.id)
    .eq("period", scorecardPeriod)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (scErr) {
    console.warn("Scorecard lookup skipped:", scErr.message);
    return;
  }
  if (!scRow) {
    console.log(`# No scorecard row for period "${scorecardPeriod}" (set PERIOD_LABEL to match scorecards.period).`);
    return;
  }
  console.log("");
  console.log(`# Scorecard on file: period=${scRow.period} score=${scRow.score} model=${scRow.data?.review_scoring_model ?? "—"}`);
  if (overallRecomputed != null && scRow.score != null && overallRecomputed !== scRow.score) {
    console.warn(`# MISMATCH: rubric recompute overall=${overallRecomputed} vs scorecards.score=${scRow.score}`);
  } else if (overallRecomputed != null && scRow.score != null) {
    console.log("# OK: recomputed overall matches scorecards.score.");
  }

  if (snapshotIdForAudit) {
    const { data: attrRows, error: attrErr } = await supabase
      .from("rubric_review_attributions")
      .select(
        "source, review_date, rating, rubric_role, categories_mentioned, rubric_score_by_category, external_review_id, review_text_snapshot",
      )
      .eq("snapshot_id", snapshotIdForAudit)
      .order("review_date", { ascending: true });
    if (attrErr) {
      console.warn("# rubric_review_attributions lookup:", attrErr.message);
    } else if (attrRows?.length) {
      console.log("");
      console.log(`# Frozen DB audit: rubric_review_attributions snapshot_id=${snapshotIdForAudit} (${attrRows.length} row(s))`);
      attrRows.forEach((row, i) => {
        console.log(`---`);
        console.log(
          `## ${i + 1}. ${row.source} · ${row.review_date ?? "—"} · ${row.rubric_role} · rating ${row.rating ?? "—"} · ext=${row.external_review_id ?? "—"}`,
        );
        console.log(`categories_mentioned: ${(row.categories_mentioned ?? []).join(", ") || "(none)"}`);
        console.log(`rubric_score_by_category: ${JSON.stringify(row.rubric_score_by_category ?? {})}`);
        const snap = String(row.review_text_snapshot ?? "").trim();
        console.log(`review_text_snapshot (${snap.length} chars):`);
        console.log(snap || "(empty)");
      });
    } else {
      console.log("");
      console.log(
        `# No rubric_review_attributions rows for snapshot_id=${snapshotIdForAudit} — run pipeline:rebuild:rubric-from-observations (or lead intake / monthly Yelp) after migration 024.`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
