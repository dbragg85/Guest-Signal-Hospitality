import Link from "next/link";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";

const painPoints = [
  { 
    title: "Ratings slipping", 
    desc: "Identify the real causes (speed, accuracy, hospitality, value) and prioritize fixes that move the needle.",
    icon: "📉"
  },
  { 
    title: "Inconsistent service", 
    desc: "Turn recurring complaints into training themes and simple SOPs your team can execute consistently.",
    icon: "🔄"
  },
  { 
    title: "Bad reviews feel random", 
    desc: "We quantify patterns by time window and topic so you can act with confidence, not guesswork.",
    icon: "🎲"
  },
  { 
    title: "Competitors are winning", 
    desc: "We compare positioning and highlight what they're getting praised for—so you can compete effectively.",
    icon: "🏆"
  },
];

const solutions = [
  {
    title: "Review Intelligence",
    desc: "Extract actionable insights from guest feedback patterns",
    details: [
      "Sentiment analysis across all review platforms",
      "Topic clustering to identify recurring themes",
      "Time-based analysis to pinpoint peak problem hours",
      "Competitive benchmarking and positioning insights"
    ]
  },
  {
    title: "SWOT Analysis",
    desc: "Owner-ready strategic assessment built from real guest signals",
    details: [
      "Strengths tied to specific positive feedback patterns",
      "Weaknesses quantified by complaint frequency and impact",
      "Opportunities identified from competitor gaps",
      "Threats detected through early warning signals"
    ]
  },
  {
    title: "Action Planning",
    desc: "Prioritized roadmap with clear execution steps",
    details: [
      "30/60/90-day prioritized action plan",
      "Quick wins vs. structural fixes clearly marked",
      "Training priorities mapped to specific pain points",
      "Weekly scorecard with trackable KPIs"
    ]
  }
];

const deliverables = [
  "Sentiment + topic themes (what guests talk about most)",
  "Peak-hour breakdowns (when problems spike)",
  "SWOT built from review signals, not assumptions",
  "Competitor snapshot + positioning notes",
  "Prioritized 30/60/90-day action plan",
  "Weekly scorecard suggestions (simple, trackable)",
  "Training priorities mapped to specific feedback",
  "Owner response strategy recommendations"
];

const industries = [
  { name: "Fine Dining", desc: "Elevate guest experience through refined service analysis" },
  { name: "Casual Dining", desc: "Optimize speed and consistency during peak hours" },
  { name: "Fast Casual", desc: "Balance speed with hospitality to improve ratings" },
  { name: "QSR", desc: "Drive-through and counter service excellence" },
];

export default function RestaurantsIndustryPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Industry Focus
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Hospitality & Restaurants: Turn Guest Feedback Into Growth
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                You don't need another dashboard. You need clarity. We translate review signals into practical operational fixes that improve guest experience and profitability.
              </p>
              <p className="mt-4 text-base text-slate-600">
                Built for independent operators and restaurant groups who want data-driven insights without enterprise software complexity.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 text-center"
                >
                  Get Your Free Snapshot
                </Link>
                <Link
                  href="/services"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 text-center"
                >
                  View All Services
                </Link>
              </div>
            </div>

            {/* Image placeholder - can be replaced with actual image */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 p-12 shadow-lg">
              <div className="aspect-video rounded-2xl bg-slate-300 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Restaurant Image</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <Section title="Common Challenges We Solve" kicker="Pain Points">
        <div className="grid gap-6 md:grid-cols-2">
          {painPoints.map((p) => (
            <Card key={p.title} title={p.title} desc={p.desc} className="relative">
              <div className="absolute top-6 right-6 text-3xl">{p.icon}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Solutions */}
      <Section title="How We Help" kicker="Solutions">
        <div className="grid gap-8 md:grid-cols-3">
          {solutions.map((s) => (
            <Card key={s.title} title={s.title} desc={s.desc}>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {s.details.map((d, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-slate-400">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* Deliverables */}
      <Section title="What's Included" kicker="Deliverables">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {deliverables.map((d, idx) => (
              <div key={idx} className="flex items-start">
                <span className="mr-3 mt-1 flex-shrink-0 text-slate-400">✓</span>
                <span className="text-sm text-slate-700">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Restaurant Types */}
      <Section title="We Serve All Restaurant Types" kicker="Industries">
        <div className="grid gap-6 md:grid-cols-4">
          {industries.map((i) => (
            <Card key={i.name} title={i.name} desc={i.desc} />
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <CTA
          title="Ready to turn your reviews into actionable insights?"
          desc="Get a free snapshot of your review signals. We'll send a quick summary: top strengths, biggest risks, and 3 quick wins you can implement this week."
          primaryLabel="Get Free Snapshot"
          secondaryLabel="Learn More"
          secondaryHref="/services"
        />
      </Section>
    </div>
  );
}
