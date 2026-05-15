import type { SnapshotDeliverable, SnapshotPriority } from "@/lib/snapshot/types";

export const SNAPSHOT_INTAKE_PATH = "/snapshot/";

/** Every free snapshot includes these deliverables (shown on form + confirmation). */
export const SNAPSHOT_DELIVERABLES: SnapshotDeliverable[] = [
  { key: "guest_signal_score", label: "Guest Signal Score" },
  { key: "review_sentiment", label: "Review sentiment overview" },
  { key: "gbp_visibility", label: "Google Business Profile visibility notes" },
  { key: "website_mobile_health", label: "Website and mobile health notes" },
  { key: "seo_opportunities", label: "Basic SEO opportunities" },
  { key: "competitor_positioning", label: "Competitor positioning notes" },
  { key: "top_priorities", label: "Top 3 action priorities" },
  {
    key: "plan_fit",
    label:
      "Recommended plan fit: Signal Monitor ($149/mo), Signal Growth ($499/mo), or Signal Elevate ($999/mo)",
  },
];

export const SNAPSHOT_PRIORITY_OPTIONS: {
  value: SnapshotPriority;
  label: string;
  hint: string;
}[] = [
  {
    value: "reviews",
    label: "Reviews & reputation alerts",
    hint: "Sentiment, themes, and what guests are saying now",
  },
  {
    value: "google_visibility",
    label: "Google visibility",
    hint: "How you show up on Maps and Search",
  },
  {
    value: "seo",
    label: "Local SEO",
    hint: "Keywords, listings, and findability gaps",
  },
  {
    value: "website",
    label: "Website & conversion",
    hint: "Mobile experience, CTAs, and booking paths",
  },
  {
    value: "competitors",
    label: "Competitors",
    hint: "How nearby restaurants compare on visibility and reviews",
  },
  {
    value: "social_reputation",
    label: "Social & managed reputation",
    hint: "Mentions, responses, and coordinated guest recovery",
  },
  {
    value: "unsure",
    label: "Not sure — help me prioritize",
    hint: "We will recommend the best starting plan from your baseline",
  },
];
