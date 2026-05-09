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

const NEWSLETTER_BANNER_DIR = path.join(process.cwd(), "public", "newsletter-banners");
const WEEKLY_THEMES = [
  {
    label: "review response speed",
    opening: "Guest behavior this week points to tighter expectations around response quality and accountability.",
    takeaway:
      "Faster, specific review responses reduce trust erosion and give teams clearer feedback loops for service recovery.",
    actions: [
      "Track average response time to negative and neutral reviews each week.",
      "Create three approved response templates for speed and tone consistency.",
      "Escalate recurring complaint categories to operations within 24 hours.",
      "Assign one manager each shift to monitor and route review friction signals.",
      "Compare response quality against one local competitor each week.",
    ],
  },
  {
    label: "menu value positioning",
    opening: "Search and review signals suggest guests are scrutinizing value communication more than discount size.",
    takeaway:
      "Value perception improves when menu language, portion expectations, and service consistency are aligned.",
    actions: [
      "Audit top-selling menu items for clarity on portion and value framing.",
      "Update one pricing explanation touchpoint on menu, web, or social channels.",
      "Track mentions of price fairness in weekly review summaries.",
      "Train front-of-house on one sentence that explains current value proposition.",
      "Check whether promotions drive repeat visits, not only one-time traffic.",
    ],
  },
  {
    label: "service consistency under pressure",
    opening: "Operators are seeing demand variability expose handoff and speed inconsistencies during peak windows.",
    takeaway:
      "Consistency in execution still beats occasional spikes in demand when protecting long-term reputation.",
    actions: [
      "Review staffing handoff quality during peak shifts and note repeat breakdowns.",
      "Run one pre-shift briefing focused on top complaint themes this week.",
      "Cross-check ticket-time outliers against review sentiment by daypart.",
      "Assign one owner to close the loop on every repeated complaint theme.",
      "Measure service recovery outcomes after escalations within 48 hours.",
    ],
  },
  {
    label: "guest recovery playbooks",
    opening: "This week's pattern shows guests reward quick acknowledgement and clear recovery actions after mistakes.",
    takeaway:
      "Restaurants that standardize recovery language and follow-through protect trust faster than ad hoc responses.",
    actions: [
      "Publish a simple guest recovery playbook for managers and leads.",
      "Set 24-48 hour SLA targets for high-impact complaint responses.",
      "Track whether recovered guests mention improved experience in follow-up reviews.",
      "Capture top three service failures and assign root-cause fixes this week.",
      "Audit social reply tone to ensure alignment with review response standards.",
    ],
  },
  {
    label: "local marketing signal alignment",
    opening: "Search momentum this week indicates operators should align local messaging with what guests are actively seeking.",
    takeaway:
      "Marketing performs better when weekly content reflects real guest language from reviews and search behavior.",
    actions: [
      "Map top search terms to one menu or service message update this week.",
      "Update Google Business Profile copy to match current guest intent language.",
      "Track social and review sentiment after each promotional post.",
      "Compare campaign promises against in-store execution consistency.",
      "Use one weekly insights recap to sync owners, managers, and marketing.",
    ],
  },
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
    ...(frontmatter.heroImage ? [`heroImage: "${frontmatter.heroImage}"`] : []),
    ...(frontmatter.draft ? ["draft: true"] : []),
    "---",
  ];
  return rows.join("\n");
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createBannerSvg(title: string, subtitle: string, dateLabel: string): string {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeDate = escapeXml(dateLabel);
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
  <text x="96" y="240" fill="#FFFFFF" font-size="64" font-family="Inter, Arial, sans-serif" font-weight="700">${safeTitle}</text>
  <text x="96" y="332" fill="#CBD5E1" font-size="34" font-family="Inter, Arial, sans-serif">${safeSubtitle}</text>
  <text x="96" y="760" fill="#F8FAFC" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="600">Guest Signal Hospitality</text>
  <text x="1340" y="760" fill="#94A3B8" font-size="24" text-anchor="end" font-family="Inter, Arial, sans-serif">${safeDate}</text>
</svg>`;
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
  openingDetail: string;
  guestTakeawayText: string;
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
    `This week, the strongest hospitality signal was **${safeText(input.mainFeature)}**. ${safeText(
      input.openingDetail,
    )}`,
    "The weekly pattern points to one consistent theme: guests reward clarity and consistency. Teams that monitor search behavior and review feedback together can react faster than teams that rely on intuition alone.",
    "",
    "## What People Are Searching",
    trendSection,
    "",
    "## Restaurant Industry Watch",
    articleSection,
    "",
    "## Guest Signal Takeaway",
    safeText(input.guestTakeawayText),
    "",
    "## Action Checklist for Operators",
    actionList,
    "",
    "## Get Your Free Guest Signal Snapshot",
    "Want to know what your guests are already signaling? Request your free Guest Signal Snapshot.",
    "",
    "## Source List",
    ...input.sourceUrls.map((url) => `- ${url}`),
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
  const weekIndex = Math.floor(baseDate.getTime() / (7 * 24 * 60 * 60 * 1000));
  const keyword = KEYWORD_ROTATION[weekIndex % KEYWORD_ROTATION.length];
  const today = isoDay(baseDate);
  const theme = WEEKLY_THEMES[weekIndex % WEEKLY_THEMES.length];
  const slugTopic = slugify(mainFeature).slice(0, 36) || "restaurant-trends";
  const slug = `${today}-this-week-in-hospitality-signals-${slugTopic}`;

  const title = `This Week in Hospitality Signals: ${mainFeature} and ${theme.label}`;
  const subtitle = "Search trends, guest behavior signals, and operator takeaways for restaurants.";
  const seoTitle = buildSeoTitle(mainFeature, keyword);
  const metaDescription = buildMetaDescription(keyword);
  const excerpt = safeText(`Weekly hospitality intelligence for operators focused on ${mainFeature}.`);
  const sourceUrls = buildSourceList(topTrends, topArticles);
  const draftMode = process.env.NEWSLETTER_AUTO_PUBLISH !== "true";
  const checklist = theme.actions;
  const openingDetail = theme.opening;
  const guestTakeawayText = theme.takeaway;
  ensureDir(NEWSLETTER_BANNER_DIR);
  const heroImage = `/newsletter-banners/${slug}.svg`;
  const bannerSvg = createBannerSvg(mainFeature, subtitle, today);
  fs.writeFileSync(path.join(NEWSLETTER_BANNER_DIR, `${slug}.svg`), bannerSvg, "utf8");

  const body = buildNewsletterBody({
    title,
    subtitle,
    trends: topTrends.slice(0, 5),
    articles: topArticles.slice(0, 5),
    mainFeature,
    takeaways: checklist,
    sourceUrls,
    openingDetail,
    guestTakeawayText,
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
    heroImage,
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
