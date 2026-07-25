import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN =
  Deno.env.get("SITE_ORIGIN")?.replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

const PLAN_PRICES: Record<string, { envKey: string; name: string; amount: number }> = {
  signal_monitor: {
    envKey: "STRIPE_PRICE_SIGNAL_MONITOR",
    name: "Signal Monitor",
    amount: 14900,
  },
  signal_growth: {
    envKey: "STRIPE_PRICE_SIGNAL_GROWTH",
    name: "Signal Growth",
    amount: 49900,
  },
  signal_elevate: {
    envKey: "STRIPE_PRICE_SIGNAL_ELEVATE",
    name: "Signal Elevate",
    amount: 99900,
  },
};

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    origin === SITE_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin)
      ? origin
      : SITE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!stripeKey) return json(req, { error: "stripe_not_configured" }, 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid_json" }, 400);
  }

  const planKey = String(body.planKey ?? "").trim();
  const plan = PLAN_PRICES[planKey];
  if (!plan) return json(req, { error: "invalid_plan" }, 400);

  const email = String(body.email ?? "").trim().toLowerCase();
  const restaurantName = String(body.restaurantName ?? "").trim().slice(0, 200);
  const priceId = Deno.env.get(plan.envKey)?.trim();

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${SITE_ORIGIN}/services/?checkout=success&plan=${planKey}`);
  params.set("cancel_url", `${SITE_ORIGIN}/services/?checkout=cancelled&plan=${planKey}`);
  params.set("allow_promotion_codes", "true");
  params.set("automatic_tax[enabled]", "false");
  params.set("managed_payments[enabled]", "false");
  params.set("client_reference_id", planKey);
  params.set("metadata[plan_key]", planKey);
  if (restaurantName) params.set("metadata[restaurant_name]", restaurantName);
  if (email) {
    params.set("customer_email", email);
    params.set("metadata[customer_email]", email);
  }

  if (priceId) {
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
  } else {
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(plan.amount));
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("line_items[0][price_data][product_data][name]", plan.name);
    params.set(
      "line_items[0][price_data][product_data][description]",
      "Guest Signal Hospitality monthly plan",
    );
    params.set(
      "line_items[0][price_data][product_data][tax_code]",
      "txcd_10103001",
    );
    params.set("line_items[0][quantity]", "1");
  }

  const introCoupon = Deno.env.get("STRIPE_INTRO_COUPON_ID")?.trim();
  if (introCoupon) params.set("discounts[0][coupon]", introCoupon);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json();
  if (!response.ok) {
    return json(
      req,
      {
        error: "stripe_session_failed",
        detail: String(payload?.error?.message ?? "unknown"),
      },
      502,
    );
  }

  return json(req, { url: payload.url, id: payload.id });
});
