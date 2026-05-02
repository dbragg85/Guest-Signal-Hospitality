#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local — run: npm run setup:env");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));

function get(name) {
  const line = lines.find((l) => l.startsWith(`${name}=`));
  if (!line) return "";
  return line.split("=").slice(1).join("=").trim();
}

/** Returns JWT payload.role if decodable, else null. */
function jwtRole(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = Buffer.from(b64 + pad, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

let bad = false;
if (!url || url.includes("your-project") || url.includes("<project-ref>")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder (e.g. <project-ref>).",
  );
  console.error("Set it to the same URL as SUPABASE_URL, e.g. https://xxxxx.supabase.co");
  bad = true;
}
if (!key || key.includes("your-anon")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder (your-anon-key).",
  );
  console.error(
    "Supabase → Project Settings → API → copy the long key labeled **anon** **public** (not service_role).",
  );
  bad = true;
} else if (jwtRole(key) === "service_role") {
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY looks like the **service_role** JWT (dangerous in the browser).",
  );
  console.error(
    "Replace it with the **anon** **public** key from the same Supabase API page. Keep service_role only in SUPABASE_SERVICE_ROLE_KEY.",
  );
  bad = true;
}

if (bad) {
  console.error("\nEdit .env.local with values from Supabase → Project Settings → API.");
  process.exit(1);
}

console.log("Environment looks configured for local dev.");
process.exit(0);
