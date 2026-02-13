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
  { label: "Free Snapshot", href: "/contact" },
  { label: "About", href: "/team" },
  { label: "Newsletter", href: "#newsletter" },
  { label: "Contact", href: "/contact" },
];

export const pricingPlans = [
  {
    name: "Signal Monitor",
    price: "$79",
    period: "month",
    badge: null,
    description: "Essential guest experience visibility.",
    features: [
      "Monthly Guest Signal Score",
      "Sentiment trend monitoring",
      "Google review monitoring",
      "Risk alerts",
      "Quarterly Intelligence Report"
    ],
    buttonText: "Start Monitoring",
    popular: false
  },
  {
    name: "Signal Growth",
    price: "$149",
    period: "month",
    badge: "Most Popular",
    description: "Active guest experience improvement.",
    features: [
      "Everything in Monitor, plus:",
      "Competitor tracking",
      "Monthly improvement insights",
      "Sentiment breakdown by category",
      "Monthly Growth Summary",
      "Priority alerts"
    ],
    buttonText: "Start Growing",
    popular: true
  },
  {
    name: "Signal Elevate",
    price: "$299",
    period: "month",
    badge: "Best Value",
    description: "Full guest reputation elevation.",
    features: [
      "Everything in Growth, plus:",
      "Professional review responses",
      "Weekly reputation monitoring",
      "Guest recovery response strategy",
      "Monthly Executive Intelligence Report",
      "Priority support"
    ],
    buttonText: "Elevate Your Reputation",
    popular: false
  }
];

export const freeSnapshot = {
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

export const team = [
  {
    name: "Your Name",
    title: "Founder / Restaurant Analyst",
    bio: "Hospitality operator with over [X] years of experience in restaurant operations, guest experience management, and data analysis. Passionate about helping independent operators succeed by turning guest feedback into actionable insights. Previously worked in [relevant experience] and understands the day-to-day challenges of running a successful restaurant.",
    linkedin: "#",
  },
  {
    name: "Advisor Name",
    title: "Advisor / Brand & Operations",
    bio: "Hospitality strategist with deep expertise in positioning, process optimization, coaching, and execution planning for owner-operators. Brings [X] years of experience helping restaurants improve guest experience and profitability through data-driven decision making.",
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
