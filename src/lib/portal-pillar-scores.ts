import { guestSignalHeadlineFromDisplayPillars } from "@/lib/guest-signal-display-score";

/**
 * Category mention keys used to infer each Guest Signal pillar when explicit
 * pillar fields are missing. Kept in sync with RestaurantSnapshotTemplate.
 */
const PILLAR_CATEGORY_KEYS: Record<string, string[]> = {
  experience_quality: [
    "experience_quality",
    "food",
    "service",
    "atmosphere",
    "hospitality",
  ],
  service_hospitality: [
    "service_hospitality",
    "service",
    "hospitality",
    "staff",
    "friendliness",
  ],
  food_beverage: ["food_beverage", "food", "menu", "drinks", "beverage"],
  operational_reliability: [
    "operational_reliability",
    "speed",
    "consistency",
    "cleanliness",
    "operations",
  ],
  emotional_connection: [
    "emotional_connection",
    "momentum",
    "service",
    "atmosphere",
    "sentiment",
  ],
};

export const PORTAL_PILLAR_KEYS = [
  "experience_quality",
  "service_hospitality",
  "food_beverage",
  "operational_reliability",
  "emotional_connection",
] as const;

export type PortalPillarKey = (typeof PORTAL_PILLAR_KEYS)[number];

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

type CategoryScoreRow = { category: string; score: number; mentions: number | null };

function parseCategoryScoreRows(raw: unknown): CategoryScoreRow[] {
  const rows: CategoryScoreRow[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const labelRaw =
        record.category ?? record.name ?? record.label ?? record.key;
      const scoreRaw = record.score ?? record.value;
      if (typeof labelRaw !== "string" || !labelRaw.trim()) continue;
      const score = parseNumeric(scoreRaw);
      if (score == null) continue;
      const mentions = parseNumeric(
        record.mentions ?? record.mention_count ?? record.count ?? record.review_count,
      );
      rows.push({ category: labelRaw, score, mentions });
    }
    return rows;
  }

  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const score = parseNumeric(v);
      if (score == null) continue;
      rows.push({ category: k, score, mentions: null });
    }
    return rows;
  }

  return [];
}

function pillarMentionStats(
  categoryScoreMap: Map<string, { score: number; mentions: number | null }>,
  keys: string[],
): { hasMentionMetadata: boolean; totalMentions: number } {
  let hasMentionMetadata = false;
  let totalMentions = 0;
  for (const key of keys) {
    const value = categoryScoreMap.get(key);
    if (!value) continue;
    if (value.mentions != null && Number.isFinite(value.mentions)) {
      hasMentionMetadata = true;
      if (value.mentions > 0) totalMentions += value.mentions;
    }
  }
  return { hasMentionMetadata, totalMentions };
}

function avgFor(
  categoryScoreMap: Map<string, { score: number; mentions: number | null }>,
  keys: string[],
): number | null {
  const weighted = keys.flatMap((k) => {
    const value = categoryScoreMap.get(k);
    if (!value || !Number.isFinite(value.score)) return [];
    return [value];
  });
  if (weighted.length === 0) return null;

  const mentionWeighted = weighted.filter(
    (v) => v.mentions != null && Number.isFinite(v.mentions) && v.mentions > 0,
  );
  const hasMentionMetadata = weighted.some(
    (v) => v.mentions != null && Number.isFinite(v.mentions),
  );
  if (mentionWeighted.length > 0) {
    const totalMentions = mentionWeighted.reduce((sum, v) => sum + (v.mentions ?? 0), 0);
    if (totalMentions > 0) {
      const totalScore = mentionWeighted.reduce(
        (sum, v) => sum + v.score * (v.mentions ?? 0),
        0,
      );
      return Math.round(totalScore / totalMentions);
    }
  }

  if (hasMentionMetadata) return null;

  return Math.round(
    weighted.reduce((sum, v) => sum + v.score, 0) / weighted.length,
  );
}

export type PortalPillarComputed = {
  key: PortalPillarKey;
  score: number | null;
  explicitScore: number | null;
  missingMentionEvidence: boolean;
};

/**
 * Pillar scores for portal UI — matches RestaurantSnapshotTemplate / hero headline
 * derivation (explicit fields, category_scores fallbacks, mention guards).
 */
export function computePortalPillarScores(
  data: Record<string, unknown> | null | undefined,
): PortalPillarComputed[] {
  const d = data ?? null;
  const gradeCategorySource: Record<string, unknown> = {
    food: d?.food_grade,
    service: d?.service_grade,
    speed: d?.speed_grade,
    consistency: d?.consistency_grade,
    momentum: d?.momentum_grade,
    atmosphere: d?.atmosphere_grade,
    cleanliness: d?.cleanliness_grade,
  };

  const categorySources = [
    d?.category_scores,
    d?.categories,
    d?.score_breakdown,
    d?.breakdown,
    gradeCategorySource,
  ];
  const categoryBreakdown =
    categorySources
      .map((source) => parseCategoryScoreRows(source))
      .find((rows) => rows.length > 0) ?? [];

  const categoryScoreMap = new Map<string, { score: number; mentions: number | null }>(
    categoryBreakdown.map((row) => [
      row.category.trim().toLowerCase(),
      { score: row.score, mentions: row.mentions },
    ]),
  );

  const fallbackPillarScores: Record<PortalPillarKey, number | null> = {
    experience_quality: avgFor(categoryScoreMap, PILLAR_CATEGORY_KEYS.experience_quality),
    service_hospitality: avgFor(categoryScoreMap, PILLAR_CATEGORY_KEYS.service_hospitality),
    food_beverage: avgFor(categoryScoreMap, PILLAR_CATEGORY_KEYS.food_beverage),
    operational_reliability: avgFor(
      categoryScoreMap,
      PILLAR_CATEGORY_KEYS.operational_reliability,
    ),
    emotional_connection: avgFor(categoryScoreMap, PILLAR_CATEGORY_KEYS.emotional_connection),
  };

  return PORTAL_PILLAR_KEYS.map((pKey) => {
    const v =
      d?.[pKey] ??
      d?.[`pillar_${pKey}`] ??
      (pKey === "service_hospitality" ? d?.service : null) ??
      (pKey === "food_beverage" ? d?.food : null);
    const explicitScore = parseNumeric(v);
    let score = explicitScore ?? fallbackPillarScores[pKey] ?? null;
    const mentionStats = pillarMentionStats(
      categoryScoreMap,
      PILLAR_CATEGORY_KEYS[pKey] ?? [],
    );
    const missingMentionEvidence =
      !mentionStats.hasMentionMetadata || mentionStats.totalMentions === 0;
    if (
      mentionStats.hasMentionMetadata &&
      mentionStats.totalMentions === 0 &&
      (explicitScore == null || explicitScore === 0)
    ) {
      score = null;
    }
    if (explicitScore === 0 && missingMentionEvidence) {
      score = null;
    }
    return {
      key: pKey,
      score,
      explicitScore,
      missingMentionEvidence,
    };
  });
}

/** Same headline number as the snapshot hero for this row's `data` + stored score. */
export function portalGuestSignalHeadline(
  data: Record<string, unknown> | null | undefined,
  storedScore: number | null | undefined,
): number | null {
  const pillars = computePortalPillarScores(data).map(({ key, score }) => ({ key, score }));
  const fromPillars = guestSignalHeadlineFromDisplayPillars(pillars);
  if (fromPillars != null) return fromPillars;
  if (storedScore != null && Number.isFinite(storedScore)) return storedScore;
  return null;
}
