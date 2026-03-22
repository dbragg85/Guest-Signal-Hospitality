"use client";

import { usePortalSession } from "@/contexts/PortalSessionContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Restaurant = {
  id: string;
  slug: string;
  name: string;
};

type Scorecard = {
  id: string;
  restaurant_id: string;
  period: string;
  score: number | null;
  headline: string | null;
  data: Record<string, unknown> | null;
};

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
      .select("id, slug, name")
      .order("name");

    if (rErr) {
      setLoadError(rErr.message);
      setDataLoading(false);
      return;
    }

    setRestaurants((rests ?? []) as Restaurant[]);
    if (rests?.length) {
      setSelectedId((prev) => {
        if (prev && rests.some((r) => r.id === prev)) return prev;
        return rests[0].id;
      });
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
        return;
      }
      const { data, error } = await supabase
        .from("scorecards")
        .select("id, restaurant_id, period, score, headline, data")
        .eq("restaurant_id", selectedId)
        .order("period", { ascending: false });

      if (error) {
        setLoadError(error.message);
        return;
      }
      setScorecards((data ?? []) as Scorecard[]);
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
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    {r.name} ({r.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-10 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
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
                  </tr>
                </thead>
                <tbody>
                  {scorecards.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-slate-600"
                        colSpan={3}
                      >
                        No scorecards for this restaurant yet.
                      </td>
                    </tr>
                  ) : (
                    scorecards.map((row) => (
                      <tr key={row.id} className="border-b border-stone-100">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.period}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.score ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.headline ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
