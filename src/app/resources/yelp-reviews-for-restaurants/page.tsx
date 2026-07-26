import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Yelp Reviews for Restaurants: Themes, Replies & Scorecards",
  description:
    "How Yelp reviews affect restaurants alongside Google: which themes to track, how to reply, and how to fold Yelp into a weekly scorecard—not a second vanity dashboard.",
  alternates: { canonical: "/resources/yelp-reviews-for-restaurants/" },
  openGraph: {
    title: `Yelp Reviews for Restaurants | ${brand.name}`,
    description:
      "Operator guide to Yelp reviews: themes, response discipline, and dual-source scorecards with Google.",
    url: "/resources/yelp-reviews-for-restaurants/",
  },
};

export default function YelpReviewsForRestaurantsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Yelp reviews for restaurants: themes, replies, and scorecards",
    description:
      "How independent restaurants use Yelp review language with Google for a single operator scorecard.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do Yelp reviews still matter for restaurants?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes in many markets. Even when Google drives more discovery, Yelp still surfaces detailed guest language on food, value, and service that operators should score alongside Google.",
        },
      },
      {
        "@type": "Question",
        name: "Should restaurants manage Yelp and Google separately?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reply on each platform, but analyze themes together. Guests repeat the same friction across sites—one scorecard beats two vanity averages.",
        },
      },
      {
        "@type": "Question",
        name: "How often should restaurants check Yelp reviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Clear negatives within 48 hours and fold Yelp into a weekly or monthly scorecard with Google so themes drive floor priorities.",
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
            Yelp reviews for restaurants: themes, replies, and scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Yelp is not a second inbox to ignore. Guests still leave long-form notes on food, value,
            and service—language that belongs in the same weekly scorecard as Google.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Why Yelp still belongs in the operator stack
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Longer guest language</strong> — Yelp reviews often name dishes, wait
                patterns, and value more explicitly than short Google blurbs.
              </li>
              <li>
                <strong>Same themes, different channel</strong> — Speed, hospitality, and
                consistency show up on both platforms; treat them as one friction list.
              </li>
              <li>
                <strong>Reply still signals accountability</strong> — Unanswered Yelp negatives
                read the same as unanswered Google to guests who check both.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Run Google + Yelp as one scorecard
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Pull both sources for the same period, tag themes once, and rank impact. Use a{" "}
              <Link
                href="/resources/restaurant-review-scorecard/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant review scorecard
              </Link>{" "}
              for pillars,{" "}
              <Link
                href="/resources/respond-to-restaurant-reviews/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                how to respond to restaurant reviews
              </Link>{" "}
              for reply SLAs, and{" "}
              <Link
                href="/resources/google-reviews-for-restaurants/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Google Reviews for restaurants
              </Link>{" "}
              for Maps-heavy discovery context.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">Weekly Yelp checklist</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>Clear unanswered negatives older than 48 hours.</li>
              <li>Tag new mentions: food, service, speed, value, cleanliness.</li>
              <li>Merge Yelp theme counts with Google before picking three floor moves.</li>
              <li>
                Escalate repeating themes with{" "}
                <Link
                  href="/resources/guest-recovery-solutions/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  guest recovery solutions
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
                  Do Yelp reviews still matter for restaurants?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Yes in many markets—especially for detailed food, value, and service language
                  worth scoring with Google.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Should we manage Yelp and Google separately?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reply on each platform; analyze themes together in one scorecard.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How often should we check Yelp?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Clear negatives within 48 hours; fold Yelp into a weekly or monthly dual-source
                  scorecard.
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
