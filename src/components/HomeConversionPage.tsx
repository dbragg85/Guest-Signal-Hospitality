import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { pricingPlans } from "@/content/site";
import { getFeaturedNewsletters, getInsightPath } from "@/lib/newsletter/content";

const deliverables = [
  {
    title: "A score you can explain",
    body: "One clear baseline across food, service, speed, cleanliness, and atmosphere.",
  },
  {
    title: "The three issues to fix first",
    body: "Review themes ranked by what is hurting trust, consistency, or repeat visits.",
  },
  {
    title: "Words your GM can use",
    body: "Plain-language coaching notes and response direction—not a 40-page deck.",
  },
];

const planFit: Record<string, string> = {
  "Signal Monitor": "For owners who want a dependable monthly pulse.",
  "Signal Growth": "For teams actively improving demand and conversion.",
  "Signal Elevate": "For operators who want hands-on analysis and support.",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function HomeConversionPage() {
  const insights = getFeaturedNewsletters(3);

  return (
    <div className="bg-white">
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-5 md:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Review intelligence for independent restaurants
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
              Know what guests notice. Fix what costs you repeat visits.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              We turn your Google and Yelp reviews into one score, the themes behind it,
              and three practical priorities your team can use this week.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ServicesIntakeLink
                href="/snapshot/"
                className="btn-primary px-6 py-3 text-center"
                data-track="cta_hero_snapshot"
              >
                Get your free snapshot
              </ServicesIntakeLink>
              <Link href="#what-you-get" className="btn-secondary px-6 py-3 text-center">
                See what you get
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No card. No sales call required. Delivered to your private portal.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Example scorecard
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Last 30 days</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-semibold tracking-tight text-slate-950">73</p>
                <p className="text-xs text-slate-500">Guest Signal Score</p>
              </div>
            </div>
            <div className="mt-7 space-y-4">
              {[
                ["Food", 82],
                ["Service", 76],
                ["Speed", 58],
                ["Atmosphere", 79],
              ].map(([label, score]) => (
                <div key={String(label)}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">{score}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 border-t border-stone-200 pt-5">
              <p className="text-sm font-semibold text-slate-900">First priority</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Saturday wait-time complaints are rising. Tighten the host-to-table handoff
                before adding another promotion.
              </p>
            </div>
            <p className="mt-4 text-xs text-slate-400">Sample layout—not a customer result.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:px-5 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">Built in Cincinnati for operators, not marketing teams.</p>
          <p className="text-sm text-slate-300">
            One recent 30-day engagement lifted booking CTA clicks 27% after message and plan-page changes.
          </p>
        </div>
      </section>

      <section id="what-you-get" className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-amber-800">Your free snapshot</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Useful before the next manager meeting.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              We do the reading and sorting. You get the short version.
            </p>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 md:grid-cols-3">
            {deliverables.map((item, index) => (
              <div key={item.title} className="bg-white p-7">
                <p className="text-sm font-semibold text-amber-800">0{index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <ServicesIntakeLink
              href="/snapshot/"
              className="btn-primary inline-block px-6 py-3"
              data-track="cta_snapshot_deliverables"
            >
              Get your free snapshot
            </ServicesIntakeLink>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-50 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-amber-800">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Reviews in. Priorities out.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Start free. If the monthly support is useful, keep it. If not, you still leave
                with a clear baseline.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                ["1", "Share the basics", "Restaurant, location, and the email for your private portal."],
                ["2", "We read the patterns", "Google and Yelp reviews are grouped into the issues guests repeat."],
                ["3", "Use the short list", "Open your scorecard and take the top three priorities to your team."],
              ].map(([number, title, body]) => (
                <li key={number} className="border-l-2 border-amber-500 pl-5">
                  <p className="text-sm font-semibold text-slate-500">{number}</p>
                  <h3 className="mt-2 font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-amber-800">Monthly support</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Keep the level of help that fits.
              </h2>
            </div>
            <Link href="/services/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
              Compare every plan detail
            </Link>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.popular ? "border-amber-500 bg-amber-50/40" : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-950">{plan.name}</h3>
                  {plan.popular ? (
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                      Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {plan.price}<span className="text-sm font-normal text-slate-500">/{plan.period}</span>
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{planFit[plan.name]}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-amber-700">—</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <StripeCheckoutButton
                    planKey={plan.inquiryKey}
                    label={plan.buttonText}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                      plan.popular
                        ? "btn-primary"
                        : "border border-stone-300 text-slate-900 hover:bg-stone-50"
                    }`}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {insights.length ? (
        <section className="border-y border-stone-200 bg-stone-50 py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-5">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-amber-800">From the field</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Short reads for busy operators.
                </h2>
              </div>
              <Link href="/insights/" className="hidden text-sm font-semibold underline underline-offset-4 sm:block">
                See all briefs
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {insights.map((item) => (
                <Link
                  key={item.frontmatter.slug}
                  href={getInsightPath(item.frontmatter.slug)}
                  className="group rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:border-amber-400"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {formatDate(item.frontmatter.publishedDate)}
                  </p>
                  <h3 className="mt-3 font-semibold leading-6 text-slate-950 group-hover:text-amber-900">
                    {item.frontmatter.title.replace(/^This Week in Hospitality Signals:\s*/i, "")}
                  </h3>
                  <p className="mt-4 text-sm font-semibold text-slate-700">Read the brief →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-stone-200 bg-stone-50 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-5">
          <p className="text-sm font-semibold text-amber-800">Beyond Cincinnati</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Expanding restaurant reputation coverage across major U.S. markets.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            City pages target Google ratings and review searches where independent operators
            compete for local pack attention.
          </p>
          <div className="mt-8">
            <Link href="/markets/" className="btn-secondary inline-block px-6 py-3">
              Browse markets
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-5">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Your reviews already contain the next fix.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Start free, or skip ahead if you already know you want a monthly scorecard.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ServicesIntakeLink
              href="/snapshot/"
              className="btn-primary inline-block px-7 py-3"
              data-track="cta_home_final"
            >
              Get your free snapshot
            </ServicesIntakeLink>
            <StripeCheckoutButton
              planKey="signal_monitor"
              label="Start Signal Monitor — $149/mo"
              className="btn-secondary px-7 py-3"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
