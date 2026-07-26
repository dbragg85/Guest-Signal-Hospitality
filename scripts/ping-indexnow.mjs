#!/usr/bin/env node
/**
 * Submit priority URLs to IndexNow (Bing/Yandex/etc.).
 * Usage: node scripts/ping-indexnow.mjs
 * Requires INDEXNOW_KEY or .operator/indexnow-key.txt
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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
const urls = [
  `https://${host}/`,
  `https://${host}/services/`,
  `https://${host}/snapshot/`,
  `https://${host}/markets/`,
  `https://${host}/resources/`,
  `https://${host}/resources/improve-google-restaurant-rating/`,
  `https://${host}/resources/google-restaurant-ratings/`,
  `https://${host}/resources/restaurant-seo-google-ratings/`,
  `https://${host}/resources/restaurant-review-monitoring/`,
  `https://${host}/resources/restaurant-review-scorecard/`,
  `https://${host}/resources/guest-recovery-solutions/`,
  `https://${host}/resources/restaurant-reputation/`,
  `https://${host}/resources/guest-signal-vs-review-tools/`,
  `https://${host}/resources/cincinnati-restaurant-reputation/`,
  `https://${host}/insights/guest-recovery-playbooks/`,
  `https://${host}/markets/cincinnati-oh/`,
  `https://${host}/markets/columbus-oh/`,
  `https://${host}/markets/nashville-tn/`,
  `https://${host}/markets/charlotte-nc/`,
  `https://${host}/insights/`,
];

const body = JSON.stringify({ host, key, keyLocation, urlList: urls });
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body,
});
const text = await res.text();
console.log(JSON.stringify({ status: res.status, ok: res.ok, body: text.slice(0, 300), urls: urls.length }));
if (!res.ok && res.status !== 202) process.exit(1);
