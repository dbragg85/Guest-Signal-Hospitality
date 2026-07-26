import fs from "node:fs";
import path from "node:path";
import type { ArticleRecord, TrendRecord } from "@/lib/newsletter/types";

export const ROOT = process.cwd();
export const TRENDS_DIR = path.join(ROOT, "src", "data", "hospitality-trends");
export const ARTICLES_DIR = path.join(ROOT, "src", "data", "hospitality-articles");
export const NEWSLETTER_DIR = path.join(ROOT, "src", "content", "newsletter");
export const MANUAL_TRENDS_FILE = path.join(ROOT, "src", "data", "newsletter_trends_manual.json");

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function isoDay(input = new Date()): string {
  return input.toISOString().slice(0, 10);
}

export function weekAgoIso(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function loadJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function latestJsonFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
  if (!files.length) return null;
  return path.join(dir, files[0]);
}

export function sanitizeHeadline(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function deriveOperatorAngle(term: string): string {
  const lower = term.toLowerCase();
  if (lower.includes("price") || lower.includes("value") || lower.includes("deal")) {
    return "Guests are signaling price sensitivity; review menu framing, value communication, and margin-safe offers.";
  }
  if (lower.includes("delivery") || lower.includes("takeout")) {
    return "Off-premise behavior is active; confirm packaging quality, order accuracy, and pickup flow clarity.";
  }
  if (lower.includes("brunch") || lower.includes("breakfast")) {
    return "Daypart demand is shifting; adjust staffing and prep timing to protect speed and consistency.";
  }
  return "Treat this as demand signal context and check whether guest expectations are shifting faster than current operations.";
}

export function scoreTrend(term: string): number {
  const low = term.toLowerCase();
  let score = 0;
  const positive = [
    "restaurant",
    "menu",
    "food",
    "drink",
    "reviews",
    "guest",
    "hospitality",
    "delivery",
    "takeout",
    "cincinnati",
    "pricing",
    "reservation",
  ];
  for (const token of positive) {
    if (low.includes(token)) score += 2;
  }
  return score;
}

export function scoreArticle(article: ArticleRecord): number {
  const txt = `${article.title} ${article.summary} ${article.topicTags.join(" ")}`.toLowerCase();
  const boost = [
    "restaurant",
    "hospitality",
    "guest",
    "review",
    "reputation",
    "operations",
    "marketing",
    "labor",
    "cincinnati",
    "google",
  ];
  return boost.reduce((acc, token) => acc + (txt.includes(token) ? 2 : 0), 0);
}

export function normalizeTrend(input: Partial<TrendRecord>): TrendRecord {
  return {
    term: sanitizeHeadline(input.term ?? "Unknown trend"),
    source:
      input.source === "Manual"
        ? "Manual"
        : input.source === "Reddit"
          ? "Reddit"
          : "Google Trends",
    geo: "US",
    category: "Food & Drink",
    timeWindow: "past 7 days",
    searchVolumeLabel: input.searchVolumeLabel ?? "N/A",
    trendUrl: input.trendUrl ?? "https://trends.google.com/trending?geo=US&category=5&hours=168",
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    operatorAngle: input.operatorAngle ?? deriveOperatorAngle(input.term ?? ""),
  };
}
