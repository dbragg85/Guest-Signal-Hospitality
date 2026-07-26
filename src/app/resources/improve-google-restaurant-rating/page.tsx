import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "How to Improve Your Google Restaurant Rating",
  description:
    "Operator playbook to improve a Google restaurant rating: fix recurring guest themes, respond faster, grow review velocity, and run a weekly scorecard cadence.",
  alternates: { canonical: "/resources/improve-google-restaurant-rating/" },
  openGraph: {
    title: `How to Improve Your Google Restaurant Rating | ${brand.name}`,
    description:
      "Practical steps independent restaurants use to lift Google ratings without gimmicks—themes, responses, velocity, and weekly priorities.",
    url: "/resources/improve-google-restaurant-rating/",
  },
};

export default function ImproveGoogleRestaurantRatingPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to improve your Google restaurant rating",
    description:
      "A practical operator playbook for improving Google restaurant ratings with themes, response discipline, and weekly cadence.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How long does it take to improve a Google restaurant rating?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Meaningful movement usually takes weeks, not days. Recent reviews weigh more than old ones, so fixing recurring themes and keeping response + velocity steady compounds faster than one promotional push.",
        },
      },
      {
        "@type": "Question",
        name: "Should I delete negative Google reviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Only report reviews that clearly violate Google’s policies. For legitimate criticism, respond publicly, fix the operational cause, and let newer positive experiences dilute the impact.",
        },
      },
      {
        "@type": "Question",
        name: "What moves a Google restaurant rating the most?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Recurring guest themes (speed, value, consistency), response quality, and steady review velocity. Star-chasing without operational fixes rarely holds.",
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
            How to improve your Google restaurant rating
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Guests shortlist from Maps before they read your menu. A stuck or slipping Google rating
            usually means the same operational themes keep showing up—and nobody is turning them into
            a short weekly plan.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">What actually moves the number</h2>
            <p className="mt-3 text-slate-700 leading-7">
              Google ratings are a lagging score of guest experience. For independent restaurants, the
              levers that matter are: recurring complaint themes, how fast and specifically you reply,
              and whether fresh reviews keep arriving. One-off “please leave a 5-star” pushes without
              fixing the floor rarely hold.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Themes over anecdotes.</strong> Three wait-time complaints in a week beat one
                viral rant as a training priority.
              </li>
              <li>
                <strong>Response quality.</strong> Specific recovery language signals you run the
                place—not a template apology.
              </li>
              <li>
                <strong>Velocity.</strong> A slow drip of recent reviews keeps the rating current;
                silence freezes an old average in place.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">Week-one playbook</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                Pull the last 30–60 days of Google (and Yelp) reviews. Tag each mention: food, service,
                speed, value, cleanliness, atmosphere.
              </li>
              <li>
                Pick the top two negative themes by frequency—not by how loud the review felt.
              </li>
              <li>
                Write one floor-facing fix per theme (host pacing, expo checks, ticket times) and one
                public response pattern that names the recovery step.
              </li>
              <li>
                Assign an owner for unanswered reviews older than 48 hours. Clear the backlog in one
                sitting.
              </li>
              <li>
                Set a weekly 15-minute scorecard review: score, theme movement, open risks, next three
                fixes. See{" "}
                <Link
                  href="/resources/restaurant-review-monitoring/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review monitoring
                </Link>
                .
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Stop confusing rating repair with reputation theater
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Posting more photos, rewriting your Google Business Profile description, and running a
              one-week review ask can help—but they do not replace fixing the experience guests keep
              naming. If “slow,” “inconsistent,” or “not worth it” repeats, Maps will keep showing a
              soft trust signal no matter how polished the listing looks.
            </p>
            <p className="mt-3 text-slate-700 leading-7">
              For how ratings interact with local search visibility, read{" "}
              <Link
                href="/resources/restaurant-seo-google-ratings/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant SEO and Google ratings
              </Link>{" "}
              and{" "}
              <Link
                href="/resources/google-restaurant-ratings/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Google restaurant ratings
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">City-level searches</h2>
            <p className="mt-3 text-slate-700 leading-7">
              Operators searching “improve Google rating” often add a city. {brand.name} publishes
              market pages for those queries—start at{" "}
              <Link href="/markets/" className="font-semibold text-amber-900 underline underline-offset-2">
                Markets
              </Link>{" "}
              (including{" "}
              <Link
                href="/markets/cincinnati-oh/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Cincinnati
              </Link>
              )—or request a free snapshot for your concept.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How long does it take to improve a Google restaurant rating?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Meaningful movement usually takes weeks. Recent reviews weigh more than old ones, so
                  theme fixes plus steady velocity compound faster than a single campaign.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How do I get more reviews while improving my rating?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Grow velocity ethically after strong visits—see{" "}
                  <Link
                    href="/resources/get-more-restaurant-reviews/"
                    className="font-semibold text-amber-900 underline underline-offset-2"
                  >
                    how to get more restaurant reviews
                  </Link>
                  —while fixing the themes that keep showing up.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">Should I try to remove negative reviews?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Report only clear policy violations. For real misses, respond, fix the cause, and let
                  newer experiences move the average.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">What should we track weekly?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Headline score, top themes, unanswered negatives, and three operator priorities—not a
                  40-page report.
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
              href="/markets/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Browse city pages
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
