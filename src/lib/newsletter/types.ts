export type TrendRecord = {
  term: string;
  source: "Google Trends" | "Manual";
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

export type NewsletterFrontmatter = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  excerpt: string;
  publishedDate: string;
  updatedDate: string;
  category: "Newsletter";
  tags: string[];
  sources: string[];
  canonicalUrl: string;
  draft?: boolean;
};

export type ParsedNewsletter = {
  frontmatter: NewsletterFrontmatter;
  body: string;
  path: string;
};
