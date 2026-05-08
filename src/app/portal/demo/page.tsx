import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Snapshot",
  description:
    "Illustrative Guest Signal snapshot dashboard for demo purposes.",
};

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${
        up ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {value}
    </span>
  );
}

export default function PortalDemoPage() {
  return (
    <div className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
              Guest Signal snapshot
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Your Restaurant
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Illustrative preview only—numbers and themes are generic samples to
              show how reporting is structured.
            </p>
          </div>
          <Link
            href="/portal"
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 hover:underline"
          >
            ← Back to portal
          </Link>
        </div>

        <section className="mt-10" aria-labelledby="quarterly-heading">
          <div className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-lg sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2
                  id="quarterly-heading"
                  className="text-xl font-semibold text-slate-900"
                >
                  Free quarterly snapshot
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  A single score summarizes guest perception across recent
                  reviews—then breaks into themes that drive loyalty and repeat
                  visits.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start lg:items-end">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Guest Signal Score
                </p>
                <p className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                  84
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Strong performance vs. peer sample set
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-4 border-t border-stone-200 pt-8 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Experience Quality",
                  score: 86,
                  blurb: "Cross-category guest perception using mention-weighted signals.",
                },
                {
                  label: "Service & Hospitality",
                  score: 88,
                  blurb: "Staff warmth and issue recovery trends remain a standout.",
                },
                {
                  label: "Food & Beverage",
                  score: 84,
                  blurb: "Menu quality is strong with mild consistency variance at peak.",
                },
                {
                  label: "Operational Reliability",
                  score: 81,
                  blurb: "Wait times and order accuracy show occasional friction points.",
                },
                {
                  label: "Emotional Connection",
                  score: 82,
                  blurb: "Guests describe the visit as welcoming with room to deepen memorability.",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {row.score}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {row.blurb}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Scoring methodology status</p>
              <p className="mt-2">
                Pillar and total scores use mention-weighted averaging. Categories with zero mentions are excluded
                from averages (not treated as zero).
              </p>
              <p className="mt-1">
                Source coverage shown in production scorecards: <strong>Total</strong>, <strong>Google</strong>,
                and <strong>Yelp</strong> analyzed reviews.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="monthly-heading">
          <h2
            id="monthly-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Monthly score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Ongoing monitoring highlights directionally where attention pays off
            between quarters.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { month: "January", score: 82, delta: 2 },
              { month: "February", score: 84, delta: 2 },
              { month: "March", score: 82, delta: -2 },
            ].map((m) => (
              <div
                key={m.month}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{m.month}</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">
                  {m.score}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>vs. prior month</span>
                  <Trend value={m.delta} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="swot-heading">
          <h2
            id="swot-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            SWOT preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            High-level themes from your reviews—full narrative and action items
            ship with paid reporting.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              {
                title: "Strengths",
                border: "border-l-emerald-600",
                lines: [
                  "Consistent friendly service mentions",
                  "Menu clarity and perceived value",
                ],
              },
              {
                title: "Weaknesses",
                border: "border-l-amber-500",
                lines: [
                  "Peak-hour wait experience variability",
                  "Limited follow-up after service issues",
                ],
              },
              {
                title: "Opportunities",
                border: "border-l-sky-600",
                lines: [
                  "Highlight signature dishes in responses",
                  "Train staff on recovery scripts during rushes",
                ],
              },
              {
                title: "Threats",
                border: "border-l-rose-600",
                lines: [
                  "Nearby competitors promoting speed of service",
                  "Price sensitivity in weekday lunch traffic",
                ],
              },
            ].map((block) => (
              <div
                key={block.title}
                className={`rounded-2xl border border-stone-200 border-l-4 bg-white p-6 shadow-sm ${block.border}`}
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {block.title}
                </h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                  {block.lines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-slate-300">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="upgrade-heading">
          <div className="rounded-3xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-8 shadow-lg sm:p-10">
            <h2
              id="upgrade-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              Turn this snapshot into ongoing intelligence
            </h2>
            <p className="mt-4 max-w-2xl text-slate-600 leading-relaxed">
              Monthly reporting keeps scores, sentiment, and SWOT themes
              current—so leadership can prioritize improvements with confidence.
              When you&apos;re ready, we&apos;ll align on the right monitoring
              tier and consultation cadence for your team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/contact" className="btn-primary text-center sm:inline-flex">
                Book a consultation
              </Link>
              <Link
                href="/services/"
                className="btn-secondary text-center sm:inline-flex"
              >
                View plans &amp; monthly reporting
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
