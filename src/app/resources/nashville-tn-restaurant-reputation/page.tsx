import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Nashville TN Restaurant Reputation: Reviews & Scorecards",
  description:
    "Restaurant reputation for Nashville, Tennessee operators—high review velocity, tourist noise, Google and Yelp themes, and weekly scorecards that protect local demand.",
  alternates: { canonical: "/resources/nashville-tn-restaurant-reputation/" },
  openGraph: {
    title: `Nashville TN Restaurant Reputation | ${brand.name}`,
    description:
      "How Nashville restaurants protect reputation amid high review velocity—scorecards, themes, and floor priorities.",
    url: "/resources/nashville-tn-restaurant-reputation/",
  },
};

export default function NashvilleTnRestaurantReputationPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Nashville TN restaurant reputation: reviews, themes, and scorecards",
    description:
      "Operator guidance for Nashville, Tennessee restaurants competing on Google Maps trust under high review velocity.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do restaurants in Nashville TN improve reputation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Separate tourist noise from repeating ops themes, clear negatives within 48 hours, and run a weekly scorecard with three floor moves—especially speed, value, and hospitality consistency.",
        },
      },
      {
        "@type": "Question",
        name: "Does Guest Signal work in Nashville?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Guest Signal delivers nationwide dual-source scorecards, including Nashville, Tennessee market coverage.",
        },
      },
      {
        "@type": "Question",
        name: "Why is Nashville review volume harder to manage?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tourist traffic raises velocity and variance. Theme clustering matters more than reacting to every one-off rant.",
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
            Nashville TN restaurant reputation: reviews, themes, and scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Nashville mixes locals and tourists—high review velocity with noisy outliers. Reputation
            work wins when you score repeating themes, not every one-off night.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What Nashville operators should watch weekly
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Wait and ticket times during music-weekend peaks.</li>
              <li>Value and hospitality language when tourists and locals disagree.</li>
              <li>Unanswered negatives older than 48 hours on Google or Yelp.</li>
              <li>Theme clusters that survive after you discount one-off tourist rants.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">A practical Nashville cadence</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                Start with the{" "}
                <Link
                  href="/markets/nashville-tn/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  Nashville TN Google ratings
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
                Grow velocity ethically via{" "}
                <Link
                  href="/resources/get-more-restaurant-reviews/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  how to get more restaurant reviews
                </Link>
                —after you fix repeating friction.
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
                  How do Nashville restaurants improve reputation?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Separate tourist noise from repeating ops themes, clear negatives within 48 hours,
                  and assign three floor moves each week.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">Do you serve Nashville?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Yes. {brand.name} delivers nationwide dual-source scorecards, including Nashville.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Why is review volume harder here?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tourist traffic raises velocity and variance—theme clustering beats reacting to
                  every outlier.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Free Nashville snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
            <Link
              href="/markets/nashville-tn/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Nashville market page
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
