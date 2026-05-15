import Link from "next/link";
import { getTopicCategory } from "@/lib/seo/categories";
import type { ParsedNewsletter } from "@/lib/newsletter/types";
import { getInsightPath } from "@/lib/newsletter/content";

export function ArticleInternalLinks({ article }: { article: ParsedNewsletter }) {
  const topic = getTopicCategory(article.frontmatter.topicCategory);

  return (
    <nav
      aria-label="Continue exploring Guest Signal"
      className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Operational next steps</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {topic ? (
          <li>
            <Link
              href={`/topics/${topic.slug}/`}
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              More on {topic.name}
            </Link>
            <span className="text-slate-500"> — topical guides for operators in this lane.</span>
          </li>
        ) : null}
        <li>
          <Link href="/services/" className="font-semibold text-amber-900 underline underline-offset-2">
            Guest Signal monitoring plans
          </Link>
          <span className="text-slate-500"> — turn review signals into monthly scorecards and action plans.</span>
        </li>
        <li>
          <Link href="/industries/restaurants/" className="font-semibold text-amber-900 underline underline-offset-2">
            Restaurant reputation intelligence
          </Link>
          <span className="text-slate-500"> — how we support independent and multi-unit operators.</span>
        </li>
        <li>
          <Link href="/snapshot/" className="font-semibold text-amber-900 underline underline-offset-2">
            Get your free Guest Signal Snapshot
          </Link>
          <span className="text-slate-500"> — complimentary baseline before choosing Monitor, Growth, or Elevate.</span>
        </li>
        <li>
          <Link href="/" className="font-semibold text-amber-900 underline underline-offset-2">
            Guest Signal Hospitality home
          </Link>
          <span className="text-slate-500"> — operational intelligence for restaurants, bars, and hotels.</span>
        </li>
        <li>
          <Link href="/insights/" className="font-semibold text-amber-900 underline underline-offset-2">
            Hospitality Signals archive
          </Link>
          <span className="text-slate-500"> — weekly search and review intelligence for operators.</span>
        </li>
      </ul>
    </nav>
  );
}
