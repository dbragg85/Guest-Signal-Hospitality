import path from "node:path";
import {
  MANUAL_TRENDS_FILE,
  TRENDS_DIR,
  deriveOperatorAngle,
  ensureDir,
  isoDay,
  loadJsonFile,
  normalizeTrend,
  writeJsonFile,
} from "./lib/newsletter-utils";
import type { TrendRecord } from "@/lib/newsletter/types";

const GOOGLE_TRENDS_URL = "https://trends.google.com/trending?geo=US&category=5&hours=168";

async function collectFromSerpApi(): Promise<TrendRecord[] | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const url = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&hours=168&cat=5&api_key=${encodeURIComponent(
    apiKey,
  )}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`SerpApi failed: ${response.status}`);
  const json = (await response.json()) as Record<string, unknown>;
  const trends = (json.trending_searches as Array<Record<string, unknown>> | undefined) ?? [];

  return trends.slice(0, 20).map((item) =>
    normalizeTrend({
      term: String(item.query ?? item.title ?? "Unknown trend"),
      source: "Google Trends",
      searchVolumeLabel: String(item.search_volume ?? item.traffic ?? "N/A"),
      trendUrl: String(item.link ?? GOOGLE_TRENDS_URL),
      collectedAt: new Date().toISOString(),
      operatorAngle: deriveOperatorAngle(String(item.query ?? item.title ?? "")),
    }),
  );
}

async function collectFromGlimpse(): Promise<TrendRecord[] | null> {
  const apiKey = process.env.GLIMPSE_API_KEY;
  const endpoint = process.env.GLIMPSE_API_URL;
  if (!apiKey || !endpoint) return null;

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Glimpse failed: ${response.status}`);

  const json = (await response.json()) as { trends?: Array<Record<string, unknown>> };
  const trends = json.trends ?? [];
  return trends.slice(0, 20).map((item) =>
    normalizeTrend({
      term: String(item.term ?? item.title ?? "Unknown trend"),
      source: "Google Trends",
      searchVolumeLabel: String(item.searchVolumeLabel ?? item.search_volume ?? "N/A"),
      trendUrl: String(item.trendUrl ?? GOOGLE_TRENDS_URL),
      collectedAt: new Date().toISOString(),
      operatorAngle: deriveOperatorAngle(String(item.term ?? item.title ?? "")),
    }),
  );
}

async function collectWithPlaywright(): Promise<TrendRecord[] | null> {
  if (process.env.NEWSLETTER_ALLOW_SCRAPE !== "true") return null;
  try {
    const req = (0, eval)("require") as (id: string) => any;
    const playwright = req("playwright");
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(GOOGLE_TRENDS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    const extracted = (await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("a, div, span"))
        .map((node) => (node.textContent ?? "").trim())
        .filter((t) => t.length > 2 && t.length < 120);
      const unique = Array.from(new Set(candidates));
      return unique.slice(0, 40);
    })) as string[];
    await browser.close();

    const likelyTerms = extracted.filter((term: string) => /[a-zA-Z]/.test(term)).slice(0, 15);
    return likelyTerms.map((term: string) =>
      normalizeTrend({
        term,
        source: "Google Trends",
        searchVolumeLabel: "N/A",
        trendUrl: GOOGLE_TRENDS_URL,
        collectedAt: new Date().toISOString(),
        operatorAngle: deriveOperatorAngle(term),
      }),
    );
  } catch {
    return null;
  }
}

function collectManual(): TrendRecord[] {
  const manual = loadJsonFile<TrendRecord[]>(MANUAL_TRENDS_FILE) ?? [];
  return manual.map((item) => normalizeTrend(item));
}

/** Merge previously collected Apify Reddit signals (npm run growth:reddit-signals). */
function collectFromRedditSignalsFile(): TrendRecord[] {
  const latest = loadJsonFile<{
    trends?: Array<{ term?: string; weight?: number }>;
    signals?: Array<{ title?: string | null; url?: string | null; community?: string | null }>;
  }>(path.join(process.cwd(), ".operator", "reddit-signals", "latest.json"));
  if (!latest) return [];

  const fromTrends = (latest.trends ?? [])
    .filter((t) => t.term && !String(t.term).startsWith("r/"))
    .slice(0, 8)
    .map((t) =>
      normalizeTrend({
        term: String(t.term),
        source: "Reddit",
        searchVolumeLabel: "community",
        trendUrl: "https://www.reddit.com/",
        collectedAt: new Date().toISOString(),
        operatorAngle: deriveOperatorAngle(String(t.term)),
      }),
    );

  const fromTitles = (latest.signals ?? [])
    .map((s) => String(s.title ?? "").trim())
    .filter((t) => t.length > 18 && t.length < 110)
    .slice(0, 6)
    .map((term) =>
      normalizeTrend({
        term,
        source: "Reddit",
        searchVolumeLabel: "discussion",
        trendUrl: "https://www.reddit.com/",
        collectedAt: new Date().toISOString(),
        operatorAngle: deriveOperatorAngle(term),
      }),
    );

  return [...fromTrends, ...fromTitles];
}

async function main() {
  ensureDir(TRENDS_DIR);
  const date = isoDay();
  const outputPath = path.join(TRENDS_DIR, `${date}.json`);

  let trends: TrendRecord[] | null = null;
  try {
    trends = await collectFromSerpApi();
  } catch (error) {
    console.warn("SerpApi collection failed:", (error as Error).message);
  }
  if (!trends || !trends.length) {
    try {
      trends = await collectFromGlimpse();
    } catch (error) {
      console.warn("Glimpse collection failed:", (error as Error).message);
    }
  }
  if (!trends || !trends.length) {
    trends = await collectWithPlaywright();
  }
  if (!trends || !trends.length) {
    trends = collectManual();
    console.warn("Using manual trend fallback from newsletter_trends_manual.json");
  }

  const reddit = collectFromRedditSignalsFile();
  if (reddit.length) {
    const seen = new Set(trends.map((t) => t.term.toLowerCase()));
    for (const item of reddit) {
      const key = item.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      trends.push(item);
    }
    console.log(`Merged ${reddit.length} Reddit community signals into weekly trends`);
  }

  writeJsonFile(outputPath, trends);
  console.log(`Saved ${trends.length} weekly trends to ${outputPath}`);
}

main().catch((error) => {
  console.error("Trend collection failed:", error);
  process.exit(1);
});
