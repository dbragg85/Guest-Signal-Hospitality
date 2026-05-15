export type ServiceFaqItem = {
  question: string;
  answer: string;
};

export const servicesFaq: ServiceFaqItem[] = [
  {
    question: "What is hospitality operational intelligence?",
    answer:
      "It is the practice of turning guest reviews, search trends, and service signals into prioritized operational actions—staffing, menu clarity, recovery playbooks, and reputation response—not vanity metrics or generic marketing advice.",
  },
  {
    question: "How is Guest Signal different from reputation software?",
    answer:
      "Most tools alert you to new reviews. Guest Signal clusters themes, tracks competitors, and delivers owner-ready scorecards with specific next steps tied to guest language—so your GM can run changes the same week.",
  },
  {
    question: "What is included in the free Guest Signal Snapshot?",
    answer:
      "A complimentary Guest Signal Score, sentiment overview, strengths and risk areas, and an executive summary—typically delivered within 48 hours with no credit card required.",
  },
  {
    question: "Which plan fits an independent restaurant with one location?",
    answer:
      "Start with the free snapshot. Signal Monitor ($149/mo) gives foundational reputation intelligence and a Google visibility baseline. Signal Growth ($499/mo) adds AI-powered restaurant performance insights—value perception trends, sentiment patterns, competitor positioning, monthly opportunity analysis, and operational bottleneck observations from guest feedback. Signal Elevate ($999/mo) layers menu intelligence, pricing perception, throughput opportunities, operational tradeoff summaries, and executive performance reporting with managed execution.",
  },
  {
    question: "Do you work outside Cincinnati?",
    answer:
      "Yes. We are Cincinnati-rooted and serve restaurant, bar, and hotel operators nationwide. Deliverables are remote-friendly with optional on-site assessments on Elevate-tier engagements.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Review response and recovery discipline can shift guest perception within weeks. Operational fixes (speed, consistency, value framing) compound over 30–90 days as themes clear from new feedback.",
  },
];
