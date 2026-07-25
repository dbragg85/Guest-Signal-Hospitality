import { createClient } from "@supabase/supabase-js";

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function serviceClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function collectGrowthMetrics(supabase, days = 7) {
  const { data, error } = await supabase.rpc("growth_operator_metrics", {
    p_days: Math.max(1, Math.min(Number(days) || 7, 90)),
  });
  if (error) throw error;
  if (!data || typeof data !== "object") throw new Error("Metrics RPC returned no data.");

  const { data: prospects, error: prospectError } = await supabase
    .from("prospect_queue")
    .select(
      "id,business_name,city,state,fit_score,status,rationale,draft_subject,send_status,scheduled_for,contacted_at,contact_email",
    )
    .in("status", ["approval_required", "approved", "contacted"])
    .order("fit_score", { ascending: false })
    .limit(15);
  if (prospectError) throw prospectError;

  const { data: outreachRows, error: outreachError } = await supabase
    .from("prospect_queue")
    .select("business_name,status,send_status,scheduled_for,contacted_at,contact_email");
  if (outreachError) throw outreachError;

  const outreach = summarizeOutreach(outreachRows ?? []);

  const { data: runs, error: runError } = await supabase
    .from("automation_runs")
    .select("run_kind,status,started_at,summary,error_message")
    .gte("started_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order("started_at", { ascending: false })
    .limit(20);
  if (runError) throw runError;

  const { data: goals, error: goalError } = await supabase
    .from("growth_goals")
    .select("name,target_conversions,window_days,starts_at,ends_at,status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  if (goalError) throw goalError;

  const { count: wonPeriod, error: wonError } = await supabase
    .from("sales_opportunities")
    .select("id", { count: "exact", head: true })
    .eq("stage", "won")
    .eq("is_test", false)
    .gte("won_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
  if (wonError) throw wonError;

  return {
    ...data,
    approval_queue: prospects ?? [],
    recent_automation_runs: runs ?? [],
    outreach,
    active_goal: goals?.[0] ?? null,
    won_period: wonPeriod ?? 0,
  };
}

function summarizeOutreach(rows) {
  const summary = {
    total: rows.length,
    approval_required: 0,
    approved: 0,
    contacted: 0,
    with_email: 0,
    send_scheduled: 0,
    send_sent: 0,
    send_failed: 0,
    send_not_ready: 0,
    next_scheduled_for: null,
    scheduled_names: [],
  };
  for (const row of rows) {
    if (row.status === "approval_required") summary.approval_required += 1;
    if (row.status === "approved") summary.approved += 1;
    if (row.status === "contacted") summary.contacted += 1;
    if (row.contact_email) summary.with_email += 1;
    if (row.send_status === "scheduled") {
      summary.send_scheduled += 1;
      if (
        row.scheduled_for &&
        (!summary.next_scheduled_for || row.scheduled_for < summary.next_scheduled_for)
      ) {
        summary.next_scheduled_for = row.scheduled_for;
      }
    } else if (row.send_status === "sent") {
      summary.send_sent += 1;
    } else if (row.send_status === "failed") {
      summary.send_failed += 1;
    } else if (row.send_status === "not_ready" || !row.send_status) {
      summary.send_not_ready += 1;
    }
  }
  summary.scheduled_names = rows
    .filter((row) => row.send_status === "scheduled")
    .slice(0, 8)
    .map((row) => row.business_name)
    .filter(Boolean);
  return summary;
}

export async function recordAutomationRun(supabase, values) {
  const { data, error } = await supabase
    .from("automation_runs")
    .insert(values)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function finishAutomationRun(supabase, id, values) {
  const { error } = await supabase
    .from("automation_runs")
    .update({ ...values, completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(numerator, denominator) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function dollars(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number(cents) / 100);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatEt(iso) {
  if (!iso) return "n/a";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function buildOwnerReport(metrics) {
  const events = metrics.events ?? {};
  const sales = metrics.sales ?? {};
  const intake = metrics.intake ?? {};
  const prospects = metrics.prospects ?? {};
  const outreach = metrics.outreach ?? {};
  const goal = metrics.active_goal;
  const period = number(metrics.days) || 7;
  const ctaRate = percent(number(events.cta_clicks), number(events.page_views));
  const completionRate = percent(number(events.form_completions), number(events.form_starts));
  const failures = (metrics.recent_automation_runs ?? []).filter((run) => run.status === "failed");
  const queue = (metrics.approval_queue ?? []).filter(
    (item) => item.status === "approval_required",
  );
  const latestCodex = (metrics.recent_automation_runs ?? []).find(
    (run) => run.run_kind === "codex_operator" && run.summary,
  );
  const nextSend = formatEt(outreach.next_scheduled_for);
  const goalLine = goal
    ? `- Active goal: ${number(metrics.won_period)} / ${number(goal.target_conversions)} paid conversions (window ends ${formatEt(goal.ends_at)})`
    : `- Active goal: none`;

  const lines = [
    `# Guest Signal daily owner report`,
    ``,
    `Generated: ${metrics.generated_at ?? new Date().toISOString()}`,
    ``,
    `## Revenue and sales`,
    `- Paid MRR: ${dollars(sales.mrr_cents)}`,
    goalLine,
    `- Pipeline: ${number(sales.new_count)} new, ${number(sales.qualified_count)} qualified, ${number(sales.meeting_count)} meeting, ${number(sales.proposal_count)} proposal, ${number(sales.won_count)} won`,
    `- Follow-ups due: ${number(sales.follow_ups_due)}`,
    ``,
    `## Outreach email status`,
    `- Delivered (sent): ${number(outreach.send_sent)}`,
    `- Queued with Resend (scheduled): ${number(outreach.send_scheduled)}${
      outreach.next_scheduled_for ? ` — next batch ${nextSend}` : ""
    }`,
    `- Approved but missing public email: ${number(outreach.send_not_ready)}`,
    `- Send failures: ${number(outreach.send_failed)}`,
    `- With public email on file: ${number(outreach.with_email)} / ${number(outreach.total)}`,
    ...(Array.isArray(outreach.scheduled_names) && outreach.scheduled_names.length
      ? outreach.scheduled_names.map((name) => `- Scheduled: ${name}`)
      : [`- No prospect emails are currently scheduled.`]),
    ``,
    `## Funnel — last ${period} days`,
    `- Sessions: ${number(events.sessions_period)} (${number(events.sessions_24h)} in 24h)`,
    `- Page views: ${number(events.page_views)}`,
    `- CTA clicks: ${number(events.cta_clicks)} (${ctaRate} of page views)`,
    `- Form starts: ${number(events.form_starts)}`,
    `- Form completions: ${number(events.form_completions)} (${completionRate} of starts)`,
    `- Portal upgrade clicks: ${number(events.portal_upgrade_clicks)}`,
    ``,
    `## Operations`,
    `- New submissions: ${number(intake.submissions_period)}`,
    `- Snapshot queue: ${number(intake.pending)} pending, ${number(intake.processing)} processing, ${number(intake.failed)} failed`,
    `- Automation failures in 48h: ${failures.length}`,
    ``,
    `## Prospect approval queue`,
    `- Awaiting approval: ${number(prospects.approval_required)}`,
    ...queue.map(
      (item) =>
        `- ${item.business_name} (${item.city}, ${item.state}) — fit ${item.fit_score}/100 — ${item.status}`,
    ),
    ``,
    `## Owner attention`,
    number(outreach.send_scheduled) > 0 && number(outreach.send_sent) === 0
      ? `- Prospect emails are scheduled, not delivered yet. Next send window: ${nextSend}.`
      : number(outreach.send_sent) > 0
        ? `- ${number(outreach.send_sent)} prospect email(s) have been delivered.`
        : `- No prospect emails delivered or scheduled yet.`,
    number(outreach.send_not_ready) > 0
      ? `- ${number(outreach.send_not_ready)} approved prospect(s) still need a public email before send.`
      : `- All approved prospects with send intent have emails or are already queued.`,
    number(intake.failed) > 0
      ? `- Investigate failed snapshot jobs before acquiring additional leads.`
      : `- No snapshot pipeline failures require attention.`,
    number(sales.follow_ups_due) > 0
      ? `- Review ${number(sales.follow_ups_due)} overdue commercial follow-up(s).`
      : `- No commercial follow-ups are overdue.`,
    queue.length > 0
      ? `- Approve or dismiss the ${queue.length} highest-fit outreach draft(s).`
      : `- No outreach drafts await approval.`,
    ``,
    `## AI automation plan — path to the conversion goal`,
    `- Daily: research 10 new restaurant prospects across all service markets; enrich public emails; ping ntfy Approve/Deny.`,
    `- On Approve: queue outreach (immediate when requested, else Tue–Thu 9:45 AM ET); track opens/clicks via Resend webhooks.`,
    `- Every 12h: evaluate the 3-paid-conversions / 7-day goal; if off-track, propose concrete interventions on ntfy for Approve/Deny.`,
    `- Continuous: convert free snapshots → Stripe Checkout CTAs; alert on checkout starts without completion.`,
    `- Content/SEO: keep market + Google-ratings pages indexed; surface top CTAs in the daily report when sessions rise but conversions stay at zero.`,
    `- Instagram assist: draft 3 owner-facing posts/week from the same review themes (ratings, reply scripts, scorecard proof) and DM local independents once the account has usable reach.`,
    `- Human only when needed: Approve/Deny outreach, Approve/Deny growth interventions, and close warm intros that AI cannot.`,
    `- Near-term success check: emails delivered → snapshot requests → checkout sessions → won subscriptions counted toward the active goal.`,
    ...(latestCodex
      ? [
          ``,
          `## Latest bounded-operator analysis`,
          ...String(latestCodex.summary)
            .split("\n")
            .filter(Boolean)
            .slice(0, 20)
            .map((line) => (line.startsWith("- ") ? line : `- ${line.replace(/^#+\s*/, "")}`)),
        ]
      : []),
  ];

  const markdown = `${lines.join("\n")}\n`;
  const html = `
    <main style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#172033">
      ${lines
        .map((line) => {
          if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
          if (line.startsWith("## ")) return `<h2 style="margin-top:28px">${escapeHtml(line.slice(3))}</h2>`;
          if (line.startsWith("- ")) return `<p style="margin:7px 0">• ${escapeHtml(line.slice(2))}</p>`;
          if (!line) return "";
          return `<p>${escapeHtml(line)}</p>`;
        })
        .join("\n")}
    </main>`;

  return {
    subject: `Guest Signal daily report — ${dollars(sales.mrr_cents)} MRR, ${number(events.sessions_24h)} sessions`,
    markdown,
    html,
  };
}

export async function sendOwnerEmail(report) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const recipients = requiredEnv("OWNER_REPORT_EMAIL_TO")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const from =
    process.env.OWNER_REPORT_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Guest Signal Operator <audit@guestsignalhospitality.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: report.subject,
      text: report.markdown,
      html: report.html,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend owner report failed (${response.status}): ${await response.text()}`);
  }
}
