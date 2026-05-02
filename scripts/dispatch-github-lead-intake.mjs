#!/usr/bin/env node
/**
 * Triggers GitHub Actions "Process lead intake snapshots" via repository_dispatch.
 *
 * Easiest path (no Supabase Edge Function):
 *   1. GitHub → Settings → Developer settings → Personal access tokens → generate
 *      (classic: enable "repo", or fine-grained: Contents read/write on this repo).
 *   2. Add to .env.local (never commit):
 *        GITHUB_DISPATCH_TOKEN=github_pat_...   or   ghp_...
 *      Optional:
 *        GITHUB_DISPATCH_REPOSITORY=owner/repo   (default: dbragg85/Guest-Signal-Hospitality)
 *   3. Run:
 *        npm run dispatch:lead-intake              → run workflow (processes pending queue)
 *        npm run dispatch:lead-intake -- --latest → same but passes newest pending row id
 *
 * If GITHUB_DISPATCH_TOKEN is unset, tries `gh auth token` (requires `gh auth login` and
 * a token with permission to call repository_dispatch on the repo).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_REPO = "dbragg85/Guest-Signal-Hospitality";
const SERVICE_PLANS = [
  "free_snapshot",
  "signal_monitor",
  "signal_growth",
  "signal_elevate",
];

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function tokenFromGhCli() {
  try {
    return execSync("gh auth token", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

async function fetchLatestPendingLeadId(baseUrl, serviceKey) {
  const root = baseUrl.replace(/\/+$/, "");
  const inFilter = `in.(${SERVICE_PLANS.join(",")})`;
  const q = [
    "select=id",
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
    console.error("Supabase REST error:", res.status, text);
    process.exit(1);
  }
  const body = await res.json();
  if (body && typeof body === "object" && "id" in body) return body.id;
  if (Array.isArray(body) && body[0]?.id) return body[0].id;
  return null;
}

async function main() {
  const fileEnv = loadEnvLocal();
  const env = (k) => process.env[k] || fileEnv[k] || "";

  const args = process.argv.slice(2);
  const wantLatest = args.includes("--latest");
  let leadId = args.find((a) => a !== "--latest" && /^[0-9a-f-]{36}$/i.test(a));

  const token = env("GITHUB_DISPATCH_TOKEN").trim() || tokenFromGhCli();
  if (!token) {
    console.error(
      "No GitHub token. Either add GITHUB_DISPATCH_TOKEN to .env.local (see .env.local.example),\n" +
        "or run: gh auth login   (then this script will use `gh auth token`).",
    );
    process.exit(1);
  }

  const repo = (env("GITHUB_DISPATCH_REPOSITORY") || DEFAULT_REPO).replace(
    /^\/+|\/+$/g,
    "",
  );
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    console.error(
      `Invalid GITHUB_DISPATCH_REPOSITORY="${repo}" — expected owner/repo`,
    );
    process.exit(1);
  }

  if (wantLatest && !leadId) {
    const url = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.error(
        "For --latest, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (same as lead intake pipeline).",
      );
      process.exit(1);
    }
    leadId = await fetchLatestPendingLeadId(url, serviceKey);
    if (!leadId) {
      console.error(
        "No pending service-tier row found in lead_intake_submissions (check plan + processing_status in Supabase).",
      );
      process.exit(1);
    }
    console.log("Using latest pending lead_id:", leadId);
  }

  const clientPayload =
    leadId && typeof leadId === "string"
      ? { lead_id: leadId }
      : {};

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GuestSignal-dispatch-github-lead-intake",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "lead_intake_process",
        client_payload: clientPayload,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`GitHub returned ${res.status}:`, text);
    if (res.status === 404) {
      console.error(
        "\nCheck GITHUB_DISPATCH_REPOSITORY and that the token can access that repo.",
      );
    }
    if (res.status === 403 || res.status === 401) {
      console.error(
        "\nToken lacks permission for repository_dispatch. Use a classic PAT with `repo`, or fine-grained with Contents: Read and write.",
      );
    }
    process.exit(1);
  }

  console.log(
    "Dispatched workflow: Process lead intake snapshots. Open:\n" +
      `  https://github.com/${owner}/${repoName}/actions/workflows/lead-intake-snapshot.yml`,
  );
  if (leadId) {
    console.log(`  (with LEAD_INTAKE_ID=${leadId})`);
  } else {
    console.log("  (workflow will pick up all pending service-tier rows)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
