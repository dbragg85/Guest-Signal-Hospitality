import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Restaurant Reputation: Reviews, Themes & Weekly Scorecards",
  description:
    "Restaurant reputation for operators: how Google and Yelp reviews shape demand, which themes to track weekly, and a scorecard cadence that protects guest perception.",
  alternates: { canonical: "/resources/restaurant-reputation/" },
  openGraph: {
    title: `Restaurant Reputation: Reviews, Themes & Weekly Scorecards | ${brand.name}`,
    description:
      "Practical restaurant reputation guidance—review themes, response discipline, and weekly scorecards for independent restaurants.",
    url: "/resources/restaurant-reputation/",
  },
};

export default function RestaurantReputationPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant reputation: reviews, themes, and weekly scorecards",
    description:
      "How independent restaurants protect restaurant reputation with review intelligence—not vanity star averages.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is restaurant reputation for operators?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Restaurant reputation is the guest perception that shows up in Google, Yelp, and word of mouth—driven by recurring experience themes, response quality, and recent review velocity, not just a star average.",
        },
      },
      {
        "@type": "Question",
        name: "How do you monitor restaurant reputation weekly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pull Google and Yelp reviews for the last 7–30 days, tag themes (food, service, speed, value, cleanliness), clear unanswered negatives within 48 hours, and set three floor-facing priorities for the week.",
        },
      },
      {
        "@type": "Question",
        name: "Is restaurant reputation the same as review monitoring?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Review monitoring is the weekly system; restaurant reputation is the outcome guests and Maps show. Monitoring without theme-based ops fixes rarely moves reputation.",
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
            Restaurant reputation: reviews, themes, and weekly scorecards
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Guests decide from Maps and recent reviews before they ever open your menu. Restaurant
            reputation is that first trust signal—and it moves when the same guest themes keep
            repeating unanswered.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What “restaurant reputation” actually means
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Operators searching “restaurant reputation” usually want two things: fewer surprise
              1★ nights, and a clear weekly plan when Google or Yelp softens. The useful definition is
              operational—not PR theater. Reputation is the pattern in recent guest language across
              Google and Yelp, plus whether you respond like someone who runs the floor.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Themes over anecdotes.</strong> Three “slow” mentions beat one viral rant as a
                priority.
              </li>
              <li>
                <strong>Response discipline.</strong> Specific recovery language protects trust more
                than silence or generic apologies.
              </li>
              <li>
                <strong>Recent velocity.</strong> Fresh reviews keep Maps current; silence freezes an
                old average.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">A 20-minute weekly cadence</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>Pull the last 7–30 days of Google + Yelp reviews.</li>
              <li>Tag each mention: food, service, speed, value, cleanliness, atmosphere.</li>
              <li>Pick the top two negative themes by frequency—not volume of emotion.</li>
              <li>Clear unanswered negatives older than 48 hours in one sitting.</li>
              <li>
                Write three floor-facing priorities for the week. Use{" "}
                <Link
                  href="/resources/restaurant-review-monitoring/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review monitoring
                </Link>{" "}
                as the system, and{" "}
                <Link
                  href="/resources/improve-google-restaurant-rating/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  improve Google restaurant rating
                </Link>{" "}
                when the Maps score is the bottleneck.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Reputation vs. agency “management”
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Many “restaurant reputation” products emphasize alerts and polished reply templates.
              Those help—but they do not replace fixing the experience guests keep naming. If wait
              time, value, or consistency repeats, Maps will keep showing soft trust no matter how
              fast you reply.
            </p>
            <p className="mt-3 text-slate-700 leading-7">
              For city-level searches, see{" "}
              <Link
                href="/resources/cincinnati-restaurant-reputation/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Cincinnati restaurant reputation
              </Link>{" "}
              and the broader{" "}
              <Link href="/markets/" className="font-semibold text-amber-900 underline underline-offset-2">
                Markets
              </Link>{" "}
              pages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What is restaurant reputation for operators?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The guest perception that shows up in Google, Yelp, and word of mouth—driven by
                  recurring themes, response quality, and recent review velocity.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How often should we review restaurant reputation?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Weekly is enough for most independents: themes, unanswered negatives, and three
                  priorities. Daily only if volume is high or a risk review is open.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Is this the same as restaurant review monitoring?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Monitoring is the weekly system. Reputation is the outcome guests and Maps show.
                  You need both—alerts without ops fixes rarely stick.
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
