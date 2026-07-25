import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "function_not_configured" }, 500);
  }

  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
    return json({ error: "invalid_token" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const { data: actionRow, error: actionError } = await admin
    .from("prospect_approval_actions")
    .select("id,prospect_id,action")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();
  if (actionError) return json({ error: "lookup_failed" }, 500);
  if (!actionRow) return json({ error: "expired_or_used" }, 410);

  const update =
    actionRow.action === "approve"
      ? { status: "approved", approved_at: now }
      : { status: "dismissed", send_status: "not_ready", send_error: null };
  const { data: prospect, error: decisionError } = await admin
    .from("prospect_queue")
    .update(update)
    .eq("id", actionRow.prospect_id)
    .eq("status", "approval_required")
    .select("id,business_name,status")
    .maybeSingle();
  if (decisionError) return json({ error: "decision_failed" }, 500);

  await admin
    .from("prospect_approval_actions")
    .update({ used_at: now })
    .eq("prospect_id", actionRow.prospect_id)
    .is("used_at", null);

  if (!prospect) {
    return json({ error: "already_decided" }, 409);
  }
  return json({
    ok: true,
    decision: actionRow.action,
    business_name: prospect.business_name,
    portal: "https://guestsignalhospitality.com/portal/dashboard/",
  });
});
