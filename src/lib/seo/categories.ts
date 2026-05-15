export type TopicCategory = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
};

/** Topical hubs for hospitality operational intelligence */
export const topicCategories: TopicCategory[] = [
  {
    slug: "restaurant-operations",
    name: "Restaurant Operations",
    description:
      "Execution systems, shift readiness, and operational signals that keep service consistent when volume spikes.",
    keywords: ["restaurant operations", "shift execution", "operational intelligence"],
  },
  {
    slug: "guest-experience",
    name: "Guest Experience",
    description:
      "Guest journey signals, expectation alignment, and experience design for repeat visits and stronger reviews.",
    keywords: ["guest experience", "hospitality experience", "guest satisfaction"],
  },
  {
    slug: "hospitality-marketing",
    name: "Hospitality Marketing",
    description:
      "Local demand signals, message-market fit, and marketing alignment with what guests are already searching for.",
    keywords: ["restaurant marketing", "local marketing", "hospitality marketing"],
  },
  {
    slug: "service-recovery",
    name: "Service Recovery",
    description:
      "Frontline recovery playbooks, escalation paths, and trust repair when service misses guest expectations.",
    keywords: ["service recovery", "guest recovery", "complaint resolution"],
  },
  {
    slug: "menu-engineering",
    name: "Menu Engineering",
    description:
      "Value positioning, menu clarity, and pricing communication that protects margin and repeat visits.",
    keywords: ["menu engineering", "menu value", "restaurant pricing"],
  },
  {
    slug: "front-of-house",
    name: "Front-of-House Optimization",
    description:
      "FOH coaching, greeting standards, and service pacing that protect hospitality during peak periods.",
    keywords: ["front of house", "FOH training", "service consistency"],
  },
  {
    slug: "hospitality-technology",
    name: "Hospitality Technology",
    description:
      "Review intelligence, monitoring systems, and tooling that turns guest feedback into operator action.",
    keywords: ["hospitality technology", "review intelligence", "restaurant analytics"],
  },
  {
    slug: "reputation-management",
    name: "Reputation Management",
    description:
      "Review response discipline, reputation monitoring, and trust signals across Google and social channels.",
    keywords: ["reputation management", "Google reviews", "review monitoring"],
  },
  {
    slug: "staff-retention",
    name: "Staff Retention",
    description:
      "Team stability, coaching cadence, and culture signals that reduce turnover-driven service drift.",
    keywords: ["staff retention", "restaurant staffing", "team culture"],
  },
  {
    slug: "revenue-optimization",
    name: "Revenue Optimization",
    description:
      "Revenue levers tied to guest signals—check averages, repeat visits, and operational efficiency.",
    keywords: ["revenue optimization", "restaurant revenue", "profitability"],
  },
];

export function getTopicCategory(slug: string): TopicCategory | undefined {
  return topicCategories.find((c) => c.slug === slug.replace(/^\/+|\/+$/g, ""));
}
