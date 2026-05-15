import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegacyRedirect } from "@/components/seo/LegacyRedirect";
import {
  buildLegacySlugMap,
  getLegacyRedirectTarget,
} from "@/lib/seo/redirects";
import {
  getAllLegacySlugsForRedirect,
  getAllNewsletters,
  getInsightPath,
} from "@/lib/newsletter/content";
import { getSiteOrigin } from "@/lib/site-url";

type Params = { slug: string };

export function generateStaticParams() {
  const legacy = getAllLegacySlugsForRedirect().map((slug) => ({ slug }));
  const published = getAllNewsletters()
    .filter((n) => !n.frontmatter.draft)
    .map((n) => ({ slug: n.frontmatter.slug.replace(/^\/+|\/+$/g, "") }));
  const seen = new Set<string>();
  return [...legacy, ...published].filter((entry) => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}

function resolveTargetPath(slug: string): string | null {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const legacyMap = buildLegacySlugMap(
    getAllNewsletters().map((n) => ({
      slug: n.frontmatter.slug,
      legacySlug: n.frontmatter.legacySlug,
    })),
  );
  const legacyTarget = getLegacyRedirectTarget(clean, legacyMap);
  if (legacyTarget) return getInsightPath(legacyTarget);

  const item = getAllNewsletters().find(
    (n) => n.frontmatter.slug.replace(/^\/+|\/+$/g, "") === clean,
  );
  if (item) return getInsightPath(item.frontmatter.slug);

  return null;
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const target = resolveTargetPath(params.slug);
  if (!target) return {};
  const origin = getSiteOrigin();
  return {
    robots: { index: false, follow: true },
    alternates: { canonical: `${origin}${target}` },
  };
}

export default function LegacyNewsletterRedirectPage({ params }: { params: Params }) {
  const target = resolveTargetPath(params.slug);
  if (!target) notFound();
  return <LegacyRedirect targetPath={target} />;
}
