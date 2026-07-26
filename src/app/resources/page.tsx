import type { Metadata } from "next";
import Link from "next/link";
import { resourceArticles } from "@/content/resources";
import { Section } from "@/components/Section";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";

import { monitorCheckoutLabel } from "@/content/founding-promo";
export const metadata: Metadata = {
  title: "Restaurant Reputation Guides: Reviews, Ratings & Monitoring",
  description:
    "Restaurant reputation resources for owners: review monitoring, Google ratings, recovery playbooks, and local reputation guides—plus free snapshot and Signal Monitor.",
  alternates: { canonical: "/resources/" },
  openGraph: {
    title: "Restaurant Reputation Guides: Reviews, Ratings & Monitoring",
    description:
      "Practical restaurant reputation guides—monitoring, Google ratings, and guest recovery.",
    url: "/resources/",
  },
};

export default function ResourcesIndexPage() {
  return (
    <div>
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            Resources
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant reputation guides: reviews, ratings, and monitoring
          </h1>
          <p className="mt-4 text-slate-600 md:text-lg">
            Short, operator-focused restaurant reputation articles—review monitoring, Google ratings,
            and guest recovery—whether you are in Cincinnati or nationwide.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-start">
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
          </div>
        </div>
      </section>

      <Section title="Articles" kicker="Read">
        <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-1">
          {resourceArticles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/resources/${a.slug}/`}
                className="block rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-200/80 hover:bg-stone-50/80"
              >
                <h2 className="text-xl font-semibold text-slate-900">{a.headline}</h2>
                <p className="mt-2 text-sm text-slate-600">{a.description}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-amber-800">
                  Read guide →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
