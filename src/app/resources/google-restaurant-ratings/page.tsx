import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";

export const metadata: Metadata = {
  title: "Google Restaurant Ratings: How They Shape Local Demand",
  description:
    "How Google restaurant ratings influence Maps and search, what moves a rating over time, and how operators turn rating risk into a short weekly plan.",
  alternates: { canonical: "/resources/google-restaurant-ratings/" },
};

export default function GoogleRestaurantRatingsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Google restaurant ratings: how they shape local demand",
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
            Google restaurant ratings: how they shape local demand
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Your star rating is a compressed trust signal. Guests use it to filter Maps results,
            compare neighborhood options, and decide whether your brand is worth a first visit.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">Why the number moves slowly—then suddenly</h2>
          <p className="text-slate-700">
            A handful of new reviews rarely swing a mature rating. What hurts operators is a{" "}
            <strong>cluster of the same complaint</strong>: wait times, inaccurate orders, cold food,
            or weak recovery. Those clusters show up in language before the average drops enough for
            everyone to notice.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">What to watch besides stars</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>Review velocity after weekends, holidays, and menu changes</li>
            <li>Theme concentration (one issue dominating recent negatives)</li>
            <li>Response quality—specific, calm, and operationally honest</li>
            <li>Cross-check with Yelp so Google alone does not hide the pattern</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">Turn ratings into next week&apos;s priorities</h2>
          <p className="text-slate-700">
            {brand.name} builds a Guest Signal Score from Google and Yelp review language, then
            hands owners three practical priorities—not another chart to ignore. Pair that with{" "}
            <Link
              href="/resources/google-reviews-for-restaurants/"
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              Google Reviews guidance
            </Link>{" "}
            and city pages under{" "}
            <Link href="/markets/" className="font-semibold text-amber-900 underline underline-offset-2">
              Markets
            </Link>
            .
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Get your free snapshot
            </ServicesIntakeLink>
            <Link
              href="/resources/restaurant-seo-google-ratings/"
              className="text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              Restaurant SEO + ratings
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
