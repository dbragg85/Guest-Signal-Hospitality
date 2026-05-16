/**
 * Operator / automation prompts for Signal Elevate deliverables missing from rubric-only data.
 * Keys align with `elevate_gaps` on scorecards and `scripts/lib/elevate-deliverables.mjs`.
 */

export type ElevatePromptKey =
  | "menu_intelligence"
  | "menu_upload"
  | "social_handles"
  | "review_responses"
  | "competitor_set"
  | "executive_report"
  | "recovery_playbook";

export type ElevatePromptTemplate = {
  key: ElevatePromptKey;
  title: string;
  clientAsk: string;
  operatorPrompt: string;
  resolvesWith: string[];
};

export const ELEVATE_PROMPT_TEMPLATES: ElevatePromptTemplate[] = [
  {
    key: "menu_upload",
    title: "Menu on file",
    clientAsk:
      "Paste your current menu (sections and items) or share a public PDF / web menu link on Elevate intake. We use it to cluster guest mentions by dish and flag value or throughput themes.",
    operatorPrompt:
      "Using the restaurant menu_text (or fetched menu_source_url), list sections and items. Cross-reference review_observations for dish-level sentiment. Output: top 5 praised items, top 5 risk items, pricing/value perception note, throughput bottleneck hypothesis.",
    resolvesWith: ["menu_text", "menu_source_url"],
  },
  {
    key: "menu_intelligence",
    title: "Menu intelligence analysis",
    clientAsk:
      "After menu is on file, we publish item-level sentiment clusters and opportunity notes in your Elevate scorecard.",
    operatorPrompt:
      "Given menu items[] and category_scores + food-theme review quotes, produce menu item clusters (star performers, inconsistent execution, value complaints, missing from conversation). Include 3 operational tradeoffs (labor vs coverage vs margin).",
    resolvesWith: ["menu_text"],
  },
  {
    key: "social_handles",
    title: "Social mention tracking",
    clientAsk:
      "Share Instagram, Facebook, and TikTok handles (or page names) you want tracked alongside reviews.",
    operatorPrompt:
      "From social_presence_note and public profiles, summarize 30-day mention themes, reputation cross-signals vs Google/Yelp, and 3 response priorities. Flag channels not provided.",
    resolvesWith: ["social_presence_note"],
  },
  {
    key: "review_responses",
    title: "Review response drafting",
    clientAsk:
      "Confirm tone (warm professional, chef-forward, family-friendly) and any phrases to avoid. Elevate includes up to 30 drafted responses per month.",
    operatorPrompt:
      "For negative and neutral reviews in-window without owner reply, draft responses matching brand tone. Include recovery offer only when appropriate. Batch by theme (food, service, wait).",
    resolvesWith: ["goals", "review_observations"],
  },
  {
    key: "competitor_set",
    title: "Competitive intelligence set",
    clientAsk:
      "Name up to five local competitors (neighborhood + concept) so we can track ratings, review volume, and positioning monthly.",
    operatorPrompt:
      "Curate restaurants.competitors JSON (name, cuisine_style, distance_miles, google_rating, google_review_count). Summarize quarter-over-quarter deltas and 3 strategic implications.",
    resolvesWith: ["competitors_note", "competitors"],
  },
  {
    key: "executive_report",
    title: "Executive performance report",
    clientAsk:
      "Tell us who receives the monthly readout (owner, GM, multi-unit) and which KPIs matter beyond Guest Signal Score.",
    operatorPrompt:
      "One-page executive summary: headline score trend, pillar deltas, top 3 risks, top 3 wins, menu/social/competitive callouts, recommended decisions for next 30 days.",
    resolvesWith: ["goals", "guest_signal_score"],
  },
  {
    key: "recovery_playbook",
    title: "Guest recovery playbook",
    clientAsk:
      "Describe how you want negative reviews handled (who approves, comp policy limits, escalation to manager).",
    operatorPrompt:
      "Document SLA tiers (24h / 72h), approved recovery language, when to take offline, and 5 scenario templates mapped to common complaint themes from reviews.",
    resolvesWith: ["goals", "message"],
  },
];

export function elevatePromptByKey(key: string): ElevatePromptTemplate | undefined {
  return ELEVATE_PROMPT_TEMPLATES.find((p) => p.key === key);
}
