import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "How to Get More Restaurant Reviews (Without Star-Chasing)",
  description:
    "How to get more restaurant reviews on Google and Yelp: ethical ask timing, QR/table habits, response discipline, and why review quality beats raw volume.",
  alternates: { canonical: "/resources/get-more-restaurant-reviews/" },
  openGraph: {
    title: `How to Get More Restaurant Reviews | ${brand.name}`,
    description:
      "Operator playbook for more restaurant reviews—velocity with theme quality, not gimmicky star-chasing.",
    url: "/resources/get-more-restaurant-reviews/",
  },
};

export default function GetMoreRestaurantReviewsPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to get more restaurant reviews without star-chasing",
    description:
      "Ethical ways independent restaurants grow Google and Yelp review velocity while protecting guest trust.",
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do restaurants get more Google reviews ethically?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ask after a strong visit with a simple link or QR, make it easy on mobile, thank guests who write, and never filter for five-star only. Pair asks with fixing themes guests already name.",
        },
      },
      {
        "@type": "Question",
        name: "Does getting more reviews improve a restaurant rating?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fresh volume helps Maps stay current, but recurring negative themes can still soften trust. Velocity without ops fixes rarely holds.",
        },
      },
      {
        "@type": "Question",
        name: "When should staff ask for a restaurant review?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "After a clearly good experience—paid check, happy send-off—not during a recovery. One calm ask beats a pushy script.",
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
            How to get more restaurant reviews without star-chasing
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            More reviews keep Maps current—but only if the experience behind them improves. The
            goal is ethical velocity plus theme quality, not a five-star filter.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Five habits that grow review volume
            </h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-slate-700">
              <li>
                <strong>Ask after a win</strong> — paid check, happy send-off, or a guest who
                already compliments the meal.
              </li>
              <li>
                <strong>Make the path one tap</strong> — QR to Google review link on the receipt or
                table card; avoid multi-step email chains.
              </li>
              <li>
                <strong>Train one phrase</strong> — “If you have a minute, a Google note helps other
                guests find us”—then stop. No pressure.
              </li>
              <li>
                <strong>Respond to what you get</strong> — thank specifics; clear under-3★ in 48
                hours (
                <Link
                  href="/resources/respond-to-restaurant-reviews/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  how to respond to restaurant reviews
                </Link>
                ).
              </li>
              <li>
                <strong>Fix themes before you scale asks</strong> — if speed or value repeats, more
                volume will amplify the miss. Use a{" "}
                <Link
                  href="/resources/restaurant-review-scorecard/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review scorecard
                </Link>{" "}
                first.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              What not to do
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Incentivize five-star-only reviews (policy risk and trust damage).</li>
              <li>Ask during a recovery or after a known miss.</li>
              <li>Ignore Yelp while chasing Google—themes usually match both.</li>
              <li>
                Treat volume as the whole strategy—pair with{" "}
                <Link
                  href="/resources/improve-google-restaurant-rating/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  improve Google restaurant rating
                </Link>{" "}
                and{" "}
                <Link
                  href="/resources/restaurant-review-management/"
                  className="font-semibold text-amber-900 underline underline-offset-2"
                >
                  restaurant review management
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
                  How do we get more Google reviews ethically?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ask after strong visits with a simple mobile link, thank writers, never filter for
                  five stars, and fix recurring themes.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  Will more reviews raise our rating?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fresh volume helps Maps stay current, but repeating negatives still soften trust.
                  Velocity without ops fixes rarely holds.
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-950">
                  When should staff ask?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  After a clearly good experience—not during recovery. One calm ask beats a pushy
                  script.
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
