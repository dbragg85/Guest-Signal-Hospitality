import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NewsletterMarkdown } from "@/components/newsletter/NewsletterMarkdown";
import { getAllNewsletters, getNewsletterBySlug, getNewsletterCanonical } from "@/lib/newsletter/content";
import { brand } from "@/content/site";

type Params = { slug: string };

export function generateStaticParams() {
  return getAllNewsletters().map((item) => ({
    slug: item.frontmatter.slug.replace(/^\/+|\/+$/g, ""),
  }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const item = getNewsletterBySlug(params.slug);
  if (!item) return {};
  return {
    title: item.frontmatter.seoTitle,
    description: item.frontmatter.metaDescription,
    alternates: {
      canonical: `/newsletter/${item.frontmatter.slug.replace(/^\/+|\/+$/g, "")}/`,
    },
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsletterDetailPage({ params }: { params: Params }) {
  const item = getNewsletterBySlug(params.slug);
  if (!item) notFound();

  const canonical = getNewsletterCanonical(item.frontmatter.slug);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.frontmatter.title,
    description: item.frontmatter.excerpt,
    datePublished: item.frontmatter.publishedDate,
    dateModified: item.frontmatter.updatedDate,
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
    mainEntityOfPage: canonical,
    url: canonical,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://guestsignalhospitality.com/" },
      { "@type": "ListItem", position: 2, name: "Newsletter", item: "https://guestsignalhospitality.com/newsletter/" },
      { "@type": "ListItem", position: 3, name: item.frontmatter.title, item: canonical },
    ],
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: "https://guestsignalhospitality.com/",
  };

  return (
    <div className="bg-gradient-to-b from-stone-100 via-white to-stone-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      <section className="border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.2),_transparent_42%),radial-gradient(circle_at_top_left,_rgba(2,132,199,0.14),_transparent_38%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <img
            src="/guest-signal-header-icon.svg"
            alt="Guest Signal mark"
            className="h-12 w-12 rounded-xl border border-amber-200/70 bg-white/90 p-2 shadow-sm"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/newsletter/" className="hover:underline">
              Newsletter
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{item.frontmatter.title}</h1>
          <p className="mt-3 text-sm text-slate-500">{formatDate(item.frontmatter.publishedDate)}</p>
          <p className="mt-4 text-slate-600">{item.frontmatter.excerpt}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
        <div className="mb-6 rounded-2xl border border-sky-200/60 bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
          Built for restaurant owners and operators who want practical weekly signal intelligence.
        </div>
        <NewsletterMarkdown markdown={item.body} />

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Get Your Free Guest Signal Snapshot</h2>
          <p className="mt-2 text-slate-700">
            Want to know what your guests are already signaling? Request your free Guest Signal Snapshot.
          </p>
          <div className="mt-4">
            <Link href="/services/inquiry/?plan=free_snapshot" className="btn-primary inline-block">
              Request Free Snapshot
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
