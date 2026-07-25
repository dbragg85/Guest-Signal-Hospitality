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
  status: "approval_required" | "approved";
  contact_email: string | null;
  send_status: "not_ready" | "pending" | "sending" | "failed";
  send_error: string | null;
};

export function ProspectApprovalPanel({ supabase }: { supabase: SupabaseClient }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [contactEmails, setContactEmails] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("prospect_queue")
      .select(
        "id,business_name,website_url,source_url,city,state,fit_score,rationale,draft_subject,draft_body,status,contact_email,send_status,send_error",
      )
      .in("status", ["approval_required", "approved"])
      .neq("send_status", "sent")
      .order("fit_score", { ascending: false })
      .limit(20);
    if (queryError) setError(queryError.message);
    else {
      const nextProspects = (data ?? []) as Prospect[];
      setProspects(nextProspects);
      setContactEmails(
        Object.fromEntries(
          nextProspects.map((prospect) => [
            prospect.id,
            prospect.contact_email ?? "",
          ]),
        ),
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approveAndSend(prospect: Prospect) {
    setError(null);
    const contactEmail = (contactEmails[prospect.id] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError(`Enter a valid public business email for ${prospect.business_name}.`);
      return;
    }
    setSendingId(prospect.id);
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({
        contact_email: contactEmail,
        status: "approved",
        approved_at: new Date().toISOString(),
        send_status: "pending",
        send_error: null,
      })
      .eq("id", prospect.id);
    if (updateError) {
      setError(updateError.message);
      setSendingId(null);
      return;
    }

    const { error: sendError } = await supabase.functions.invoke(
      "send-approved-prospect",
      { body: { prospectId: prospect.id } },
    );
    if (sendError) {
      setError(
        `Draft approved, but delivery failed: ${sendError.message}. Verify sender configuration and retry.`,
      );
      setSendingId(null);
      await load();
      return;
    }
    setProspects((current) => current.filter((item) => item.id !== prospect.id));
    setSendingId(null);
  }

  async function dismiss(id: string) {
    setError(null);
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({ status: "dismissed", send_status: "not_ready", send_error: null })
      .eq("id", id)
      .in("status", ["approval_required", "approved"]);
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
            Enter a verified public business email. Approval is the explicit
            authorization to send this exact draft once.
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
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Verified public business email
              <input
                type="email"
                value={contactEmails[prospect.id] ?? ""}
                onChange={(event) =>
                  setContactEmails((current) => ({
                    ...current,
                    [prospect.id]: event.target.value,
                  }))
                }
                placeholder="hello@restaurant.com"
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                autoComplete="off"
              />
            </label>
            {prospect.status === "approved" ? (
              <p className="mt-3 text-xs font-semibold text-amber-800">
                Already approved; add the recipient and send when ready.
              </p>
            ) : null}
            {prospect.send_error ? (
              <p className="mt-3 text-xs text-red-700">
                Previous delivery error: {prospect.send_error}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void approveAndSend(prospect)}
                className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sendingId === prospect.id}
              >
                {sendingId === prospect.id
                  ? "Sending…"
                  : prospect.status === "approved"
                    ? "Send approved draft"
                    : "Approve & send"}
              </button>
              <button
                type="button"
                onClick={() => void dismiss(prospect.id)}
                className="btn-secondary text-sm"
                disabled={sendingId === prospect.id}
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
