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

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

let bad = false;
if (!url || url.includes("your-project")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.");
  bad = true;
}
if (!key || key.includes("your-anon")) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder.");
  bad = true;
}

if (bad) {
  console.error("\nEdit .env.local with values from Supabase → Project Settings → API.");
  process.exit(1);
}

console.log("Environment looks configured for local dev.");
process.exit(0);
