import Link from "next/link";
import type { Metadata } from "next";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import {
  freeSnapshot,
  pricingPlans,
  servicesPageSeo,
  servicesPricingContext,
} from "@/content/site";
import { servicesFaq } from "@/content/services-faq";
import { PlanFitSnapshotCta } from "@/components/PlanFitSnapshotCta";
import { Section } from "@/components/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema, servicesPricingSchema } from "@/lib/seo/schema";

const SERVICES_PAGE_TITLE =
  "Restaurant Reputation, SEO & Google Visibility Plans | Guest Signal Hospitality";
const SERVICES_PAGE_DESCRIPTION =
  "Compare Guest Signal Hospitality plans for restaurant review monitoring, Google Business Profile optimization, local SEO, website visibility, and guest experience intelligence.";

export const metadata: Metadata = {
  title: { absolute: SERVICES_PAGE_TITLE },
  description: SERVICES_PAGE_DESCRIPTION,
  alternates: { canonical: "/services/" },
  openGraph: {
    title: SERVICES_PAGE_TITLE,
    description: SERVICES_PAGE_DESCRIPTION,
    url: "/services/",
  },
};

export default function ServicesPage() {
  const seo = servicesPageSeo;

  return (
    <div>
      <JsonLd data={[servicesPricingSchema(), faqPageSchema(servicesFaq)]} />

      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <ServicesHero seo={seo} />
      </section>

      <Section title={seo.snapshotHeading} kicker="Free baseline">
        <ServicesSnapshotBlock />
      </Section>

      <Section title={servicesPricingContext.title} kicker="Plan progression">
        <ServicesPricingContext />
      </Section>

      <Section title={seo.plansTitle} kicker={seo.plansKicker}>
        <ServicesPlans seo={seo} />
      </Section>

      <Section>
        <ServicesAuthority />
      </Section>

      <Section title="Frequently asked questions" kicker="Plans & reputation">
        <ServicesFaq />
      </Section>

      <Section>
        <ServicesInsightsCta />
      </Section>
    </div>
  );
}

function ServicesHero({ seo }: { seo: typeof servicesPageSeo }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
          Restaurant reputation management &amp; local SEO
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{seo.title}</h1>
        <p className="mt-5 text-lg text-slate-700 md:text-xl">{seo.intro}</p>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          {seo.supporting}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
          Explore{" "}
          <Link
            href="/resources/restaurant-review-monitoring/"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            restaurant review monitoring
          </Link>
          ,{" "}
          <Link
            href="/resources/google-reviews-for-restaurants/"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            Google Reviews intelligence
          </Link>
          , and{" "}
          <Link
            href="/resources/cincinnati-restaurant-reputation/"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            Cincinnati restaurant marketing
          </Link>{" "}
          guides—or start with a free snapshot below.
        </p>
      </div>
    </div>
  );
}

function ServicesSnapshotBlock() {
  const seo = servicesPageSeo;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl border-2 border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-8 shadow-lg md:p-12">
        <p className="mx-auto mb-8 max-w-2xl text-center text-slate-700">{seo.snapshotLead}</p>
        <p className="mb-4 text-center text-sm font-semibold text-slate-900">
          Your complimentary snapshot reviews:
        </p>
        <ul className="mb-8 grid gap-3 md:grid-cols-2">
          {seo.snapshotReviews.map((item) => (
            <li key={item} className="flex items-start text-sm text-slate-700">
              <span className="mr-3 shrink-0 font-bold text-green-600">✔</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <ServicesIntakeLink
            href="/snapshot/"
            className="btn-primary inline-block px-8 py-3"
            data-track="services_cta_free_snapshot"
          >
            {freeSnapshot.buttonText}
          </ServicesIntakeLink>
          <p className="mt-4 text-xs text-slate-500">{freeSnapshot.trustText}</p>
        </div>
      </div>
    </div>
  );
}

function ServicesPricingContext() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-center text-sm leading-relaxed text-slate-600 md:text-base">
        {servicesPricingContext.lead}
      </p>
      <ul className="mt-5 list-disc space-y-3 pl-5 text-left text-sm leading-relaxed text-slate-600 md:text-base sm:pl-6">
        {servicesPricingContext.bullets.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function ServicesPlans({ seo }: { seo: typeof servicesPageSeo }) {
  return (
    <>
      <p className="mx-auto mb-10 max-w-2xl text-center text-slate-600">{seo.plansLead}</p>
      <ServicesPlanGrid />
      <PlanFitSnapshotCta />
    </>
  );
}

function ServicesPlanGrid() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {pricingPlans.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-3xl border-2 p-8 shadow-sm ${
            plan.popular
              ? "scale-105 border-slate-900 bg-gradient-to-br from-stone-50 to-white ring-1 ring-amber-500/20"
              : "border-slate-200 bg-white"
          }`}
        >
          {plan.badge ? (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
              <span className="rounded-full bg-gradient-to-r from-slate-800 to-amber-600 px-4 py-1 text-xs font-semibold text-white">
                {plan.badge}
              </span>
            </div>
          ) : null}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
            <ServicesPlanPrice plan={plan} />
            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
          </div>
          <ul className="mb-8 space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-700">
                <span className="mr-2 text-slate-400">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <ServicesIntakeLink
            href={`/services/inquiry/?plan=${plan.inquiryKey}`}
            className={`block w-full rounded-xl px-5 py-3 text-center text-sm font-semibold ${
              plan.popular
                ? "btn-primary shadow-md"
                : "border border-stone-300 text-slate-900 hover:bg-stone-50"
            }`}
            data-track={`services_cta_${plan.inquiryKey}`}
          >
            {plan.buttonText}
          </ServicesIntakeLink>
        </div>
      ))}
    </div>
  );
}

function ServicesPlanPrice({ plan }: { plan: (typeof pricingPlans)[number] }) {
  return (
    <div className="mt-4">
      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
      <span className="text-slate-600">/{plan.period}</span>
    </div>
  );
}

function ServicesAuthority() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Guest experience intelligence for independent restaurants
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          From restaurant review monitoring to Google Business Profile optimization and local
          restaurant marketing—we help operators turn feedback into priorities their teams can run
          this week.
        </p>
        <p className="mt-4 text-base text-slate-600">
          Based in Cincinnati with nationwide delivery.{" "}
          <Link
            href="/industries/restaurants/"
            className="font-semibold text-amber-900 underline underline-offset-2"
          >
            See how we support restaurants
          </Link>{" "}
          or{" "}
          <Link href="/contact/" className="font-semibold text-amber-900 underline underline-offset-2">
            contact us
          </Link>{" "}
          with questions.
        </p>
      </div>
    </div>
  );
}

function ServicesFaq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
      {servicesFaq.map((item) => (
        <details key={item.question} className="px-6 py-5">
          <summary className="cursor-pointer font-semibold text-slate-900">{item.question}</summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function ServicesInsightsCta() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200/70 bg-amber-50/60 p-8 text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Weekly hospitality &amp; restaurant SEO signals
      </h2>
      <p className="mt-3 text-slate-700">
        Read <strong>Hospitality Signals</strong> for search shifts, local visibility patterns, and
        practical actions for independent restaurant growth.
      </p>
      <div className="mt-5">
        <Link href="/insights/" className="btn-secondary inline-block">
          Read Hospitality Signals
        </Link>
      </div>
    </div>
  );
}
