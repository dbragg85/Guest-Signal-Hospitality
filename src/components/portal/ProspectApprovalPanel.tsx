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
  status: "approval_required" | "approved" | "contacted";
  contact_email: string | null;
  send_status:
    | "not_ready"
    | "pending"
    | "sending"
    | "scheduled"
    | "sent"
    | "failed"
    | "bounced"
    | "complained";
  send_error: string | null;
  scheduled_for: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  click_count: number;
  last_clicked_url: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProspectApprovalPanel({ supabase }: { supabase: SupabaseClient }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [contactEmails, setContactEmails] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("prospect_queue")
      .select(
        "id,business_name,website_url,source_url,city,state,fit_score,rationale,draft_subject,draft_body,status,contact_email,send_status,send_error,scheduled_for,first_opened_at,last_opened_at,open_count,first_clicked_at,last_clicked_at,click_count,last_clicked_url",
      )
      .in("status", ["approval_required", "approved", "contacted"])
      .order("updated_at", { ascending: false })
      .limit(30);
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

  async function saveContactEmail(prospect: Prospect) {
    setError(null);
    const contactEmail = (contactEmails[prospect.id] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError(`Enter a valid public business email for ${prospect.business_name}.`);
      return;
    }
    setSavingId(prospect.id);
    const update: Record<string, unknown> = {
      contact_email: contactEmail,
      send_error: null,
    };
    if (prospect.status === "approved") {
      update.send_status = "pending";
    }
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update(update)
      .eq("id", prospect.id);
    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    if (prospect.status === "approved") {
      const { error: sendError } = await supabase.functions.invoke(
        "send-approved-prospect",
        { body: { prospectId: prospect.id } },
      );
      if (sendError) {
        setError(
          `Email saved, but scheduling failed: ${sendError.message}. Retry after checking sender config.`,
        );
        setSavingId(null);
        await load();
        return;
      }
    }
    setSavingId(null);
    await load();
  }

  return (
    <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            ntfy approval queue
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Prospect outreach drafts
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Approve or deny drafts in the ntfy app. Use this panel to add a
            public business email and watch open/click tracking after send.
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
        <p className="mt-5 text-sm text-slate-600">No active outreach drafts.</p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {prospects.map((prospect) => {
          const deliveryLocked = [
            "pending",
            "sending",
            "scheduled",
            "sent",
            "bounced",
            "complained",
          ].includes(prospect.send_status);
          const awaitingNtfy = prospect.status === "approval_required";
          return (
            <article
              key={prospect.id}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {prospect.business_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {prospect.city}, {prospect.state} · Fit {prospect.fit_score}/100
                    {awaitingNtfy ? " · Waiting on ntfy" : ""}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  {prospect.website_url ? (
                    <a
                      className="font-semibold text-amber-900 underline"
                      href={prospect.website_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </a>
                  ) : null}
                  {prospect.source_url ? (
                    <a
                      className="font-semibold text-amber-900 underline"
                      href={prospect.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
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
              {awaitingNtfy ? (
                <p className="mt-3 text-xs font-semibold text-amber-800">
                  Decision required in ntfy (Approve / Deny). Optionally save the
                  recipient email below first so Approve can schedule immediately.
                </p>
              ) : null}
              {!deliveryLocked ? (
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
              ) : null}
              {deliveryLocked ? (
                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700">
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <span>
                      Status:{" "}
                      <strong className="capitalize">{prospect.send_status}</strong>
                    </span>
                    {prospect.scheduled_for ? (
                      <span>
                        Scheduled:{" "}
                        <strong>{formatDateTime(prospect.scheduled_for)}</strong>
                      </span>
                    ) : null}
                    <span>
                      Opens: <strong>{prospect.open_count}</strong>
                    </span>
                    <span>
                      Clicks: <strong>{prospect.click_count}</strong>
                    </span>
                  </div>
                  {prospect.first_opened_at ? (
                    <p className="mt-2 text-xs text-slate-500">
                      First open {formatDateTime(prospect.first_opened_at)}
                      {prospect.last_opened_at &&
                      prospect.last_opened_at !== prospect.first_opened_at
                        ? ` · latest ${formatDateTime(prospect.last_opened_at)}`
                        : ""}
                    </p>
                  ) : null}
                  {prospect.last_clicked_url ? (
                    <p className="mt-2 break-all text-xs text-slate-500">
                      Last clicked: {prospect.last_clicked_url}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {prospect.send_error ? (
                <p className="mt-3 text-xs text-red-700">
                  Previous delivery error: {prospect.send_error}
                </p>
              ) : null}
              {!deliveryLocked ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveContactEmail(prospect)}
                    className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingId === prospect.id}
                  >
                    {savingId === prospect.id
                      ? "Saving…"
                      : prospect.status === "approved"
                        ? "Save email & schedule"
                        : "Save email for ntfy Approve"}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
