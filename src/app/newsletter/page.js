import Link from "next/link";
import { getAllNewsletters } from "@/lib/newsletter/content";
import { Section } from "@/components/Section";

export const metadata = {
  title: "This Week in Hospitality Signals",
  description:
    "Weekly hospitality signals for restaurant operators: search trends, guest behavior clues, and practical action steps.",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsletterPage() {
  const items = getAllNewsletters();

  return (
    <div className="bg-gradient-to-b from-stone-100 via-white to-stone-50">
      <section className="border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_40%),radial-gradient(circle_at_top_left,_rgba(2,132,199,0.14),_transparent_35%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-5">
          <img
            src="/guest-signal-header-icon.svg"
            alt="Guest Signal mark"
            className="mx-auto h-12 w-12 rounded-xl border border-amber-200/60 bg-white/85 p-2 shadow-sm"
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-800/80">Newsletter</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            This Week in Hospitality Signals
          </h1>
          <p className="mt-4 text-slate-600 md:text-lg">
            Search trends, guest behavior signals, and operator takeaways for restaurants.
          </p>
        </div>
      </section>

      <Section title="Latest issues" kicker="Archive">
        <div className="mx-auto grid max-w-4xl gap-5">
          {items.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white p-5 text-slate-600">
              No newsletters yet. Run the weekly generator to publish the first issue.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.frontmatter.slug}
                className="rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/70 p-6 shadow-sm"
              >
                {item.frontmatter.heroImage ? (
                  <img
                    src={item.frontmatter.heroImage}
                    alt={`${item.frontmatter.title} banner`}
                    className="mb-4 w-full rounded-xl border border-stone-200 bg-white"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatDate(item.frontmatter.publishedDate)}</span>
                  <span aria-hidden>•</span>
                  <span>{item.frontmatter.category}</span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{item.frontmatter.title}</h2>
                <p className="mt-3 text-slate-600">{item.frontmatter.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.frontmatter.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <Link href={`/newsletter/${item.frontmatter.slug}/`} className="btn-primary inline-block">
                    Read Newsletter
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}
