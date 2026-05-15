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
  email: "hello@guestsignalhospitality.com",
  city: "Cincinnati, OH",
  instagram: "https://www.instagram.com/guest_signal_hospitality/",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "Plans", href: "/services" },
  { label: "Free Snapshot", href: "/snapshot/" },
  { label: "About", href: "/team" },
  { label: "Newsletter", href: "#newsletter" },
  { label: "Contact", href: "/contact" },
];

export const pricingPlans = [
  {
    inquiryKey: "signal_monitor" as const,
    name: "Signal Monitor",
    price: "$149",
    period: "month",
    badge: null,
    description: "Foundational guest reputation and visibility monitoring.",
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
    buttonText: "Start With Signal Monitor",
    popular: false,
  },
  {
    inquiryKey: "signal_growth" as const,
    name: "Signal Growth",
    price: "$499",
    period: "month",
    badge: "Most Popular",
    description:
      "AI-powered restaurant visibility and performance intelligence—guest sentiment patterns, value perception trends, and monthly opportunity analysis grounded in how guests experience your operation.",
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
    buttonText: "Choose Signal Growth",
    popular: true,
  },
  {
    inquiryKey: "signal_elevate" as const,
    name: "Signal Elevate",
    price: "$999",
    period: "month",
    badge: "Premium Managed Support",
    description:
      "Premium managed reputation plus menu intelligence, pricing perception, throughput opportunities, and executive performance reporting for operators balancing guest experience, labor, and revenue.",
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
    buttonText: "Request Signal Elevate",
    popular: false,
  },
];

export const freeSnapshot = {
  inquiryKey: "free_snapshot" as const,
  title: "Start With Your Free Guest Signal Snapshot",
  price: "Free",
  description:
    "See how your restaurant is performing through the eyes of your guests. Your complimentary snapshot provides immediate visibility into your reputation, strengths, and risk areas.",
  features: [
    "Guest Signal Score",
    "Review sentiment overview",
    "Key strengths and improvement areas",
    "Executive summary",
    "Delivered within 48 hours",
  ],
  buttonText: "Get Your Free Snapshot",
  trustText: "No obligation. No credit card required.",
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

export const team = [
  {
    name: "Your Name",
    title: "Founder / Restaurant Analyst",
    bio: "Hospitality operator with deep experience in restaurant operations, guest experience management, and data analysis.",
    linkedin: "#",
  },
];

export const jobs = [
  {
    title: "Restaurant Analyst (Contract)",
    location: "Cincinnati (Hybrid)",
    type: "Part-time / Contract",
    bullets: [
      "Turn review data into operator-ready insights and reports",
      "Draft SWOT analyses and prioritized action plans",
      "Support client calls, presentations, and follow-ups",
    ],
  },
];
