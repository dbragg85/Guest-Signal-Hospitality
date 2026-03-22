#!/usr/bin/env node
/**
 * Upserts NEXT_PUBLIC_SUPABASE_* from .env.local into GitHub Actions repository Variables.
 * Requires: GITHUB_TOKEN or GH_TOKEN with repo scope (classic PAT) or a fine-grained token
 * with "Variables" read/write on this repository.
 *
 * Usage: npm run sync:github-vars
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error(
    "Set GITHUB_TOKEN (or GH_TOKEN) to a PAT with access to repo Actions variables.\n" +
      "Create: GitHub → Settings → Developer settings → Personal access tokens."
  );
  process.exit(1);
}

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

if (!url || url.includes("your-project")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder in .env.local.");
  process.exit(1);
}
if (!key || key.includes("your-anon")) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder in .env.local.");
  process.exit(1);
}

let owner;
let repo;
try {
  const remote = execSync("git remote get-url origin", {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
  }).trim();
  const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/i);
  if (!m) throw new Error("Could not parse owner/repo from git remote");
  owner = m[1];
  repo = m[2].replace(/\.git$/, "");
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

const api = (path, opts) =>
  fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });

async function upsertVariable(name, value) {
  const enc = encodeURIComponent(name);
  const one = `/repos/${owner}/${repo}/actions/variables/${enc}`;
  const getRes = await api(one, { method: "GET" });
  if (getRes.status === 200) {
    const patchRes = await api(one, {
      method: "PATCH",
      body: JSON.stringify({ name, value }),
    });
    if (patchRes.status === 204) {
      console.log(`Updated variable: ${name}`);
      return;
    }
    console.error(`Failed to update ${name}: ${patchRes.status} ${await patchRes.text()}`);
    process.exit(1);
  }
  if (getRes.status === 404) {
    const postRes = await api(`/repos/${owner}/${repo}/actions/variables`, {
      method: "POST",
      body: JSON.stringify({ name, value }),
    });
    if (postRes.status === 201) {
      console.log(`Created variable: ${name}`);
      return;
    }
    console.error(`Failed to create ${name}: ${postRes.status} ${await postRes.text()}`);
    process.exit(1);
  }
  if (getRes.status === 401 || getRes.status === 403) {
    console.error(
      `GitHub API ${getRes.status}: check that your token has repo scope and access to ${owner}/${repo}.`
    );
    process.exit(1);
  }
  console.error(`Unexpected response checking ${name}: ${getRes.status} ${await getRes.text()}`);
  process.exit(1);
}

await upsertVariable("NEXT_PUBLIC_SUPABASE_URL", url);
await upsertVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
console.log(`\nDone. Repository: ${owner}/${repo}`);
console.log("Push to main (or re-run Actions) so the next build picks up these variables.");
