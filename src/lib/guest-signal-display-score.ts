/**
 * Portal headline Guest Signal Score — how `guestSignalHeadlineFromDisplayPillars` works:
 * 1. **Primary:** weighted mean of the **three** board meta-pillars (45% / 30% / 25%),
 *    using only pillars that have a numeric score; weights are renormalized over that set.
 *    Keys: experience_quality, operational_reliability, emotional_connection.
 * 2. **Fallback:** if step 1 yields nothing, **simple arithmetic mean** of every **five**
 *    pillar tiles that have a score (Service & Hospitality, Food & Beverage, etc.).
 * 3. Callers may then fall back to the stored `scorecards.score` if both are null.
 */
/** Board rubric: top-level pillar weights (sum = 1.0). */
export const RUBRIC_PILLAR_WEIGHTS: Record<string, number> = {
  experience_quality: 0.45,
  operational_reliability: 0.3,
  emotional_connection: 0.25,
};

export function parseNumericLike(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Renormalize over pillars that have scores (matches Yelp `overallGuestSignalFromPillars`). */
export function guestSignalFromRubricPillarScores(
  scores: Record<string, number | null | undefined>,
): number | null {
  let num = 0;
  let den = 0;
  for (const [key, w] of Object.entries(RUBRIC_PILLAR_WEIGHTS)) {
    const v = scores[key];
    if (v == null || !Number.isFinite(v)) continue;
    num += v * w;
    den += w;
  }
  if (!den) return null;
  return Math.round(num / den);
}

/** Read explicit rubric trio from scorecard `data` (incl. `pillar_*` from snapshots). */
export function guestSignalHeadlineFromScorecardData(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const scores: Record<string, number | null> = {};
  for (const key of Object.keys(RUBRIC_PILLAR_WEIGHTS)) {
    const raw = d[key] ?? d[`pillar_${key}`];
    scores[key] = parseNumericLike(raw);
  }
  return guestSignalFromRubricPillarScores(scores);
}

/** @see module docstring — tries 3-pillar weighted rubric first, then mean of scored tiles among five. */
export function guestSignalHeadlineFromDisplayPillars(
  pillars: ReadonlyArray<{ key: string; score: number | null }>,
): number | null {
  const scores: Record<string, number | null> = {};
  for (const key of Object.keys(RUBRIC_PILLAR_WEIGHTS)) {
    scores[key] = pillars.find((p) => p.key === key)?.score ?? null;
  }
  const rubric = guestSignalFromRubricPillarScores(scores);
  if (rubric != null) return rubric;
  const scored = pillars.filter((p) => p.score != null).map((p) => p.score!);
  if (!scored.length) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
}
