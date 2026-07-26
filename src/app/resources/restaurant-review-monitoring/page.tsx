import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "Restaurant Review Monitoring: Themes, Alerts & Scorecards",
  description:
    "Restaurant review monitoring for operators: track Google and Yelp themes, risk alerts, and a monthly scorecard—not just star averages. Free snapshot available.",
  alternates: { canonical: "/resources/restaurant-review-monitoring/" },
  openGraph: {
    title: "Restaurant Review Monitoring: Themes, Alerts & Scorecards",
    description:
      "What to track when monitoring restaurant reviews—volume, themes, risks, and owner-ready next steps.",
    url: "/resources/restaurant-review-monitoring/",
  },
};

export default function RestaurantReviewMonitoringPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant review monitoring: themes, alerts, and scorecards",
    description:
      "Restaurant review monitoring for independent operators—Google and Yelp themes, risk alerts, and monthly scorecards.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is restaurant review monitoring?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Restaurant review monitoring tracks Google and Yelp feedback for recurring themes, risk spikes, and rating movement—so owners get a short weekly priority list instead of raw star averages.",
        },
      },
      {
        "@type": "Question",
        name: "How often should restaurants monitor reviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most independents do best with a monthly scorecard plus lightweight alerts when negative themes spike. Daily panic reading rarely beats a fixed weekly rhythm.",
        },
      },
      {
        "@type": "Question",
        name: "Is restaurant monitoring the same as reputation management software?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Restaurant monitoring should produce operator action—theme clusters and next fixes—not another inbox. Guest Signal focuses on scorecards and priorities your GM can run the same week.",
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/resources/" className="hover:underline">
              Resources
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant review monitoring: themes, alerts, and scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Restaurant review monitoring is not staring at star averages. It is catching{" "}
            <strong>themes</strong> early, knowing what moved this month, and giving your GM a short
            list of priorities—before a soft Google rating quietly cuts discovery.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">
            Restaurant monitoring that earns the click
          </h2>
          <p className="text-slate-700 leading-7">
            For the broader outcome guests see on Maps, see{" "}
            <Link
              href="/resources/restaurant-reputation/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              restaurant reputation
            </Link>
            . When negatives need a floor response system, use{" "}
            <Link
              href="/resources/guest-recovery-solutions/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              guest recovery solutions
            </Link>
            . Operators searching “restaurant review monitoring” or “restaurant monitoring” usually want
            one thing: a trustworthy read of Google and Yelp without living in five apps. The useful
            output is a score, the themes behind it, and three fixes—not a dump of every new comment.
          </p>

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
          <p className="text-slate-700">
            Pair monitoring with a clear repair path:{" "}
            <Link
              href="/resources/improve-google-restaurant-rating/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              how to improve your Google restaurant rating
            </Link>
            ,{" "}
            <Link
              href="/resources/google-reviews-for-restaurants/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              Google Reviews for restaurants
            </Link>
            , and city pages under{" "}
            <Link href="/markets/" className="font-semibold text-amber-900 underline underline-offset-2">
              Markets
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
          <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">What is restaurant review monitoring?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tracking Google and Yelp for recurring themes, risk spikes, and rating movement—so you
                get priorities, not noise.
              </p>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">How often should we monitor?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Monthly scorecard + alerts when themes spike. Daily doom-scrolling rarely beats a fixed
                weekly review with your GM.
              </p>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">
                Is this the same as generic reputation software?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                No. The job is operator action—score, themes, next three fixes—not another inbox.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">Start with a free snapshot</h2>
          <p className="text-slate-700">
            If you want to see how this looks for your concept before committing to a plan, start with
            a complimentary Guest Signal Snapshot (score, themes, strengths, and risks).
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Get your free snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
            <Link href="/services/" className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2">
              Compare all plans
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
