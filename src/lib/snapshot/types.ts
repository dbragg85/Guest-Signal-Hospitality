import type { PlanInquiryKey } from "@/content/site";

/** What the operator wants prioritized in the free snapshot. */
export type SnapshotPriority =
  | "reviews"
  | "google_visibility"
  | "seo"
  | "website"
  | "competitors"
  | "social_reputation"
  | "unsure";

export type SnapshotDeliverableKey =
  | "guest_signal_score"
  | "review_sentiment"
  | "gbp_visibility"
  | "website_mobile_health"
  | "seo_opportunities"
  | "competitor_positioning"
  | "top_priorities"
  | "plan_fit";

export type SnapshotDeliverable = {
  key: SnapshotDeliverableKey;
  label: string;
};

export type SnapshotPlanRecommendation = {
  planKey: Exclude<PlanInquiryKey, "free_snapshot">;
  planName: string;
  rationale: string;
  ctaLabel: string;
  ctaHref: string;
};

export type SnapshotIntakePayload = {
  name: string;
  email: string;
  business: string;
  websiteUrl: string;
  gbpUrl: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  snapshotPriority: SnapshotPriority;
  message: string;
};
