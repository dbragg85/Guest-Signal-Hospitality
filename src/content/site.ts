export type AudienceKey =
  | "independent"
  | "multiUnit"
  | "franchise"
  | "hospitalityGroups"
  | "newConcepts";

export const brand = {
  name: "Guest Signal Hospitality",
  tagline: "Clear review priorities for restaurant owners.",
  mission:
    "We turn restaurant reviews into a clear score, recurring themes, and a short action list owners and GMs can use immediately.",
  phone: "",
  email: "audit@guestsignalhospitality.com",
  city: "Cincinnati, OH",
  instagram: "https://www.instagram.com/guest_signal_hospitality/",
};

export const nav = [
  { label: "Plans", href: "/services/" },
  { label: "Markets", href: "/markets/" },
  { label: "Insights", href: "/insights/" },
  { label: "About", href: "/team/" },
  { label: "Contact", href: "/contact/" },
];

/** Query param `plan=` on `/services/inquiry/` (or legacy `/contact`) for service-specific intake */
export type PlanInquiryKey =
  | "free_snapshot"
  | "signal_monitor"
  | "signal_growth"
  | "signal_elevate";

export const PLAN_INQUIRY_LABELS: Record<PlanInquiryKey, string> = {
  free_snapshot: "Free Guest Signal Snapshot",
  signal_monitor: "Signal Monitor",
  signal_growth: "Signal Growth",
  signal_elevate: "Signal Elevate",
};

export function isPlanInquiryKey(v: string | null): v is PlanInquiryKey {
  return v !== null && Object.prototype.hasOwnProperty.call(PLAN_INQUIRY_LABELS, v);
}

/** /services: plan progression bridge between free snapshot and paid tiers. */
export const servicesPricingContext = {
  title: "How the plans progress",
  lead: "Each tier builds on the last—from AI-powered visibility and performance insights to menu intelligence and executive reporting with hands-on execution.",
  bullets: [
    "Signal Monitor ($149/mo; GUEST#1 founding $99/mo for 3 months) — foundational guest reputation and visibility monitoring.",
    "Signal Growth ($499/mo) — restaurant performance insights, value perception trends, sentiment patterns, and monthly opportunity analysis.",
    "Signal Elevate ($999/mo) — menu intelligence, pricing perception, operational tradeoffs, throughput opportunities, and executive performance reporting.",
  ],
} as const;

export const pricingPlans = [
  {
    inquiryKey: "signal_monitor" as const,
    name: "Signal Monitor",
    price: "$99",
    period: "month for 3 months",
    priceNote: "then $149/mo · code GUEST1",
    badge: "GUEST#1 founding",
    description:
      "Founding rate for the first 100 clients: $99/mo for 3 months, then $149/mo. Cancel anytime.",
    features: [
      "Monthly Guest Signal Score with category breakdown",
      "Google review sentiment monitoring",
      "Google Business Profile visibility snapshot",
      "Basic website and mobile health scan",
      "Reputation risk alerts within 72 hours",
      "One-page monthly intelligence digest",
      "AI-assisted review response suggestions, up to 10/month",
      "Quarterly owner checklist with next-step priorities",
    ],
    buttonText: "Start Monitor — $99/mo intro",
    popular: false,
  },
  {
    inquiryKey: "signal_growth" as const,
    name: "Signal Growth",
    price: "$499",
    period: "month",
    badge: "Most Popular",
    description:
      "A deeper monthly view of guest patterns, local position, and conversion opportunities.",
    features: [
      "Everything in Signal Monitor",
      "Restaurant Performance Insights",
      "Value perception trend analysis",
      "Guest sentiment pattern observations",
      "Competitor positioning summaries (up to 5 local restaurants)",
      "Monthly opportunity analysis",
      "Operational bottleneck observations based on guest feedback",
      "Google Business Profile optimization recommendations",
      "Local SEO scan and keyword opportunity tracking",
      "Website conversion and CTA recommendations",
      "Weekly sentiment breakdown by service theme",
      "Review generation funnel recommendations",
      "Monthly growth summary and owner action list",
    ],
    buttonText: "Start Signal Growth",
    popular: true,
  },
  {
    inquiryKey: "signal_elevate" as const,
    name: "Signal Elevate",
    price: "$999",
    period: "month",
    badge: "Managed support",
    description:
      "Hands-on analysis for operators balancing reputation, menu, labor, and revenue.",
    features: [
      "Everything in Signal Growth",
      "Menu Intelligence Analysis",
      "Menu item sentiment clustering",
      "Opportunity cost and throughput observations",
      "Pricing perception indicators",
      "Guest preference pattern tracking",
      "Operational tradeoff summaries",
      "Executive restaurant performance reporting",
      "Professional review response drafting, up to 30/month",
      "Social mention and reputation tracking for Instagram, Facebook, and TikTok where applicable",
      "Guest recovery response playbook",
      "Priority support with 24-hour response target",
      "Website optimization recommendations and implementation guidance",
      "Quarterly competitive intelligence review",
    ],
    buttonText: "Start Signal Elevate",
    popular: false,
  },
];

export const freeSnapshot = {
  inquiryKey: "free_snapshot" as const,
  title: "Start with a free Guest Signal Snapshot",
  price: "Free",
  description: "Get one clear score, the review themes behind it, and three priorities for your next manager meeting.",
  features: [
    "Guest Signal Score",
    "Review sentiment overview",
    "Key strengths and improvement areas",
    "Executive summary",
    "Delivered within 48 hours",
  ],
  buttonText: "Get your free snapshot",
  trustText: "No card. No obligation.",
};

/** /services page: SEO hero and snapshot scope (restaurant reputation, SEO, GBP). */
export const servicesPageSeo = {
  title: "Restaurant Reputation, SEO & Google Visibility Plans",
  intro:
    "Choose how much help you want turning reviews and visibility data into a short, useful action list.",
  supporting:
    "Every plan includes a scorecard, recurring guest themes, and clear next steps. Higher tiers add competitor, conversion, menu, and hands-on support.",
  snapshotHeading: "Start with a free snapshot",
  snapshotLead:
    "See your baseline and our work before choosing monthly support.",
  snapshotReviews: [
    "Google review sentiment and recurring guest themes",
    "Guest Signal Score with strengths and risk areas",
    "Google Business Profile visibility and listing health",
    "Website and mobile experience health (speed, clarity, core CTAs)",
    "Basic local SEO opportunities tied to how guests find you",
    "Competitor positioning against nearby restaurants",
    "Recommended plan fit: Signal Monitor ($149/mo), Signal Growth ($499/mo), or Signal Elevate ($999/mo)",
  ],
  plansKicker: "Paid plans",
  plansTitle: "Restaurant reputation management & local visibility plans",
  plansLead:
    "Progress from review monitoring to AI-powered performance intelligence—or Elevate for menu intelligence, operational tradeoffs, and executive reporting with managed support.",
} as const;

export const services = [
  {
    title: "Google Reviews Intelligence Audit",
    desc: "Extract themes, sentiment shifts, and operational bottlenecks from recent reviews—mapped to impact.",
    bullets: [
      "Sentiment & topic clustering",
      "Peak-hour pain points",
      "Service speed & hospitality drivers",
      "Owner response strategy",
    ],
  },
  {
    title: "SWOT + Competitive Snapshot",
    desc: "A clean owner-ready SWOT with local competitor context and positioning.",
    bullets: [
      "Strengths/weaknesses tied to feedback",
      "Opportunities for growth",
      "Threats and early warning signals",
      "Competitor comparison notes",
    ],
  },
  {
    title: "Reputation Recovery Plan",
    desc: "When ratings dip, we build a practical recovery plan operators can execute.",
    bullets: [
      "90-day recovery roadmap",
      "Quick wins vs. structural fixes",
      "Training priorities",
      "Weekly scorecard tracking",
    ],
  },
];

export const process = [
  {
    step: "01",
    title: "Baseline & data pull",
    desc: "Gather review data, identify trend shifts, and establish benchmarks.",
  },
  {
    step: "02",
    title: "Theme & driver analysis",
    desc: "Cluster feedback into drivers (speed, accuracy, hospitality, value, consistency).",
  },
  {
    step: "03",
    title: "SWOT + competitor context",
    desc: "Translate signals into strengths/weaknesses and opportunities/threats.",
  },
  {
    step: "04",
    title: "Action plan + scorecard",
    desc: "Deliver a prioritized plan with KPIs and simple weekly tracking.",
  },
];

export const audiences: Record<
  AudienceKey,
  { label: string; headline: string; points: string[] }
> = {
  independent: {
    label: "Independent Operators",
    headline: "Stabilize ratings, improve consistency, and grow repeat business.",
    points: [
      "Fix the biggest guest pain points fast",
      "Turn reviews into training priorities",
      "Simple SOPs your team can run",
    ],
  },
  multiUnit: {
    label: "Multi-Unit Groups",
    headline: "Standardize guest experience across locations—without killing speed.",
    points: [
      "Compare locations and spot drift",
      "Create a shared scorecard",
      "Scale what's working system-wide",
    ],
  },
  franchise: {
    label: "Franchise Operators",
    headline: "Hit brand standards and protect local reputation signals.",
    points: [
      "Align execution to brand expectations",
      "Reduce friction during peak rushes",
      "Improve service consistency and speed",
    ],
  },
  hospitalityGroups: {
    label: "Hospitality Groups",
    headline: "Protect reputation across concepts with early warning signals.",
    points: [
      "Detect rating drops early",
      "Cross-concept learnings",
      "Leadership-ready reporting",
    ],
  },
  newConcepts: {
    label: "New Concepts",
    headline: "Launch with feedback loops built in from day one.",
    points: [
      "First 90-day feedback cadence",
      "Process tuning before bad habits form",
      "Positioning and expectation alignment",
    ],
  },
};

/** Leadership bios for /team */
export const team = [
  {
    name: "David Bragg",
    title: "Founder & Lead Analyst",
    bio: "David bridges the line and the spreadsheet—turning review signals into training priorities, recovery plans, and owner-ready scorecards. He pairs that with positioning, service design, and execution planning so guest feedback becomes SOP tweaks, coaching cadences, and leadership talking points your team can actually run. Focused on independents and small groups who want clarity without corporate overhead.",
    linkedin: "https://www.linkedin.com/in/david-bragg-26073326",
  },
];

/** Short trust strip for /team — swap metrics as you collect public proof. */
export const teamPageProofPoints = [
  "Guest Signal Score™ methodology tied to real review themes—not a mystery number",
  "Cincinnati roots with nationwide delivery",
  "Start with a free snapshot before you commit to a plan",
  "Plain-English reporting your GM and owners can use the same week",
] as const;

export const jobs = [
  {
    title: "Restaurant Analyst (Contract)",
    location: "Cincinnati (Hybrid)",
    type: "Part-time / Contract",
    bullets: [
      "Turn review data into operator-ready insights and reports",
      "Draft SWOT analyses and prioritized action plans",
      "Support client calls, presentations, and follow-ups",
      "Analyze competitive positioning and market trends",
      "Collaborate with team to ensure high-quality deliverables"
    ],
  },
  {
    title: "Client Success Manager (Contract)",
    location: "Remote",
    type: "Part-time / Contract",
    bullets: [
      "Onboard new clients and manage delivery timelines",
      "Track KPIs and conduct weekly check-ins",
      "Coordinate report delivery and manage revision cycles",
      "Build relationships with restaurant owners and operators",
      "Gather feedback to continuously improve our services"
    ],
  },
  {
    title: "Hospitality Operations Consultant (Contract)",
    location: "Cincinnati / Remote",
    type: "Part-time / Contract",
    bullets: [
      "Provide operational expertise and recommendations",
      "Develop training materials and SOPs based on insights",
      "Support implementation of action plans",
      "Conduct on-site assessments when needed",
      "Share best practices from industry experience"
    ],
  },
];
