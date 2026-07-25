#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || "out");
const siteOrigin = "https://guestsignalhospitality.com";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function routeForHtml(file) {
  const relative = path.relative(outputDir, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -10)}`;
  return `/${relative.replace(/\.html$/, "")}`;
}

function targetExists(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidates = [
    path.join(outputDir, clean),
    path.join(outputDir, clean, "index.html"),
    path.join(outputDir, `${clean}.html`),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

if (!fs.existsSync(outputDir)) {
  console.error(`Static export directory not found: ${outputDir}`);
  process.exit(1);
}

const htmlFiles = walk(outputDir).filter((file) => file.endsWith(".html"));
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const sourceRoute = routeForHtml(file);
  const hrefs = Array.from(html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')/gi))
    .map((match) => match[1] ?? match[2] ?? "")
    .filter(Boolean);

  for (const href of hrefs) {
    if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;

    let url;
    try {
      url = new URL(href.replaceAll("&amp;", "&"), `${siteOrigin}${sourceRoute}`);
    } catch {
      failures.push({ sourceRoute, href, reason: "invalid URL" });
      continue;
    }

    if (url.origin !== siteOrigin) continue;
    checked += 1;
    if (!targetExists(url.pathname)) {
      failures.push({ sourceRoute, href, reason: "missing static target" });
    }
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} broken internal link(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.sourceRoute} -> ${failure.href} (${failure.reason})`);
  }
  process.exit(1);
}

console.log(`Checked ${checked} internal links across ${htmlFiles.length} pages; no broken targets found.`);
