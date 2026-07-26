import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Restaurant Review Scorecard: Pillars, Themes & Weekly Moves",
  description:
    "What a restaurant review scorecard should measure: experience, ops, and emotional pillars—not vanity star averages—plus themes, SWOT, and three floor moves.",
  alternates: { canonical: "/resources/restaurant-review-scorecard/" },
  openGraph: {
    title: `Restaurant Review Scorecard | ${brand.name}`,
    description:
      "Operator guide to restaurant review scorecards: weighted pillars, theme friction, peer context, and a weekly action list.",
    url: "/resources/restaurant-review-scorecard/",
  },
};

export default function RestaurantReviewScorecardPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant review scorecard: pillars, themes, and weekly moves",
    description:
      "How independent restaurants use a restaurant review scorecard to turn Google and Yelp feedback into floor priorities.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a restaurant review scorecard?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A restaurant review scorecard turns recent Google and Yelp reviews into weighted pillar scores, theme friction, and a short list of floor-facing moves—so owners act on patterns instead of chasing a star average.",
        },
      },
      {
        "@type": "Question",
        name: "How is a review scorecard different from a star rating?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Star ratings collapse every visit into one number. A scorecard separates experience quality, operational reliability, and emotional connection, then ranks themes by how often guests mention friction.",
        },
      },
      {
        "@type": "Question",
        name: "How often should restaurants update a review scorecard?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Monthly is enough for most independents; weekly when volume is high or a Maps rating is soft. Each run should end with three owner-assigned moves for the floor.",
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
            Restaurant review scorecard: pillars, themes, and weekly moves
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            A restaurant review scorecard is not a prettier star average. It is an operator report
            that turns Google and Yelp language into weighted pillars, theme friction, and three
            moves the floor can run this week.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What a useful restaurant review scorecard includes
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Headline score from pillars</strong> — experience quality, operational
                reliability, and emotional connection (weighted), not a vanity blend of every star.
              </li>
              <li>
                <strong>Theme friction</strong> — food, service, speed, cleanliness, atmosphere, and
                return intent ranked by softness × mention frequency.
              </li>
              <li>
                <strong>SWOT tied to evidence</strong> — strengths and weaknesses from scored
                themes; opportunities and threats from peer pressure and unresolved patterns.
              </li>
              <li>
                <strong>Three floor moves</strong> — owner-ready actions for the next pre-shift, not
                a 40-page PDF.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Scorecard vs. review inbox tools
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Inbox platforms optimize for reply speed and review asks. That matters—and it is not
              the same job as deciding which guest theme is costing you Maps trust. If you are
              comparing stacks, read{" "}
              <Link
                href="/resources/guest-signal-vs-review-tools/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Guest Signal vs review tools
              </Link>
              . Pair the scorecard with{" "}
              <Link
                href="/resources/restaurant-review-monitoring/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant review monitoring
              </Link>{" "}
              for the weekly cadence.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              How to run a scorecard in 30 minutes
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>Pull the last 30 days of Google + Yelp reviews (written text preferred).</li>
              <li>Score pillars from themes guests actually mention—not every category by default.</li>
              <li>Sort themes by impact: how soft the score is × how often it appears.</li>
              <li>
                Assign three moves. When Maps is the bottleneck, use{" "}
                <Link
                  href="/resources/improve-google-restaurant-rating/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  improve Google restaurant rating
                </Link>
                .
              </li>
              <li>
                Re-check next period. Reputation is a cadence—see{" "}
                <Link
                  href="/resources/restaurant-reputation/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant reputation
                </Link>
                .
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What is a restaurant review scorecard?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  An operator report that turns recent reviews into weighted pillars, theme friction,
                  and a short list of floor-facing moves.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How is it different from a star rating?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Stars collapse every visit into one number. A scorecard separates experience, ops,
                  and emotional connection, then ranks themes by friction impact.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">How often should we update it?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Monthly for most independents; weekly when volume is high or Maps is soft. Every
                  run should end with three assigned moves.
                </p>
              </div>
            </div>
          </div>

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
            <Link
              href="/resources/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              All reputation guides
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
