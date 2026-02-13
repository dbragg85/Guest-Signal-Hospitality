import Link from "next/link";
import { brand, freeSnapshot, pricingPlans } from "@/content/site";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { CTA } from "@/components/CTA";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b gradient-primary">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Know Your Restaurant's Guest Signal Score.
            </h1>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">
              Monitor, Improve, and Elevate Your Guest Experience.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="btn-primary text-center"
              >
                Get Your Free Guest Signal Snapshot
              </Link>
              <Link
                href="/services"
                className="btn-secondary text-center"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Free Snapshot Section */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8 md:p-12 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {freeSnapshot.title}
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">{freeSnapshot.price}</span>
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
              <Link
                href="/contact"
                className="inline-block rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-3 text-sm font-semibold text-white hover:from-primary-700 hover:to-primary-800 shadow-lg transition-all"
              >
                {freeSnapshot.buttonText}
              </Link>
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
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Analyze Reviews</h3>
              </div>
              <p className="text-sm text-slate-600">
                We analyze your guest reviews and sentiment to understand what customers are really saying.
              </p>
            </div>

            <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Calculate Score</h3>
              </div>
              <p className="text-sm text-slate-600">
                We calculate your Guest Signal Score to give you a clear picture of your reputation.
              </p>
            </div>

            <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Identify Areas</h3>
              </div>
              <p className="text-sm text-slate-600">
                We identify strengths and risk areas so you know exactly where to focus your efforts.
              </p>
            </div>

            <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
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

      {/* Pricing Plans Section */}
      <Section title="Ongoing Guest Experience Monitoring & Elevation" kicker="Core Plans">
        <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
          Choose the level of intelligence and support that fits your restaurant's growth goals.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border-2 p-8 shadow-sm relative ${
                plan.popular
                  ? "border-slate-900 bg-gradient-to-br from-slate-50 to-white scale-105"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md">
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

              <Link
                href="/contact"
                className={`block w-full text-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md"
                    : "border border-slate-300 text-slate-900 hover:bg-primary-50 hover:border-primary-300"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Authority Section */}
      <Section>
        <div className="rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white p-10 shadow-sm">
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
        <div className="rounded-3xl border border-accent-200 bg-gradient-to-br from-accent-50 via-white to-primary-50 p-10 shadow-sm">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Get the Guest Signal Intelligence Brief
            </h2>
            <p className="mt-4 text-slate-600">
              Monthly insights into guest experience trends and hospitality performance.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </Section>
    </div>
  );
}
