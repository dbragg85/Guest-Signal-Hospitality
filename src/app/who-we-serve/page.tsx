import Link from "next/link";
import { audiences } from "@/content/site";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Tabs } from "@/components/Tabs";
import { CTA } from "@/components/CTA";

const audienceDetails: Record<keyof typeof audiences, {
  icon: string;
  challenges: string[];
  solutions: string[];
  outcomes: string[];
}> = {
  independent: {
    icon: "🏪",
    challenges: [
      "Limited resources to analyze guest feedback systematically",
      "Ratings slipping without clear understanding of root causes",
      "Competing priorities make it hard to focus on what matters most"
    ],
    solutions: [
      "Quick snapshot of review signals in plain English",
      "Prioritized action plan focused on highest-impact fixes",
      "Simple SOPs and training priorities your team can execute"
    ],
    outcomes: [
      "Stabilize ratings and improve consistency",
      "Grow repeat business through better guest experience",
      "Make data-driven decisions without complex software"
    ]
  },
  multiUnit: {
    icon: "🏢",
    challenges: [
      "Inconsistent guest experience across locations",
      "Difficulty identifying which locations need the most attention",
      "Lack of standardized metrics and reporting"
    ],
    solutions: [
      "Location-by-location comparison and benchmarking",
      "Shared scorecard and KPIs across all units",
      "Best practice identification and system-wide scaling"
    ],
    outcomes: [
      "Standardize guest experience without killing speed",
      "Identify and scale what's working best",
      "Data-driven decisions for resource allocation"
    ]
  },
  franchise: {
    icon: "🍔",
    challenges: [
      "Balancing brand standards with local market needs",
      "Peak-hour service quality during rushes",
      "Protecting local reputation while maintaining brand consistency"
    ],
    solutions: [
      "Review analysis aligned with brand expectations",
      "Peak-hour optimization strategies",
      "Local positioning insights while maintaining brand standards"
    ],
    outcomes: [
      "Hit brand standards consistently",
      "Improve service speed and quality during peak times",
      "Protect and improve local reputation signals"
    ]
  },
  hospitalityGroups: {
    icon: "🏨",
    challenges: [
      "Managing reputation across multiple concepts",
      "Early detection of rating drops before they become crises",
      "Cross-concept learning and knowledge sharing"
    ],
    solutions: [
      "Multi-concept monitoring and early warning systems",
      "Cross-concept analysis and best practice sharing",
      "Leadership-ready reporting and strategic insights"
    ],
    outcomes: [
      "Protect reputation across all concepts",
      "Detect issues early and respond proactively",
      "Scale successful strategies across the portfolio"
    ]
  },
  newConcepts: {
    icon: "🚀",
    challenges: [
      "Establishing feedback loops from day one",
      "Tuning operations before bad habits form",
      "Aligning guest expectations with concept positioning"
    ],
    solutions: [
      "First 90-day feedback cadence and analysis",
      "Process optimization based on early guest signals",
      "Positioning validation and expectation management"
    ],
    outcomes: [
      "Launch with feedback systems built in",
      "Optimize operations before problems compound",
      "Align guest expectations with concept reality"
    ]
  }
};

export default function WhoWeServePage() {
  const items = (Object.entries(audiences) as Array<
    [keyof typeof audiences, (typeof audiences)[keyof typeof audiences]]
  >).map(([key, val]) => {
    const details = audienceDetails[key as keyof typeof audienceDetails];
    return {
      key,
      label: val.label,
      content: (
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{details.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold tracking-tight">{val.headline}</h3>
                <p className="mt-2 text-slate-600">Tailored solutions for {val.label.toLowerCase()}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card title="Common Challenges" desc="What you might be facing">
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {details.challenges.map((c, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-slate-400">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="How We Help" desc="Our approach">
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {details.solutions.map((s, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-slate-400">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Expected Outcomes" desc="What you'll achieve">
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {details.outcomes.map((o, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-slate-400">→</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Focus Areas" desc="What we focus on">
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {val.points.map((p, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ),
    };
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Who We Serve
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Built for operators who want practical improvement, not "marketing speak." We serve independent operators, multi-unit groups, franchises, hospitality groups, and new concepts.
            </p>
            <p className="mt-4 text-base text-slate-600">
              Each operator type faces unique challenges. Our approach is tailored to your specific needs, whether you're running a single location or managing a portfolio of concepts.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <Section title="Choose Your Operator Type" kicker="Segments">
        <Tabs items={items} initialKey="independent" />
      </Section>

      {/* CTA Section */}
      <Section>
        <CTA
          title="Not sure where you fit?"
          desc="Send us your restaurant name and concept type, and we'll recommend the best starting path for your situation."
          primaryLabel="Talk to Us"
          secondaryLabel="View Services"
          secondaryHref="/services"
        />
      </Section>

      {/* Additional Info */}
      <Section title="Why Choose Guest Signal" kicker="Our Approach">
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            title="Operator-Focused" 
            desc="Built by operators, for operators. We speak your language and understand your challenges."
          />
          <Card 
            title="Data-Driven" 
            desc="No guesswork. Every recommendation is backed by real guest feedback signals and analysis."
          />
          <Card 
            title="Practical & Actionable" 
            desc="Clear, prioritized action plans you can execute immediately—no enterprise software required."
          />
        </div>
      </Section>
    </div>
  );
}
