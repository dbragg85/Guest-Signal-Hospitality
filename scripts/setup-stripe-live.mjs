#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key?.startsWith("sk_live_")) {
  console.error("STRIPE_SECRET_KEY must be a live secret key.");
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function stripe(method, path, body) {
  const encoded = body
    ? body instanceof Array
      ? new URLSearchParams(body)
      : new URLSearchParams(body)
    : undefined;
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encoded,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe ${method} ${path}: ${json?.error?.message || response.status}`);
  }
  return json;
}

run("npx", [
  "supabase",
  "secrets",
  "set",
  `STRIPE_SECRET_KEY=${key}`,
  "SITE_ORIGIN=https://guestsignalhospitality.com",
  "--project-ref",
  "sqsleiwtacqiweyfacmj",
]);
console.log("Supabase STRIPE_SECRET_KEY set");

const plans = [
  ["signal_monitor", "Signal Monitor", 14900, "STRIPE_PRICE_SIGNAL_MONITOR"],
  ["signal_growth", "Signal Growth", 49900, "STRIPE_PRICE_SIGNAL_GROWTH"],
  ["signal_elevate", "Signal Elevate", 99900, "STRIPE_PRICE_SIGNAL_ELEVATE"],
];

const priceSecrets = {};
for (const [planKey, name, amount, envName] of plans) {
  const existing = await stripe(
    "GET",
    `/products/search?query=${encodeURIComponent(`metadata['plan_key']:'${planKey}'`)}`,
  );
  const product = existing.data?.[0]
    ? existing.data[0]
    : await stripe("POST", "/products", {
        name,
        description: `Guest Signal Hospitality ${name} monthly plan`,
        "metadata[plan_key]": planKey,
      });
  console.log(`${existing.data?.[0] ? "Using" : "Created"} product for ${planKey}`);

  const prices = await stripe("GET", `/prices?product=${product.id}&active=true&limit=10`);
  let monthly = (prices.data || []).find(
    (price) => price.recurring?.interval === "month" && price.unit_amount === amount,
  );
  if (!monthly) {
    monthly = await stripe("POST", "/prices", {
      product: product.id,
      unit_amount: String(amount),
      currency: "usd",
      "recurring[interval]": "month",
      "metadata[plan_key]": planKey,
    });
    console.log(`Created price for ${planKey}`);
  } else {
    console.log(`Using existing price for ${planKey}`);
  }
  priceSecrets[envName] = monthly.id;
}

const webhookUrl =
  "https://sqsleiwtacqiweyfacmj.supabase.co/functions/v1/stripe-webhook";
const hooks = await stripe("GET", "/webhook_endpoints?limit=100");
let webhookSecret = null;
const existingHook = (hooks.data || []).find((hook) => hook.url === webhookUrl);
if (existingHook) {
  console.log("Webhook endpoint already exists");
} else {
  const created = await stripe("POST", "/webhook_endpoints", [
    ["url", webhookUrl],
    ["enabled_events[]", "checkout.session.completed"],
    ["description", "Guest Signal paid plan conversions"],
  ]);
  // URLSearchParams from array of pairs
  webhookSecret = created.secret;
  console.log("Webhook endpoint created");
}

const secretArgs = ["supabase", "secrets", "set"];
for (const [name, value] of Object.entries(priceSecrets)) {
  secretArgs.push(`${name}=${value}`);
}
if (webhookSecret) secretArgs.push(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
secretArgs.push("--project-ref", "sqsleiwtacqiweyfacmj");
run("npx", secretArgs);
console.log("Price IDs saved");
console.log(
  webhookSecret
    ? "Webhook secret saved"
    : "Set STRIPE_WEBHOOK_SECRET from Stripe dashboard for the existing webhook",
);

const session = await stripe("POST", "/checkout/sessions", {
  mode: "subscription",
  success_url:
    "https://guestsignalhospitality.com/services/?checkout=success&plan=signal_monitor",
  cancel_url:
    "https://guestsignalhospitality.com/services/?checkout=cancelled&plan=signal_monitor",
  "line_items[0][price]": priceSecrets.STRIPE_PRICE_SIGNAL_MONITOR,
  "line_items[0][quantity]": "1",
  "metadata[plan_key]": "signal_monitor",
  client_reference_id: "signal_monitor",
});
console.log("Checkout smoke OK", Boolean(session.url));
