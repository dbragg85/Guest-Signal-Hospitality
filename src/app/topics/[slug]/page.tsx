import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getInsightPath,
  getNewslettersByTopic,
} from "@/lib/newsletter/content";
import { topicCategories, getTopicCategory } from "@/lib/seo/categories";
import type { TopicCategorySlug } from "@/lib/newsletter/types";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";

type Params = { slug: string };

export function generateStaticParams() {
  return topicCategories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const topic = getTopicCategory(params.slug);
  if (!topic) return {};
  return {
    title: `${topic.name} — Hospitality Operational Intelligence`,
    description: topic.description,
    alternates: { canonical: `/topics/${topic.slug}/` },
    openGraph: {
      title: `${topic.name} | Guest Signal Hospitality`,
      description: topic.description,
      url: `/topics/${topic.slug}/`,
    },
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TopicPage({ params }: { params: Params }) {
  const topic = getTopicCategory(params.slug);
  if (!topic) notFound();

  const articles = getNewslettersByTopic(params.slug as TopicCategorySlug);

  return (
    <div className="bg-gradient-to-b from-stone-100 via-white to-stone-50">
      <JsonLd
        data={[
          collectionPageSchema({
            name: topic.name,
            description: topic.description,
            path: `/topics/${topic.slug}/`,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hospitality Signals", path: "/insights/" },
            { name: topic.name, path: `/topics/${topic.slug}/` },
          ]),
        ]}
      />

      <section className="border-b border-stone-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_40%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Hospitality Signals", href: "/insights/" },
              { label: topic.name },
            ]}
          />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{topic.name}</h1>
          <p className="mt-4 text-lg text-slate-600">{topic.description}</p>
          <p className="mt-4 text-sm text-slate-500">
            Keywords: {topic.keywords.join(" · ")}
          </p>
        </div>
      </section>

      <Section title="Articles in this topic" kicker="Intelligence briefs">
        <div className="mx-auto max-w-4xl space-y-4">
          {articles.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white p-5 text-slate-600">
              More {topic.name.toLowerCase()} briefs are on the way. Browse the{" "}
              <Link href="/insights/" className="font-semibold text-amber-900 underline">
                full Hospitality Signals archive
              </Link>
              .
            </p>
          ) : (
            articles.map((item) => (
              <article
                key={item.frontmatter.slug}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs text-slate-500">{formatDate(item.frontmatter.publishedDate)}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.frontmatter.title}</h2>
                <p className="mt-2 text-slate-600">{item.frontmatter.excerpt}</p>
                <Link
                  href={getInsightPath(item.frontmatter.slug)}
                  className="mt-4 inline-block text-sm font-semibold text-amber-900 underline underline-offset-2"
                >
                  Read {topic.name.toLowerCase()} intelligence brief
                </Link>
              </article>
            ))
          )}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <Link href="/services/" className="btn-secondary inline-block">
            Explore Guest Signal monitoring plans
          </Link>
        </div>
      </Section>
    </div>
  );
}
