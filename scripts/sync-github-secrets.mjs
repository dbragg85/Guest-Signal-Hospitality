#!/usr/bin/env node
/**
 * Pushes sensitive values from .env.local into GitHub Actions **Secrets** via the `gh` CLI.
 *
 * Prerequisites:
 *   - Install GitHub CLI: https://cli.github.com/
 *   - Run `gh auth login` with a token that can write secrets to this repo.
 *
 * Usage (from repo root):
 *   npm run sync:github-secrets
 *
 * Never commit .env.local. Secrets are not readable from GitHub after upload.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const SECRET_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "APIFY_TOKEN",
  "LEAD_INTAKE_SUCCESS_WEBHOOK_URL",
  "RESEND_API_KEY",
];

function loadLines() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local — run: npm run setup:env then fill in secrets.");
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, "utf8");
  return raw.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
}

function get(lines, name) {
  const line = lines.find((l) => l.startsWith(`${name}=`));
  if (!line) return "";
  return line.split("=").slice(1).join("=").trim();
}

function isPlaceholder(v) {
  const s = String(v).trim();
  if (!s) return true;
  if (/your-(service-role|apify|anon)/i.test(s)) return true;
  if (s.includes("<project-ref>")) return true;
  if (s.includes("your-apify-token")) return true;
  return false;
}

function ghOk() {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "pipe", cwd: root });
    return true;
  } catch {
    return false;
  }
}

if (!ghOk()) {
  console.error(
    "GitHub CLI (`gh`) is not installed or not authenticated.\n" +
      "Install: https://cli.github.com/  then run: gh auth login"
  );
  process.exit(1);
}

const lines = loadLines();
let any = false;

for (const name of SECRET_NAMES) {
  const value = get(lines, name);
  if (isPlaceholder(value)) {
    console.log(`Skip ${name} (missing or still a placeholder in .env.local).`);
    continue;
  }
  try {
    execFileSync("gh", ["secret", "set", name, "-b", value], { stdio: "inherit", cwd: root });
    console.log(`Set secret: ${name}`);
    any = true;
  } catch (e) {
    console.error(`Failed to set ${name}:`, e?.message || e);
    process.exit(1);
  }
}

if (!any) {
  console.log("\nNo secrets were uploaded. Add real values to .env.local for the names above, then re-run.");
  process.exit(0);
}

console.log("\nDone. Open GitHub → Settings → Secrets and variables → Actions to verify.");
