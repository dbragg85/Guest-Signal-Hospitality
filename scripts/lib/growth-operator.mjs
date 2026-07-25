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
    .select("id,business_name,city,state,fit_score,status,rationale,draft_subject")
    .in("status", ["approval_required", "approved"])
    .order("fit_score", { ascending: false })
    .limit(10);
  if (prospectError) throw prospectError;

  const { data: runs, error: runError } = await supabase
    .from("automation_runs")
    .select("run_kind,status,started_at,summary,error_message")
    .gte("started_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order("started_at", { ascending: false })
    .limit(20);
  if (runError) throw runError;

  return {
    ...data,
    approval_queue: prospects ?? [],
    recent_automation_runs: runs ?? [],
  };
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

export function buildOwnerReport(metrics) {
  const events = metrics.events ?? {};
  const sales = metrics.sales ?? {};
  const intake = metrics.intake ?? {};
  const prospects = metrics.prospects ?? {};
  const period = number(metrics.days) || 7;
  const ctaRate = percent(number(events.cta_clicks), number(events.page_views));
  const completionRate = percent(number(events.form_completions), number(events.form_starts));
  const failures = (metrics.recent_automation_runs ?? []).filter((run) => run.status === "failed");
  const queue = metrics.approval_queue ?? [];
  const latestCodex = (metrics.recent_automation_runs ?? []).find(
    (run) => run.run_kind === "codex_operator" && run.summary,
  );

  const lines = [
    `# Guest Signal daily owner report`,
    ``,
    `Generated: ${metrics.generated_at ?? new Date().toISOString()}`,
    ``,
    `## Revenue and sales`,
    `- Paid MRR: ${dollars(sales.mrr_cents)}`,
    `- Pipeline: ${number(sales.new_count)} new, ${number(sales.qualified_count)} qualified, ${number(sales.meeting_count)} meeting, ${number(sales.proposal_count)} proposal, ${number(sales.won_count)} won`,
    `- Follow-ups due: ${number(sales.follow_ups_due)}`,
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
    `- Automation failures in 24h: ${failures.length}`,
    ``,
    `## Prospect approval queue`,
    `- Awaiting approval: ${number(prospects.approval_required)}`,
    ...queue.map(
      (item) =>
        `- ${item.business_name} (${item.city}, ${item.state}) — fit ${item.fit_score}/100 — ${item.status}`,
    ),
    ``,
    `## Owner attention`,
    number(intake.failed) > 0
      ? `- Investigate failed snapshot jobs before acquiring additional leads.`
      : `- No snapshot pipeline failures require attention.`,
    number(sales.follow_ups_due) > 0
      ? `- Review ${number(sales.follow_ups_due)} overdue commercial follow-up(s).`
      : `- No commercial follow-ups are overdue.`,
    queue.length > 0
      ? `- Approve or dismiss the ${queue.length} highest-fit outreach draft(s).`
      : `- No outreach drafts await approval.`,
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
