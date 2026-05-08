import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "careers",
  "contact",
  "newsletter",
  "privacy",
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

  return entries;
}
