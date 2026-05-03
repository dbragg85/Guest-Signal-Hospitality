#!/usr/bin/env node
/**
 * POST a Database Webhook–shaped payload to the Edge Function `github-dispatch-lead-intake`
 * (same path production uses). Verifies LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET + function secrets
 * and that GitHub dispatch returns 200 from the function.
 *
 * Env (.env.local):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL — project URL (https://<ref>.supabase.co)
 *   LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET — same value as webhook header x-lead-intake-dispatch-secret
 *   SUPABASE_SERVICE_ROLE_KEY — to load the latest pending lead (or pass a UUID argv)
 *
 * Usage:
 *   npm run test:lead-intake-webhook
 *   npm run test:lead-intake-webhook -- <lead_uuid>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const SERVICE_PLANS = [
  "free_snapshot",
  "signal_monitor",
  "signal_growth",
  "signal_elevate",
];

function loadDotEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function fetchLatestPendingRecord(baseUrl, serviceKey) {
  const root = baseUrl.replace(/\/+$/, "");
  const inFilter = `in.(${SERVICE_PLANS.join(",")})`;
  const q = [
    "select=id,inquiry_plan,processing_status",
    "processing_status=eq.pending",
    `inquiry_plan=${inFilter}`,
    "order=created_at.desc",
    "limit=1",
  ].join("&");
  const res = await fetch(`${root}/rest/v1/lead_intake_submissions?${q}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST ${res.status}: ${text.slice(0, 500)}`);
  }
  const body = await res.json();
  return Array.isArray(body) ? body[0] ?? null : body;
}

loadDotEnvLocal();

const base =
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const secret = (process.env.LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET || "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const argId = process.argv[2]?.trim();
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!base || !secret || !serviceKey) {
  console.error(
    "Need SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET, and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(2);
}

let record;
if (argId && uuidRe.test(argId)) {
  record = { id: argId, inquiry_plan: "free_snapshot", processing_status: "pending" };
  console.log("Using lead id from argv:", argId);
} else {
  record = await fetchLatestPendingRecord(base, serviceKey);
  if (!record?.id) {
    console.error(
      "No pending service-tier lead found. Submit from /services/inquiry/?plan=free_snapshot or pass a UUID:\n" +
        "  npm run test:lead-intake-webhook -- <lead_uuid>",
    );
    process.exit(1);
  }
  console.log("Using latest pending lead:", record.id, record.inquiry_plan);
}

const url = `${base}/functions/v1/github-dispatch-lead-intake`;
const payload = {
  type: "INSERT",
  table: "lead_intake_submissions",
  schema: "public",
  record,
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-lead-intake-dispatch-secret": secret,
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text.slice(0, 800) };
}

console.log("HTTP", res.status);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) {
  process.exit(1);
}
if (json.ok === true) {
    console.log(
    "\nOpen GitHub Actions → Process lead intake snapshots — expect a new `lead_intake_process` run.\n" +
      "If unauthorized: match LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET to the Database Webhook header `x-lead-intake-dispatch-secret`.\n" +
      "If function_not_configured: set Edge secrets GITHUB_DISPATCH_TOKEN + LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET.",
  );
  process.exit(0);
}

if (json.skipped) {
  console.error(
    "\nEdge skipped dispatch:",
    json.reason || json,
    "\nUse a row with inquiry_plan in free_snapshot|signal_* and processing_status=pending.",
  );
  process.exit(1);
}

if (json.error) {
  console.error("\nEdge returned error:", json.error, json.detail || "");
  process.exit(1);
}

console.error("\nUnexpected response body.");
process.exit(1);
