import fs from "node:fs";
import path from "node:path";
import { NEWSLETTER_DIR, ensureDir } from "./lib/newsletter-utils";

const BANNER_DIR = path.join(process.cwd(), "public", "newsletter-banners");

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createBannerSvg(title: string, subtitle: string, dateLabel: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="840" viewBox="0 0 1600 840" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1600" y2="840" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0F172A"/>
      <stop offset="1" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="840" fill="url(#bg)"/>
  <circle cx="1360" cy="120" r="230" fill="#0284C7" fill-opacity="0.2"/>
  <circle cx="1220" cy="700" r="320" fill="#F59E0B" fill-opacity="0.16"/>
  <rect x="96" y="98" width="416" height="44" rx="22" fill="#0B1220" stroke="url(#accent)"/>
  <text x="126" y="126" fill="#FBBF24" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="700">This Week in Hospitality Signals</text>
  <text x="96" y="240" fill="#FFFFFF" font-size="64" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
  <text x="96" y="332" fill="#CBD5E1" font-size="34" font-family="Inter, Arial, sans-serif">${escapeXml(subtitle)}</text>
  <text x="96" y="760" fill="#F8FAFC" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="600">Guest Signal Hospitality</text>
  <text x="1340" y="760" fill="#94A3B8" font-size="24" text-anchor="end" font-family="Inter, Arial, sans-serif">${escapeXml(dateLabel)}</text>
</svg>`;
}

function upsertHeroImageFrontmatter(raw: string, heroImage: string): string {
  if (!raw.startsWith("---\n")) return raw;
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return raw;
  const frontmatter = raw.slice(4, end);
  if (frontmatter.includes("\nheroImage:")) {
    return raw.replace(/\nheroImage:\s*"[^"]*"/, `\nheroImage: "${heroImage}"`);
  }
  const updatedFrontmatter = `${frontmatter}\nheroImage: "${heroImage}"`;
  return `---\n${updatedFrontmatter}\n---\n${raw.slice(end + 5)}`;
}

function extractField(raw: string, key: string): string | null {
  const re = new RegExp(`\\n${key}:\\s*"([^"]+)"`);
  return raw.match(re)?.[1] ?? null;
}

function main() {
  ensureDir(BANNER_DIR);
  if (!fs.existsSync(NEWSLETTER_DIR)) return;

  const files = fs.readdirSync(NEWSLETTER_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const full = path.join(NEWSLETTER_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    const title = extractField(raw, "title");
    const slug = extractField(raw, "slug");
    const published = extractField(raw, "publishedDate");
    if (!title || !slug || !published) continue;
    const dateLabel = published.slice(0, 10);
    const heroImage = `/newsletter-banners/${slug}.svg`;

    const banner = createBannerSvg(
      title.replace(/^This Week in Hospitality Signals:\s*/i, ""),
      "Search trends, guest behavior signals, and operator takeaways for restaurants.",
      dateLabel,
    );
    fs.writeFileSync(path.join(BANNER_DIR, `${slug}.svg`), banner, "utf8");

    const updated = upsertHeroImageFrontmatter(raw, heroImage);
    fs.writeFileSync(full, updated, "utf8");
  }

  console.log(`Backfilled hero banners for ${files.length} newsletters.`);
}

main();
