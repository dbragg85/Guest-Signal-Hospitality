import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.69.0";

const TRACKED_EVENTS = new Set([
  "email.sent",
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
]);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "function_not_configured" }, 500);
  }

  const rawBody = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: Record<string, unknown>;
  try {
    event = new Webhook(secret).verify(rawBody, headers) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_signature" }, 401);
  }

  const eventType = typeof event.type === "string" ? event.type : "";
  if (!TRACKED_EVENTS.has(eventType)) return json({ ok: true, ignored: true });
  const data =
    event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : {};
  const emailId = typeof data.email_id === "string" ? data.email_id : "";
  if (!emailId) return json({ error: "missing_email_id" }, 400);
  const click =
    data.click && typeof data.click === "object"
      ? (data.click as Record<string, unknown>)
      : {};
  const linkUrl = typeof click.link === "string" ? click.link : null;
  const occurredAt =
    typeof event.created_at === "string"
      ? event.created_at
      : new Date().toISOString();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: matched, error } = await admin.rpc(
    "record_prospect_email_event",
    {
      p_resend_event_id: headers["svix-id"],
      p_email_id: emailId,
      p_event_type: eventType,
      p_occurred_at: occurredAt,
      p_link_url: linkUrl,
    },
  );
  if (error) return json({ error: "event_record_failed" }, 500);
  return json({ ok: true, matched });
});
