import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { Section } from "@/components/Section";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { brand } from "@/content/site";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "Restaurant Reputation in Cincinnati: Reviews & Scorecards",
  description:
    "Restaurant reputation guidance for Cincinnati operators—Google review themes, Guest Signal scorecards, and weekly priorities that protect local demand.",
  alternates: { canonical: "/resources/cincinnati-restaurant-reputation/" },
  openGraph: {
    title: "Restaurant Reputation in Cincinnati: Reviews & Scorecards",
    description:
      "How Cincinnati restaurants protect restaurant reputation with review intelligence and scorecards.",
    url: "/resources/cincinnati-restaurant-reputation/",
  },
};

export default function CincinnatiRestaurantReputationPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Cincinnati restaurant reputation and guest experience",
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
            Cincinnati restaurant reputation and guest experience
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {brand.name} is based in <strong>{brand.city}</strong>. We work with independent
            operators who want clearer insight into what guests say online—without corporate bloat.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <h2 className="text-xl font-semibold text-slate-900">Why local context matters</h2>
          <p className="text-slate-700">
            Cincinnati diners compare you to the other tabs open on their phone: nearby independents,
            fast-casual chains, and destination nights out. Reputation work is stronger when it
            acknowledges <strong>peer neighborhoods</strong>, seasonal traffic (sports, events), and
            the expectations guests bring from similar concepts.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">What we deliver</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>Guest Signal Score and theme breakdown tied to real review language</li>
            <li>Monthly or weekly reporting options depending on your plan</li>
            <li>Peer comparison on higher tiers so you know where you lead or lag</li>
            <li>Nationwide delivery if you operate beyond the Cincinnati market</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">Start with a snapshot</h2>
          <p className="text-slate-700">
            Request a free Guest Signal Snapshot to see how your reputation reads to guests today—and
            what to prioritize next.
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
            <Link href="/contact/" className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2">
              Contact
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
