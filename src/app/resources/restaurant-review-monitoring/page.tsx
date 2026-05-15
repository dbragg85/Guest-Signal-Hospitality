import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";

export const metadata: Metadata = {
  title: "Restaurant Review Monitoring Guide",
  description:
    "Learn what to track when monitoring restaurant reviews: sentiment themes, risk alerts, competitor context, and monthly scorecards.",
  alternates: { canonical: "/resources/restaurant-review-monitoring/" },
};

export default function RestaurantReviewMonitoringPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant review monitoring that operators actually use",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/resources/" className="hover:underline">
              Resources
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant review monitoring that operators actually use
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Monitoring is not about staring at star averages. It is about catching{" "}
            <strong>themes</strong> early, knowing what moved this month, and giving your GM a short
            list of priorities.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">What “good” monitoring includes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>
              <strong>Volume and recency</strong> — Are reviews accelerating after a menu change,
              staffing shift, or busy holiday weekend?
            </li>
            <li>
              <strong>Theme clusters</strong> — Hospitality, speed, food quality, value, and
              consistency usually matter more than one angry sentence.
            </li>
            <li>
              <strong>Risk signals</strong> — Repeated complaints about the same failure mode
              (long waits, cold food, billing) deserve a faster response than a one-off rant.
            </li>
            <li>
              <strong>Peer context</strong> — Your guests compare you to the other options on their
              phone; a local benchmark keeps the story honest.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">Monthly rhythm beats daily panic</h2>
          <p className="text-slate-700">
            Most independent restaurants do best with a <strong>monthly scorecard</strong> plus
            lightweight alerting when something important shifts. That is the model behind Guest
            Signal plans—from essential monitoring to growth and elevate tiers with deeper peer and
            social context.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Start with a free snapshot</h2>
          <p className="text-slate-700">
            If you want to see how this looks for your concept before committing to a plan, start with
            a complimentary Guest Signal Snapshot (score, themes, strengths, and risks).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Get your free snapshot
            </ServicesIntakeLink>
            <Link href="/services/" className="btn-secondary">
              View plans
            </Link>
            <Link href="/resources/" className="text-sm font-semibold text-amber-900 underline underline-offset-2">
              More resources
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
