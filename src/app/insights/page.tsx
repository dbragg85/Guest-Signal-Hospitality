import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import {
  getInsightPath,
  getPublishedNewsletters,
} from "@/lib/newsletter/content";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { topicCategories } from "@/lib/seo/categories";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Hospitality Operational Intelligence & Weekly Signals",
  description:
    "Weekly hospitality operational intelligence for restaurants, bars, and hotels: search trends, guest behavior signals, and actionable operator playbooks.",
  alternates: { canonical: "/insights/" },
  openGraph: {
    title: "Hospitality Operational Intelligence | Guest Signal",
    description:
      "Weekly signals on guest experience, service consistency, menu value, and reputation intelligence for hospitality operators.",
    url: "/insights/",
  },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InsightsHubPage() {
  const items = getPublishedNewsletters();

  return (
    <div className="bg-gradient-to-b from-stone-100 via-white to-stone-50">
      <JsonLd
        data={[
          collectionPageSchema({
            name: "Hospitality Signals — Operational Intelligence",
            description: metadata.description as string,
            path: "/insights/",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hospitality Signals", path: "/insights/" },
          ]),
        ]}
      />

      <section className="border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_40%),radial-gradient(circle_at_top_left,_rgba(2,132,199,0.14),_transparent_35%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Hospitality Signals" },
            ]}
          />
          <img
            src="/guest-signal-header-icon.svg"
            alt="Guest Signal Hospitality logo mark"
            className="mx-auto mt-6 h-12 w-12 rounded-xl border border-amber-200/60 bg-white/85 p-2 shadow-sm"
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            Operational intelligence
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Hospitality Signals for Restaurant Operators
          </h1>
          <p className="mt-4 text-slate-600 md:text-lg">
            Short, practical reads for independent restaurant owners and GMs.
            One issue, why it matters, and what to do next.
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

      <section className="border-b border-stone-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-5">
          <p className="text-sm font-semibold text-amber-800">Operator guides</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Turn weekly signals into a review system.
          </h2>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link
              href="/resources/restaurant-review-management/"
              className="text-amber-900 underline underline-offset-2"
            >
              Review management
            </Link>
            <Link
              href="/resources/restaurant-review-scorecard/"
              className="text-amber-900 underline underline-offset-2"
            >
              Review scorecard
            </Link>
            <Link
              href="/resources/respond-to-restaurant-reviews/"
              className="text-amber-900 underline underline-offset-2"
            >
              Respond to reviews
            </Link>
            <Link
              href="/resources/get-more-restaurant-reviews/"
              className="text-amber-900 underline underline-offset-2"
            >
              Get more reviews
            </Link>
            <Link
              href="/resources/"
              className="text-amber-900 underline underline-offset-2"
            >
              All guides
            </Link>
          </div>
        </div>
      </section>

      <Section title="Browse by topic" kicker="Topical hubs">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
          {topicCategories.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}/`}
              className="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-amber-200"
            >
              <span className="font-semibold text-slate-900">{topic.name}</span>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{topic.description}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Latest intelligence" kicker="Archive">
        <InsightsArchiveList items={items} formatDate={formatDate} />
      </Section>
    </div>
  );
}

function InsightsArchiveList({
  items,
  formatDate,
}: {
  items: ReturnType<typeof getPublishedNewsletters>;
  formatDate: (v: string) => string;
}) {
  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      {items.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-5 text-slate-600">
          No published insights yet.
        </p>
      ) : (
        items.map((item) => (
          <article
            key={item.frontmatter.slug}
            className="rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/70 p-6 shadow-sm"
          >
            {item.frontmatter.heroImage ? (
              <img
                src={item.frontmatter.heroImage}
                alt={`${item.frontmatter.title} — weekly hospitality intelligence`}
                className="mb-4 h-44 w-full rounded-xl border border-stone-200 bg-white object-cover object-center"
                loading="lazy"
              />
            ) : null}
            <InsightsArchiveCard item={item} formatDate={formatDate} />
          </article>
        ))
      )}
    </div>
  );
}

function InsightsArchiveCard({
  item,
  formatDate,
}: {
  item: ReturnType<typeof getPublishedNewsletters>[number];
  formatDate: (v: string) => string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{formatDate(item.frontmatter.publishedDate)}</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{item.frontmatter.title}</h2>
      <p className="mt-3 text-slate-600">{item.frontmatter.excerpt}</p>
      <div className="mt-5">
        <Link
          href={getInsightPath(item.frontmatter.slug)}
          className="btn-primary inline-block"
        >
          Read the brief
        </Link>
      </div>
    </>
  );
}
