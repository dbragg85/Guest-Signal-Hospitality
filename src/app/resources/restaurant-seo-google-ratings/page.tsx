import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "Restaurant SEO and Google Ratings: Win Local Search",
  description:
    "How restaurant SEO and Google ratings work together for local pack visibility—plus a practical weekly checklist for independent operators.",
  alternates: { canonical: "/resources/restaurant-seo-google-ratings/" },
};

export default function RestaurantSeoGoogleRatingsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Restaurant SEO and Google ratings: win local search",
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
            Restaurant SEO and Google ratings: win local search
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Local search is not only keywords. Guests see proximity, category fit, ratings, review
            freshness, and whether your profile looks active and trustworthy.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">The local pack loop</h2>
          <p className="text-slate-700">
            Better experience → better reviews → stronger ratings → more pack clicks → more
            first-time guests. When service or consistency slips, the loop runs in reverse—and SEO
            content alone cannot fix it.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Operator checklist (weekly)</h2>
          <ol className="list-decimal space-y-2 pl-5 text-slate-700">
            <li>Scan new Google and Yelp reviews for the same two or three themes.</li>
            <li>Reply to negatives with a specific recovery step, not a template apology.</li>
            <li>Confirm Google Business Profile hours, categories, and photos are accurate.</li>
            <li>Pick one operational fix your floor team can execute this week.</li>
            <li>
              Track a single score so progress is visible—see{" "}
              <Link href="/services/" className="font-semibold text-amber-900 underline underline-offset-2">
                Guest Signal plans
              </Link>
              .
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-slate-900">City-level search intent</h2>
          <p className="text-slate-700">
            Owners search by city: “improve Google rating [city],” “restaurant reviews [city],”
            “reputation management for restaurants.” {brand.name} publishes market pages for those
            queries—start at{" "}
            <Link href="/markets/" className="font-semibold text-amber-900 underline underline-offset-2">
              Markets
            </Link>{" "}
            or read{" "}
            <Link
              href="/resources/google-restaurant-ratings/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              Google restaurant ratings
            </Link>
            .
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
