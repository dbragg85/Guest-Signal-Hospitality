"use client";

import { RestaurantSnapshotTemplate } from "@/components/portal/RestaurantSnapshotTemplate";
import { usePortalSession } from "@/contexts/PortalSessionContext";
import { isPortalRestaurantSlug } from "@/data/portal-restaurants";
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
  price_level: number | null;
  competitors: unknown;
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

type Props = { initialSlug?: string };

const REQUIRED_SNAPSHOT_PERIODS = [
  "Dec 2025",
  "Jan 2026",
  "Feb 2026",
  "Q1 2026",
] as const;

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
  const trimmed = period.trim();
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

export function PortalDashboardClient({ initialSlug }: Props) {
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
        "id, slug, name, portal_intro, address, phone, website, logo_url, google_rating, price_level, competitors"
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
        if (initialSlug) {
          const bySlug = list.find((r) => r.slug === initialSlug);
          if (bySlug) return bySlug.id;
          return null;
        }
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0].id;
      });
    } else {
      setSelectedId(null);
    }
    setDataLoading(false);
  }, [supabase, session, initialSlug]);

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
      const sorted = sortScorecards((data ?? []) as Scorecard[]);
      setScorecards(sorted);
      setActiveScorecardId((prev) => {
        if (prev && sorted.some((row) => row.id === prev)) return prev;
        return sorted[0]?.id ?? null;
      });
    }
    loadScorecards();
  }, [supabase, selectedId]);

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
              {profile?.is_super_admin ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  Super admin — all restaurants
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/portal/demo/"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              Sales demo layout
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>

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
        ) : !dataLoading &&
          initialSlug &&
          selectedId === null &&
          restaurants.length > 0 ? (
          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-5 text-sm text-amber-950">
            <p className="font-semibold">This restaurant page isn&apos;t available for your account.</p>
            <p className="mt-2 text-amber-900/90">
              The URL may be wrong, or your team hasn&apos;t been granted access yet. Open the main
              dashboard to pick a restaurant you&apos;re assigned to.
            </p>
            <Link
              href="/portal/dashboard/"
              className="mt-4 inline-block font-semibold text-amber-900 underline underline-offset-4"
            >
              Back to scorecards
            </Link>
          </div>
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
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedId(id);
                  const r = restaurants.find((x) => x.id === id);
                  if (initialSlug !== undefined && r && isPortalRestaurantSlug(r.slug)) {
                    router.replace(`/portal/dashboard/${r.slug}/`);
                  }
                }}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </select>
              {selectedId ? (
                <div className="text-sm">
                  {(() => {
                    const cur = restaurants.find((r) => r.id === selectedId);
                    if (cur && isPortalRestaurantSlug(cur.slug)) {
                      return (
                        <Link
                          href={`/portal/dashboard/${cur.slug}/`}
                          className="font-medium text-amber-900 underline-offset-4 hover:underline"
                        >
                          Bookmarkable page for this restaurant
                        </Link>
                      );
                    }
                    return (
                      <span className="text-slate-500">
                        Add this venue to the static portal list in the repo to enable a dedicated
                        URL.
                      </span>
                    );
                  })()}
                </div>
              ) : null}
            </div>

            {selectedId ? (
              (() => {
                const cur = restaurants.find((r) => r.id === selectedId);
                if (!cur) return null;
                const periodsPresent = new Set<string>();
                scorecards.forEach((row) => {
                  const canonical = canonicalPeriodKey(row.period);
                  if (canonical) {
                    periodsPresent.add(canonical);
                  } else {
                    periodsPresent.add(`raw:${normalizePeriod(row.period)}`);
                  }
                });
                const missingPeriods = REQUIRED_SNAPSHOT_PERIODS.filter(
                  (period) => {
                    const canonical = canonicalPeriodKey(period);
                    if (canonical) return !periodsPresent.has(canonical);
                    return !periodsPresent.has(`raw:${normalizePeriod(period)}`);
                  },
                );
                return (
                  <>
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
                        competitors: cur.competitors,
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
                        All published periods for this location (source: Supabase{" "}
                        <code className="rounded bg-stone-100 px-1 text-xs">scorecards</code>).
                      </p>
                      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Required snapshot coverage
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {REQUIRED_SNAPSHOT_PERIODS.map((period) => {
                            const canonical = canonicalPeriodKey(period);
                            const present = canonical
                              ? periodsPresent.has(canonical)
                              : periodsPresent.has(`raw:${normalizePeriod(period)}`);
                            return (
                              <span
                                key={period}
                                className={`rounded-full px-2 py-1 font-semibold ${
                                  present
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {period}: {present ? "ready" : "missing"}
                              </span>
                            );
                          })}
                        </div>
                        {missingPeriods.length > 0 ? (
                          <p className="mt-2 text-xs text-amber-900">
                            Missing periods: {missingPeriods.join(", ")}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-emerald-800">
                            All required periods are published.
                          </p>
                        )}
                      </div>
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
                                    {row.score ?? "—"}
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
