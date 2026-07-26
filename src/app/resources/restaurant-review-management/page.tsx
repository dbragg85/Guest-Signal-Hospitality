import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Restaurant Review Management: Scorecards, Not Just Inboxes",
  description:
    "Restaurant review management for operators: Google and Yelp monitoring, response SLAs, theme scorecards, and weekly floor moves—beyond vanity star averages.",
  alternates: { canonical: "/resources/restaurant-review-management/" },
  openGraph: {
    title: `Restaurant Review Management | ${brand.name}`,
    description:
      "How independents run restaurant review management: dual-source scorecards, reply discipline, and three weekly priorities.",
    url: "/resources/restaurant-review-management/",
  },
};

export default function RestaurantReviewManagementPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant review management: scorecards, not just inboxes",
    description:
      "An operator system for managing Google and Yelp reviews with pillars, themes, and floor ownership.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is restaurant review management?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Restaurant review management is the weekly system for collecting Google and Yelp feedback, responding on time, scoring recurring themes, and assigning floor fixes—not only sending polite replies.",
        },
      },
      {
        "@type": "Question",
        name: "Is restaurant review management the same as reputation management?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reputation is the outcome guests see on Maps. Review management is the operating cadence—monitoring, replies, scorecards, and theme ownership—that moves reputation.",
        },
      },
      {
        "@type": "Question",
        name: "What tools do restaurants need for review management?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "At minimum: dual-source review pull, a response SLA, a theme scorecard, and three weekly priorities. Inbox-only tools help speed; scorecards help decisions.",
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
            Restaurant review management: scorecards, not just inboxes
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Managing reviews is not living in notifications. It is a short weekly cadence that turns
            Google and Yelp language into a score, theme friction, and three moves the floor can run.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              The four jobs of restaurant review management
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                <strong>Monitor</strong> — Pull Google + Yelp on a fixed rhythm (
                <Link
                  href="/resources/restaurant-review-monitoring/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review monitoring
                </Link>
                ).
              </li>
              <li>
                <strong>Respond</strong> — Clear under-3★ within 48 hours (
                <Link
                  href="/resources/respond-to-restaurant-reviews/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  how to respond to restaurant reviews
                </Link>
                ).
              </li>
              <li>
                <strong>Score</strong> — Weight pillars and theme impact (
                <Link
                  href="/resources/restaurant-review-scorecard/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review scorecard
                </Link>
                ).
              </li>
              <li>
                <strong>Recover</strong> — Fix repeating themes on the floor (
                <Link
                  href="/resources/guest-recovery-solutions/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  guest recovery solutions
                </Link>
                ).
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Inbox tools vs. operator scorecards
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Review inboxes optimize for reply speed and review asks. That matters—and it is not
              the same job as deciding which guest theme is costing Maps trust. Compare stacks in{" "}
              <Link
                href="/resources/guest-signal-vs-review-tools/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                Guest Signal vs review tools
              </Link>
              . For Maps math, use{" "}
              <Link
                href="/resources/improve-google-restaurant-rating/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                improve Google restaurant rating
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">A 30-minute weekly loop</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Tag last 7–30 days of Google and Yelp by theme.</li>
              <li>Sort by impact (softness × mentions); pick three floor moves.</li>
              <li>Clear unanswered negatives older than 48 hours.</li>
              <li>
                Note peer pressure if nearby ratings are climbing—see your city under{" "}
                <Link
                  href="/markets/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  Markets
                </Link>
                .
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What is restaurant review management?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The weekly system for collecting reviews, responding on time, scoring themes, and
                  assigning floor fixes.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Is it the same as reputation management?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reputation is the Maps outcome. Review management is the operating cadence that
                  moves it.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What do restaurants need at minimum?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Dual-source pulls, a response SLA, a theme scorecard, and three weekly priorities.
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
