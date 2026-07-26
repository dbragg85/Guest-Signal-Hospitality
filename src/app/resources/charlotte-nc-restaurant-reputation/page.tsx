import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Charlotte NC Restaurant Reputation: Reviews & Scorecards",
  description:
    "Restaurant reputation for Charlotte, North Carolina operators—Google and Yelp themes, response discipline, and weekly scorecards that protect local guest demand.",
  alternates: { canonical: "/resources/charlotte-nc-restaurant-reputation/" },
  openGraph: {
    title: `Charlotte NC Restaurant Reputation | ${brand.name}`,
    description:
      "How Charlotte NC restaurants protect reputation with review scorecards and floor priorities.",
    url: "/resources/charlotte-nc-restaurant-reputation/",
  },
};

export default function CharlotteNcRestaurantReputationPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Charlotte NC restaurant reputation: reviews, themes, and scorecards",
    description:
      "Operator guidance for Charlotte, North Carolina restaurants competing on Google Maps trust.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do restaurants in Charlotte NC improve reputation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pull recent Google and Yelp reviews, tag recurring themes, clear negatives within 48 hours, and run a weekly scorecard with three floor moves—especially for speed, value, and hospitality consistency in a competitive dining market.",
        },
      },
      {
        "@type": "Question",
        name: "Does Guest Signal work in Charlotte?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Guest Signal delivers nationwide dual-source scorecards, including Charlotte, North Carolina market coverage.",
        },
      },
      {
        "@type": "Question",
        name: "What should Charlotte restaurants watch on Google Maps?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Recent review velocity, unanswered negatives, and themes guests repeat across neighborhoods—more than a single star average.",
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
            Charlotte NC restaurant reputation: reviews, themes, and scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Charlotte diners compare neighborhoods and concepts fast. Reputation moves when the same
            service, speed, or value themes keep repeating unanswered on Google and Yelp.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What Charlotte operators should watch weekly
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Rush pacing and ticket times during busy corridors and weekends.</li>
              <li>Value language when guests compare you to nearby independents.</li>
              <li>Unanswered negatives older than 48 hours on Google or Yelp.</li>
              <li>Peer ratings that can win the same Maps shortlist.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">A practical Charlotte cadence</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                Start with the{" "}
                <Link
                  href="/markets/charlotte-nc/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  Charlotte NC Google ratings
                </Link>{" "}
                market page.
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
                  How do Charlotte NC restaurants improve reputation?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tag recurring themes, clear negatives within 48 hours, and assign three floor
                  moves each week.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">Do you serve Charlotte?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Yes. {brand.name} delivers nationwide dual-source scorecards, including Charlotte.
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
              Free Charlotte snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
            <Link
              href="/markets/charlotte-nc/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Charlotte market page
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
