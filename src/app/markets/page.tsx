import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { markets } from "@/content/markets";
import { brand } from "@/content/site";

export const metadata: Metadata = {
  title: "Restaurant Reputation Markets | Google Ratings & Review Scorecards",
  description:
    "Guest Signal Hospitality helps restaurants improve Google ratings and review priorities in Cincinnati and expanding U.S. markets.",
  alternates: { canonical: "/markets/" },
  openGraph: {
    title: "Restaurant reputation markets | Guest Signal Hospitality",
    description:
      "City pages for restaurant Google ratings, review monitoring, and operator scorecards.",
    url: "/markets/",
  },
};

export default function MarketsHubPage() {
  const byRegion = markets.reduce<Record<string, typeof markets>>((acc, market) => {
    (acc[market.regionLabel] ||= []).push(market);
    return acc;
  }, {});

  return (
    <div className="bg-white">
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-5">
          <p className="text-sm font-semibold text-amber-800">Markets</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Restaurant review intelligence beyond one city.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            {brand.name} started in Cincinnati. These market pages target the searches owners
            actually make—Google ratings, review monitoring, and clear next steps—across growing
            U.S. dining cities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary" data-track="markets_hub_snapshot">
              Get a free snapshot
            </ServicesIntakeLink>
            <Link href="/services/" className="btn-secondary">
              See monthly plans
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-5">
          {Object.entries(byRegion).map(([region, rows]) => (
            <div key={region}>
              <h2 className="text-xl font-semibold text-slate-950">{region}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {rows.map((market) => (
                  <Link
                    key={market.slug}
                    href={`/markets/${market.slug}/`}
                    className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-amber-400"
                  >
                    <h3 className="font-semibold text-slate-950">
                      {market.city}, {market.stateCode}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{market.blurb}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
