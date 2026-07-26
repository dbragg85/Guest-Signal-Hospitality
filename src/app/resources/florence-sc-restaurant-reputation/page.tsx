import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Florence SC Restaurant Reputation: Reviews & Scorecards",
  description:
    "Restaurant reputation for Florence, South Carolina operators—Google and Yelp themes, response discipline, and weekly scorecards that protect local guest demand.",
  alternates: { canonical: "/resources/florence-sc-restaurant-reputation/" },
  openGraph: {
    title: `Florence SC Restaurant Reputation | ${brand.name}`,
    description:
      "How Florence SC restaurants protect reputation with review scorecards and floor priorities.",
    url: "/resources/florence-sc-restaurant-reputation/",
  },
};

export default function FlorenceScRestaurantReputationPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Florence SC restaurant reputation: reviews, themes, and scorecards",
    description:
      "Operator guidance for Florence, South Carolina restaurants competing on Google Maps trust.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do restaurants in Florence SC improve reputation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pull recent Google and Yelp reviews, tag recurring themes, clear negatives within 48 hours, and run a weekly scorecard with three floor moves—especially for hospitality consistency and family-dining expectations.",
        },
      },
      {
        "@type": "Question",
        name: "Does Guest Signal work outside Cincinnati?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Guest Signal is based in Cincinnati and delivers nationwide, including Florence, South Carolina market pages and dual-source scorecards.",
        },
      },
      {
        "@type": "Question",
        name: "What should Florence restaurants watch on Google Maps?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Recent review velocity, unanswered negatives, and themes guests repeat—speed, value, cleanliness, and warm service—more than a single star average.",
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
            Florence SC restaurant reputation: reviews, themes, and scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            In Florence, South Carolina, guests shortlist from Maps and recent reviews before they
            call. Reputation moves when the same hospitality or consistency themes keep repeating
            unanswered.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What Florence operators should watch weekly
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Warm service and recovery language—Southern hospitality expectations are high.</li>
              <li>Family-dining themes: pace, value, and cleanliness between turns.</li>
              <li>Unanswered negatives older than 48 hours on Google or Yelp.</li>
              <li>Peer ratings nearby that can win the same Maps shortlist.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">A practical Florence cadence</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                Run the city market playbook on{" "}
                <Link
                  href="/markets/florence-sc/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  Florence SC Google ratings
                </Link>
                .
              </li>
              <li>
                Score themes with a{" "}
                <Link
                  href="/resources/restaurant-review-scorecard/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review scorecard
                </Link>
                .
              </li>
              <li>
                Reply with discipline using{" "}
                <Link
                  href="/resources/respond-to-restaurant-reviews/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  how to respond to restaurant reviews
                </Link>
                .
              </li>
              <li>
                Keep the full loop in{" "}
                <Link
                  href="/resources/restaurant-review-management/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review management
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
                  How do Florence SC restaurants improve reputation?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tag recurring themes, clear negatives within 48 hours, and assign three floor
                  moves each week—not chase one viral review.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Do you only serve Cincinnati?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  No. {brand.name} delivers nationwide; Florence is an active expansion market for
                  scorecards and monitoring.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What matters most on Maps locally?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Recent velocity, response quality, and repeating guest themes—more than a frozen
                  star average.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Free Florence snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
            <Link
              href="/markets/florence-sc/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Florence market page
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
