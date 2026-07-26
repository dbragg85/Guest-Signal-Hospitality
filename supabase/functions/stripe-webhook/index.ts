import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLAN_VALUES: Record<string, number> = {
  signal_monitor: 14900,
  signal_growth: 49900,
  signal_elevate: 99900,
};

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [k, v] = piece.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return timingSafeEqual(expected, signature);
}

const MAX_REQUEST_SIZE = 65536; // 64KB

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    return new Response(JSON.stringify({ error: "payload_too_large" }), { status: 413 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "function_not_configured" }), { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
  }

  const session = (event.data as { object?: Record<string, unknown> })?.object ?? {};
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const planKey = String(metadata.plan_key || session.client_reference_id || "").trim();
  if (!PLAN_VALUES[planKey]) {
    return new Response(JSON.stringify({ ok: true, ignored: "unknown_plan" }), { status: 200 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();
  const checkoutId = typeof session.id === "string" ? session.id : null;
  const customerEmail =
    typeof session.customer_details === "object" &&
    session.customer_details &&
    typeof (session.customer_details as { email?: string }).email === "string"
      ? (session.customer_details as { email: string }).email
      : typeof session.customer_email === "string"
        ? session.customer_email
        : metadata.customer_email ?? null;

  const row = {
    stage: "won",
    plan_key: planKey,
    monthly_value_cents: PLAN_VALUES[planKey],
    is_test: String(session.livemode) === "false",
    won_at: now,
    updated_at: now,
    stripe_checkout_session_id: checkoutId,
    stripe_customer_id:
      typeof session.customer === "string" ? session.customer : null,
    stripe_subscription_id:
      typeof session.subscription === "string" ? session.subscription : null,
    customer_email: customerEmail,
    notes: `Stripe checkout completed for ${planKey}`,
  };

  if (checkoutId) {
    const { data: existing } = await admin
      .from("sales_opportunities")
      .select("id")
      .eq("stripe_checkout_session_id", checkoutId)
      .maybeSingle();
    if (existing) {
      await admin.from("sales_opportunities").update(row).eq("id", existing.id);
    } else {
      await admin.from("sales_opportunities").insert(row);
    }
  } else {
    await admin.from("sales_opportunities").insert(row);
  }

  // Mark active goal achieved when target is met.
  const { data: goals } = await admin
    .from("growth_goals")
    .select("id,target_conversions,starts_at,ends_at,plan_keys")
    .eq("status", "active");
  for (const goal of goals ?? []) {
    const { count } = await admin
      .from("sales_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("stage", "won")
      .eq("is_test", false)
      .gte("won_at", goal.starts_at)
      .lte("won_at", goal.ends_at)
      .in("plan_key", goal.plan_keys ?? ["signal_monitor", "signal_growth", "signal_elevate"]);
    if ((count ?? 0) >= goal.target_conversions) {
      await admin
        .from("growth_goals")
        .update({ status: "achieved", updated_at: now })
        .eq("id", goal.id);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
