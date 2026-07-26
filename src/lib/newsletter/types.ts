export type TrendRecord = {
  term: string;
  source: "Google Trends" | "Manual" | "Reddit";
  geo: "US";
  category: "Food & Drink";
  timeWindow: "past 7 days";
  searchVolumeLabel: string;
  trendUrl: string;
  collectedAt: string;
  operatorAngle: string;
};

export type ArticleRecord = {
  title: string;
  publisher: string;
  url: string;
  publishedDate: string;
  summary: string;
  topicTags: string[];
  operatorTakeaway: string;
};

export type TopicCategorySlug =
  | "restaurant-operations"
  | "guest-experience"
  | "hospitality-marketing"
  | "service-recovery"
  | "menu-engineering"
  | "front-of-house"
  | "hospitality-technology"
  | "reputation-management"
  | "staff-retention"
  | "revenue-optimization";

export type NewsletterFrontmatter = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  /** Canonical short slug for /insights/{slug}/ */
  slug: string;
  /** Previous long-dated slug for 301-style redirects */
  legacySlug?: string;
  excerpt: string;
  publishedDate: string;
  updatedDate: string;
  category: "Newsletter";
  /** Topical hub slug — maps to /topics/{topicCategory}/ */
  topicCategory: TopicCategorySlug;
  tags: string[];
  sources: string[];
  canonicalUrl: string;
  /** Related insight slugs for internal linking */
  relatedSlugs?: string[];
  /** Surface on homepage and sitemap priority boost */
  featured?: boolean;
  heroImage?: string;
  draft?: boolean;
};

export type ParsedNewsletter = {
  frontmatter: NewsletterFrontmatter;
  body: string;
  path: string;
};
