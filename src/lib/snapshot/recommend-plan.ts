import { pricingPlans } from "@/content/site";
import type { PlanInquiryKey } from "@/content/site";
import { SNAPSHOT_PRIORITY_OPTIONS } from "@/lib/snapshot/constants";
import type { SnapshotPlanRecommendation, SnapshotPriority } from "@/lib/snapshot/types";

export function snapshotPriorityLabel(priority: SnapshotPriority): string {
  return SNAPSHOT_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
}

/**
 * Recommend paid plan from snapshot priority (universal lead magnet — not a purchase commitment).
 */
export function recommendSnapshotPlan(priority: SnapshotPriority): SnapshotPlanRecommendation {
  let planKey: Exclude<PlanInquiryKey, "free_snapshot"> = "signal_monitor";

  if (priority === "social_reputation") {
    planKey = "signal_elevate";
  } else if (
    priority === "google_visibility" ||
    priority === "seo" ||
    priority === "website" ||
    priority === "competitors"
  ) {
    planKey = "signal_growth";
  } else if (priority === "reviews") {
    planKey = "signal_monitor";
  } else {
    // unsure — start with visibility baseline; Growth if they need more than monitoring
    planKey = "signal_monitor";
  }

  const plan = pricingPlans.find((p) => p.inquiryKey === planKey)!;

  const rationaleByPlan: Record<typeof planKey, string> = {
    signal_monitor:
      "Based on your focus, you will benefit most from foundational review visibility, sentiment monitoring, and reputation risk alerts before adding heavier SEO or managed support.",
    signal_growth:
      "Your priorities point to performance intelligence—visibility, sentiment patterns, value perception, competitor context, and monthly opportunity analysis—where Signal Growth turns guest feedback into operational priorities.",
    signal_elevate:
      "You indicated needs that match menu intelligence, pricing perception, throughput opportunities, operational tradeoffs, and executive performance reporting—with hands-on reputation execution.",
  };

  return {
    planKey,
    planName: plan.name,
    rationale: rationaleByPlan[planKey],
    ctaLabel: plan.buttonText,
    ctaHref: `/services/inquiry/?plan=${planKey}`,
  };
}
