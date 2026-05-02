#!/usr/bin/env node
/**
 * Verifies anonymous inserts into public.lead_intake_submissions (browser / intake form path).
 * Loads NEXT_PUBLIC_SUPABASE_* from .env.local (or process.env). Exits 0 on 201, non-zero otherwise.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

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

loadDotEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local or env).");
  process.exit(2);
}

const body = {
  inquiry_plan: "free_snapshot",
  name: "Smoke Test",
  email: "smoke-lead-intake@example.com",
  business: "Smoke Biz",
  submission_client_key: crypto.randomUUID(),
};

const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/lead_intake_submissions`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (res.status === 201) {
  console.log("smoke: anon INSERT ok (201)");
  process.exit(0);
}

console.error(`smoke: anon INSERT failed HTTP ${res.status}`);
try {
  console.error(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.error(text.slice(0, 500));
}
console.error(
  "\nIf code is 42501 (RLS), apply migration 018_lead_intake_anon_insert_repair.sql to this Supabase project (CLI db push or SQL Editor), then re-run.",
);
process.exit(1);
