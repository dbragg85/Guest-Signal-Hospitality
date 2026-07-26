import Link from "next/link";
import type { Metadata } from "next";
import { NewsletterMarkdown } from "@/components/newsletter/NewsletterMarkdown";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedArticles } from "@/components/seo/RelatedArticles";
import { ArticleInternalLinks } from "@/components/seo/ArticleInternalLinks";
import {
  getInsightPath,
  getRelatedNewsletters,
} from "@/lib/newsletter/content";
import type { ParsedNewsletter } from "@/lib/newsletter/types";
import { getTopicCategory } from "@/lib/seo/categories";
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
} from "@/lib/seo/schema";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { monitorCheckoutLabel } from "@/content/founding-promo";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function buildInsightMetadata(item: ParsedNewsletter): Metadata {
  const path = getInsightPath(item.frontmatter.slug);
  return {
    title: item.frontmatter.seoTitle,
    description: item.frontmatter.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: item.frontmatter.seoTitle,
      description: item.frontmatter.metaDescription,
      url: path,
      type: "article",
      publishedTime: item.frontmatter.publishedDate,
      modifiedTime: item.frontmatter.updatedDate,
      ...(item.frontmatter.heroImage ? { images: [item.frontmatter.heroImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: item.frontmatter.seoTitle,
      description: item.frontmatter.metaDescription,
    },
    ...(item.frontmatter.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export function InsightArticle({ item }: { item: ParsedNewsletter }) {
  const slug = item.frontmatter.slug.replace(/^\/+|\/+$/g, "");
  const path = getInsightPath(slug);
  const topic = getTopicCategory(item.frontmatter.topicCategory);
  const related = getRelatedNewsletters(item, 3);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Hospitality Signals", href: "/insights/" },
    ...(topic ? [{ label: topic.name, href: `/topics/${topic.slug}/` }] : []),
    { label: item.frontmatter.title },
  ];

  const schemaBreadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Hospitality Signals", path: "/insights/" },
    ...(topic ? [{ name: topic.name, path: `/topics/${topic.slug}/` }] : []),
    { name: item.frontmatter.title, path },
  ];

  return (
    <div className="bg-gradient-to-b from-stone-100 via-white to-stone-50">
      <JsonLd
        data={[
          organizationSchema(),
          articleSchema({
            title: item.frontmatter.title,
            description: item.frontmatter.excerpt,
            path,
            publishedDate: item.frontmatter.publishedDate,
            updatedDate: item.frontmatter.updatedDate,
            image: item.frontmatter.heroImage,
          }),
          breadcrumbSchema(schemaBreadcrumbs),
        ]}
      />

      <section className="border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.2),_transparent_42%),radial-gradient(circle_at_top_left,_rgba(2,132,199,0.14),_transparent_38%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <Breadcrumbs items={breadcrumbItems} />
          {item.frontmatter.heroImage ? (
            <img
              src={item.frontmatter.heroImage}
              alt={`${item.frontmatter.title} — hospitality operational intelligence`}
              className="mb-5 mt-4 w-full rounded-2xl border border-stone-200 bg-white shadow-sm"
              loading="lazy"
            />
          ) : (
            <img
              src="/guest-signal-header-icon.svg"
              alt="Guest Signal Hospitality logo mark"
              className="mt-4 h-12 w-12 rounded-xl border border-amber-200/70 bg-white/90 p-2 shadow-sm"
            />
          )}
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            {topic ? (
              <Link href={`/topics/${topic.slug}/`} className="hover:underline">
                {topic.name}
              </Link>
            ) : (
              <Link href="/insights/" className="hover:underline">
                Hospitality Signals
              </Link>
            )}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{item.frontmatter.title}</h1>
          <p className="mt-3 text-sm text-slate-500">{formatDate(item.frontmatter.publishedDate)}</p>
          <p className="mt-4 text-slate-600">{item.frontmatter.excerpt}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
        <div className="mb-6 rounded-2xl border border-sky-200/60 bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
          Hospitality operational intelligence for restaurant owners and operators — practical weekly
          signals from search trends and guest feedback patterns.
        </div>
        <NewsletterMarkdown markdown={item.body} />
        <RelatedArticles items={related} currentSlug={item.frontmatter.slug} />
        <ArticleInternalLinks article={item} />
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Turn this brief into your scorecard</h2>
          <p className="mt-2 text-slate-700">
            Start free with a Guest Signal Snapshot, or begin monthly monitoring if you already know
            you want the recurring scorecard.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink
              href="/snapshot/"
              className="btn-primary inline-block"
              data-track="cta_insight_snapshot"
            >
              Request free snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
