import { getPublishedNewsletters } from "@/lib/newsletter/content";
import { topicCategories } from "@/lib/seo/categories";
import { markets } from "@/content/markets";
import { resourceArticles } from "@/content/resources";

export type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
};

/** High-priority commercial and brand pages */
const HIGH_PRIORITY: SitemapEntry[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "services", priority: 0.95, changeFrequency: "weekly" },
  { path: "snapshot", priority: 0.93, changeFrequency: "weekly" },
  { path: "industries/restaurants", priority: 0.9, changeFrequency: "monthly" },
  { path: "contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "team", priority: 0.85, changeFrequency: "monthly" },
];

/** Medium-priority content hubs */
const MEDIUM_PRIORITY: SitemapEntry[] = [
  { path: "insights", priority: 0.9, changeFrequency: "weekly" },
  { path: "newsletter", priority: 0.75, changeFrequency: "weekly" },
  { path: "resources", priority: 0.85, changeFrequency: "weekly" },
  { path: "markets", priority: 0.9, changeFrequency: "weekly" },
  { path: "who-we-serve", priority: 0.8, changeFrequency: "monthly" },
  ...resourceArticles.map((a) => ({
    path: `resources/${a.slug}`,
    priority: 0.85,
    changeFrequency: "monthly" as const,
  })),
  ...markets.map((m) => ({
    path: `markets/${m.slug}`,
    priority: 0.88,
    changeFrequency: "monthly" as const,
  })),
  ...topicCategories.map((c) => ({
    path: `topics/${c.slug}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  })),
];

/** Lower-priority utility pages */
const LOW_PRIORITY: SitemapEntry[] = [
  { path: "careers", priority: 0.5, changeFrequency: "monthly" },
  { path: "privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "terms", priority: 0.3, changeFrequency: "yearly" },
];

export function buildSitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [...HIGH_PRIORITY, ...MEDIUM_PRIORITY, ...LOW_PRIORITY];

  for (const item of getPublishedNewsletters()) {
    const slug = item.frontmatter.slug.replace(/^\/+|\/+$/g, "");
    const priority = item.frontmatter.featured ? 0.88 : 0.82;
    entries.push({
      path: `insights/${slug}`,
      priority,
      changeFrequency: "weekly",
    });
  }

  return entries;
}
