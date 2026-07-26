import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SnapshotIntakeForm } from "@/components/SnapshotIntakeForm";
import { brand } from "@/content/site";

export const metadata: Metadata = {
  title: "Free Restaurant Review Scorecard Snapshot",
  description:
    "Request a free Guest Signal snapshot: Google and Yelp review themes, Guest Signal Score pillars, SWOT preview, and three floor priorities—delivered for independent restaurants.",
  alternates: {
    canonical: "/snapshot/",
  },
  openGraph: {
    title: `Free Restaurant Review Scorecard Snapshot | ${brand.name}`,
    description:
      "Complimentary dual-source review scorecard for independent restaurants—themes, pillars, and weekly moves.",
    url: "/snapshot/",
  },
};

export default function SnapshotPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a free Guest Signal snapshot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A complimentary restaurant review scorecard from Google and Yelp: a headline Guest Signal Score, theme friction, SWOT preview, and three practical priorities for your floor.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a credit card for the free snapshot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The free snapshot does not require a card. You can start Signal Monitor later if you want monthly scorecards.",
        },
      },
      {
        "@type": "Question",
        name: "How is a snapshot different from a star average?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Stars collapse every visit into one number. The snapshot scores experience, ops, and emotional pillars and ranks themes by how often guests mention friction.",
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            Free scorecard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Free restaurant review scorecard snapshot
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            See how guests talk about your restaurant on Google and Yelp—pillars, themes, and three
            moves—before you buy a monthly plan.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link
              href="/resources/restaurant-review-scorecard/"
              className="text-amber-900 underline underline-offset-2"
            >
              What a scorecard includes
            </Link>
            <Link
              href="/resources/restaurant-review-management/"
              className="text-amber-900 underline underline-offset-2"
            >
              Review management loop
            </Link>
            <Link
              href="/resources/guest-signal-vs-review-tools/"
              className="text-amber-900 underline underline-offset-2"
            >
              vs inbox tools
            </Link>
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="mx-auto max-w-3xl px-4 py-10">
            <p className="text-slate-600">Loading…</p>
          </section>
        }
      >
        <SnapshotIntakeForm />
      </Suspense>

      <section className="border-t border-stone-200 bg-stone-50/60 py-12">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-5">
          <h2 className="text-xl font-semibold text-slate-900">Snapshot FAQ</h2>
          <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">What do I get?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A dual-source read of recent reviews, a headline score, theme friction, SWOT preview,
                and three floor priorities—not a vanity star average.
              </p>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">Is a card required?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                No. Start free. Upgrade to Signal Monitor only if you want recurring scorecards.
              </p>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-slate-950">
                How is this different from review inbox tools?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Inboxes optimize for replies and asks. The snapshot is an operator scorecard—see{" "}
                <Link
                  href="/resources/guest-signal-vs-review-tools/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  Guest Signal vs review tools
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
