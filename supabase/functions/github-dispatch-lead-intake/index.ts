/**
 * Called by Supabase Database Webhooks on INSERT into public.lead_intake_submissions.
 * Dispatches GitHub repository_dispatch so "Process lead intake snapshots" runs for that lead_id.
 * Also alerts the owner via ntfy (+ optional Resend email) that a scorecard request arrived.
 *
 * Secrets (supabase secrets set --project-ref ...):
 *   GITHUB_DISPATCH_TOKEN — classic PAT with `repo` scope, or fine-grained with Contents: Read/Write
 *   LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET — shared secret; same value in webhook HTTP header below
 *
 * Optional:
 *   GITHUB_DISPATCH_REPOSITORY — default dbragg85/Guest-Signal-Hospitality
 *   NTFY_TOPIC — default Guest_Signal
 *   NTFY_SERVER_URL — default https://ntfy.sh
 *   NTFY_ACCESS_TOKEN — if topic is protected
 *   RESEND_API_KEY + RESEND_FROM + OWNER_REPORT_EMAIL_TO — owner email on new request
 *
 * Webhook (Dashboard → Database → Webhooks):
 *   Table: public.lead_intake_submissions, Events: INSERT
 *   HTTP POST URL: https://<project-ref>.supabase.co/functions/v1/github-dispatch-lead-intake
 *   Headers:
 *     x-lead-intake-dispatch-secret: <same as LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET>
 *     Content-Type: application/json
 *
 * With verify_jwt = false, do not expose this URL without the shared secret header.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SERVICE_PLANS = new Set([
  "free_snapshot",
  "signal_monitor",
  "signal_growth",
  "signal_elevate",
]);

const DEFAULT_REPO = "dbragg85/Guest-Signal-Hospitality";

/** Normalize `record.id` from Database Webhooks (Postgres uuid is almost always a JSON string). */
function normalizeLeadId(raw: unknown): string | null {
  if (typeof raw === "string") {
    const s = raw.trim();
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    ) {
      return s;
    }
  }
  return null;
}

function json(res: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function alertOwnerNewLead(record: Record<string, unknown>, leadId: string) {
  const business = String(record.business ?? "Unknown business");
  const email = String(record.email ?? "—");
  const name = String(record.name ?? "—");
  const plan = String(record.inquiry_plan ?? "—");
  const city = [record.city, record.state].filter(Boolean).join(", ") || "—";
  const message = [
    `New scorecard request received`,
    `Plan: ${plan}`,
    `Business: ${business}`,
    `Contact: ${name} <${email}>`,
    `Location: ${city}`,
    `Lead ID: ${leadId}`,
    "",
    "GitHub Actions will build the scorecard, create portal login, and email the guest.",
  ].join("\n");

  const topic = (Deno.env.get("NTFY_TOPIC") || "Guest_Signal").trim();
  const server = (Deno.env.get("NTFY_SERVER_URL") || "https://ntfy.sh").replace(/\/+$/, "");
  try {
    const headers: Record<string, string> = {
      Title: `New scorecard request: ${business}`.slice(0, 120),
      Priority: "4",
      Tags: "inbox_tray,scorecard",
      "Content-Type": "text/plain",
    };
    const ntfyToken = Deno.env.get("NTFY_ACCESS_TOKEN")?.trim();
    if (ntfyToken) headers.Authorization = `Bearer ${ntfyToken}`;
    const ntfyRes = await fetch(`${server}/${topic}`, {
      method: "POST",
      headers,
      body: message,
    });
    if (!ntfyRes.ok) {
      console.warn("[github-dispatch-lead-intake] ntfy failed", ntfyRes.status, await ntfyRes.text());
    }
  } catch (err) {
    console.warn("[github-dispatch-lead-intake] ntfy error", err);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const ownerTo = (
    Deno.env.get("OWNER_REPORT_EMAIL_TO") ||
    Deno.env.get("LEAD_INTAKE_OWNER_EMAIL") ||
    "audit@guestsignalhospitality.com"
  ).trim();
  const from =
    Deno.env.get("RESEND_FROM")?.trim() ||
    "Guest Signal <audit@guestsignalhospitality.com>";
  if (resendKey && ownerTo) {
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: ownerTo.split(",").map((s) => s.trim()).filter(Boolean),
          subject: `[Guest Signal] New scorecard request — ${business}`,
          text: message,
        }),
      });
      if (!emailRes.ok) {
        console.warn(
          "[github-dispatch-lead-intake] owner email failed",
          emailRes.status,
          await emailRes.text(),
        );
      }
    } catch (err) {
      console.warn("[github-dispatch-lead-intake] owner email error", err);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.info("[github-dispatch-lead-intake] POST received");

  const secret = Deno.env.get("LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET");
  const token = Deno.env.get("GITHUB_DISPATCH_TOKEN");
  const repo =
    Deno.env.get("GITHUB_DISPATCH_REPOSITORY")?.trim() || DEFAULT_REPO;

  if (!secret || !token) {
    console.error("Missing LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET or GITHUB_DISPATCH_TOKEN");
    return json({ error: "function_not_configured" }, 500);
  }

  const headerSecret = req.headers.get("x-lead-intake-dispatch-secret");
  if (headerSecret !== secret) {
    console.warn("[github-dispatch-lead-intake] unauthorized: header secret mismatch");
    return json({ error: "unauthorized" }, 401);
  }
  console.info("[github-dispatch-lead-intake] shared secret OK");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Supabase Database Webhook shape: { type, table, record, schema, old_record }
  const record = (body.record ?? body) as Record<string, unknown> | null;
  if (!record || typeof record !== "object") {
    return json({ error: "missing_record", skipped: true }, 200);
  }

  const leadId = normalizeLeadId(record.id);
  const inquiryPlan =
    typeof record.inquiry_plan === "string" ? record.inquiry_plan : null;
  const status =
    typeof record.processing_status === "string"
      ? record.processing_status
      : null;

  if (!leadId) {
    console.warn("[github-dispatch-lead-intake] skip: missing or invalid record.id", {
      id_type: typeof record.id,
    });
    return json({ error: "missing_id", skipped: true }, 200);
  }

  if (!inquiryPlan || !SERVICE_PLANS.has(inquiryPlan)) {
    console.info("[github-dispatch-lead-intake] skip: not_service_plan", {
      inquiry_plan: inquiryPlan,
      lead_id: leadId,
    });
    return json(
      { skipped: true, reason: "not_service_plan", inquiry_plan: inquiryPlan },
      200,
    );
  }

  if (status && status !== "pending") {
    console.info("[github-dispatch-lead-intake] skip: not_pending", {
      processing_status: status,
      lead_id: leadId,
    });
    return json(
      { skipped: true, reason: "not_pending", processing_status: status },
      200,
    );
  }

  // Alert owner immediately (before GitHub) so a dispatch failure still surfaces the lead.
  await alertOwnerNewLead(record, leadId);

  console.info("[github-dispatch-lead-intake] dispatching to GitHub", {
    lead_id: leadId,
    inquiry_plan: inquiryPlan,
  });

  const ghRes = await fetch(
    `https://api.github.com/repos/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GuestSignal-Supabase-LeadIntake-Dispatch",
      },
      body: JSON.stringify({
        event_type: "lead_intake_process",
        client_payload: { lead_id: leadId },
      }),
    },
  );

  if (!ghRes.ok) {
    const text = await ghRes.text();
    console.error("[github-dispatch-lead-intake] GitHub dispatches failed:", ghRes.status, text);
    return json(
      { error: "github_dispatch_failed", status: ghRes.status, detail: text },
      502,
    );
  }

  console.info("[github-dispatch-lead-intake] repository_dispatch ok", {
    lead_id: leadId,
    repository: repo,
  });
  return json({ ok: true, lead_id: leadId, repository: repo }, 200);
});
