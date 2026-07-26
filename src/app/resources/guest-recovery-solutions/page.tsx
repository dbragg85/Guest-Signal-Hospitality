import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Guest Recovery Solutions for Restaurants: Floor Playbooks",
  description:
    "Guest recovery solutions for restaurant operators: 48-hour reply discipline, floor recovery language, and theme fixes that protect Google ratings—not generic apology templates.",
  alternates: { canonical: "/resources/guest-recovery-solutions/" },
  openGraph: {
    title: `Guest Recovery Solutions for Restaurants | ${brand.name}`,
    description:
      "Practical guest recovery solutions: response speed, recovery language, and ops fixes tied to review themes.",
    url: "/resources/guest-recovery-solutions/",
  },
};

export default function GuestRecoverySolutionsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Guest recovery solutions for restaurants: floor playbooks that stick",
    description:
      "How independent restaurants recover from bad guest experiences with reply discipline and theme-based floor fixes.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are guest recovery solutions for restaurants?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Guest recovery solutions are the systems restaurants use after a bad experience—fast, specific replies plus floor fixes for the themes guests keep naming—so Maps trust and repeat visits recover.",
        },
      },
      {
        "@type": "Question",
        name: "How fast should restaurants respond to negative reviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Aim to reply to every review under 3★ within 48 hours. Speed protects perception; specificity (what you will change) protects trust more than a generic apology.",
        },
      },
      {
        "@type": "Question",
        name: "Do guest recovery solutions replace fixing operations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Replies buy time; recurring themes (speed, value, cleanliness) need floor ownership. Recovery without ops fixes rarely moves ratings.",
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/resources/" className="hover:underline">
              Resources
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Guest recovery solutions for restaurants: floor playbooks that stick
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Guest recovery is not a polished apology. It is a 48-hour reply habit plus a floor fix for
            the theme guests keep naming—so Google and Yelp stop compounding the same miss.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Three layers of guest recovery that actually work
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                <strong>Public reply within 48 hours</strong> — acknowledge the visit, own the miss,
                invite offline resolution. Skip defensive language.
              </li>
              <li>
                <strong>Private recovery</strong> — manager outreach with a clear make-good when the
                guest is identifiable and the miss was real.
              </li>
              <li>
                <strong>Theme fix on the floor</strong> — if three guests name the same delay or
                dish, it is a training or station problem, not a PR problem.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Recovery language managers can reuse
            </h2>
            <p className="mt-3 text-slate-700 leading-7">
              Keep a short phrase bank for peak nights. Example shape: thank the guest, name the
              issue without arguing, say what changes tonight, offer a path to talk. Pair replies
              with{" "}
              <Link
                href="/resources/restaurant-review-monitoring/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant review monitoring
              </Link>{" "}
              so you know which themes deserve a huddle, and a{" "}
              <Link
                href="/resources/restaurant-review-scorecard/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                restaurant review scorecard
              </Link>{" "}
              when you need weighted pillars instead of inbox noise.
            </p>
            <p className="mt-3 text-slate-700 leading-7">
              For frontline coaching detail, see the insight{" "}
              <Link
                href="/insights/guest-recovery-playbooks/"
                className="font-semibold text-amber-900 underline underline-offset-2"
              >
                guest recovery playbooks
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              When recovery should escalate to ops
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Same theme appears 3+ times in 30 days (speed, value, cleanliness, food).</li>
              <li>Unanswered negatives older than 48 hours pile up.</li>
              <li>
                Maps rating softens while reply volume stays high—see{" "}
                <Link
                  href="/resources/improve-google-restaurant-rating/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  improve Google restaurant rating
                </Link>
                .
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  What are guest recovery solutions for restaurants?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Systems for after a bad experience: fast specific replies plus floor fixes for
                  recurring themes—so Maps trust and repeat visits recover.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  How fast should we respond to negative reviews?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reply to every review under 3★ within 48 hours. Specificity beats a generic
                  apology.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Do recovery replies replace fixing operations?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  No. Replies buy time; recurring themes need owner-assigned floor fixes or ratings
                  stall.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Get your free snapshot
            </ServicesIntakeLink>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label={monitorCheckoutLabel()}
                className="btn-secondary w-full"
              />
            </div>
            <Link
              href="/resources/"
              className="px-2 py-3 text-sm font-semibold text-amber-900 underline underline-offset-2"
            >
              All reputation guides
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
