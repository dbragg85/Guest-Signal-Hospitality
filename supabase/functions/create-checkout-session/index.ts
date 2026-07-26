import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN =
  Deno.env.get("SITE_ORIGIN")?.replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

const IS_PRODUCTION = SITE_ORIGIN.includes("guestsignalhospitality.com");

/** Stripe promotion codes cannot include "#". Market as GUEST#1; code is GUEST1. */
const FOUNDING_PROMO_CODE = "GUEST1";
const FOUNDING_MAX_REDEMPTIONS = 100;

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    origin === SITE_ORIGIN ||
    (!IS_PRODUCTION && /^http:\/\/localhost:\d+$/.test(origin))
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

async function stripeForm(
  stripeKey: string,
  method: string,
  path: string,
  body?: URLSearchParams | Record<string, string>,
) {
  const encoded =
    body instanceof URLSearchParams
      ? body
      : body
        ? new URLSearchParams(body)
        : undefined;
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encoded,
  });
  const payload = await response.json();
  return { ok: response.ok, status: response.status, payload };
}

/** Ensure GUEST1 exists: $50 off Monitor for 3 months, max 100 redemptions. */
async function ensureFoundingPromoId(
  stripeKey: string,
): Promise<{ promoId: string | null; error?: string; couponId?: string }> {
  const listed = await stripeForm(
    stripeKey,
    "GET",
    `/promotion_codes?code=${encodeURIComponent(FOUNDING_PROMO_CODE)}&limit=5`,
  );
  if (!listed.ok) {
    return {
      promoId: null,
      error: `list_promo: ${listed.payload?.error?.message || listed.status}`,
    };
  }

  const codes = Array.isArray(listed.payload?.data) ? listed.payload.data : [];
  const usable = codes.find(
    (row: { id?: string; active?: boolean; times_redeemed?: number; max_redemptions?: number | null }) =>
      row?.active !== false &&
      !(
        typeof row.times_redeemed === "number" &&
        typeof row.max_redemptions === "number" &&
        row.times_redeemed >= row.max_redemptions
      ),
  );
  if (usable?.id) {
    const couponRef = (usable as { coupon?: string | { id?: string } }).coupon;
    const existingCouponId =
      typeof couponRef === "string" ? couponRef : couponRef?.id;
    return { promoId: String(usable.id), couponId: existingCouponId };
  }

  if (codes.length > 0) {
    return { promoId: null, error: "GUEST1 exists but is exhausted or inactive" };
  }

  const coupon = await stripeForm(stripeKey, "POST", "/coupons", {
    id: "guest1_founding_monitor_99",
    name: "GUEST1 founding Monitor 99 for 3 months",
    amount_off: "5000",
    currency: "usd",
    duration: "repeating",
    duration_in_months: "3",
    "metadata[campaign]": "GUEST1_founding",
    "metadata[brand_code]": "GUEST1",
  });

  let couponId = coupon.payload?.id ? String(coupon.payload.id) : "";
  if (!coupon.ok) {
    // Idempotent: coupon id may already exist
    const msg = String(coupon.payload?.error?.message || "");
    if (msg.toLowerCase().includes("already") || coupon.payload?.error?.code === "resource_already_exists") {
      couponId = "guest1_founding_monitor_99";
    } else {
      return { promoId: null, error: `coupon_create: ${msg || coupon.status}` };
    }
  }

  // Newer Stripe API versions expect promotion[type]/promotion[coupon]
  // instead of a top-level `coupon` field.
  const promo = await stripeForm(stripeKey, "POST", "/promotion_codes", {
    "promotion[type]": "coupon",
    "promotion[coupon]": couponId,
    code: FOUNDING_PROMO_CODE,
    max_redemptions: String(FOUNDING_MAX_REDEMPTIONS),
    "metadata[campaign]": "GUEST1_founding",
    "metadata[brand_code]": "GUEST1",
  });
  if (!promo.ok || !promo.payload?.id) {
    // Fallback: apply coupon id directly at checkout even if code creation fails
    const err = String(promo.payload?.error?.message || promo.status);
    return { promoId: null, couponId, error: `promo_create: ${err}` };
  }
  return { promoId: String(promo.payload.id), couponId };
}

const MAX_REQUEST_SIZE = 65536; // 64KB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    return json(req, { error: "payload_too_large" }, 413);
  }

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
  if (email && !EMAIL_REGEX.test(email)) {
    return json(req, { error: "invalid_email" }, 400);
  }
  const restaurantName = String(body.restaurantName ?? "")
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, 200);
  const priceId = Deno.env.get(plan.envKey)?.trim();
  const wantFounding =
    planKey === "signal_monitor" &&
    body.applyFoundingPromo !== false &&
    Deno.env.get("FOUNDING_PROMO_DISABLED") !== "1";

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${SITE_ORIGIN}/services/?checkout=success&plan=${planKey}`);
  params.set("cancel_url", `${SITE_ORIGIN}/services/?checkout=cancelled&plan=${planKey}`);
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

  let appliedPromo: string | null = null;
  let foundingPromoError: string | undefined;
  if (wantFounding) {
    const ensured = await ensureFoundingPromoId(stripeKey);
    foundingPromoError = ensured.error;
    if (ensured.promoId) {
      params.set("discounts[0][promotion_code]", ensured.promoId);
      params.set("metadata[founding_promo]", FOUNDING_PROMO_CODE);
      appliedPromo = ensured.promoId;
    } else if (ensured.couponId) {
      // Fallback: apply coupon even if promotion code creation failed
      params.set("discounts[0][coupon]", ensured.couponId);
      params.set("metadata[founding_promo]", FOUNDING_PROMO_CODE);
      appliedPromo = ensured.couponId;
    }
  }

  // Stripe forbids allow_promotion_codes together with discounts[]
  if (!appliedPromo) {
    const introCoupon = Deno.env.get("STRIPE_INTRO_COUPON_ID")?.trim();
    if (introCoupon && planKey === "signal_monitor") {
      params.set("discounts[0][coupon]", introCoupon);
    } else {
      params.set("allow_promotion_codes", "true");
    }
  }

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
    console.error("[create-checkout-session] Stripe error:", payload?.error?.message ?? "unknown");
    return json(req, { error: "stripe_session_failed" }, 502);
  }

  return json(req, {
    url: payload.url,
    id: payload.id,
    foundingPromoApplied: Boolean(appliedPromo),
    ...(foundingPromoError ? { foundingPromoError } : {}),
  });
});
