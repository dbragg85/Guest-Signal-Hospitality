import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarket, markets } from "@/content/markets";
import { brand } from "@/content/site";
import { breadcrumbSchema, faqPageSchema, localBusinessSchema } from "@/lib/seo/schema";

type Params = { slug: string };

export function generateStaticParams() {
  return markets.map((market) => ({ slug: market.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const market = getMarket(params.slug);
  if (!market) return {};
  const title = `${market.city} Restaurant Google Ratings & Review Scorecards`;
  const description = `Improve ${market.city}, ${market.stateCode} restaurant Google ratings with a clear Guest Signal score, recurring review themes, and weekly operator priorities.`;
  return {
    title,
    description,
    alternates: { canonical: `/markets/${market.slug}/` },
    openGraph: {
      title: `${title} | ${brand.name}`,
      description,
      url: `/markets/${market.slug}/`,
    },
  };
}

export default function MarketPage({ params }: { params: Params }) {
  const market = getMarket(params.slug);
  if (!market) notFound();

  const faq = [
    {
      q: `How do Google ratings affect restaurants in ${market.city}?`,
      a: `In ${market.city}, guests often shortlist from Google Maps and search before they ever call. Rating drops, unanswered complaints, and repeated service themes quietly cut discovery and repeat visits.`,
    },
    {
      q: `What does a Guest Signal snapshot include for a ${market.city} restaurant?`,
      a: "A combined Google and Yelp read, a clear headline score, the recurring guest themes that matter, and three practical priorities your team can use this week.",
    },
    {
      q: `Do you only work in Cincinnati?`,
      a: `No. ${brand.name} is based in Cincinnati and delivers nationwide. ${market.city} is an active expansion market for review scorecards and monthly monitoring.`,
    },
  ];

  return (
    <div className="bg-white">
      <JsonLd
        data={[
          localBusinessSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Markets", path: "/markets/" },
            { name: `${market.city}, ${market.stateCode}`, path: `/markets/${market.slug}/` },
          ]),
          faqPageSchema(faq.map((item) => ({ question: item.q, answer: item.a }))),
        ]}
      />

      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-sm font-semibold text-amber-800">
            <Link href="/markets/" className="hover:underline">
              Markets
            </Link>{" "}
            · {market.regionLabel}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {market.city} restaurant Google ratings, decoded for operators.
          </h1>
          <p className="mt-4 text-lg text-slate-600">{market.blurb}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink
              href="/snapshot/"
              className="btn-primary"
              data-track={`market_snapshot_${market.slug}`}
            >
              Free {market.city} snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label="Start Signal Monitor — $149/mo"
                className="btn-secondary w-full"
              />
            </div>
            <Link href="/services/" className="px-2 py-3 text-sm font-semibold text-slate-700 underline underline-offset-4">
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Why {market.city} owners lose ground in search
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Guests searching “restaurants near me,” cuisine + neighborhood, or your brand name
              see ratings, recent reviews, and response quality before they see your menu. If the
              same complaints repeat—wait time, value, consistency—your Google pack position and
              conversion both suffer.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-950">What we measure</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              <li>Guest Signal Score from Google and Yelp review language</li>
              <li>Recurring themes tied to service, speed, food, and value</li>
              <li>Reputation risk alerts when negative patterns spike</li>
              <li>A short action list owners and GMs can run the same week</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">Start monitoring this month</h2>
            <p className="mt-2 text-sm text-slate-700">
              Signal Monitor is the fastest paid path for {market.city} operators who want a
              dependable monthly scorecard.
            </p>
            <div className="mt-4 max-w-sm">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label="Start Signal Monitor — $149/mo"
                className="btn-primary w-full"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-950">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              {faq.map((item) => (
                <div key={item.q} className="p-5">
                  <h3 className="font-semibold text-slate-950">{item.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
