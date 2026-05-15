import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildInsightMetadata, InsightArticle } from "@/components/insights/InsightArticle";
import {
  getNewsletterBySlug,
  getPublishedNewsletters,
} from "@/lib/newsletter/content";

type Params = { slug: string };

export function generateStaticParams() {
  return getPublishedNewsletters().map((item) => ({
    slug: item.frontmatter.slug.replace(/^\/+|\/+$/g, ""),
  }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const item = getNewsletterBySlug(params.slug);
  if (!item) return {};
  return buildInsightMetadata(item);
}

export default function InsightDetailPage({ params }: { params: Params }) {
  const item = getNewsletterBySlug(params.slug);
  if (!item || item.frontmatter.draft) notFound();
  return <InsightArticle item={item} />;
}
