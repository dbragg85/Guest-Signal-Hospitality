import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function applyIntervention(
  admin: ReturnType<typeof createClient>,
  intervention: { id: string; kind: string; payload: Record<string, unknown> },
) {
  if (intervention.kind === "checkout_intro_offer") {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY missing");
    const percentOff = Number(intervention.payload.percent_off ?? 20);
    const params = new URLSearchParams();
    params.set("percent_off", String(percentOff));
    params.set("duration", "once");
    params.set("name", "Guest Signal intro offer");
    const response = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error?.message || "coupon_create_failed");
    }
    // Persist coupon id into function secrets is not possible from here; store on intervention.
    await admin
      .from("growth_interventions")
      .update({
        payload: { ...intervention.payload, stripe_coupon_id: body.id },
        apply_result: `Created Stripe coupon ${body.id} (${percentOff}% off first invoice). Set STRIPE_INTRO_COUPON_ID=${body.id} on the create-checkout-session function to activate.`,
      })
      .eq("id", intervention.id);
    return `Coupon ${body.id} created. Activate by setting STRIPE_INTRO_COUPON_ID.`;
  }

  if (intervention.kind === "prospect_outreach_push") {
    return "Approved. Run Research Cincinnati prospects with enrich_emails_only=false to push more drafts to ntfy.";
  }

  if (
    intervention.kind === "homepage_cta_push" ||
    intervention.kind === "snapshot_cta_push"
  ) {
    return "Approved. Operator may apply bounded website CTA copy in the next Codex/operator pass.";
  }

  return "Approved with no automatic side effect.";
}

const MAX_REQUEST_SIZE = 8192; // 8KB - smaller for action endpoints

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    return json({ error: "payload_too_large" }, 413);
  }

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
    .from("growth_intervention_actions")
    .select("id,intervention_id,action")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();
  if (actionError) return json({ error: "lookup_failed" }, 500);
  if (!actionRow) return json({ error: "expired_or_used" }, 410);

  const { data: intervention, error: interventionError } = await admin
    .from("growth_interventions")
    .select("id,kind,title,payload,status")
    .eq("id", actionRow.intervention_id)
    .eq("status", "proposed")
    .maybeSingle();
  if (interventionError) return json({ error: "intervention_lookup_failed" }, 500);
  if (!intervention) return json({ error: "already_decided" }, 409);

  await admin
    .from("growth_intervention_actions")
    .update({ used_at: now })
    .eq("intervention_id", intervention.id)
    .is("used_at", null);

  if (actionRow.action === "deny") {
    await admin
      .from("growth_interventions")
      .update({ status: "denied", denied_at: now, updated_at: now })
      .eq("id", intervention.id);
    return json({ ok: true, decision: "deny", title: intervention.title });
  }

  await admin
    .from("growth_interventions")
    .update({ status: "approved", approved_at: now, updated_at: now })
    .eq("id", intervention.id);

  try {
    const result = await applyIntervention(admin, {
      id: intervention.id,
      kind: intervention.kind,
      payload: (intervention.payload ?? {}) as Record<string, unknown>,
    });
    await admin
      .from("growth_interventions")
      .update({
        status: "applied",
        applied_at: now,
        updated_at: now,
        apply_result: result,
      })
      .eq("id", intervention.id);
    return json({
      ok: true,
      decision: "approve",
      title: intervention.title,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[growth-intervention-action] Apply failed:", message);
    await admin
      .from("growth_interventions")
      .update({
        status: "approved",
        updated_at: now,
        apply_result: `Apply failed: ${message.slice(0, 500)}`,
      })
      .eq("id", intervention.id);
    return json({
      ok: true,
      decision: "approve",
      apply_failed: true,
    });
  }
});
