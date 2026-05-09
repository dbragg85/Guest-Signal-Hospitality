import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getSiteOrigin } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "careers",
  "contact",
  "newsletter",
  "privacy",
  "resources",
  "resources/restaurant-review-monitoring",
  "resources/google-reviews-for-restaurants",
  "resources/cincinnati-restaurant-reputation",
  "services",
  "services/inquiry",
  "team",
  "terms",
  "who-we-serve",
  "industries/restaurants",
  "portal",
  "portal/demo",
] as const;

function pathToUrl(origin: string, path: string): string {
  if (path === "") return `${origin}/`;
  return `${origin}/${path}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: pathToUrl(origin, path),
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const newsletterDir = path.join(process.cwd(), "src", "content", "newsletter");
  if (fs.existsSync(newsletterDir)) {
    const files = fs.readdirSync(newsletterDir).filter((file) => file.endsWith(".md"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(newsletterDir, file), "utf8");
      if (raw.includes("draft: true")) continue;
      const slugMatch = raw.match(/\nslug:\s*"([^"]+)"/);
      if (!slugMatch) continue;
      const slug = slugMatch[1].replace(/^\/+|\/+$/g, "");
      entries.push({
        url: `${origin}/newsletter/${slug}/`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
