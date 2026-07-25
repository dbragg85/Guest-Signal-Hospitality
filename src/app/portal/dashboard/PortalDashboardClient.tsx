"use client";

import { ProspectApprovalPanel } from "@/components/portal/ProspectApprovalPanel";
import { RestaurantSnapshotTemplate } from "@/components/portal/RestaurantSnapshotTemplate";
import { usePortalSession } from "@/contexts/PortalSessionContext";
import {
  isPlanInquiryKey,
  PLAN_INQUIRY_LABELS,
} from "@/content/site";
import { portalGuestSignalHeadline } from "@/lib/portal-pillar-scores";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Restaurant = {
  id: string;
  slug: string;
  name: string;
  portal_intro: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  google_rating: number | null;
  price_level: string | number | null;
  price_level_label: string | null;
  competitors: unknown;
  intake_inquiry_plan: string | null;
};

type Scorecard = {
  id: string;
  restaurant_id: string;
  period: string;
  score: number | null;
  headline: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
};

type SnapshotCategoryScoreRow = {
  snapshot_id: string | null;
  category: string | null;
  score: number | null;
  mentions: number | null;
};

type SnapshotMonthlyTrendRow = {
  snapshot_id: string | null;
  month_label: string | null;
  guest_signal_score: number | null;
  delta_prior: number | null;
  sort_order: number | null;
};

type SnapshotPeriodRow = {
  id: string;
  period_label: string | null;
  created_at: string | null;
  [key: string]: unknown;
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

function periodSortOrder(period: string): number {
  const trimmed = period.trim();
  const quarter = /^q([1-4])[\s-]*(\d{4})$/i.exec(trimmed);
  if (quarter) {
    const q = Number(quarter[1]);
    const year = Number(quarter[2]);
    return year * 100 + q * 3;
  }
  const month = /^([a-z]+)[,\s-]+(\d{4})$/i.exec(trimmed);
  if (month) {
    const monthKey = month[1].toLowerCase();
    const monthNum = MONTH_INDEX[monthKey];
    const year = Number(month[2]);
    if (monthNum) return year * 100 + monthNum;
  }
  return -1;
}

function normalizePeriod(period: string): string {
  return period.trim().toLowerCase().replace(/\s+/g, " ");
}

function canonicalPeriodKey(period: string): string | null {
  const trimmed = period.trim().replace(/\s+snapshot$/i, "");
  const yyyyMm = /^(\d{4})[-/](\d{1,2})$/.exec(trimmed);
  if (yyyyMm) {
    const year = Number(yyyyMm[1]);
    const monthNum = Number(yyyyMm[2]);
    if (monthNum >= 1 && monthNum <= 12) return `m:${year}:${monthNum}`;
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
    if (!monthNum) return null;
    return `m:${year}:${monthNum}`;
  }
  return null;
}

function sortScorecards(rows: Scorecard[]): Scorecard[] {
  return [...rows].sort((a, b) => {
    const ao = periodSortOrder(a.period);
    const bo = periodSortOrder(b.period);
    if (ao !== bo) return bo - ao;
    if (a.created_at !== b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return b.period.localeCompare(a.period);
  });
}

function normalizePeriodForLookup(period: string): string {
  const canonical = canonicalPeriodKey(period);
  return canonical ?? `raw:${normalizePeriod(period)}`;
}

function getSnapshotIdFromScorecardData(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const raw = data.snapshot_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

const PILLAR_FIELD_ALIASES: Array<{ dataKey: string; snapshotFields: string[] }> = [
  {
    dataKey: "experience_quality",
    snapshotFields: [
      "pillar_experience_quality",
      "experience_quality",
      "experience_score",
    ],
  },
  {
    dataKey: "service_hospitality",
    snapshotFields: [
      "pillar_service_hospitality",
      "service_hospitality",
      "service_score",
      "hospitality_score",
    ],
  },
  {
    dataKey: "food_beverage",
    snapshotFields: [
      "pillar_food_beverage",
      "food_beverage",
      "food_score",
    ],
  },
  {
    dataKey: "operational_reliability",
    snapshotFields: [
      "pillar_operational_reliability",
      "operational_reliability",
      "operations_score",
    ],
  },
  {
    dataKey: "emotional_connection",
    snapshotFields: [
      "pillar_emotional_connection",
      "emotional_connection",
      "sentiment_score",
    ],
  },
];

export function PortalDashboardClient() {
  const router = useRouter();
  const { session, loading: authLoading, supabase, configured } =
    usePortalSession();

  const [profile, setProfile] = useState<{
    is_super_admin: boolean;
  } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [activeScorecardId, setActiveScorecardId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const loadProfileAndRestaurants = useCallback(async () => {
    if (!supabase || !session) return;
    setLoadError(null);
    setDataLoading(true);

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", session.user.id)
      .maybeSingle();

    if (pErr) {
      setLoadError(pErr.message);
      setDataLoading(false);
      return;
    }

    setProfile({
      is_super_admin: Boolean(prof?.is_super_admin),
    });

    const { data: rests, error: rErr } = await supabase
      .from("restaurants")
      .select(
        "id, slug, name, portal_intro, address, phone, website, logo_url, google_rating, price_level, price_level_label, competitors, intake_inquiry_plan"
      )
      .order("name");

    if (rErr) {
      setLoadError(rErr.message);
      setDataLoading(false);
      return;
    }

    const list = (rests ?? []) as Restaurant[];
    setRestaurants(list);
    if (list.length) {
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0].id;
      });
    } else {
      setSelectedId(null);
    }
    setDataLoading(false);
  }, [supabase, session]);

  useEffect(() => {
    if (!configured || authLoading) return;
    if (!session) {
      router.replace("/portal/");
      return;
    }
    loadProfileAndRestaurants();
  }, [authLoading, configured, session, router, loadProfileAndRestaurants]);

  useEffect(() => {
    async function loadScorecards() {
      if (!supabase || !selectedId) {
        setScorecards([]);
        setActiveScorecardId(null);
        return;
      }
      const { data, error } = await supabase
        .from("scorecards")
        .select("id, restaurant_id, period, score, headline, data, created_at")
        .eq("restaurant_id", selectedId)
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError(error.message);
        return;
      }
      const base = sortScorecards((data ?? []) as Scorecard[]);
      if (base.length === 0) {
        setScorecards(base);
        setActiveScorecardId(null);
        return;
      }

      // Some production scorecards have sparse `data` JSON while category/monthly
      // detail lives in normalized snapshot tables. Hydrate those payloads here.
      // snapshot_category_scores / snapshot_monthly_trends are keyed by snapshot_id only (no restaurant_id).
      const { data: snapshotRows, error: snapshotsErr } = await supabase
        .from("snapshots")
        .select("*")
        .eq("restaurant_id", selectedId)
        .order("created_at", { ascending: false });

      if (snapshotsErr) {
        console.warn("snapshots period hydration skipped:", snapshotsErr.message);
      }

      const snapshotIds = ((snapshotRows ?? []) as SnapshotPeriodRow[])
        .map((r) => r.id)
        .filter((id): id is string => Boolean(id));

      let categoryRows: SnapshotCategoryScoreRow[] | null = null;
      let monthlyRows: SnapshotMonthlyTrendRow[] | null = null;
      if (snapshotIds.length > 0) {
        const [{ data: cat, error: categoryErr }, { data: mon, error: monthlyErr }] = await Promise.all([
          supabase
            .from("snapshot_category_scores")
            .select("snapshot_id, category, score, mentions")
            .in("snapshot_id", snapshotIds),
          supabase
            .from("snapshot_monthly_trends")
            .select("snapshot_id, month_label, guest_signal_score, delta_prior, sort_order")
            .in("snapshot_id", snapshotIds),
        ]);
        if (categoryErr) {
          console.warn("snapshot_category_scores hydration skipped:", categoryErr.message);
        }
        if (monthlyErr) {
          console.warn("snapshot_monthly_trends hydration skipped:", monthlyErr.message);
        }
        categoryRows = (cat ?? []) as SnapshotCategoryScoreRow[];
        monthlyRows = (mon ?? []) as SnapshotMonthlyTrendRow[];
      }

      const categoryBySnapshot = new Map<string, SnapshotCategoryScoreRow[]>();
      ((categoryRows ?? []) as SnapshotCategoryScoreRow[]).forEach((row) => {
        if (row.snapshot_id) {
          const bucket = categoryBySnapshot.get(row.snapshot_id) ?? [];
          bucket.push(row);
          categoryBySnapshot.set(row.snapshot_id, bucket);
        }
      });

      const monthlyBySnapshot = new Map<string, SnapshotMonthlyTrendRow[]>();
      ((monthlyRows ?? []) as SnapshotMonthlyTrendRow[]).forEach((row) => {
        if (row.snapshot_id) {
          const bucket = monthlyBySnapshot.get(row.snapshot_id) ?? [];
          bucket.push(row);
          monthlyBySnapshot.set(row.snapshot_id, bucket);
        }
      });

      const snapshotIdsByPeriod = new Map<string, string[]>();
      const snapshotById = new Map<string, SnapshotPeriodRow>();
      ((snapshotRows ?? []) as SnapshotPeriodRow[]).forEach((row) => {
        if (!row.id || !row.period_label) return;
        snapshotById.set(row.id, row);
        const key = normalizePeriodForLookup(row.period_label);
        const bucket = snapshotIdsByPeriod.get(key) ?? [];
        bucket.push(row.id);
        snapshotIdsByPeriod.set(key, bucket);
      });

      const hydrated = base.map((row) => {
        const snapshotId = getSnapshotIdFromScorecardData(row.data);
        const periodKey = normalizePeriodForLookup(row.period);
        const periodSnapshotIds = snapshotIdsByPeriod.get(periodKey) ?? [];
        const candidateSnapshotIds = [
          ...(snapshotId ? [snapshotId] : []),
          row.id,
          ...periodSnapshotIds,
        ];

        const categories =
          candidateSnapshotIds
            .map((id) => categoryBySnapshot.get(id))
            .find((items): items is SnapshotCategoryScoreRow[] => Array.isArray(items) && items.length > 0) ??
          [];
        const monthly =
          candidateSnapshotIds
            .map((id) => monthlyBySnapshot.get(id))
            .find((items): items is SnapshotMonthlyTrendRow[] => Array.isArray(items) && items.length > 0) ??
          [];

        const parsedCategories = categories
          .filter((item) => item.category && item.score != null)
          .map((item) => ({
            category: String(item.category),
            score: Number(item.score),
            mentions:
              item.mentions == null || Number.isNaN(Number(item.mentions))
                ? null
                : Number(item.mentions),
          }));

        const parsedMonthly = monthly
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .filter((item) => item.month_label && item.guest_signal_score != null)
          .map((item) => ({
            month: String(item.month_label),
            score: Number(item.guest_signal_score),
            delta: item.delta_prior == null ? null : Number(item.delta_prior),
          }));
        const categoryAverage =
          parsedCategories.length > 0
            ? Number(
                (
                  parsedCategories.reduce((sum, item) => sum + item.score, 0) /
                  parsedCategories.length
                ).toFixed(1),
              )
            : null;

        const nextData: Record<string, unknown> = {
          ...(row.data ?? {}),
        };
        const snapshotForPillars =
          candidateSnapshotIds
            .map((id) => snapshotById.get(id))
            .find((item): item is SnapshotPeriodRow => Boolean(item)) ?? null;

        if (!nextData.category_scores && parsedCategories.length > 0) {
          nextData.category_scores = parsedCategories;
        }
        if (!nextData.monthly && !nextData.monthly_trends && parsedMonthly.length > 0) {
          nextData.monthly = parsedMonthly;
        }
        if (!nextData.total_score_breakdown && (row.score != null || categoryAverage != null)) {
          nextData.total_score_breakdown = {
            scorecard_total_score: row.score,
            category_average: categoryAverage,
            category_count: parsedCategories.length,
            variance:
              row.score != null && categoryAverage != null
                ? Number((row.score - categoryAverage).toFixed(1))
                : null,
            source: "Hydrated from scorecards + snapshot_category_scores",
          };
        }
        const categoryScoresRaw = nextData.category_scores;
        const hasStructuredCategoryScores =
          Array.isArray(categoryScoresRaw) &&
          categoryScoresRaw.length > 0 &&
          categoryScoresRaw.every(
            (x) =>
              x &&
              typeof x === "object" &&
              typeof (x as Record<string, unknown>).category === "string" &&
              (x as Record<string, unknown>).score != null,
          );
        // Rubric (and GSS) category rows: derive pillar tiles from `category_scores` + explicit
        // `experience_quality` / … on the scorecard JSON. Do **not** back-fill missing pillar keys
        // from `snapshots` — those rows only store three meta-pillars and often match overall
        // (e.g. 82), which made every portal tile look identical when scorecard omitted a key.
        if (!hasStructuredCategoryScores) {
          PILLAR_FIELD_ALIASES.forEach(({ dataKey, snapshotFields }) => {
            if (Object.prototype.hasOwnProperty.call(nextData, dataKey) || !snapshotForPillars) {
              return;
            }
            const value =
              snapshotFields
                .map((field) => parseNumeric(snapshotForPillars[field]))
                .find((v): v is number => v != null) ?? null;
            if (value != null) nextData[dataKey] = value;
          });
        }
        if (
          !Object.prototype.hasOwnProperty.call(nextData, "total_reviews_analyzed") &&
          snapshotForPillars
        ) {
          const total =
            parseNumeric(snapshotForPillars.total_reviews_analyzed) ??
            parseNumeric(snapshotForPillars.total_reviews);
          if (total != null) nextData.total_reviews_analyzed = total;
        }
        if (
          !Object.prototype.hasOwnProperty.call(nextData, "google_reviews_analyzed") &&
          snapshotForPillars
        ) {
          const google = parseNumeric(snapshotForPillars.google_reviews_analyzed);
          if (google != null) nextData.google_reviews_analyzed = google;
        }
        if (
          !Object.prototype.hasOwnProperty.call(nextData, "yelp_reviews_analyzed") &&
          snapshotForPillars
        ) {
          const yelp = parseNumeric(snapshotForPillars.yelp_reviews_analyzed);
          if (yelp != null) nextData.yelp_reviews_analyzed = yelp;
        }
        if (
          !Object.prototype.hasOwnProperty.call(nextData, "confidence_level") &&
          snapshotForPillars &&
          typeof snapshotForPillars.confidence_level === "string" &&
          snapshotForPillars.confidence_level.trim()
        ) {
          nextData.confidence_level = snapshotForPillars.confidence_level.trim().toLowerCase();
        }
        return {
          ...row,
          data: nextData,
        };
      });

      setScorecards(hydrated);
      setActiveScorecardId((prev) => {
        if (prev && hydrated.some((row) => row.id === prev)) return prev;
        return hydrated[0]?.id ?? null;
      });
    }
    loadScorecards();
  }, [supabase, selectedId, restaurants]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/portal/");
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-slate-600">Configure Supabase environment variables.</p>
        <Link href="/portal/" className="mt-4 inline-block font-semibold text-amber-800 underline">
          Back to portal
        </Link>
      </div>
    );
  }

  if (authLoading || !session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
              Client portal
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Scorecards
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-medium text-slate-800">
                {session.user.email}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>

        {profile?.is_super_admin && supabase ? (
          <ProspectApprovalPanel supabase={supabase} />
        ) : null}

        {dataLoading ? (
          <p className="mt-10 text-slate-600">Loading restaurants…</p>
        ) : loadError ? (
          <p className="mt-10 text-red-700" role="alert">
            {loadError}
          </p>
        ) : restaurants.length === 0 ? (
          <p className="mt-10 text-slate-600">
            No restaurants linked to this account yet. Ask Guest Signal to add a
            membership or set your profile as super admin in Supabase.
          </p>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label htmlFor="restaurant" className="text-sm font-semibold text-slate-800">
                Restaurant
              </label>
              <select
                id="restaurant"
                className="max-w-md rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedId ? (
              (() => {
                const cur = restaurants.find((r) => r.id === selectedId);
                if (!cur) return null;
                const planRaw = cur.intake_inquiry_plan;
                const planLabel =
                  planRaw && isPlanInquiryKey(planRaw)
                    ? PLAN_INQUIRY_LABELS[planRaw]
                    : planRaw?.trim() || null;
                return (
                  <>
                    {planLabel ? (
                      <p className="mt-2 text-xs text-slate-600">
                        Intake plan:{" "}
                        <span className="font-semibold text-slate-800">
                          {planLabel}
                        </span>
                      </p>
                    ) : null}
                    <RestaurantSnapshotTemplate
                      restaurant={{
                        name: cur.name,
                        slug: cur.slug,
                        portal_intro: cur.portal_intro,
                        address: cur.address,
                        phone: cur.phone,
                        website: cur.website,
                        logo_url: cur.logo_url,
                        google_rating: cur.google_rating,
                        price_level: cur.price_level,
                        price_level_label: cur.price_level_label,
                        competitors: cur.competitors,
                        intake_inquiry_plan: cur.intake_inquiry_plan,
                      }}
                      scorecards={scorecards.map((row) => ({
                        id: row.id,
                        period: row.period,
                        score: row.score,
                        headline: row.headline,
                        data: row.data,
                      }))}
                      activeScorecardId={activeScorecardId}
                      onSelectScorecardId={(id) => setActiveScorecardId(id)}
                    />

                    <div className="mt-14">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Scorecard history
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        All published periods for this location.
                      </p>
                      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-stone-200 bg-stone-50/80">
                              <th className="px-4 py-3 font-semibold text-slate-900">
                                Period
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-900">
                                Score
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-900">
                                Headline
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-900">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scorecards.length === 0 ? (
                              <tr>
                                <td
                                  className="px-4 py-6 text-slate-600"
                                  colSpan={4}
                                >
                                  No scorecards for this restaurant yet.
                                </td>
                              </tr>
                            ) : (
                              scorecards.map((row) => (
                                <tr
                                  key={row.id}
                                  className={`border-b border-stone-100 ${
                                    activeScorecardId === row.id
                                      ? "bg-amber-50/70"
                                      : "bg-white"
                                  }`}
                                >
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    {row.period}
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">
                                    {portalGuestSignalHeadline(row.data, row.score) ??
                                      "—"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {row.headline ?? "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => setActiveScorecardId(row.id)}
                                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                        activeScorecardId === row.id
                                          ? "bg-amber-200 text-amber-900"
                                          : "bg-stone-100 text-slate-700 hover:bg-stone-200"
                                      }`}
                                    >
                                      {activeScorecardId === row.id
                                        ? "Opened"
                                        : "Open scorecard"}
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
