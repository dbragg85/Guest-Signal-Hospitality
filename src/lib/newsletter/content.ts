import fs from "node:fs";
import path from "node:path";
import { getSiteOrigin } from "@/lib/site-url";
import type { NewsletterFrontmatter, ParsedNewsletter } from "@/lib/newsletter/types";

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
  ];
  for (const field of required) {
    if (!(field in map)) return null;
  }

  return {
    frontmatter: map as NewsletterFrontmatter,
    body,
  };
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

export function getNewsletterBySlug(slug: string): ParsedNewsletter | null {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const list = getAllNewsletters();
  return list.find((item) => item.frontmatter.slug.replace(/^\/+|\/+$/g, "") === clean) ?? null;
}

export function getNewsletterCanonical(slug: string): string {
  const base = getSiteOrigin();
  return `${base}/newsletter/${slug.replace(/^\/+|\/+$/g, "")}/`;
}
