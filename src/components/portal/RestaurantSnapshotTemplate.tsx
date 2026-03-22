import Link from "next/link";

export type ScorecardRow = {
  id: string;
  period: string;
  score: number | null;
  headline: string | null;
  data: Record<string, unknown> | null;
};

export type RestaurantProfile = {
  name: string;
  slug: string;
  portal_intro: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  google_rating: number | null;
  price_level: number | null;
  competitors: unknown;
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

function priceLevelLabel(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Math.max(0, Math.min(4, Math.round(Number(n))));
  const labels = ["N/A", "$", "$$", "$$$", "$$$$"];
  return labels[v] ?? "—";
}

type Competitor = {
  name: string;
  address?: string;
  google_rating?: number;
  price_level?: number;
  distance_miles?: number;
};

function parseCompetitors(raw: unknown): Competitor[] {
  if (!Array.isArray(raw)) return [];
  const rows: Competitor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    if (!name.trim()) continue;
    rows.push({
      name,
      address: typeof o.address === "string" ? o.address : undefined,
      google_rating:
        typeof o.google_rating === "number" ? o.google_rating : undefined,
      price_level: typeof o.price_level === "number" ? o.price_level : undefined,
      distance_miles:
        typeof o.distance_miles === "number" ? o.distance_miles : undefined,
    });
  }
  return rows
    .sort((a, b) => {
      const da = a.distance_miles ?? 999;
      const db = b.distance_miles ?? 999;
      return da - db;
    })
    .slice(0, 5);
}

const PILLAR_DEF = [
  {
    key: "experience_quality",
    label: "Experience Quality",
    blurb:
      "Service pacing and hospitality tone—how guests describe the feel of the visit.",
  },
  {
    key: "operational_reliability",
    label: "Operational Reliability",
    blurb: "Wait times, order accuracy, and consistency under pressure.",
  },
  {
    key: "emotional_connection",
    label: "Emotional Connection",
    blurb: "Memorability, warmth, and whether guests say they’d return.",
  },
] as const;

type MonthlyRow = { month: string; score: number; delta: number };
type SwotBlock = {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
};

type Props = {
  restaurant: RestaurantProfile;
  scorecards: ScorecardRow[];
};

export function RestaurantSnapshotTemplate({
  restaurant,
  scorecards,
}: Props) {
  const latest = scorecards[0] ?? null;
  const data = latest?.data ?? null;

  const pillars = PILLAR_DEF.map((p) => {
    const v = data?.[p.key];
    const score = typeof v === "number" ? v : null;
    const blurbKey = `${p.key}_blurb`;
    const customBlurb = data?.[blurbKey];
    const blurb =
      typeof customBlurb === "string" && customBlurb.trim()
        ? customBlurb
        : p.blurb;
    return { ...p, score, blurb };
  });

  const monthly = Array.isArray(data?.monthly)
    ? (data?.monthly as MonthlyRow[])
    : null;
  const swot =
    data?.swot && typeof data.swot === "object"
      ? (data.swot as SwotBlock)
      : null;

  const competitors = parseCompetitors(restaurant.competitors);

  const headlineScore = latest?.score ?? null;
  const headlineText =
    latest?.headline ??
    (headlineScore != null
      ? "Guest Signal snapshot"
      : "Reporting will appear here when the first scorecard is published.");

  return (
    <div className="mt-10 space-y-12">
      <section
        className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-lg sm:p-8"
        aria-labelledby="biz-heading"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {restaurant.logo_url ? (
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 sm:h-32 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote operator logos; avoid domain allowlist */}
                  <img
                    src={restaurant.logo_url}
                    alt={`${restaurant.name} logo`}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-center text-xs font-medium text-slate-500 sm:h-32 sm:w-32">
                  Logo
                  <br />
                  not set
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
                Guest Signal snapshot
              </p>
              <h2
                id="biz-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
              >
                {restaurant.name}
              </h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                {restaurant.address ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Address
                    </dt>
                    <dd className="whitespace-pre-wrap">{restaurant.address}</dd>
                  </div>
                ) : (
                  <p className="text-slate-500">Address not set yet.</p>
                )}
                {restaurant.phone ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                        className="font-medium text-amber-900 underline-offset-4 hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {restaurant.website ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 font-semibold text-slate-600">
                      Web
                    </dt>
                    <dd>
                      <a
                        href={
                          restaurant.website.startsWith("http")
                            ? restaurant.website
                            : `https://${restaurant.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-amber-900 underline-offset-4 hover:underline"
                      >
                        {restaurant.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600">
                  <span>
                    Google rating:{" "}
                    <strong className="text-slate-800">
                      {restaurant.google_rating != null
                        ? Number(restaurant.google_rating).toFixed(1)
                        : "—"}
                    </strong>
                  </span>
                  <span>
                    Price tier:{" "}
                    <strong className="text-slate-800">
                      {priceLevelLabel(restaurant.price_level)}
                    </strong>
                  </span>
                </div>
              </dl>
              {restaurant.portal_intro ? (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {restaurant.portal_intro}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="quarterly-heading">
        <div className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-lg sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                id="quarterly-heading"
                className="text-xl font-semibold text-slate-900"
              >
                {latest?.period ? `${latest.period} snapshot` : "Latest snapshot"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                {headlineText}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start lg:items-end">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Guest Signal Score
              </p>
              <p className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                {headlineScore ?? "—"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {headlineScore != null
                  ? "Based on your latest published scorecard"
                  : "Add a scorecard row in Supabase to populate this view"}
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 border-t border-stone-200 pt-8 sm:grid-cols-3">
            {pillars.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {row.score ?? "—"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {row.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {monthly && monthly.length > 0 ? (
        <section aria-labelledby="monthly-heading">
          <h2
            id="monthly-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Monthly score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Directional view between quarters when month-level data is included in
            reporting.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {monthly.map((m) => (
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
      ) : (
        <section aria-labelledby="monthly-heading" className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-8">
          <h2
            id="monthly-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Monthly score breakdown
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            When your scorecard&apos;s JSON includes a{" "}
            <code className="rounded bg-stone-200 px-1 text-xs">monthly</code>{" "}
            array, month-over-month tiles will render here (same layout as the
            sales demo).
          </p>
        </section>
      )}

      {swot &&
      (swot.strengths?.length ||
        swot.weaknesses?.length ||
        swot.opportunities?.length ||
        swot.threats?.length) ? (
        <section aria-labelledby="swot-heading">
          <h2
            id="swot-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            SWOT preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Themes derived from review intelligence in your reporting payload.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(
              [
                {
                  title: "Strengths",
                  border: "border-l-emerald-600",
                  lines: swot.strengths ?? [],
                },
                {
                  title: "Weaknesses",
                  border: "border-l-amber-500",
                  lines: swot.weaknesses ?? [],
                },
                {
                  title: "Opportunities",
                  border: "border-l-sky-600",
                  lines: swot.opportunities ?? [],
                },
                {
                  title: "Threats",
                  border: "border-l-rose-600",
                  lines: swot.threats ?? [],
                },
              ] as const
            ).map((block) => (
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
      ) : (
        <section
          aria-labelledby="swot-heading"
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-8"
        >
          <h2
            id="swot-heading"
            className="text-lg font-semibold text-slate-900"
          >
            SWOT preview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Add a{" "}
            <code className="rounded bg-stone-200 px-1 text-xs">swot</code>{" "}
            object to the scorecard JSON to populate strengths, weaknesses,
            opportunities, and threats.
          </p>
        </section>
      )}

      <section aria-labelledby="peers-heading">
        <h2
          id="peers-heading"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Comparable competitors (~20 mi)
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Top five peer venues with similar price tier and Google ratings,
          within roughly twenty miles—<strong>curated and stored in Supabase</strong>{" "}
          for each location. Live Google Places discovery needs a secure backend
          and API billing; we can add that when you&apos;re ready.
        </p>
        {competitors.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-stone-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
            No competitor rows yet. Edit the{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">competitors</code>{" "}
            JSON on this restaurant in the Table Editor (array of objects with{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">name</code>,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">address</code>,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              google_rating
            </code>
            ,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">price_level</code>{" "}
            0–4,{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              distance_miles
            </code>
            ).
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80">
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Competitor
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Address
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Google
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-900">
                    Miles
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, idx) => (
                  <tr key={`${c.name}-${idx}`} className="border-b border-stone-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.google_rating != null
                        ? c.google_rating.toFixed(1)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {priceLevelLabel(c.price_level)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.distance_miles != null
                        ? c.distance_miles.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="upgrade-heading">
        <div className="rounded-3xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-8 shadow-lg sm:p-10">
          <h2
            id="upgrade-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Turn this snapshot into ongoing intelligence
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
            Monthly reporting keeps scores, sentiment, and SWOT themes
            current—so leadership can prioritize improvements with confidence.
            When you&apos;re ready, we&apos;ll align on the right monitoring tier
            and consultation cadence for your team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact/"
              className="btn-primary text-center sm:inline-flex"
            >
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
  );
}
