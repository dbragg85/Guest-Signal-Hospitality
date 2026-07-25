import fs from "node:fs";
import path from "node:path";
import { getSiteOrigin } from "@/lib/site-url";
import { buildLegacySlugMap, getLegacyRedirectTarget } from "@/lib/seo/redirects";
import type { NewsletterFrontmatter, ParsedNewsletter, TopicCategorySlug } from "@/lib/newsletter/types";

const NEWSLETTER_DIR = path.join(process.cwd(), "src", "content", "newsletter");

function parseYamlLikeValue(input: string): string | string[] | boolean {
  const v = input.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }
  return v.replace(/^"|"$/g, "");
}

function parseFrontmatter(raw: string): { frontmatter: NewsletterFrontmatter; body: string } | null {
  if (!raw.startsWith("---\n")) return null;
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return null;

  const fmRaw = raw.slice(4, end).split("\n");
  const body = raw.slice(end + 5).trim();

  const map: Record<string, unknown> = {};
  for (const line of fmRaw) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    map[key] = parseYamlLikeValue(value);
  }

  const required = [
    "title",
    "seoTitle",
    "metaDescription",
    "slug",
    "excerpt",
    "publishedDate",
    "updatedDate",
    "category",
    "tags",
    "sources",
    "canonicalUrl",
    "topicCategory",
  ];
  for (const field of required) {
    if (!(field in map)) return null;
  }

  const fm = map as NewsletterFrontmatter;
  if (!fm.topicCategory) {
    fm.topicCategory = inferTopicCategory(fm);
  }

  return { frontmatter: fm, body };
}

function inferTopicCategory(fm: NewsletterFrontmatter): TopicCategorySlug {
  const haystack = `${fm.title} ${fm.excerpt} ${(fm.tags ?? []).join(" ")}`.toLowerCase();
  if (haystack.includes("menu") || haystack.includes("value")) return "menu-engineering";
  if (haystack.includes("recovery")) return "service-recovery";
  if (haystack.includes("review") || haystack.includes("reputation")) return "reputation-management";
  if (haystack.includes("marketing") || haystack.includes("local")) return "hospitality-marketing";
  if (haystack.includes("consistency") || haystack.includes("front")) return "front-of-house";
  if (haystack.includes("staff") || haystack.includes("retention")) return "staff-retention";
  if (haystack.includes("revenue")) return "revenue-optimization";
  if (haystack.includes("technology") || haystack.includes("monitoring")) return "hospitality-technology";
  if (haystack.includes("guest")) return "guest-experience";
  return "restaurant-operations";
}

export function getNewsletterFiles(): string[] {
  if (!fs.existsSync(NEWSLETTER_DIR)) return [];
  return fs
    .readdirSync(NEWSLETTER_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(NEWSLETTER_DIR, file));
}

export function getAllNewsletters(): ParsedNewsletter[] {
  const files = getNewsletterFiles();
  const parsed: ParsedNewsletter[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const result = parseFrontmatter(raw);
    if (!result) continue;
    parsed.push({ ...result, path: file });
  }

  parsed.sort((a, b) => (a.frontmatter.publishedDate < b.frontmatter.publishedDate ? 1 : -1));
  return parsed;
}

export function getPublishedNewsletters(): ParsedNewsletter[] {
  return getAllNewsletters().filter((item) => !item.frontmatter.draft);
}

export function getFeaturedNewsletters(limit = 3): ParsedNewsletter[] {
  const published = getPublishedNewsletters();
  const featured = published.filter((item) => item.frontmatter.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  return published.slice(0, limit);
}

function getLegacySlugMap(): Record<string, string> {
  return buildLegacySlugMap(
    getAllNewsletters().map((item) => ({
      slug: item.frontmatter.slug,
      legacySlug: item.frontmatter.legacySlug,
    })),
  );
}

export function getNewsletterBySlug(slug: string): ParsedNewsletter | null {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const list = getAllNewsletters();
  const legacyMap = getLegacySlugMap();

  const direct = list.find((item) => item.frontmatter.slug.replace(/^\/+|\/+$/g, "") === clean);
  if (direct) return direct;

  const legacyTarget = getLegacyRedirectTarget(clean, legacyMap);
  if (legacyTarget) {
    return list.find((item) => item.frontmatter.slug.replace(/^\/+|\/+$/g, "") === legacyTarget) ?? null;
  }

  return null;
}

export function getAllLegacySlugsForRedirect(): string[] {
  return Object.keys(
    buildLegacySlugMap(
      getPublishedNewsletters().map((item) => ({
        slug: item.frontmatter.slug,
        legacySlug: item.frontmatter.legacySlug,
      })),
    ),
  );
}

export function getInsightPath(slug: string): string {
  return `/insights/${slug.replace(/^\/+|\/+$/g, "")}/`;
}

export function getNewsletterCanonical(slug: string): string {
  const base = getSiteOrigin();
  return `${base}${getInsightPath(slug)}`;
}

export function getNewslettersByTopic(topicCategory: TopicCategorySlug): ParsedNewsletter[] {
  return getPublishedNewsletters().filter((item) => item.frontmatter.topicCategory === topicCategory);
}

export function getRelatedNewsletters(item: ParsedNewsletter, limit = 3): ParsedNewsletter[] {
  const published = getPublishedNewsletters().filter(
    (n) => n.frontmatter.slug !== item.frontmatter.slug,
  );
  const relatedSlugs = item.frontmatter.relatedSlugs ?? [];
  const fromSlugs = relatedSlugs
    .map((s) => published.find((n) => n.frontmatter.slug === s))
    .filter((n): n is ParsedNewsletter => Boolean(n));

  const sameTopic = published.filter(
    (n) =>
      n.frontmatter.topicCategory === item.frontmatter.topicCategory &&
      !fromSlugs.some((r) => r.frontmatter.slug === n.frontmatter.slug),
  );

  return [...fromSlugs, ...sameTopic].slice(0, limit);
}
