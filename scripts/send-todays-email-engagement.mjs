#!/usr/bin/env node
/**
 * Send a report of today's email opens/clicks to the owner.
 *
 * Usage:
 *   npm run growth:todays-engagement
 *   DRY_RUN=1 npm run growth:todays-engagement
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 *   OWNER_REPORT_EMAIL_TO (defaults to audit@guestsignalhospitality.com)
 */
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function formatEt(iso) {
  if (!iso) return "n/a";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());

  const supabase = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Get start of today in ET
  const now = new Date();
  const etOptions = { timeZone: "America/New_York" };
  const etDate = new Intl.DateTimeFormat("en-CA", { ...etOptions, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const todayStart = new Date(`${etDate}T00:00:00-04:00`).toISOString();

  // Query emails sent today
  const { data: sentToday, error: sentError } = await supabase
    .from("prospect_queue")
    .select("id,business_name,city,state,contact_email,contacted_at,open_count,first_opened_at,last_opened_at,click_count,first_clicked_at,last_clicked_at,last_clicked_url,draft_subject")
    .gte("contacted_at", todayStart)
    .eq("send_status", "sent")
    .order("contacted_at", { ascending: false });

  if (sentError) throw sentError;

  // Also get emails with engagement today (opened/clicked today, even if sent earlier)
  const { data: engagedToday, error: engagedError } = await supabase
    .from("prospect_queue")
    .select("id,business_name,city,state,contact_email,contacted_at,open_count,first_opened_at,last_opened_at,click_count,first_clicked_at,last_clicked_at,last_clicked_url,draft_subject")
    .or(`last_opened_at.gte.${todayStart},last_clicked_at.gte.${todayStart}`)
    .eq("send_status", "sent");

  if (engagedError) throw engagedError;

  // Merge and dedupe
  const allIds = new Set();
  const all = [];
  for (const row of [...(sentToday ?? []), ...(engagedToday ?? [])]) {
    if (!allIds.has(row.id)) {
      allIds.add(row.id);
      all.push(row);
    }
  }

  const withOpens = all.filter((r) => r.open_count > 0);
  const withClicks = all.filter((r) => r.click_count > 0);
  const sentTodayCount = (sentToday ?? []).length;

  // Build report
  const lines = [
    `# Email engagement report — ${etDate}`,
    ``,
    `Generated: ${formatEt(now.toISOString())}`,
    ``,
    `## Summary`,
    `- Emails sent today: ${sentTodayCount}`,
    `- With opens: ${withOpens.length}`,
    `- With clicks: ${withClicks.length}`,
    ``,
  ];

  if (withClicks.length > 0) {
    lines.push(`## Clicks (highest intent)`);
    for (const row of withClicks) {
      lines.push(`- **${row.business_name}** (${row.city}, ${row.state})`);
      lines.push(`  - Email: ${row.contact_email}`);
      lines.push(`  - Sent: ${formatEt(row.contacted_at)}`);
      lines.push(`  - Clicks: ${row.click_count} (first: ${formatEt(row.first_clicked_at)}, last: ${formatEt(row.last_clicked_at)})`);
      if (row.last_clicked_url) lines.push(`  - Last URL: ${row.last_clicked_url}`);
      lines.push(``);
    }
  }

  if (withOpens.length > 0) {
    lines.push(`## Opens`);
    for (const row of withOpens) {
      if (row.click_count > 0) continue; // Already shown in clicks
      lines.push(`- **${row.business_name}** (${row.city}, ${row.state})`);
      lines.push(`  - Email: ${row.contact_email}`);
      lines.push(`  - Sent: ${formatEt(row.contacted_at)}`);
      lines.push(`  - Opens: ${row.open_count} (first: ${formatEt(row.first_opened_at)}, last: ${formatEt(row.last_opened_at)})`);
      lines.push(``);
    }
  }

  if (sentTodayCount > 0 && withOpens.length === 0 && withClicks.length === 0) {
    lines.push(`## No engagement yet`);
    lines.push(`${sentTodayCount} email(s) sent today have not been opened or clicked yet.`);
    lines.push(``);
  }

  if (sentTodayCount === 0 && withOpens.length === 0 && withClicks.length === 0) {
    lines.push(`No emails were sent today and no engagement was recorded today.`);
    lines.push(``);
  }

  const markdown = lines.join("\n");
  const html = `
    <main style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#172033;padding:20px">
      ${lines
        .map((line) => {
          if (line.startsWith("# ")) return `<h1 style="color:#1e40af">${escapeHtml(line.slice(2))}</h1>`;
          if (line.startsWith("## ")) return `<h2 style="margin-top:24px;color:#374151">${escapeHtml(line.slice(3))}</h2>`;
          if (line.startsWith("- **")) {
            const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
            if (match) return `<p style="margin:12px 0 4px 0"><strong>${escapeHtml(match[1])}</strong>${escapeHtml(match[2])}</p>`;
          }
          if (line.startsWith("  - ")) return `<p style="margin:2px 0 2px 20px;font-size:14px;color:#4b5563">${escapeHtml(line.slice(4))}</p>`;
          if (line.startsWith("- ")) return `<p style="margin:6px 0">• ${escapeHtml(line.slice(2))}</p>`;
          if (!line) return "";
          return `<p>${escapeHtml(line)}</p>`;
        })
        .join("\n")}
    </main>`;

  const subject = `Email engagement: ${withClicks.length} click${withClicks.length !== 1 ? "s" : ""}, ${withOpens.length} open${withOpens.length !== 1 ? "s" : ""} — ${etDate}`;

  if (dryRun) {
    console.log("=== DRY RUN ===\n");
    console.log(`Subject: ${subject}\n`);
    console.log(markdown);
    return;
  }

  const apiKey = requiredEnv("RESEND_API_KEY");
  const recipients = (process.env.OWNER_REPORT_EMAIL_TO || "audit@guestsignalhospitality.com")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const from = process.env.OWNER_REPORT_EMAIL_FROM?.trim() || "Guest Signal <audit@guestsignalhospitality.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      text: markdown,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed (${response.status}): ${await response.text()}`);
  }

  console.log(`✓ Email engagement report sent to ${recipients.join(", ")}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
