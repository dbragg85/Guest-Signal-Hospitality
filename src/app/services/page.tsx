import Link from "next/link";
import { freeSnapshot, pricingPlans, servicesPricingBenchmark } from "@/content/site";
import { Section } from "@/components/Section";

export default function ServicesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Guest Signal Plans
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Choose the level of intelligence and support that fits your restaurant's growth goals.
            </p>
            <p className="mt-6 text-left text-sm text-slate-600 max-w-3xl mx-auto leading-relaxed rounded-2xl border border-stone-200 bg-white/80 px-5 py-4">
              {servicesPricingBenchmark}
            </p>
            <p className="mt-4 text-center text-sm text-slate-600 max-w-2xl mx-auto">
              Each plan opens a dedicated intake with tier-specific questions (address, concept, and priorities)—not the
              same short form as general{" "}
              <Link href="/contact" className="font-semibold text-slate-800 underline underline-offset-2">
                Contact
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Free Snapshot Section */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border-2 border-stone-200 bg-gradient-to-br from-stone-50 to-white p-8 shadow-lg md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {freeSnapshot.title}
              </h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">{freeSnapshot.price}</span>
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
                href={`/services/inquiry?plan=${freeSnapshot.inquiryKey}`}
                className="btn-primary inline-block px-8 py-3"
                data-track="services_cta_free_snapshot"
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
                  ? "scale-105 border-slate-900 bg-gradient-to-br from-stone-50 to-white ring-1 ring-amber-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-slate-800 to-amber-600 px-4 py-1 text-xs font-semibold text-white">
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
                href={`/services/inquiry?plan=${plan.inquiryKey}`}
                className={`block w-full text-center rounded-xl px-5 py-3 text-sm font-semibold ${
                  plan.popular
                    ? "btn-primary shadow-md"
                    : "border border-stone-300 text-slate-900 hover:bg-stone-50"
                }`}
                data-track={`services_cta_${plan.inquiryKey}`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Authority Section */}
      <Section>
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
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
    </div>
  );
}
