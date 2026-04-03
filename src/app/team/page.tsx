import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";

const values = [
  {
    title: "Everything we do is a reflection of who we are",
    desc: "We're not just consultants—we're operators who understand the day-to-day challenges of running a restaurant."
  },
  {
    title: "We exist to take care of people",
    desc: "Our mission is to help independent operators succeed by turning guest feedback into actionable improvements."
  },
  {
    title: "Practical fixes, not theory",
    desc: "Every recommendation is grounded in real data and designed to be executed by real teams in real restaurants."
  }
];

export default function TeamPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Our Team
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Operators + analysts focused on practical fixes, not theory. We're hospitality professionals who understand what it takes to run a successful restaurant.
            </p>
            <p className="mt-4 text-base text-slate-600">
              Our team combines deep operational experience with analytical expertise to deliver insights that actually work in the real world.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <Section title="Our Philosophy" kicker="Values">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v, idx) => (
            <Card key={idx} title={v.title} desc={v.desc} />
          ))}
        </div>
      </Section>

      {/* What We Do */}
      <Section title="What We Do" kicker="Our Work">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">For Restaurant Owners</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Turn Google Reviews into actionable insights</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Build SWOT analyses from real guest feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Create prioritized action plans you can execute</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Provide competitive positioning insights</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Our Approach</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Data-driven analysis, not guesswork</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Plain English reports, no jargon</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Practical solutions for real restaurants</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-400">•</span>
                  <span>Built for independent operators</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          <CTA
            title="Want to work with us?"
            desc="We're always open to sharp operators and analysts who can translate guest feedback into real improvements."
            primaryHref="/careers"
            primaryLabel="See Careers"
            secondaryHref="/contact"
            secondaryLabel="Contact Us"
          />
          <CTA
            title="Ready to improve your restaurant?"
            desc="Get a free snapshot of your review signals and see how we can help you turn guest feedback into growth."
            primaryHref="/services/inquiry?plan=free_snapshot"
            primaryLabel="Get Free Snapshot"
            secondaryHref="/services"
            secondaryLabel="View Services"
          />
        </div>
      </Section>
    </div>
  );
}
