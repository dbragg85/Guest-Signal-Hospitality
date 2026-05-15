import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";
import { buildSitemapEntries } from "@/lib/seo/sitemap-paths";

function pathToUrl(origin: string, path: string): string {
  if (path === "") return `${origin}/`;
  return `${origin}/${path}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const entries = buildSitemapEntries();

  return entries.map((entry) => ({
    url: pathToUrl(origin, entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
