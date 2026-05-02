/**
 * Called by Supabase Database Webhooks on INSERT into public.lead_intake_submissions.
 * Dispatches GitHub repository_dispatch so "Process lead intake snapshots" runs for that lead_id.
 *
 * Secrets (supabase secrets set --project-ref ...):
 *   GITHUB_DISPATCH_TOKEN — classic PAT with `repo` scope, or fine-grained with Contents: Read/Write
 *   LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET — shared secret; same value in webhook HTTP header below
 *
 * Optional:
 *   GITHUB_DISPATCH_REPOSITORY — default dbragg85/Guest-Signal-Hospitality
 *
 * Webhook (Dashboard → Database → Webhooks):
 *   Table: public.lead_intake_submissions, Events: INSERT
 *   HTTP POST URL: https://<project-ref>.supabase.co/functions/v1/github-dispatch-lead-intake
 *   Headers:
 *     Authorization: Bearer <anon or service_role key>  (only if verify_jwt true; we use verify_jwt false + custom header)
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

function json(res: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

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
    return json({ error: "unauthorized" }, 401);
  }

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

  const leadId = typeof record.id === "string" ? record.id : null;
  const inquiryPlan =
    typeof record.inquiry_plan === "string" ? record.inquiry_plan : null;
  const status =
    typeof record.processing_status === "string"
      ? record.processing_status
      : null;

  if (!leadId) {
    return json({ error: "missing_id", skipped: true }, 200);
  }

  if (!inquiryPlan || !SERVICE_PLANS.has(inquiryPlan)) {
    return json(
      { skipped: true, reason: "not_service_plan", inquiry_plan: inquiryPlan },
      200,
    );
  }

  if (status && status !== "pending") {
    return json(
      { skipped: true, reason: "not_pending", processing_status: status },
      200,
    );
  }

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
    console.error("GitHub dispatches failed:", ghRes.status, text);
    return json(
      { error: "github_dispatch_failed", status: ghRes.status, detail: text },
      502,
    );
  }

  return json({ ok: true, lead_id: leadId, repository: repo }, 200);
});
