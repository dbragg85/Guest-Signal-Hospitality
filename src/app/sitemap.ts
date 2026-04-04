import type { MetadataRoute } from "next";
import { PORTAL_RESTAURANTS } from "@/data/portal-restaurants";
import { getSiteOrigin } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "about",
  "careers",
  "contact",
  "newsletter",
  "services",
  "services/inquiry",
  "team",
  "test",
  "who-we-serve",
  "industries/restaurants",
  "portal",
  "portal/demo",
  "portal/dashboard",
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

  for (const { slug } of PORTAL_RESTAURANTS) {
    entries.push({
      url: `${origin}/portal/dashboard/${slug}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
