import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "How to Respond to Restaurant Reviews (Google & Yelp)",
  description:
    "How to respond to restaurant reviews on Google and Yelp: 48-hour SLAs, reply shapes for 1★–5★, and when to escalate to floor fixes—not generic apology templates.",
  alternates: { canonical: "/resources/respond-to-restaurant-reviews/" },
  openGraph: {
    title: `How to Respond to Restaurant Reviews | ${brand.name}`,
    description:
      "Operator playbook for restaurant review responses: speed, specificity, and theme escalation.",
    url: "/resources/respond-to-restaurant-reviews/",
  },
};

export default function RespondToRestaurantReviewsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to respond to restaurant reviews on Google and Yelp",
    description:
      "A practical reply framework for independent restaurants—SLAs, response shapes, and floor escalation.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How should restaurants respond to negative reviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reply within 48 hours, thank the guest, name the issue without arguing, say what you will change, and invite a private conversation. Then fix the theme if it repeats.",
        },
      },
      {
        "@type": "Question",
        name: "Should restaurants respond to every Google review?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prioritize every review under 3★ and most 3★ reviews. Thank high-volume 5★ guests when you can, especially when they name a dish or server you want to reinforce.",
        },
      },
      {
        "@type": "Question",
        name: "What is a good restaurant review response SLA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Under 3★ within 48 hours; same day during peak risk weeks. Unanswered negatives read as unresolved operations to Maps shoppers.",
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
            How to respond to restaurant reviews on Google and Yelp
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Guests treat unanswered reviews as unfinished business. A clear reply SLA and short
            response shapes protect Maps trust—while theme escalation protects the next service.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Response SLA that ships</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Under 3★:</strong> reply within 48 hours (same day if volume allows).
              </li>
              <li>
                <strong>3★:</strong> reply within 72 hours—these often hide fixable friction.
              </li>
              <li>
                <strong>4–5★:</strong> thank when the guest names a dish, server, or occasion you
                want repeated.
              </li>
            </ul>
            <p className="mt-3 text-slate-700 leading-7">
              For latency rationale, see{" "}
              <Link
                href="/insights/review-response-speed/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                review response speed
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Reply shapes (copy, then personalize)
            </h2>
            <div className="mt-4 space-y-4 text-slate-700">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  1–2★
                </p>
                <p className="mt-2 text-sm leading-6">
                  “Thank you for telling us. I’m sorry your [specific miss] fell short. We’re
                  addressing [theme] with the team today—please email [manager] so we can make this
                  right privately.”
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">3★</p>
                <p className="mt-2 text-sm leading-6">
                  “Thanks for the honest note. Glad [positive] worked; we’re tightening [named
                  friction] so the next visit is cleaner. Hope you’ll give us another shot.”
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  4–5★
                </p>
                <p className="mt-2 text-sm leading-6">
                  “Thank you—thrilled [dish/server/moment] landed. We’ll share this with the team.
                  See you again soon.”
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              When a reply is not enough
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              If the same theme appears three or more times in 30 days, escalate to{" "}
              <Link
                href="/resources/guest-recovery-solutions/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                guest recovery solutions
              </Link>{" "}
              and rank friction with a{" "}
              <Link
                href="/resources/restaurant-review-scorecard/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant review scorecard
              </Link>
              . Replies buy time; floor ownership moves ratings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How should restaurants respond to negative reviews?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Thank the guest, name the issue, say what changes, invite private resolution—then
                  fix repeating themes on the floor.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Should we respond to every Google review?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Prioritize under 3★ and most 3★. Thank standout 5★ reviews that reinforce what you
                  want repeated.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What is a good review response SLA?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Under 3★ within 48 hours. Unanswered negatives read as unresolved operations.
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
