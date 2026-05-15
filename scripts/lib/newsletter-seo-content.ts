import fs from "node:fs";
import path from "node:path";
import type { TopicCategorySlug } from "../../src/lib/newsletter/types";

const NEWSLETTER_DIR = path.join(process.cwd(), "src", "content", "newsletter");

type ThemeKey =
  | "review response speed"
  | "menu value positioning"
  | "service consistency under pressure"
  | "guest recovery playbooks"
  | "local marketing signal alignment";

const DEEP_DIVE_BY_THEME: Record<ThemeKey, string[]> = {
  "review response speed": [
    "Operators who treat review response as **reputation operations**—not marketing chores—set clear SLAs by severity. A one-star mention of slow service on a Saturday night should not wait until Monday’s social check-in.",
    "The highest-performing teams use three response spines: **recovery** (acknowledge + specific fix), **clarification** (correct factual gaps without arguing), and **gratitude** (reinforce what went right). Only the middle paragraph changes.",
    "Pair public responses with an internal log: table number or daypart, staff on floor, and whether the guest returned. Within 60 days you can see if speed alone improved sentiment or if the underlying operational miss persists.",
    "Benchmark one local competitor’s response latency and tone monthly. Guests compare you side by side in search results—your professionalism is visible before they click your menu.",
  ],
  "menu value positioning": [
    "Value pressure in 2026 is less about cheapest price and more about **expectation alignment**. Guests compare portion language, photos, and what prior reviewers said about fairness.",
    "Run a **top-five seller audit**: does each item state portion logic, included sides, and why the price makes sense for the experience? If not, FOH invents explanations under pressure.",
    "Promotions that only spike traffic without repeat mentions of “worth it” in reviews are margin leaks. Track repeat visit language separately from deal-driven first visits.",
    "Connect menu copy updates to GBP and Instagram in the same week search trends shift—split messaging trains guests to distrust every channel.",
  ],
  "service consistency under pressure": [
    "Peak-shift failures cluster at **handoff moments**: expo to server, bar to table, payment to goodbye. Reviews use verbs like ignored, forgotten, rushed—usually workflow, not attitude.",
    "A ten-minute pre-shift huddle that names **one complaint theme from last week** beats a generic “be hospitable” reminder. Teams fix what is named.",
    "Ticket-time data without review themes is incomplete. Cross-reference delay outliers with star ratings by daypart to see if kitchen, FOH, or both need the fix.",
    "Recovery after a peak miss matters: a manager table touch within two minutes prevents the review more often than a comp days later.",
  ],
  "guest recovery playbooks": [
    "Recovery language should be **role-specific**. Servers own acknowledgement; managers own authority; owners own high-LTV follow-up within 48 hours.",
    "Train away defensive phrasing (“policy says…”) in favor of ownership (“we missed this—here is what we are doing now”). Guests forgive mistakes; they do not forgive indifference.",
    "Track whether recovered guests update reviews or return within 30 days. Comp without follow-through rarely moves public sentiment.",
    "Align social DMs with review tone standards—guests expect the same voice everywhere.",
  ],
  "local marketing signal alignment": [
    "Local search intent shifts faster than quarterly brand decks. Weekly alignment means **one hero message** drawn from trends plus review praise words—not five disconnected promos.",
    "If searches favor value menus but reviews praise generous lunch portions, show the plate—not a stock image from three years ago.",
    "Post-campaign review spikes often reveal execution gaps, not creative gaps. Read new negatives within 72 hours of any promo launch.",
    "GBP description, hours, and specials should answer the top search phrase in plain language; burying intent in hashtag stacks wastes high-intent clicks.",
  ],
};

const METRICS_BY_TOPIC: Record<TopicCategorySlug, string[]> = {
  "reputation-management": [
    "Median hours-to-response on 1–3 star reviews",
    "Share of negative reviews mentioning response or accountability",
    "Week-over-week change in ‘would return’ language",
  ],
  "menu-engineering": [
    "Mentions of price fairness vs. portion satisfaction",
    "Repeat-visit language on promoted items",
    "Top-seller complaint rate after menu copy changes",
  ],
  "front-of-house": [
    "Ignored / rushed / forgotten theme volume by daypart",
    "Ticket-time outliers vs. same-day star average",
    "Recovery success rate after manager table touches",
  ],
  "service-recovery": [
    "Time from complaint to manager acknowledgement",
    "Recovered guests who update reviews within 30 days",
    "Repeat complaint themes after playbook rollout",
  ],
  "hospitality-marketing": [
    "Search term / review praise alignment score (manual weekly check)",
    "Negative review volume 72h post-campaign",
    "GBP clicks vs. prior four-week average",
  ],
  "restaurant-operations": [
    "Cross-location variance in top complaint themes",
    "Closing-the-loop rate on repeated issues",
    "Labor hours vs. complaint spikes by daypart",
  ],
  "guest-experience": [
    "Experience adjectives in 4–5 star reviews (consistency of language)",
    "Detractor themes that appear across multiple weeks",
    "Return-visit mentions tied to specific staff behaviors",
  ],
  "hospitality-technology": [
    "Alert-to-action time on review monitoring tools",
    "Theme coverage in monthly scorecard vs. ad-hoc reading",
    "Competitor rating delta month over month",
  ],
  "staff-retention": [
    "Complaint themes that correlate with new-hire weeks",
    "Service drift after turnover events",
    "Training completion vs. hospitality praise trends",
  ],
  "revenue-optimization": [
    "Check average vs. value-fairness mentions",
    "Promo-driven traffic vs. repeat-visit signals",
    "Margin-safe items in top praise themes",
  ],
};

export function buildOperatorDeepDive(themeLabel: string): string {
  const key = themeLabel as ThemeKey;
  const paragraphs = DEEP_DIVE_BY_THEME[key] ?? [
    "Connect this week's search signal to review language before changing promotions or staffing.",
    "Assign one owner to close the loop on the top repeated complaint theme within seven days.",
    "Document one operational change and review whether complaint themes shift within 14 days.",
    "Share the weekly signal with FOH and kitchen leads in the same pre-shift huddle.",
  ];
  return paragraphs.map((p) => `- ${p}`).join("\n");
}

export function buildMetricsSection(topicCategory: TopicCategorySlug): string {
  const metrics = METRICS_BY_TOPIC[topicCategory] ?? METRICS_BY_TOPIC["restaurant-operations"];
  return metrics.map((m) => `- ${m}`).join("\n");
}

export function buildCommonMistakes(themeLabel: string): string {
  const mistakes: Record<ThemeKey, string[]> = {
    "review response speed": [
      "Copy-paste apologies without naming the specific miss",
      "Letting responses age past 72 hours on high-impact negatives",
      "Arguing with reviewers in public threads",
    ],
    "menu value positioning": [
      "Deep discounting without updating portion expectations",
      "Changing prices without updating web, menu, and GBP in sync",
      "Ignoring ‘not worth it’ language while traffic holds steady",
    ],
    "service consistency under pressure": [
      "Adding labor only to kitchen while FOH handoffs break",
      "Skipping post-rush debriefs when ‘we survived’",
      "Treating every bad night as a staffing-only problem",
    ],
    "guest recovery playbooks": [
      "Comps without manager table presence",
      "Different recovery tone on social vs. Google",
      "No internal log—so the same miss repeats weekly",
    ],
    "local marketing signal alignment": [
      "Posting promos that reviews already contradict",
      "Updating ads but not in-store execution standards",
      "Measuring likes instead of post-launch review themes",
    ],
  };
  const key = themeLabel as ThemeKey;
  const list = mistakes[key] ?? ["Reacting to search trends without reading recent review themes."];
  return list.map((m) => `- ${m}`).join("\n");
}

export function buildGuestSignalCtaBlock(slug: string, topicCategory: TopicCategorySlug): string {
  return [
    "## Put signals into a scorecard",
    "",
    "Guest Signal Hospitality turns review clusters and competitive context into a **Guest Signal Score** and prioritized action list—built for operators who want operational intelligence, not generic agency dashboards.",
    "",
    `- Start with a [free Guest Signal Snapshot](/snapshot/) to baseline your location.`,
    `- Explore [monitoring plans](/services/) if you want monthly scorecards and alerts.`,
    `- Read more on [${topicLabelFromCategory(topicCategory)}](/topics/${topicCategory}/).`,
    `- Browse related briefs in [Hospitality Signals](/insights/).`,
    "",
    `This week's brief: [/insights/${slug}/](/insights/${slug}/).`,
  ].join("\n");
}

function topicLabelFromCategory(slug: TopicCategorySlug): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getPublishedSlugsExcluding(excludeSlug: string): string[] {
  if (!fs.existsSync(NEWSLETTER_DIR)) return [];
  const slugs: string[] = [];
  for (const file of fs.readdirSync(NEWSLETTER_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(NEWSLETTER_DIR, file), "utf8");
    if (raw.includes("draft: true")) continue;
    const match = raw.match(/\nslug:\s*"?([^"\n]+)"?/);
    if (!match) continue;
    const slug = match[1].trim();
    if (slug !== excludeSlug) slugs.push(slug);
  }
  return slugs;
}

export function pickRelatedSlugs(currentSlug: string, topicCategory: TopicCategorySlug, limit = 2): string[] {
  const candidates = getPublishedSlugsExcluding(currentSlug);
  if (candidates.length <= limit) return candidates.slice(0, limit);
  // Prefer variety: take most recent files by name (dated filenames sort) then shuffle lightly by topic hash
  const sorted = [...candidates].sort().reverse();
  return sorted.slice(0, limit);
}

export function estimateWordCount(markdown: string): number {
  return markdown
    .replace(/[#*_\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export const TARGET_WORD_MIN = 900;
export const TARGET_WORD_MAX = 1500;
