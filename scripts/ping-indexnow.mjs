#!/usr/bin/env node
/**
 * Submit priority URLs to IndexNow (Bing/Yandex/etc.).
 * Usage: node scripts/ping-indexnow.mjs
 * Requires INDEXNOW_KEY or .operator/indexnow-key.txt
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const host = "guestsignalhospitality.com";
const key =
  process.env.INDEXNOW_KEY?.trim() ||
  (existsSync(".operator/indexnow-key.txt")
    ? readFileSync(".operator/indexnow-key.txt", "utf8").trim()
    : "");

if (!key) {
  console.error("Missing INDEXNOW_KEY");
  process.exit(1);
}

const keyLocation = `https://${host}/${key}.txt`;

const resourceDir = resolve("src/app/resources");
const resourceSlugs = existsSync(resourceDir)
  ? readdirSync(resourceDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

const core = [
  "",
  "services",
  "snapshot",
  "markets",
  "resources",
  "insights",
  "insights/guest-recovery-playbooks",
  "insights/review-response-speed",
  "markets/cincinnati-oh",
  "markets/columbus-oh",
  "markets/nashville-tn",
  "markets/charlotte-nc",
  "markets/florence-sc",
];

const urls = [
  ...new Set([
    ...core.map((p) => (p ? `https://${host}/${p}/` : `https://${host}/`)),
    ...resourceSlugs.map((slug) => `https://${host}/resources/${slug}/`),
  ]),
];

const body = JSON.stringify({ host, key, keyLocation, urlList: urls });
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body,
});
const text = await res.text();
console.log(
  JSON.stringify({
    status: res.status,
    ok: res.ok,
    body: text.slice(0, 300),
    urls: urls.length,
  }),
);
if (!res.ok && res.status !== 202) process.exit(1);
