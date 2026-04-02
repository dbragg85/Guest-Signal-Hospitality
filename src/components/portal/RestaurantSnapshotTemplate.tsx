import Link from "next/link";

export type ScorecardRow = {
  id: string;
  period: string;
  score: number | null;
  headline: string | null;
  data: Record<string, unknown> | null;
};

export type RestaurantProfile = {
  name: string;
  slug: string;
  portal_intro: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  google_rating: number | null;
  price_level: number | null;
  competitors: unknown;
};

function Trend({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-sm text-slate-500">n/a</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${
        up ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {value}
    </span>
  );
}

function priceLevelLabel(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Math.max(0, Math.min(4, Math.round(Number(n))));
  const labels = ["N/A", "$", "$$", "$$$", "$$$$"];
  return labels[v] ?? "—";
}

function normalizeWebsiteUrl(website: string | null | undefined): string | null {
  if (!website) return null;
  const value = website.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function logoUrlFromWebsite(website: string | null | undefined): string | null {
  const normalized = normalizeWebsiteUrl(website);
  if (!normalized) return null;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    if (!host) return null;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return null;
  }
}

type Competitor = {
  name: string;
  address?: string;
  google_rating?: number;
  price_level?: number;
  distance_miles?: number;
};

function parseCompetitors(raw: unknown): Competitor[] {
  if (!Array.isArray(raw)) return [];
  const rows: Competitor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    if (!name.trim()) continue;
    rows.push({
      name,
      address: typeof o.address === "string" ? o.address : undefined,
      google_rating:
        typeof o.google_rating === "number" ? o.google_rating : undefined,
      price_level: typeof o.price_level === "number" ? o.price_level : undefined,
      distance_miles:
        typeof o.distance_miles === "number" ? o.distance_miles : undefined,
    });
  }
  return rows
    .sort((a, b) => {
      const da = a.distance_miles ?? 999;
      const db = b.distance_miles ?? 999;
      return da - db;
    })
    .slice(0, 5);
}

const PILLAR_DEF = [
  {
    key: "experience_quality",
    label: "Experience Quality",
    blurb:
      "Service pacing and hospitality tone—how guests describe the feel of the visit.",
  },
  {
    key: "service_hospitality",
    label: "Service & Hospitality",
    blurb:
      "Staff attentiveness, warmth, and recovery when issues occur during service.",
  },
  {
    key: "food_beverage",
    label: "Food & Beverage",
    blurb:
      "Food quality, beverage execution, and consistency of menu-driven expectations.",
  },
  {
    key: "operational_reliability",
    label: "Operational Reliability",
    blurb: "Wait times, order accuracy, and consistency under pressure.",
  },
  {
    key: "emotional_connection",
    label: "Emotional Connection",
    blurb: "Memorability, warmth, and whether guests say they’d return.",
  },
] as const;

type MonthlyRow = { month: string; score: number; delta: number | null };
type SwotBlock = {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
};

type CategoryScoreRow = { category: string; score: number; mentions: number | null };

type Props = {
  restaurant: RestaurantProfile;
  scorecards: ScorecardRow[];
  activeScorecardId?: string | null;
  onSelectScorecardId?: (id: string) => void;
};

const MONTH_INDEX: Record<string, number> = {
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

export function RestaurantSnapshotTemplate({
  restaurant,
  scorecards,
  activeScorecardId,
  onSelectScorecardId,
}: Props) {
  const selected =
    (activeScorecardId
      ? scorecards.find((row) => row.id === activeScorecardId)
      : null) ??
    scorecards[0] ??
    null;
  const data = selected?.data ?? null;

  function parseNumeric(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

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

    return rows;
  }

  function parseMonthlyRows(raw: unknown): MonthlyRow[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const rows: MonthlyRow[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const monthRaw = row.month ?? row.month_label ?? row.label;
      if (typeof monthRaw !== "string" || !monthRaw.trim()) continue;
      const score =
        parseNumeric(row.score ?? row.guest_signal_score ?? row.value) ?? null;
      if (score == null) continue;
      const delta = parseNumeric(row.delta ?? row.delta_prior);
      rows.push({ month: monthRaw, score, delta });
    }
    return rows.length ? rows : null;
  }

  const gradeCategorySource: Record<string, unknown> = {
    food: data?.food_grade,
    service: data?.service_grade,
    speed: data?.speed_grade,
    consistency: data?.consistency_grade,
    momentum: data?.momentum_grade,
    atmosphere: data?.atmosphere_grade,
    cleanliness: data?.cleanliness_grade,
  };

  const categorySources = [
    data?.category_scores,
    data?.categories,
    data?.score_breakdown,
    data?.breakdown,
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
  const breakdownPayload =
    data?.total_score_breakdown && typeof data.total_score_breakdown === "object"
      ? (data.total_score_breakdown as Record<string, unknown>)
      : null;
  const categoryAverageDerived =
    categoryBreakdown.length > 0
      ? Number(
          (
            categoryBreakdown.reduce((sum, row) => sum + row.score, 0) /
            categoryBreakdown.length
          ).toFixed(1),
        )
      : null;
  const totalScoreForBreakdown =
    parseNumeric(breakdownPayload?.scorecard_total_score) ?? selected?.score ?? null;
  const categoryAverageForBreakdown =
    parseNumeric(breakdownPayload?.category_average) ?? categoryAverageDerived;
  const categoryCountForBreakdown =
    parseNumeric(breakdownPayload?.category_count) ?? categoryBreakdown.length;
  const varianceForBreakdown =
    parseNumeric(breakdownPayload?.variance) ??
    (totalScoreForBreakdown != null && categoryAverageForBreakdown != null
      ? Number((totalScoreForBreakdown - categoryAverageForBreakdown).toFixed(1))
      : null);

  function avgFor(keys: string[]): number | null {
    const weighted = keys.flatMap((k) => {
      const value = categoryScoreMap.get(k);
      if (!value || !Number.isFinite(value.score)) return [];
      return [value];
    });
    if (weighted.length === 0) return null;

    const mentionWeighted = weighted.filter(
      (v) => v.mentions != null && Number.isFinite(v.mentions) && v.mentions > 0,
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

    return Math.round(
      weighted.reduce((sum, v) => sum + v.score, 0) / weighted.length,
    );
  }

  const fallbackPillarScores: Record<string, number | null> = {
    experience_quality: avgFor([
      "experience_quality",
      "food",
      "service",
      "atmosphere",
      "hospitality",
    ]),
    service_hospitality: avgFor([
      "service_hospitality",
      "service",
      "hospitality",
      "staff",
      "friendliness",
    ]),
    food_beverage: avgFor([
      "food_beverage",
      "food",
      "menu",
      "drinks",
      "beverage",
    ]),
    operational_reliability: avgFor([
      "operational_reliability",
      "speed",
      "consistency",
      "cleanliness",
      "operations",
    ]),
    emotional_connection: avgFor([
      "emotional_connection",
      "momentum",
      "service",
      "atmosphere",
      "sentiment",
    ]),
  };

  function normalizePeriodLabel(input: string): string {
    return input
      .trim()
      .replace(/\s+snapshot$/i, "")
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function canonicalPeriodLabel(input: string): string | null {
    const trimmed = input.trim().replace(/\s+snapshot$/i, "");

    const yyyyMm = /^(\d{4})[-/](\d{1,2})$/.exec(trimmed);
    if (yyyyMm) {
      const year = Number(yyyyMm[1]);
      const month = Number(yyyyMm[2]);
      if (month >= 1 && month <= 12) return `m:${year}:${month}`;
    }

    const quarter = /^q([1-4])[\s-]*(\d{4})$/i.exec(trimmed);
    if (quarter) {
      const q = Number(quarter[1]);
      const year = Number(quarter[2]);
      return `q:${year}:${q}`;
    }

    const month = /^([a-z]+)[,\s-]+(\d{4})$/i.exec(trimmed);
    if (month) {
      const monthKey = month[1].toLowerCase();
      const monthNum = MONTH_INDEX[monthKey];
      const year = Number(month[2]);
      if (monthNum) return `m:${year}:${monthNum}`;
    }

    return null;
  }

  const pillars = PILLAR_DEF.map((p) => {
    const v =
      data?.[p.key] ??
      data?.[`pillar_${p.key}`] ??
      (p.key === "service_hospitality" ? data?.service : null) ??
      (p.key === "food_beverage" ? data?.food : null);
    const score = parseNumeric(v) ?? fallbackPillarScores[p.key] ?? null;
    const blurbKey = `${p.key}_blurb`;
    const customBlurb = data?.[blurbKey];
    const blurb =
      typeof customBlurb === "string" && customBlurb.trim()
        ? customBlurb
        : p.blurb;
    return { ...p, score, blurb };
  });

  const monthly = parseMonthlyRows(data?.monthly ?? data?.monthly_trends);
  const totalReviews =
    parseNumeric(data?.total_reviews_analyzed) ??
    parseNumeric(data?.total_reviews) ??
    parseNumeric(data?.review_count);
  const googleReviews =
    parseNumeric(data?.google_reviews_analyzed) ??
    parseNumeric(data?.google_review_count) ??
    parseNumeric(data?.google_reviews);
  const yelpReviews =
    parseNumeric(data?.yelp_reviews_analyzed) ??
    parseNumeric(data?.yelp_review_count) ??
    parseNumeric(data?.yelp_reviews);
  const swot =
    data?.swot && typeof data.swot === "object"
      ? (data.swot as SwotBlock)
      : null;

  const competitors = parseCompetitors(restaurant.competitors);
  const websiteHref = normalizeWebsiteUrl(restaurant.website);
  const profileLogoUrl = restaurant.logo_url ?? logoUrlFromWebsite(restaurant.website);

  const headlineScore = selected?.score ?? null;
  const headlineText =
    selected?.headline ??
    (headlineScore != null
      ? "Guest Signal snapshot"
      : "Reporting will appear here when the first scorecard is published.");

  return (
    <div className="mt-10 space-y-12">
      <section
        className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-lg sm:p-8"
        aria-labelledby="biz-heading"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {profileLogoUrl ? (
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 sm:h-32 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote operator logos; avoid domain allowlist */}
                  <img
                    src={profileLogoUrl}
                    alt={`${restaurant.name} logo`}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-center text-xs font-medium text-slate-500 sm:h-32 sm:w-32">
                  Logo
                  <br />
                  not set
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
                Guest Signal snapshot
              </p>
              <h2
                id="biz-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
              >
                {restaurant.name}
              </h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                {restaurant.address ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Address
                    </dt>
                    <dd className="whitespace-pre-wrap">{restaurant.address}</dd>
                  </div>
                ) : (
                  <p className="text-slate-500">Address not set yet.</p>
                )}
                {restaurant.phone ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                        className="font-medium text-amber-900 underline-offset-4 hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {restaurant.website ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Web
                    </dt>
                    <dd>
                      <a
                        href={websiteHref ?? restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-amber-900 underline-offset-4 hover:underline"
                      >
                        {restaurant.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600">
                  <span>
                    Google rating:{" "}
                    <strong className="text-slate-800">
                      {restaurant.google_rating != null
                        ? Number(restaurant.google_rating).toFixed(1)
                        : "—"}
                    </strong>
                  </span>
                  <span>
                    Price tier:{" "}
                    <strong className="text-slate-800">
                      {priceLevelLabel(restaurant.price_level)}
                    </strong>
                  </span>
                </div>
              </dl>
              {restaurant.portal_intro ? (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {restaurant.portal_intro}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="quarterly-heading">
        <div className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-lg sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                id="quarterly-heading"
                className="text-xl font-semibold text-slate-900"
              >
                {selected?.period ? `${selected.period} snapshot` : "Latest snapshot"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                {headlineText}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start lg:items-end">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Guest Signal Score
              </p>
              <p className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                {headlineScore ?? "—"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {headlineScore != null
                  ? "Based on the selected published scorecard"
                  : "Add a scorecard row in Supabase to populate this view"}
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 border-t border-stone-200 pt-8 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {row.score ?? "—"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {row.blurb}
                </p>
              </div>
            ))}
          </div>
          {totalReviews != null || googleReviews != null || yelpReviews != null ? (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Review source coverage</p>
              <div className="mt-2 flex flex-wrap gap-4">
                {totalReviews != null ? (
                  <span>
                    Total analyzed: <strong>{Math.round(totalReviews)}</strong>
                  </span>
                ) : null}
                {googleReviews != null ? (
                  <span>
                    Google: <strong>{Math.round(googleReviews)}</strong>
                  </span>
                ) : null}
                {yelpReviews != null ? (
                  <span>
                    Yelp: <strong>{Math.round(yelpReviews)}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {categoryBreakdown.length > 0 ? (
        <section aria-labelledby="category-breakdown-heading">
          <h2
            id="category-breakdown-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Category score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Score components for the selected period.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Category
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((row) => (
                    <tr
                      key={`${row.category}:${row.score}`}
                      className="border-b border-stone-100"
                    >
                      <td className="px-4 py-3 font-medium capitalize text-slate-800">
                        {row.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.score}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {totalScoreForBreakdown != null || categoryAverageForBreakdown != null ? (
        <section aria-labelledby="total-derivation-heading">
          <h2
            id="total-derivation-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Total score derivation
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Published total score comes from the scorecard row, with category
            scores hydrated from snapshot category metrics.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <tbody>
                <tr className="border-b border-stone-100">
                  <th className="w-56 px-4 py-3 font-semibold text-slate-900">
                    Published total score
                  </th>
                  <td className="px-4 py-3 text-slate-700">
                    {totalScoreForBreakdown ?? "—"}
                  </td>
                </tr>
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Category average
                  </th>
                  <td className="px-4 py-3 text-slate-700">
                    {categoryAverageForBreakdown ?? "—"}
                    {categoryCountForBreakdown
                      ? ` (${Math.round(categoryCountForBreakdown)} categories)`
                      : ""}
                  </td>
                </tr>
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Variance (total - average)
                  </th>
                  <td className="px-4 py-3 text-slate-700">
                    {varianceForBreakdown == null ? "—" : varianceForBreakdown}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {monthly && monthly.length > 0 ? (
        <section aria-labelledby="monthly-heading">
          <h2
            id="monthly-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Monthly score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Directional view between quarters when month-level data is included in
            reporting.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {monthly.map((m) => (
              <button
                key={m.month}
                type="button"
                onClick={() => {
                  if (!onSelectScorecardId) return;
                  const monthCanonical = canonicalPeriodLabel(m.month);
                  const target = scorecards.find(
                    (row) => {
                      const rowCanonical = canonicalPeriodLabel(row.period);
                      if (monthCanonical && rowCanonical) {
                        return rowCanonical === monthCanonical;
                      }
                      return (
                        normalizePeriodLabel(row.period) ===
                        normalizePeriodLabel(m.month)
                      );
                    },
                  );
                  if (target) onSelectScorecardId(target.id);
                }}
                className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:border-amber-300 hover:shadow md:cursor-pointer"
              >
                <p className="text-sm font-medium text-slate-500">{m.month}</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">
                  {m.score}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>vs. prior month</span>
                  <Trend value={m.delta} />
                </div>
                {scorecards.some((row) => {
                  const monthCanonical = canonicalPeriodLabel(m.month);
                  const rowCanonical = canonicalPeriodLabel(row.period);
                  if (monthCanonical && rowCanonical) {
                    return rowCanonical === monthCanonical;
                  }
                  return (
                    normalizePeriodLabel(row.period) ===
                    normalizePeriodLabel(m.month)
                  );
                }) ? (
                  <p className="mt-3 text-xs font-semibold text-amber-800">
                    Click to open this month&apos;s scorecard
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section aria-labelledby="monthly-heading" className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-8">
          <h2
            id="monthly-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Monthly score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            When your scorecard&apos;s JSON includes a{" "}
            <code className="rounded bg-stone-200 px-1 text-xs">monthly</code>{" "}
            array, month-over-month tiles will render here (same layout as the
            sales demo).
          </p>
        </section>
      )}

      {swot &&
      (swot.strengths?.length ||
        swot.weaknesses?.length ||
        swot.opportunities?.length ||
        swot.threats?.length) ? (
        <section aria-labelledby="swot-heading">
          <h2
            id="swot-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            SWOT preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Themes derived from review intelligence in your reporting payload.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(
              [
                {
                  title: "Strengths",
                  border: "border-l-emerald-600",
                  lines: swot.strengths ?? [],
                },
                {
                  title: "Weaknesses",
                  border: "border-l-amber-500",
                  lines: swot.weaknesses ?? [],
                },
                {
                  title: "Opportunities",
                  border: "border-l-sky-600",
                  lines: swot.opportunities ?? [],
                },
                {
                  title: "Threats",
                  border: "border-l-rose-600",
                  lines: swot.threats ?? [],
                },
              ] as const
            ).map((block) => (
              <div
                key={block.title}
                className={`rounded-2xl border border-stone-200 border-l-4 bg-white p-6 shadow-sm ${block.border}`}
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {block.title}
                </h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                  {block.lines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-slate-300">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="swot-heading"
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-8"
        >
          <h2
            id="swot-heading"
            className="text-lg font-semibold text-slate-900"
          >
            SWOT preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Add a{" "}
            <code className="rounded bg-stone-200 px-1 text-xs">swot</code>{" "}
            object to the scorecard JSON to populate strengths, weaknesses,
            opportunities, and threats.
          </p>
        </section>
      )}

      <section aria-labelledby="peers-heading">
        <h2
          id="peers-heading"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Comparable competitors (~20 mi)
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Top five peer venues with similar price tier and Google ratings,
          within roughly twenty miles—<strong>curated and stored in Supabase</strong>{" "}
          for each location. Live Google Places discovery needs a secure backend
          and API billing; we can add that when you&apos;re ready.
        </p>
        {competitors.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-stone-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
            No competitor rows yet. Edit the{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">competitors</code>{" "}
            JSON on this restaurant in the Table Editor (array of objects with{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">name</code>,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">address</code>,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              google_rating
            </code>
            ,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">price_level</code>{" "}
            0–4,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              distance_miles
            </code>
            ).
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Competitor
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Address
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Google
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Miles
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, idx) => (
                  <tr key={`${c.name}-${idx}`} className="border-b border-stone-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.google_rating != null
                        ? c.google_rating.toFixed(1)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {priceLevelLabel(c.price_level)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.distance_miles != null
                        ? c.distance_miles.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="upgrade-heading">
        <div className="rounded-3xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-8 shadow-lg sm:p-10">
          <h2
            id="upgrade-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Turn this snapshot into ongoing intelligence
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
            Monthly reporting keeps scores, sentiment, and SWOT themes
            current—so leadership can prioritize improvements with confidence.
            When you&apos;re ready, we&apos;ll align on the right monitoring tier
            and consultation cadence for your team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact/"
              className="btn-primary text-center sm:inline-flex"
            >
              Book a consultation
            </Link>
            <Link
              href="/services/"
              className="btn-secondary text-center sm:inline-flex"
            >
              View plans &amp; monthly reporting
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
