#!/usr/bin/env node
/**
 * Morning digest: overnight scorecard work → owner email + ntfy.
 *   npm run growth:overnight-digest
 */
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

// Load .env.local before importing alert helpers that read process.env at call time.
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (k && process.env[k] == null) process.env[k] = v;
  }
}
process.env.NTFY_TOPIC = process.env.NTFY_TOPIC || "Guest_Signal";
process.env.OWNER_REPORT_EMAIL_TO =
  process.env.OWNER_REPORT_EMAIL_TO || "audit@guestsignalhospitality.com";

const { alertOwner } = await import("./lib/owner-alert.mjs");

const logPath = join(process.cwd(), ".operator", "scorecard-overnight-log.md");
const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "_No overnight log found._";

const summary = [
  "# Overnight scorecard product digest",
  "",
  "Shipped toward best-in-class operator scorecards (vs Birdeye/Podium inbox tools):",
  "",
  "- Evidence-backed SWOT v2 (mentions, scores, 30-day plays, peer threats)",
  "- Pillar tiles with weight labels + 30-day floor playbooks",
  "- Owner executive brief on every portal snapshot",
  "- Snapshot deliverables v2 (executive brief + pillar intelligence)",
  "- Client-side SWOT derivation so existing scorecards gain value without reprocess",
  "",
  "## Overnight log",
  "",
  log.slice(-6000),
].join("\n");

const result = await alertOwner({
  title: "Morning digest: overnight scorecard upgrades",
  emailSubject: "[Guest Signal] Morning digest — overnight scorecard work",
  tags: ["sunrise", "clipboard", "scorecard"],
  priority: 4,
  message: summary,
});

appendFileSync(
  logPath,
  `\n\n## Morning digest sent — ${new Date().toISOString()}\n${JSON.stringify(result)}\n`,
);

console.log(JSON.stringify({ ok: true, result, logChars: log.length }, null, 2));
