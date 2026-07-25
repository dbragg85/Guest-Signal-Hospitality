"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

type ProspectStatus = "approval_required" | "approved" | "contacted" | "dismissed";

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
  status: ProspectStatus;
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
  public_signals?: {
    market_slug?: string;
    ai_model?: string;
    context_useful?: boolean;
    rating?: number;
    reviews_count?: number;
  };
};

type StatusFilter = "all" | "pending" | "approved" | "sent" | "dismissed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent" },
  { value: "dismissed", label: "Dismissed" },
];

type MarketGroup = {
  market: string;
  city: string;
  state: string;
  prospects: Prospect[];
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("prospect_queue")
      .select(
        "id,business_name,website_url,source_url,city,state,fit_score,rationale,draft_subject,draft_body,status,contact_email,send_status,send_error,scheduled_for,first_opened_at,last_opened_at,open_count,first_clicked_at,last_clicked_at,click_count,last_clicked_url,public_signals",
      )
      .in("status", ["approval_required", "approved", "contacted", "dismissed"])
      .order("fit_score", { ascending: false })
      .limit(500);
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

  const availableMarkets = useMemo(() => {
    const marketMap = new Map<string, { city: string; state: string }>();
    for (const prospect of prospects) {
      const slug =
        prospect.public_signals?.market_slug ||
        `${prospect.city.toLowerCase()}-${prospect.state.toLowerCase()}`;
      if (!marketMap.has(slug)) {
        marketMap.set(slug, { city: prospect.city, state: prospect.state });
      }
    }
    return Array.from(marketMap.entries())
      .map(([slug, { city, state }]) => ({ slug, city, state }))
      .sort((a, b) => `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`));
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && prospect.status !== "approval_required") return false;
        if (statusFilter === "approved" && prospect.status !== "approved") return false;
        if (statusFilter === "sent" && prospect.send_status !== "sent") return false;
        if (statusFilter === "dismissed" && prospect.status !== "dismissed") return false;
      }

      if (marketFilter !== "all") {
        const prospectMarket =
          prospect.public_signals?.market_slug ||
          `${prospect.city.toLowerCase()}-${prospect.state.toLowerCase()}`;
        if (prospectMarket !== marketFilter) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = prospect.business_name.toLowerCase().includes(query);
        const matchesCity = prospect.city.toLowerCase().includes(query);
        if (!matchesName && !matchesCity) return false;
      }

      return true;
    });
  }, [prospects, statusFilter, marketFilter, searchQuery]);

  const groupedByMarket = filteredProspects.reduce<MarketGroup[]>((groups, prospect) => {
    const marketSlug = prospect.public_signals?.market_slug || `${prospect.city.toLowerCase()}-${prospect.state.toLowerCase()}`;
    const existing = groups.find((g) => g.market === marketSlug);
    if (existing) {
      existing.prospects.push(prospect);
    } else {
      groups.push({
        market: marketSlug,
        city: prospect.city,
        state: prospect.state,
        prospects: [prospect],
      });
    }
    return groups;
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, approved: 0, sent: 0, dismissed: 0 };
    for (const prospect of prospects) {
      counts.all++;
      if (prospect.status === "approval_required") counts.pending++;
      else if (prospect.status === "approved") counts.approved++;
      else if (prospect.status === "dismissed") counts.dismissed++;
      if (prospect.send_status === "sent") counts.sent++;
    }
    return counts;
  }, [prospects]);

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

  async function approveProspect(prospect: Prospect) {
    setError(null);
    setSavingId(prospect.id);
    const contactEmail = (contactEmails[prospect.id] ?? "").trim().toLowerCase();
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
    
    const update: Record<string, unknown> = {
      status: "approved",
      approved_at: new Date().toISOString(),
      send_status: hasEmail ? "pending" : "not_ready",
      send_error: hasEmail ? null : "Approved. Add contact email to schedule send.",
    };
    if (hasEmail) {
      update.contact_email = contactEmail;
    }

    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update(update)
      .eq("id", prospect.id)
      .eq("status", "approval_required");

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    if (hasEmail) {
      const { error: sendError } = await supabase.functions.invoke(
        "send-approved-prospect",
        { body: { prospectId: prospect.id } },
      );
      if (sendError) {
        setError(
          `Approved, but scheduling failed: ${sendError.message}. Add email and retry.`,
        );
      }
    }

    setSavingId(null);
    await load();
  }

  async function denyProspect(prospect: Prospect) {
    setError(null);
    setSavingId(prospect.id);

    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({
        status: "dismissed",
        send_status: "not_ready",
        send_error: null,
      })
      .eq("id", prospect.id)
      .eq("status", "approval_required");

    if (updateError) {
      setError(updateError.message);
    }

    setSavingId(null);
    await load();
  }

  async function recycleProspect(prospect: Prospect) {
    setError(null);
    setSavingId(prospect.id);

    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({
        status: "approval_required",
        approved_at: null,
        send_status: "not_ready",
        send_error: null,
        contacted_at: null,
        scheduled_for: null,
      })
      .eq("id", prospect.id)
      .eq("status", "dismissed");

    if (updateError) {
      setError(updateError.message);
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
            Approve or deny drafts here or in ntfy. Add a public business email
            and watch open/click tracking after send.
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

      {!loading && prospects.length > 0 ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === filter.value
                    ? "bg-amber-600 text-white"
                    : "bg-white text-slate-700 hover:bg-amber-100"
                }`}
              >
                {filter.label}
                <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                  {statusCounts[filter.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="market-filter" className="text-xs font-medium text-slate-600">
                Market:
              </label>
              <select
                id="market-filter"
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">All markets ({availableMarkets.length})</option>
                {availableMarkets.map((market) => (
                  <option key={market.slug} value={market.slug}>
                    {market.city}, {market.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search-query" className="text-xs font-medium text-slate-600">
                Search:
              </label>
              <input
                id="search-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Business name or city…"
                className="w-48 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredProspects.length !== prospects.length ? (
            <p className="text-xs text-slate-500">
              Showing {filteredProspects.length} of {prospects.length} prospects
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? <p className="mt-5 text-sm text-slate-600">Loading drafts…</p> : null}
      {error ? (
        <p className="mt-5 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && prospects.length === 0 ? (
        <p className="mt-5 text-sm text-slate-600">No active outreach drafts.</p>
      ) : null}
      {!loading && !error && prospects.length > 0 && filteredProspects.length === 0 ? (
        <p className="mt-5 text-sm text-slate-600">No prospects match your filters.</p>
      ) : null}

      <div className="mt-5 space-y-8">
        {groupedByMarket.map((group) => (
          <div key={group.market}>
            <h3 className="mb-3 flex items-center gap-2 border-b border-stone-200 pb-2 text-sm font-semibold text-slate-700">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                {group.city}, {group.state}
              </span>
              <span className="text-slate-400">
                {group.prospects.length} prospect{group.prospects.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs font-normal text-slate-400">
                {group.prospects.filter((p) => p.status === "approval_required").length} pending
              </span>
            </h3>
            <div className="grid gap-4">
              {group.prospects.map((prospect) => {
          const deliveryLocked = [
            "pending",
            "sending",
            "scheduled",
            "sent",
            "bounced",
            "complained",
          ].includes(prospect.send_status);
          const awaitingNtfy = prospect.status === "approval_required";
          const isDismissed = prospect.status === "dismissed";
          const isSent = prospect.send_status === "sent";
          return (
            <article
              key={prospect.id}
              className={`rounded-2xl border p-5 ${
                isDismissed
                  ? "border-stone-300 bg-stone-50 opacity-75"
                  : isSent
                    ? "border-green-200 bg-green-50/50"
                    : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    {prospect.business_name}
                    {isDismissed ? (
                      <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                        Dismissed
                      </span>
                    ) : isSent ? (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        Sent
                      </span>
                    ) : awaitingNtfy ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Pending
                      </span>
                    ) : prospect.status === "approved" ? (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Approved
                      </span>
                    ) : null}
                    {prospect.public_signals?.ai_model ? (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                        AI
                      </span>
                    ) : null}
                    {prospect.public_signals?.context_useful ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        Context
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {prospect.city}, {prospect.state} · Fit {prospect.fit_score}/100
                    {prospect.public_signals?.rating ? ` · ${prospect.public_signals.rating.toFixed(1)}★` : ""}
                    {prospect.public_signals?.reviews_count ? ` · ${prospect.public_signals.reviews_count} reviews` : ""}
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
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void approveProspect(prospect)}
                    disabled={savingId === prospect.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === prospect.id ? "Saving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void denyProspect(prospect)}
                    disabled={savingId === prospect.id}
                    className="rounded-lg bg-stone-500 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Deny
                  </button>
                  <span className="text-xs text-slate-500">
                    Add email first to auto-schedule on approve
                  </span>
                </div>
              ) : null}
              {isDismissed ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void recycleProspect(prospect)}
                    disabled={savingId === prospect.id}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === prospect.id ? "Recycling…" : "Re-queue for Review"}
                  </button>
                </div>
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
                        : "Save email"}
                  </button>
                </div>
              ) : null}
            </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}
