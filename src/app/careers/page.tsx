import Link from "next/link";
import { jobs } from "@/content/site";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";

const benefits = [
  {
    title: "Competitive Compensation",
    desc: "Premium wages and performance-based incentives"
  },
  {
    title: "Health & Wellness",
    desc: "Health insurance, dental, and vision coverage options"
  },
  {
    title: "Work-Life Balance",
    desc: "Paid time off, flexible scheduling, and remote work options"
  },
  {
    title: "Professional Growth",
    desc: "Training opportunities, mentorship, and career development paths"
  },
  {
    title: "Industry Perks",
    desc: "Restaurant discounts, networking events, and hospitality industry access"
  },
  {
    title: "Meaningful Work",
    desc: "Help independent operators succeed with data-driven insights"
  }
];

const values = [
  "Data-driven decision making",
  "Practical, actionable solutions",
  "Respect for independent operators",
  "Continuous learning and improvement",
  "Collaborative team environment"
];

export default function CareersPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Join Our Team of Hospitality Analysts
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Help restaurants improve with data-driven insights and practical execution. Your growth is our goal.
            </p>
            <p className="mt-4 text-base text-slate-600">
              We're building a team of sharp operators and analysts who can translate guest feedback into real improvements. If you're passionate about hospitality and love turning data into actionable insights, we want to hear from you.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 inline-block"
              >
                Apply / Introduce Yourself
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <Section title="Why Work With Us" kicker="Benefits">
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((b) => (
            <Card key={b.title} title={b.title} desc={b.desc} />
          ))}
        </div>
      </Section>

      {/* Culture & Values */}
      <Section title="Our Values" kicker="Culture">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v, idx) => (
              <div key={idx} className="flex items-center">
                <span className="mr-3 text-slate-400">✓</span>
                <span className="text-sm text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Growth Message */}
      <Section>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 shadow-sm">
          <h3 className="text-2xl font-semibold tracking-tight">Your Growth Is Our Goal</h3>
          <p className="mt-4 text-slate-600 max-w-2xl">
            We invest in our team members through ongoing training, mentorship opportunities, and clear career paths. Whether you're starting your career in hospitality analytics or looking to grow your expertise, we provide the support and resources you need to succeed.
          </p>
          <div className="mt-6">
            <Link
              href="/team"
              className="text-sm font-semibold text-slate-900 underline underline-offset-4"
            >
              Meet Our Team →
            </Link>
          </div>
        </div>
      </Section>

      {/* Open Roles */}
      <Section title="Open Positions" kicker="Opportunities">
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((j) => (
            <Card key={j.title} title={j.title} desc={`${j.location} • ${j.type}`}>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {j.bullets.map((b) => (
                  <li key={b} className="flex items-start">
                    <span className="mr-2 text-slate-400">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 inline-block"
                >
                  Apply Now →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <CTA
          title="Don't see the right role? We'd still love to hear from you."
          desc="We're always looking for talented hospitality professionals. Send us a note and let's start a conversation."
          primaryLabel="Contact Us"
          secondaryLabel="Learn About Us"
          secondaryHref="/team"
        />
      </Section>
    </div>
  );
}
