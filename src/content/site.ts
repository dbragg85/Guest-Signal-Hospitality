export type AudienceKey =
  | "independent"
  | "multiUnit"
  | "franchise"
  | "hospitalityGroups"
  | "newConcepts";

export const brand = {
  name: "Guest Signal Hospitality",
  tagline: "Operational intelligence for restaurant owners.",
  mission:
    "We turn Google Reviews into clear, actionable insights—SWOT, reputation signals, competitive positioning, and a prioritized action plan that improves guest experience and profitability.",
  phone: "(513) 000-0000",
  email: "audit@guestsignalhospitality.com",
  city: "Cincinnati, OH",
  instagram: "https://www.instagram.com/guest_signal_hospitality/",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "Plans", href: "/services" },
  { label: "About", href: "/team" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Client Portal", href: "/portal" },
  { label: "Contact", href: "/contact" },
];

/** Query param `plan=` on `/services/inquiry` (or legacy `/contact`) for service-specific intake */
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

/** /services: short “why these price points” bridge between free snapshot and paid tiers. */
export const servicesPricingContext = {
  title: "Why these price points",
  lead: "Teams often spend similar amounts on reputation software or light guest-experience help—we stay in that band on purpose, with tiers so you only buy the depth you need.",
  bullets: [
    "That market is usually roughly $80–200/mo for basics and higher when you add multi-site reporting and leadership-ready rollups; advisory-style support often lands in the low hundreds to low thousands depending on involvement.",
    "Start with the free snapshot, then choose Monitor, Growth, or Elevate as you want more signal, peer context, or hands-on review and social coordination.",
  ],
} as const;

export const pricingPlans = [
  {
    inquiryKey: "signal_monitor" as const,
    name: "Signal Monitor",
    price: "$79",
    period: "month",
    badge: null,
    description: "Essential visibility with a monthly scorecard and 72-hour alerting.",
    features: [
      "Monthly Guest Signal Score with category breakdown",
      "Sentiment trend monitoring across Google reviews",
      "Risk alerts delivered within 72 hours",
      "One-page monthly intelligence digest",
      "Quarterly owner readout and next-step checklist"
    ],
    buttonText: "Start With Signal Monitor",
    popular: false,
  },
  {
    inquiryKey: "signal_growth" as const,
    name: "Signal Growth",
    price: "$149",
    period: "month",
    badge: "Most Popular",
    description: "Active improvement with faster reporting and monthly priorities.",
    features: [
      "Everything in Monitor, plus:",
      "Competitor tracking for 3 local peers",
      "Weekly sentiment breakdown by category",
      "Monthly improvement roadmap with top 5 priorities",
      "48-hour priority alerts for rating drops",
      "Monthly growth summary and owner action list",
      "90-day rolling theme view so priorities stay tied to recent guest feedback",
      "Peer comparison snapshots on hospitality, speed, and value vs. each tracked competitor",
      "Month-over-month Guest Signal trend with plain-language what-moved callouts",
    ],
    buttonText: "Choose Signal Growth",
    popular: true,
  },
  {
    inquiryKey: "signal_elevate" as const,
    name: "Signal Elevate",
    price: "$299",
    period: "month",
    badge: "Best Value",
    description:
      "Our highest tier: hands-on reputation elevation plus social media tracking, mention monitoring, and coordinated management alongside review intelligence.",
    features: [
      "Everything in Growth, plus:",
      "Social tracking: mentions, tags, and DMs on Instagram, Facebook, and TikTok (where applicable), tied to review signals",
      "Monthly social + review narrative with recommended posts/replies, escalation flags, and light content cadence guidance",
      "Ongoing coordination for social and review response pacing (aligned with your brand voice)",
      "Professional review response drafting (up to 20/month)",
      "Weekly reputation monitoring and coaching notes",
      "Guest recovery response playbook with SLA targets",
      "Monthly executive intelligence report + KPI review",
      "Priority support with 24-hour response SLA",
    ],
    buttonText: "Request Signal Elevate",
    popular: false,
  },
];

export const freeSnapshot = {
  inquiryKey: "free_snapshot" as const,
  title: "Start With Your Free Guest Signal Snapshot",
  price: "Free",
  description: "See how your restaurant is performing through the eyes of your guests. Your complimentary snapshot provides immediate visibility into your reputation, strengths, and risk areas.",
  features: [
    "Guest Signal Score",
    "Review sentiment overview",
    "Key strengths and improvement areas",
    "Executive summary",
    "Delivered within 48 hours"
  ],
  buttonText: "Get Your Free Snapshot",
  trustText: "No obligation. No credit card required."
};

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
