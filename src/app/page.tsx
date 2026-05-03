import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { brand, freeSnapshot, pricingPlans } from "@/content/site";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";
import { NewsletterForm } from "@/components/NewsletterForm";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b gradient-primary">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Know Your Restaurant's Guest Signal Score.
            </h1>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">
              Monitor, Improve, and Elevate Your Guest Experience.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ServicesIntakeLink
                href="/services/inquiry/?plan=free_snapshot"
                className="btn-primary"
                data-track="cta_hero_snapshot"
              >
                Get Your Free Snapshot
              </ServicesIntakeLink>
              <Link href="/portal" className="btn-secondary" data-track="cta_hero_portal">
                Client Portal
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Preview a sample snapshot experience, no login required for the demo.
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200/70 bg-white/80 px-5 py-4 text-left shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Recent Cincinnati outcome</p>
              <p className="mt-1 text-sm text-slate-700">
                One 30-day engagement produced <strong>+27% direct booking CTA clicks</strong> and{" "}
                <strong>+21% quote requests</strong> after message and plan-page rewrites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Snapshot Section */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="surface-elevated border-2 p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {freeSnapshot.title}
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-amber-700 bg-clip-text text-transparent">{freeSnapshot.price}</span>
              </div>
            </div>

            <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
              {freeSnapshot.description}
            </p>

            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {freeSnapshot.features.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="mr-3 text-green-600 font-bold">✔</span>
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <ServicesIntakeLink
                href="/services/inquiry/?plan=free_snapshot"
                className="btn-primary inline-block px-8 py-3"
                data-track="cta_snapshot_primary"
              >
                {freeSnapshot.buttonText}
              </ServicesIntakeLink>
              <p className="mt-4 text-xs text-slate-500">
                {freeSnapshot.trustText}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section title="How Guest Signal Works" kicker="Process">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                  1
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Analyze Reviews</h3>
              </div>
              <p className="text-sm text-slate-600">
                We analyze your guest reviews and sentiment to understand what customers are really saying.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Calculate Score</h3>
              </div>
              <p className="text-sm text-slate-600">
                We calculate your Guest Signal Score to give you a clear picture of your reputation.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Identify Areas</h3>
              </div>
              <p className="text-sm text-slate-600">
                We identify strengths and risk areas so you know exactly where to focus your efforts.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                  4
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Provide Tools</h3>
              </div>
              <p className="text-sm text-slate-600">
                We provide intelligence and reputation elevation tools to help you improve continuously.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Local Trust Signal Section */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border-2 border-amber-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50/40 p-8 text-center shadow-lg md:p-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl text-slate-900">
              Serving Restaurants in Cincinnati and Beyond
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              We're proud to help Cincinnati-area restaurants monitor, improve, and elevate their guest experience. From Over-the-Rhine to Hyde Park, we work with independent operators who are serious about guest satisfaction.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700">📍</span>
                <span className="font-semibold">Cincinnati, OH</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700">🌎</span>
                <span>Nationwide Service Available</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing Plans Section */}
      <Section title="Ongoing Guest Experience Monitoring & Elevation" kicker="Core Plans">
        <p className="mx-auto mb-10 max-w-2xl text-center text-lg font-semibold tracking-tight text-slate-900 drop-shadow-sm md:text-xl">
          Choose the level of intelligence and support that fits your restaurant&apos;s growth goals.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border-2 p-8 shadow-sm relative ${
                plan.popular
                  ? "scale-105 border-slate-900 bg-gradient-to-br from-stone-50 to-white ring-1 ring-amber-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-slate-800 to-amber-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-700">
                    <span className="mr-2 text-slate-400">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <ServicesIntakeLink
                href={`/services/inquiry/?plan=${plan.inquiryKey}`}
                className={`block w-full rounded-xl px-5 py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? "btn-primary shadow-md"
                    : "border border-stone-300 text-slate-900 hover:border-stone-400 hover:bg-stone-50"
                }`}
                data-track={`plan_select_${plan.name.toLowerCase().replace(/\s+/g, "_")}`}
              >
                {plan.buttonText}
              </ServicesIntakeLink>
            </div>
          ))}
        </div>
      </Section>

      {/* Authority Section */}
      <Section>
        <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50/90 to-white p-10 shadow-sm">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Built for Restaurants That Take Guest Experience Seriously
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Guest Signal Hospitality helps restaurants monitor reputation, identify improvement opportunities, and maintain consistent professional guest engagement.
            </p>
            <p className="mt-4 text-base text-slate-600">
              Restaurants using Guest Signal intelligence are better equipped to protect and elevate their guest experience.
            </p>
          </div>
        </div>
      </Section>

      {/* Newsletter Section */}
      <Section id="newsletter">
        <div className="rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-10 shadow-sm">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Get The Guest Signal Report
            </h2>
            <p className="mt-4 text-slate-600">
              Monthly insights into guest experience trends and hospitality performance.
            </p>
            <div className="mt-6">
              <Link href="/newsletter" className="btn-secondary inline-block">
                View Newsletter Page
              </Link>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </Section>
    </div>
  );
}
