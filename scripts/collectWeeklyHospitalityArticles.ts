import path from "node:path";
import { ARTICLES_DIR, ensureDir, isoDay, loadJsonFile, weekAgoIso, writeJsonFile } from "./lib/newsletter-utils";
import type { ArticleRecord } from "@/lib/newsletter/types";

const QUERY_TERMS = [
  "restaurant reviews",
  "restaurant guest experience",
  "restaurant reputation management",
  "restaurant operations",
  "restaurant marketing",
  "food and beverage trends",
  "hospitality technology",
  "restaurant labor",
  "restaurant customer experience",
  "Cincinnati restaurants",
  "Google reviews restaurants",
  "AI for restaurants",
];

const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=restaurant+operations+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
  "https://news.google.com/rss/search?q=restaurant+guest+experience+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
  "https://news.google.com/rss/search?q=Cincinnati+restaurants+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
  "https://www.restaurantbusinessonline.com/rss.xml",
  "https://www.nrn.com/rss.xml",
];
const MANUAL_ARTICLES_FILE = path.join(process.cwd(), "src", "data", "newsletter_articles_manual.json");

function topicTagsFor(title: string, summary: string): string[] {
  const source = `${title} ${summary}`.toLowerCase();
  const tags = [
    "restaurant operations",
    "guest experience",
    "restaurant marketing",
    "restaurant labor",
    "reputation management",
    "google reviews",
    "hospitality technology",
    "cincinnati restaurants",
    "restaurant trends",
  ];
  return tags.filter((tag) => source.includes(tag.split(" ")[0])).slice(0, 4);
}

function operatorTakeawayFor(title: string, summary: string): string {
  const source = `${title} ${summary}`.toLowerCase();
  if (source.includes("labor") || source.includes("staff")) {
    return "Check scheduling pressure and service consistency before traffic peaks affect guest sentiment.";
  }
  if (source.includes("price") || source.includes("inflation") || source.includes("value")) {
    return "Revisit menu-value communication and make pricing changes explicit in guest-facing channels.";
  }
  if (source.includes("technology") || source.includes("ai")) {
    return "Evaluate whether the tool improves speed, accuracy, or review response time before rollout.";
  }
  return "Map this signal to weekly operations: what changes in service, messaging, or review response cadence are needed now?";
}

function decodeXml(text: string): string {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/i, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripTags(text: string): string {
  return decodeXml(text).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function parseRssItems(xml: string): Array<Record<string, string>> {
  const items = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => match[0]);
  return items.map((item) => ({
    title: stripTags((item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()),
    link: decodeXml((item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim()),
    pubDate: (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "").trim(),
    description: stripTags((item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "").trim()),
    source: stripTags((item.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "").trim()),
  }));
}

async function fetchFromNewsApi(): Promise<ArticleRecord[] | null> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return null;

  const from = weekAgoIso().slice(0, 10);
  const q = encodeURIComponent(QUERY_TERMS.join(" OR "));
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=40&from=${from}&apiKey=${encodeURIComponent(
    key,
  )}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`News API failed: ${response.status}`);
  const json = (await response.json()) as {
    articles?: Array<{
      title?: string;
      source?: { name?: string };
      url?: string;
      publishedAt?: string;
      description?: string;
    }>;
  };

  return (json.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => {
      const title = article.title ?? "Untitled";
      const summary = article.description ?? "No summary provided.";
      return {
        title,
        publisher: article.source?.name ?? "Unknown publisher",
        url: article.url ?? "",
        publishedDate: article.publishedAt ?? new Date().toISOString(),
        summary,
        topicTags: topicTagsFor(title, summary),
        operatorTakeaway: operatorTakeawayFor(title, summary),
      };
    });
}

async function fetchFromRss(): Promise<ArticleRecord[]> {
  const all: ArticleRecord[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed, {
        headers: {
          "User-Agent": "GuestSignalHospitality/1.0 (+https://guestsignalhospitality.com/)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRssItems(xml);
      for (const item of items.slice(0, 8)) {
        if (!item.title || !item.link) continue;
        const summary = item.description || "Summary unavailable.";
        all.push({
          title: item.title,
          publisher: item.source || new URL(feed).hostname.replace(/^www\./, ""),
          url: item.link,
          publishedDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary,
          topicTags: topicTagsFor(item.title, summary),
          operatorTakeaway: operatorTakeawayFor(item.title, summary),
        });
      }
    } catch {
      // Keep collecting from remaining feeds.
    }
  }

  return all;
}

async function main() {
  ensureDir(ARTICLES_DIR);
  const date = isoDay();
  const outputPath = path.join(ARTICLES_DIR, `${date}.json`);

  let articles: ArticleRecord[] | null = null;
  try {
    articles = await fetchFromNewsApi();
  } catch (error) {
    console.warn("News API collection failed:", (error as Error).message);
  }
  if (!articles || !articles.length) {
    articles = await fetchFromRss();
  }

  if (!articles.length) {
    const manual = loadJsonFile<ArticleRecord[]>(MANUAL_ARTICLES_FILE) ?? [];
    articles = manual;
    console.warn("Using manual article fallback from newsletter_articles_manual.json");
  }

  const deduped = new Map<string, ArticleRecord>();
  for (const article of articles) {
    deduped.set(article.url, article);
  }
  const result = Array.from(deduped.values()).slice(0, 30);

  writeJsonFile(outputPath, result);
  console.log(`Saved ${result.length} hospitality articles to ${outputPath}`);
}

main().catch((error) => {
  console.error("Article collection failed:", error);
  process.exit(1);
});
