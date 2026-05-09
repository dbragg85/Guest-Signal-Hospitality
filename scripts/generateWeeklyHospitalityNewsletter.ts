import fs from "node:fs";
import path from "node:path";
import { sendNewsletterEmail } from "@/lib/email/newsletterProvider";
import type { ArticleRecord, NewsletterFrontmatter, TrendRecord } from "@/lib/newsletter/types";
import {
  ARTICLES_DIR,
  NEWSLETTER_DIR,
  TRENDS_DIR,
  ensureDir,
  isoDay,
  latestJsonFile,
  loadJsonFile,
  scoreArticle,
  scoreTrend,
} from "./lib/newsletter-utils";

const BRAND_SAFETY_BLOCK = [
  "affiliate",
  "official partner",
  "endorsed by",
  "guaranteed",
];

const KEYWORD_ROTATION = [
  "restaurant review monitoring",
  "restaurant reputation management",
  "restaurant guest experience",
  "hospitality intelligence",
  "restaurant trends",
  "Google review monitoring",
  "restaurant sentiment analysis",
  "guest feedback",
  "restaurant marketing trends",
  "restaurant operations",
];

function safeText(input: string): string {
  let out = input.replace(/\s+/g, " ").trim();
  for (const banned of BRAND_SAFETY_BLOCK) {
    const pattern = new RegExp(banned, "ig");
    out = out.replace(pattern, "reference");
  }
  return out;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function markdownToHtml(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith("- ")) return `<li>${trimmed.slice(2)}</li>`;
      return `<p>${trimmed}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
}

function pickMainTheme(trends: TrendRecord[], articles: ArticleRecord[]): string {
  const candidate = trends[0]?.term || articles[0]?.title || "restaurant guest experience";
  return candidate.length > 70 ? candidate.slice(0, 70) : candidate;
}

function buildSeoTitle(mainTheme: string, keyword: string): string {
  const candidate = `Restaurant Trends This Week: ${mainTheme}`;
  if (candidate.length >= 50 && candidate.length <= 65) return candidate;
  const fallback = `Restaurant Trends This Week: ${keyword}`;
  return fallback.slice(0, 65);
}

function buildMetaDescription(keyword: string): string {
  const text = `Weekly hospitality insights for restaurant operators: search trends, guest behavior shifts, and ${keyword} takeaways with practical actions.`;
  return text.slice(0, 160);
}

function frontmatterToString(frontmatter: NewsletterFrontmatter): string {
  const rows = [
    "---",
    `title: "${frontmatter.title}"`,
    `seoTitle: "${frontmatter.seoTitle}"`,
    `metaDescription: "${frontmatter.metaDescription}"`,
    `slug: "${frontmatter.slug}"`,
    `excerpt: "${frontmatter.excerpt}"`,
    `publishedDate: "${frontmatter.publishedDate}"`,
    `updatedDate: "${frontmatter.updatedDate}"`,
    `category: ${frontmatter.category}`,
    `tags: [${frontmatter.tags.map((tag) => `"${tag}"`).join(", ")}]`,
    `sources: [${frontmatter.sources.map((source) => `"${source}"`).join(", ")}]`,
    `canonicalUrl: "${frontmatter.canonicalUrl}"`,
    ...(frontmatter.draft ? ["draft: true"] : []),
    "---",
  ];
  return rows.join("\n");
}

function buildSourceList(trends: TrendRecord[], articles: ArticleRecord[]): string[] {
  const trendSources = trends.map((item) => item.trendUrl);
  const articleSources = articles.map((item) => item.url);
  return Array.from(new Set([...trendSources, ...articleSources]));
}

function buildNewsletterBody(input: {
  title: string;
  subtitle: string;
  trends: TrendRecord[];
  articles: ArticleRecord[];
  mainFeature: string;
  takeaways: string[];
  sourceUrls: string[];
}): string {
  const trendSection = input.trends
    .map(
      (item, idx) =>
        `- **${item.term}** — ${item.operatorAngle} Source: [Google Trends item ${idx + 1}](${item.trendUrl})`,
    )
    .join("\n");
  const articleSection = input.articles
    .map(
      (item) =>
        `- **${item.title}** (${item.publisher}) — ${safeText(item.summary)}\n  Operator takeaway: ${safeText(
          item.operatorTakeaway,
        )}\n  Source: [${item.publisher}](${item.url})`,
    )
    .join("\n");
  const actionList = input.takeaways.map((item) => `- ${safeText(item)}`).join("\n");

  return [
    `# ${input.title}`,
    "",
    input.subtitle,
    "",
    "## Opening Signal",
    `This week, the strongest hospitality signal was **${safeText(
      input.mainFeature,
    )}**. Operators are seeing demand move quickly across value, speed, and experience expectations.`,
    "The weekly pattern points to one consistent theme: guests reward clarity and consistency. Teams that monitor search behavior and review feedback together can react faster than teams that rely on intuition alone.",
    "",
    "## What People Are Searching",
    trendSection,
    "",
    "## Restaurant Industry Watch",
    articleSection,
    "",
    "## Guest Signal Takeaway",
    "This week's signals reinforce the same operating truth: reputation is an output of daily execution. Response speed, message clarity, and service consistency still drive how guests describe your brand.",
    "",
    "## Action Checklist for Operators",
    actionList,
    "",
    "## CTA",
    "Want to know what your guests are already signaling? Request your free Guest Signal Snapshot.",
    "",
    "## Source List",
    ...input.sourceUrls.map((url) => `- ${url}`),
    "",
    "## Social Captions",
    `- **Instagram**: This Week in Hospitality Signals is live. We broke down the top search and guest-experience shifts restaurant operators should watch right now. Read the issue and run the checklist this week.`,
    `- **LinkedIn**: New issue: This Week in Hospitality Signals. We summarized weekly search trends, restaurant industry developments, and practical operator actions with source links. Built for owners and GMs who need clear next moves.`,
    "",
    "## Article Schema JSON-LD",
    "```json",
    JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: input.title,
        description: input.subtitle,
      },
      null,
      2,
    ),
    "```",
  ].join("\n");
}

function writeFailureLog(error: unknown): void {
  const dir = path.join(process.cwd(), "logs");
  ensureDir(dir);
  const file = path.join(dir, `weekly-newsletter-failure-${isoDay()}.log`);
  fs.writeFileSync(file, `${new Date().toISOString()}\n${String(error)}\n`, "utf8");
}

async function main() {
  ensureDir(NEWSLETTER_DIR);
  const trendsFile = latestJsonFile(TRENDS_DIR);
  const articlesFile = latestJsonFile(ARTICLES_DIR);
  if (!trendsFile || !articlesFile) {
    throw new Error("Missing data files. Run trend/article collectors first.");
  }

  const trends = (loadJsonFile<TrendRecord[]>(trendsFile) ?? []).sort((a, b) => scoreTrend(b.term) - scoreTrend(a.term));
  const articles = (loadJsonFile<ArticleRecord[]>(articlesFile) ?? []).sort((a, b) => scoreArticle(b) - scoreArticle(a));
  if (!trends.length || !articles.length) {
    throw new Error("Insufficient trend/article data to generate newsletter.");
  }

  const topTrends = trends.slice(0, 5);
  const topArticles = articles.slice(0, 5);
  const mainFeature = pickMainTheme(topTrends, topArticles);
  const baseDate = process.env.NEWSLETTER_FORCE_DATE
    ? new Date(`${process.env.NEWSLETTER_FORCE_DATE}T12:00:00.000Z`)
    : new Date();
  const keyword = KEYWORD_ROTATION[baseDate.getDate() % KEYWORD_ROTATION.length];
  const today = isoDay(baseDate);
  const slugTopic = slugify(mainFeature).slice(0, 36) || "restaurant-trends";
  const slug = `${today}-this-week-in-hospitality-signals-${slugTopic}`;

  const title = `This Week in Hospitality Signals: ${mainFeature}`;
  const subtitle = "Search trends, guest behavior signals, and operator takeaways for restaurants.";
  const seoTitle = buildSeoTitle(mainFeature, keyword);
  const metaDescription = buildMetaDescription(keyword);
  const excerpt = safeText(`Weekly hospitality intelligence for operators focused on ${mainFeature}.`);
  const sourceUrls = buildSourceList(topTrends, topArticles);
  const draftMode = process.env.NEWSLETTER_AUTO_PUBLISH !== "true";

  const body = buildNewsletterBody({
    title,
    subtitle,
    trends: topTrends.slice(0, 5),
    articles: topArticles.slice(0, 5),
    mainFeature,
    takeaways: [
      "Audit recent Google reviews for repeated complaints and assign one owner per issue.",
      "Check whether menu or pricing updates are explained clearly in-store and online.",
      "Respond to negative reviews within 24-48 hours with specific corrective language.",
      "Track social and review sentiment after any trend-driven campaign or menu change.",
      "Compare guest sentiment themes against one local competitor each week.",
    ],
    sourceUrls,
  });

  const frontmatter: NewsletterFrontmatter = {
    title,
    seoTitle,
    metaDescription,
    slug,
    excerpt,
    publishedDate: baseDate.toISOString(),
    updatedDate: new Date().toISOString(),
    category: "Newsletter",
    tags: [keyword, "restaurant trends", "guest experience", "hospitality intelligence"],
    sources: sourceUrls,
    canonicalUrl: `https://guestsignalhospitality.com/newsletter/${slug}/`,
    draft: draftMode ? true : undefined,
  };

  const markdown = `${frontmatterToString(frontmatter)}\n\n${body}\n`;
  const outputPath = path.join(NEWSLETTER_DIR, `${slug}.md`);
  fs.writeFileSync(outputPath, markdown, "utf8");
  console.log(`Generated newsletter: ${outputPath}`);

  if (!draftMode) {
    await sendNewsletterEmail({
      subject: title,
      markdown,
      html: markdownToHtml(body),
    });
  } else {
    console.log("NEWSLETTER_AUTO_PUBLISH=false; generated draft only.");
  }
}

main().catch((error) => {
  writeFailureLog(error);
  console.error("Newsletter generation failed:", error);
  process.exit(1);
});
