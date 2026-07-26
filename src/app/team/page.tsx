import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "About Guest Signal Hospitality — Operational Intelligence Team",
  description:
    "Meet the team behind Guest Signal Hospitality—hospitality operational intelligence, review analysis, and guest experience systems for restaurant owners.",
  alternates: { canonical: "/team/" },
};
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";
import { brand, team, teamPageProofPoints } from "@/content/site";

const values = [
  {
    title: "Everything we do is a reflection of who we are",
    desc: "We're not just consultants—we're operators who understand the day-to-day pressure of a busy dining room and a thin margin.",
  },
  {
    title: "We exist to take care of people",
    desc: "Independent restaurants keep neighborhoods vibrant. We help owners protect reputation, coach teams, and grow repeat visits.",
  },
  {
    title: "Practical fixes, not theory",
    desc: "Every recommendation ties back to guest language in reviews—so your team knows what to fix first and why it matters.",
  },
];

export default function TeamPage() {
  return (
    <div>
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Our Team</h1>
            <p className="mt-4 text-lg font-medium text-slate-800 md:text-xl">
              Operators and analysts who speak restaurant—and translate reviews into action.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              {brand.name} combines hospitality execution with structured review intelligence so owners get scorecards,
              priorities, and language their GMs can use the same week—not a slide deck that sits in a drawer.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center text-sm font-medium text-slate-700">
          {teamPageProofPoints.map((line) => (
            <span key={line} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
              {line}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Leadership" kicker="People">
        <div className="mx-auto grid max-w-2xl gap-8">
          {team.map((member) => (
            <Card key={member.name} className="text-center">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">{member.name}</h3>
              <p className="mt-1 text-sm font-medium text-amber-900/90">{member.title}</p>
              <p className="mt-4 text-left text-sm leading-relaxed text-slate-600">{member.bio}</p>
              {member.linkedin && member.linkedin !== "#" ? (
                <p className="mt-4">
                  <Link
                    href={member.linkedin}
                    className="text-sm font-semibold text-slate-800 underline underline-offset-2"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    LinkedIn
                  </Link>
                </p>
              ) : (
                <p className="mt-4 text-xs text-slate-400">LinkedIn coming soon</p>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Our Philosophy" kicker="Values">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v, idx) => (
            <Card key={idx} title={v.title} desc={v.desc} className="text-center" />
          ))}
        </div>
      </Section>

      <Section title="What We Do" kicker="Our Work">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-slate-600 md:text-base">
            Whether you start with a free snapshot or an ongoing plan, you get the same discipline: structured rubrics,
            clear priorities, and reporting your leadership team can act on.
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">For restaurant owners</h3>
              <ul className="mx-auto mt-4 inline-block space-y-2 text-left text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Turn Google reviews into themes, risks, and training hooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>SWOT-style snapshots grounded in what guests actually say</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Prioritized action plans—not a laundry list of ideas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Competitive context when you want to see how peers compare</span>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">How we work with you</h3>
              <ul className="mx-auto mt-4 inline-block space-y-2 text-left text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Plain English; no black-box “AI said so”</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Built for independents and small groups—not enterprise rollouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Optional portal access so your team can revisit scorecards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Cadence that scales from free snapshot → Monitor ($149) → Growth ($499) → Elevate ($999)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <CTA
            align="center"
            title="Want to work with us?"
            desc="We're always open to sharp operators and analysts who can translate guest feedback into real improvements."
            primaryHref="/careers"
            primaryLabel="See Careers"
            secondaryHref="/contact"
            secondaryLabel="Contact Us"
          />
          <CTA
            align="center"
            title="Ready to improve your restaurant?"
            desc="Get a free snapshot of your review signals and see how we help you turn guest feedback into growth."
            primaryHref="/snapshot/"
            primaryLabel="Get Free Snapshot"
            secondaryLabel="Start Signal Monitor — $149/mo"
            secondaryCheckout="signal_monitor"
          />
        </div>
      </Section>
    </div>
  );
}
