import type { Metadata } from "next";
import Link from "next/link";
import { resourceArticles } from "@/content/resources";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Restaurant Reputation & Review Resources",
  description:
    "Practical guides for restaurant owners on review monitoring, Google Reviews, and local reputation—plus how Guest Signal Hospitality helps.",
  alternates: { canonical: "/resources/" },
};

export default function ResourcesIndexPage() {
  return (
    <div>
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            Resources
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant reputation and guest experience guides
          </h1>
          <p className="mt-4 text-slate-600 md:text-lg">
            Short, operator-focused articles on review monitoring, Google Reviews, and building a
            better guest signal—whether you are in Cincinnati or nationwide.
          </p>
        </div>
      </section>

      <Section title="Articles" kicker="Read">
        <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-1">
          {resourceArticles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/resources/${a.slug}/`}
                className="block rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-200/80 hover:bg-stone-50/80"
              >
                <h2 className="text-xl font-semibold text-slate-900">{a.headline}</h2>
                <p className="mt-2 text-sm text-slate-600">{a.description}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-amber-800">
                  Read guide →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
