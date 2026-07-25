"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type Prospect = {
  id: string;
  business_name: string;
  website_url: string | null;
  source_url: string | null;
  city: string;
  state: string;
  fit_score: number;
  rationale: string | null;
  draft_subject: string | null;
  draft_body: string | null;
};

export function ProspectApprovalPanel({ supabase }: { supabase: SupabaseClient }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("prospect_queue")
      .select(
        "id,business_name,website_url,source_url,city,state,fit_score,rationale,draft_subject,draft_body",
      )
      .eq("status", "approval_required")
      .order("fit_score", { ascending: false })
      .limit(20);
    if (queryError) setError(queryError.message);
    else setProspects((data ?? []) as Prospect[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, status: "approved" | "dismissed") {
    setError(null);
    const update =
      status === "approved"
        ? { status, approved_at: new Date().toISOString() }
        : { status };
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update(update)
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setProspects((current) => current.filter((prospect) => prospect.id !== id));
  }

  return (
    <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Owner approval queue
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Prospect outreach drafts
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Public-business research only. Approving a draft does not send it;
            outreach remains manual until a separate sending policy is approved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-5 text-sm text-slate-600">Loading drafts…</p> : null}
      {error ? (
        <p className="mt-5 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && prospects.length === 0 ? (
        <p className="mt-5 text-sm text-slate-600">No drafts currently require approval.</p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {prospects.map((prospect) => (
          <article key={prospect.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{prospect.business_name}</h3>
                <p className="text-xs text-slate-500">
                  {prospect.city}, {prospect.state} · Fit {prospect.fit_score}/100
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                {prospect.website_url ? (
                  <a className="font-semibold text-amber-900 underline" href={prospect.website_url} target="_blank" rel="noreferrer">
                    Website
                  </a>
                ) : null}
                {prospect.source_url ? (
                  <a className="font-semibold text-amber-900 underline" href={prospect.source_url} target="_blank" rel="noreferrer">
                    Public profile
                  </a>
                ) : null}
              </div>
            </div>
            {prospect.rationale ? (
              <p className="mt-3 text-sm text-slate-600">{prospect.rationale}</p>
            ) : null}
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-slate-700">
              <p className="font-semibold">{prospect.draft_subject}</p>
              <p className="mt-2 whitespace-pre-line">{prospect.draft_body}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void decide(prospect.id, "approved")}
                className="btn-primary text-sm"
              >
                Approve draft
              </button>
              <button
                type="button"
                onClick={() => void decide(prospect.id, "dismissed")}
                className="btn-secondary text-sm"
              >
                Dismiss
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
