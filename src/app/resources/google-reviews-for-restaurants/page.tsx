import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "Google Reviews for Restaurants: Turn Feedback Into Growth",
  description:
    "Why Google Reviews shape restaurant demand, which guest themes to extract, and how to align responses and operations with real feedback.",
  alternates: { canonical: "/resources/google-reviews-for-restaurants/" },
};

export default function GoogleReviewsForRestaurantsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Google Reviews for restaurants: from noise to a clear plan",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/resources/" className="hover:underline">
              Resources
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Google Reviews for restaurants: from noise to a clear plan
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            For many independents, Google is the <strong>default discovery layer</strong>. Reviews
            are not just marketing—they are a steady stream of operational clues.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">What guests actually write about</h2>
          <p className="text-slate-700">
            Across concepts, the same categories show up again and again: wait time and seating,
            order accuracy, hospitality and recovery, food temperature and consistency, perceived
            value, and cleanliness. When you group language into those buckets, the story gets
            simpler for owners and GMs.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Common mistakes owners make</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>
              Chasing the <strong>last bad review</strong> instead of the underlying pattern.
            </li>
            <li>
              Writing generic replies that do not reflect the specific issue guests raised.
            </li>
            <li>
              Ignoring <strong>positive themes</strong> you could reinforce on the menu, on the floor,
              and in marketing.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">How Guest Signal helps</h2>
          <p className="text-slate-700">
            {brand.name} translates review language into a{" "}
            <Link href="/services/" className="font-semibold text-amber-900 underline underline-offset-2">
              Guest Signal Score
            </Link>
            , theme breakdowns, and owner-ready summaries—so you spend less time scrolling and more
            time improving the experience.
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
            <Link
              href="/resources/restaurant-review-monitoring/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Review monitoring guide
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
