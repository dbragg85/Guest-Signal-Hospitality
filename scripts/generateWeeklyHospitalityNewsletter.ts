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
import {
  TARGET_WORD_MAX,
  TARGET_WORD_MIN,
  buildCommonMistakes,
  buildGuestSignalCtaBlock,
  buildMetricsSection,
  buildOperatorDeepDive,
  estimateWordCount,
  pickRelatedSlugs,
} from "./lib/newsletter-seo-content";

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
    topicCategory: "reputation-management" as const,
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
    topicCategory: "menu-engineering" as const,
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
    topicCategory: "front-of-house" as const,
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
    topicCategory: "service-recovery" as const,
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
    topicCategory: "hospitality-marketing" as const,
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
const THEME_MAIN_FEATURES: Record<string, string> = {
  "review response speed": "Review response speed that protects guest trust",
  "menu value positioning": "Menu value positioning for repeat-visit confidence",
  "service consistency under pressure": "Service consistency under pressure during peak shifts",
  "guest recovery playbooks": "Guest recovery playbooks for frontline teams",
  "local marketing signal alignment": "Local marketing signal alignment with live guest intent",
};

/** Second paragraph under Opening Signal — rotates so issues do not read identical week to week. */
const OPENING_FOLLOWUPS = [
  "Search spikes are only useful when paired with what guests already say in reviews: look for mismatches between promise and proof.",
  "If one theme dominates local search, your menu, hours, and GBP copy should answer that intent in plain language—not buried in marketing fluff.",
  "Teams that assign one owner to connect search themes to weekly service adjustments usually see fewer repeat complaints in the same category.",
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

/**
 * Weekly hero trend: rotate among the top scored pool so we do not always feature trends[0]
 * (important when the collector returns several rows or manual fallback has many terms).
 */
function pickTrendPoolAndPrimary(
  trends: TrendRecord[],
  articles: ArticleRecord[],
  weekIndex: number,
): { primary: TrendRecord; orderedForIssue: TrendRecord[] } {
  const sorted = [...trends].sort((a, b) => scoreTrend(b.term) - scoreTrend(a.term));
  if (!sorted.length) {
    const fake: TrendRecord = {
      term: articles[0]?.title ?? "restaurant guest experience",
      source: "Manual",
      geo: "US",
      category: "Food & Drink",
      timeWindow: "past 7 days",
      searchVolumeLabel: "N/A",
      trendUrl: "https://trends.google.com/trending?geo=US&category=5&hours=168",
      collectedAt: new Date().toISOString(),
      operatorAngle: "Treat this as demand signal context and check whether guest expectations are shifting faster than current operations.",
    };
    return { primary: fake, orderedForIssue: [fake] };
  }
  const pool = sorted.slice(0, Math.min(5, sorted.length));
  const primaryIdx = weekIndex % pool.length;
  const primary = pool[primaryIdx]!;
  const otherInPool = pool.filter((_, i) => i !== primaryIdx);
  const deeper = sorted.slice(pool.length);
  const orderedForIssue = [primary, ...otherInPool, ...deeper].slice(0, 5);
  return { primary, orderedForIssue };
}

function pickBackfillMainTheme(themeLabel: string, trends: TrendRecord[]): string {
  const themed = THEME_MAIN_FEATURES[themeLabel];
  if (themed) return themed;
  const trendFallback = trends[0]?.term;
  return trendFallback || "restaurant guest experience priorities";
}

/** SEO title: lead with the actual Google-trends-style phrase (primary term), length-safe. */
function buildTrendAwareSeoTitle(primaryTerm: string, keyword: string): string {
  const stem = safeText(primaryTerm).slice(0, 52);
  const candidate = `Restaurant trends: ${stem}`;
  if (candidate.length >= 45 && candidate.length <= 65) return candidate;
  if (candidate.length > 65) return candidate.slice(0, 62).trimEnd() + "...";
  const fallback = `Restaurant trends: ${keyword}`.slice(0, 65);
  return fallback;
}

/** Meta description: primary + optional secondary trend phrase + operator keyword (not generic filler). */
function buildTrendAwareMetaDescription(
  primaryTerm: string,
  secondaryTerm: string | null,
  keyword: string,
): string {
  const sec =
    secondaryTerm && safeText(secondaryTerm) !== safeText(primaryTerm)
      ? ` Also rising: ${safeText(secondaryTerm)}.`
      : "";
  const text = `Weekly hospitality signals for restaurant owners—${safeText(primaryTerm)}.${sec} ${safeText(keyword)} takeaways and actions.`;
  return text.slice(0, 160);
}

function buildTrendAwareExcerpt(
  primaryTerm: string,
  secondaryTerm: string | null,
  themeLabel: string,
): string {
  const sec =
    secondaryTerm && safeText(secondaryTerm) !== safeText(primaryTerm)
      ? ` Related search theme: ${safeText(secondaryTerm)}.`
      : "";
  return safeText(`This week: ${safeText(primaryTerm)}. Operator lens: ${themeLabel}.${sec}`).slice(0, 220);
}

function buildNewsletterTags(keyword: string, primaryTerm: string, secondaryTerm: string | null): string[] {
  const tags = new Set<string>();
  tags.add(keyword);
  tags.add("restaurant trends");
  const primaryTag = safeText(primaryTerm).split(/\s+/).slice(0, 5).join(" ").slice(0, 56);
  if (primaryTag) tags.add(primaryTag);
  if (secondaryTerm && safeText(secondaryTerm) !== safeText(primaryTerm)) {
    tags.add(safeText(secondaryTerm).split(/\s+/).slice(0, 4).join(" ").slice(0, 56));
  }
  tags.add("guest experience");
  tags.add("hospitality intelligence");
  return Array.from(tags).slice(0, 8);
}

function buildOperatorLensParagraph(primaryTerm: string, themeLabel: string): string {
  return `We are framing **${safeText(primaryTerm)}** through **${safeText(themeLabel)}**. Compare that search intent to the last few weeks of Google reviews at your location—if the words guests use do not match what people are searching for, update menu copy, response tone, and training priorities before you spend on promos.`;
}

function frontmatterToString(frontmatter: NewsletterFrontmatter): string {
  const rows = [
    "---",
    `title: "${frontmatter.title}"`,
    `seoTitle: "${frontmatter.seoTitle}"`,
    `metaDescription: "${frontmatter.metaDescription}"`,
    `slug: "${frontmatter.slug}"`,
    ...(frontmatter.legacySlug ? [`legacySlug: "${frontmatter.legacySlug}"`] : []),
    `excerpt: "${frontmatter.excerpt}"`,
    `publishedDate: "${frontmatter.publishedDate}"`,
    `updatedDate: "${frontmatter.updatedDate}"`,
    `category: ${frontmatter.category}`,
    `topicCategory: ${frontmatter.topicCategory}`,
    `tags: [${frontmatter.tags.map((tag) => `"${tag}"`).join(", ")}]`,
    `sources: [${frontmatter.sources.map((source) => `"${source}"`).join(", ")}]`,
    `canonicalUrl: "${frontmatter.canonicalUrl}"`,
    ...(frontmatter.heroImage ? [`heroImage: "${frontmatter.heroImage}"`] : []),
    ...(frontmatter.relatedSlugs?.length
      ? [`relatedSlugs: [${frontmatter.relatedSlugs.map((s) => `"${s}"`).join(", ")}]`]
      : []),
    ...(frontmatter.featured ? ["featured: true"] : []),
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
  openingFollowup: string;
  operatorLens: string;
  secondaryTrendLabel: string | null;
  themeLabel: string;
  topicCategory: NewsletterFrontmatter["topicCategory"];
  slug: string;
  trendsAreLive: boolean;
}): string {
  const trendSection = input.trends
    .map(
      (item, idx) =>
        `- **${item.term}** — ${item.operatorAngle} Source: [${
          item.source === "Google Trends" ? `Google Trends item ${idx + 1}` : "operator watchlist"
        }](${item.trendUrl})`,
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

  const secondaryLine =
    input.secondaryTrendLabel && safeText(input.secondaryTrendLabel) !== safeText(input.mainFeature)
      ? input.trendsAreLive
        ? `\nAlso watch search traction around **${safeText(input.secondaryTrendLabel)}**—note whether your public listings and menu language already answer that intent.`
        : `\nAlso monitor **${safeText(input.secondaryTrendLabel)}** as an operator watchlist topic—not a verified search spike.`
      : "";

  return [
    `# ${input.title}`,
    "",
    input.subtitle,
    "",
    "## Opening Signal",
    input.trendsAreLive
      ? `This week, the primary hospitality search theme is **${safeText(input.mainFeature)}**. ${safeText(
          input.openingDetail,
        )}${secondaryLine}`
      : `This week's operator focus is **${safeText(input.mainFeature)}**. ${safeText(
          input.openingDetail,
        )}${secondaryLine}`,
    safeText(input.openingFollowup),
    "",
    "## Operator lens",
    safeText(input.operatorLens),
    "",
    "## Operator deep dive",
    buildOperatorDeepDive(input.themeLabel),
    "",
    "## Metrics to track this week",
    buildMetricsSection(input.topicCategory),
    "",
    "## Common mistakes operators make",
    buildCommonMistakes(input.themeLabel),
    "",
    input.trendsAreLive ? "## What People Are Searching" : "## Operator Watchlist",
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
    "## Source List",
    ...input.sourceUrls.map((url) => `- ${url}`),
    "",
    buildGuestSignalCtaBlock(input.slug, input.topicCategory),
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
  const forcedDate = process.env.NEWSLETTER_FORCE_DATE?.trim();
  const forcedTrendsFile = forcedDate ? path.join(TRENDS_DIR, `${forcedDate}.json`) : null;
  const forcedArticlesFile = forcedDate ? path.join(ARTICLES_DIR, `${forcedDate}.json`) : null;
  if (
    forcedDate &&
    (!forcedTrendsFile ||
      !forcedArticlesFile ||
      !fs.existsSync(forcedTrendsFile) ||
      !fs.existsSync(forcedArticlesFile))
  ) {
    throw new Error(`Missing trend/article data files for forced date ${forcedDate}.`);
  }
  const trendsFile = forcedTrendsFile ?? latestJsonFile(TRENDS_DIR);
  const articlesFile = forcedArticlesFile ?? latestJsonFile(ARTICLES_DIR);
  if (!trendsFile || !articlesFile) {
    throw new Error("Missing data files. Run trend/article collectors first.");
  }

  const trends = loadJsonFile<TrendRecord[]>(trendsFile) ?? [];
  const articles = (loadJsonFile<ArticleRecord[]>(articlesFile) ?? []).sort((a, b) => scoreArticle(b) - scoreArticle(a));
  if (!trends.length || !articles.length) {
    throw new Error("Insufficient trend/article data to generate newsletter.");
  }

  const baseDate = forcedDate
    ? new Date(`${forcedDate}T12:00:00.000Z`)
    : new Date();
  const weekIndex = Math.floor(baseDate.getTime() / (7 * 24 * 60 * 60 * 1000));
  const keyword = KEYWORD_ROTATION[weekIndex % KEYWORD_ROTATION.length];
  const today = isoDay(baseDate);
  const theme = WEEKLY_THEMES[weekIndex % WEEKLY_THEMES.length];
  const isBackfillRun = Boolean(process.env.NEWSLETTER_FORCE_DATE);

  const { primary, orderedForIssue } = pickTrendPoolAndPrimary(trends, articles, weekIndex);
  const topTrends = orderedForIssue;
  const topArticles = articles.slice(0, 5);
  const trendsAreLive = topTrends.some((trend) => {
    const collectedAt = new Date(trend.collectedAt).getTime();
    return (
      trend.source === "Google Trends" &&
      Number.isFinite(collectedAt) &&
      collectedAt >= baseDate.getTime() - 14 * 24 * 60 * 60 * 1000
    );
  });
  const hasFreshArticle = topArticles.some((article) => {
    const publishedAt = new Date(article.publishedDate).getTime();
    return (
      Number.isFinite(publishedAt) &&
      publishedAt >= baseDate.getTime() - 14 * 24 * 60 * 60 * 1000
    );
  });
  const secondaryTrendLabel = topTrends[1]?.term ?? null;
  const trendAnchoredFeature =
    primary.term.length > 70 ? primary.term.slice(0, 70) : primary.term;
  const mainFeature =
    isBackfillRun || !trendsAreLive
      ? pickBackfillMainTheme(theme.label, topTrends)
      : trendAnchoredFeature;
  const slugTopic = slugify(mainFeature).slice(0, 48) || "restaurant-trends";
  const slug = `${today}-${slugTopic}`;
  const legacySlug = `${today}-this-week-in-hospitality-signals-${slugTopic.slice(0, 36)}`;

  const title = `This Week in Hospitality Signals: ${mainFeature}`;
  const subtitle = trendsAreLive
    ? "Search trends, guest behavior signals, and operator takeaways for restaurants."
    : "Recent industry coverage, operator watchlist topics, and practical restaurant takeaways.";
  const seoTrendPhrase = primary.term;
  const seoTitle = buildTrendAwareSeoTitle(seoTrendPhrase, keyword);
  const metaDescription = buildTrendAwareMetaDescription(seoTrendPhrase, secondaryTrendLabel, keyword);
  const excerpt = buildTrendAwareExcerpt(
    isBackfillRun ? mainFeature : primary.term,
    secondaryTrendLabel,
    theme.label,
  );
  const sourceUrls = buildSourceList(topTrends, topArticles);
  const autoPublishRequested = process.env.NEWSLETTER_AUTO_PUBLISH === "true";
  const draftMode = !autoPublishRequested || !hasFreshArticle;
  if (autoPublishRequested && !hasFreshArticle) {
    console.warn("Auto-publish blocked: no source article from the last 14 days.");
  }
  const checklist = theme.actions;
  const openingDetail = theme.opening;
  const guestTakeawayText = theme.takeaway;
  const openingFollowup = OPENING_FOLLOWUPS[weekIndex % OPENING_FOLLOWUPS.length] ?? OPENING_FOLLOWUPS[0]!;
  const operatorLens = buildOperatorLensParagraph(primary.term, theme.label);
  ensureDir(NEWSLETTER_BANNER_DIR);
  const heroImage = `/newsletter-banners/${slug}.svg`;
  const bannerSvg = createBannerSvg(mainFeature, subtitle, today);
  fs.writeFileSync(path.join(NEWSLETTER_BANNER_DIR, `${slug}.svg`), bannerSvg, "utf8");

  const relatedSlugs = pickRelatedSlugs(slug, theme.topicCategory, 2);

  const body = buildNewsletterBody({
    title,
    subtitle,
    trends: topTrends,
    articles: topArticles.slice(0, 5),
    mainFeature,
    takeaways: checklist,
    sourceUrls,
    openingDetail,
    guestTakeawayText,
    openingFollowup,
    operatorLens,
    secondaryTrendLabel,
    themeLabel: theme.label,
    topicCategory: theme.topicCategory,
    slug,
    trendsAreLive,
  });

  const wordCount = estimateWordCount(body);
  if (wordCount < TARGET_WORD_MIN) {
    console.warn(
      `Newsletter word count ${wordCount} is below target ${TARGET_WORD_MIN}-${TARGET_WORD_MAX}. Consider adding source articles.`,
    );
  } else if (wordCount > TARGET_WORD_MAX) {
    console.log(`Newsletter word count ${wordCount} (target max ${TARGET_WORD_MAX}).`);
  } else {
    console.log(`Newsletter word count ${wordCount} (within ${TARGET_WORD_MIN}-${TARGET_WORD_MAX} target).`);
  }

  const frontmatter: NewsletterFrontmatter = {
    title,
    seoTitle,
    metaDescription,
    slug,
    excerpt,
    publishedDate: baseDate.toISOString(),
    updatedDate: new Date().toISOString(),
    category: "Newsletter",
    tags: buildNewsletterTags(keyword, seoTrendPhrase, secondaryTrendLabel),
    sources: sourceUrls,
    canonicalUrl: `https://guestsignalhospitality.com/insights/${slug}/`,
    legacySlug,
    topicCategory: theme.topicCategory,
    relatedSlugs,
    featured: draftMode ? undefined : true,
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
    console.log(
      autoPublishRequested
        ? "Newsletter kept as draft by the source-freshness quality gate."
        : "NEWSLETTER_AUTO_PUBLISH=false; generated draft only.",
    );
  }
}

main().catch((error) => {
  writeFailureLog(error);
  console.error("Newsletter generation failed:", error);
  process.exit(1);
});
