import Link from "next/link";
import type { ParsedNewsletter } from "@/lib/newsletter/types";
import { getInsightPath } from "@/lib/newsletter/content";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RelatedArticles({ items, currentSlug }: { items: ParsedNewsletter[]; currentSlug: string }) {
  const related = items.filter((item) => item.frontmatter.slug !== currentSlug);
  if (related.length === 0) return null;

  return (
    <aside className="mt-12 rounded-2xl border border-stone-200 bg-stone-50/80 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Related operational intelligence</h2>
      <ul className="mt-4 space-y-4">
        {related.map((item) => (
          <li key={item.frontmatter.slug}>
            <Link
              href={getInsightPath(item.frontmatter.slug)}
              className="group block rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-amber-200"
            >
              <p className="text-xs text-slate-500">{formatDate(item.frontmatter.publishedDate)}</p>
              <p className="mt-1 font-semibold text-slate-900 group-hover:text-amber-900">
                {item.frontmatter.title}
              </p>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.frontmatter.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
