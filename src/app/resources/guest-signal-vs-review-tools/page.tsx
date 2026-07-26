import type { Metadata } from "next";
import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { Section } from "@/components/Section";
import { brand } from "@/content/site";
import { monitorCheckoutLabel } from "@/content/founding-promo";

export const metadata: Metadata = {
  title: "Guest Signal vs Birdeye, Podium & Review Inbox Tools",
  description:
    "Why independent restaurants need operator scorecards—pillar scoring, evidence SWOT, and 30-day floor playbooks—not just review inboxes and AI replies.",
  alternates: { canonical: "/resources/guest-signal-vs-review-tools/" },
  openGraph: {
    title: `Guest Signal vs Review Inbox Tools | ${brand.name}`,
    description:
      "Compare Guest Signal’s pillar scorecards and SWOT playbooks with Birdeye, Podium, and other reputation inboxes.",
    url: "/resources/guest-signal-vs-review-tools/",
  },
};

export default function GuestSignalVsReviewToolsPage() {
  return (
    <div>
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-stone-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            <Link href="/resources/" className="hover:underline">
              Resources
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Guest Signal vs Birdeye, Podium, and review inbox tools
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Most reputation platforms sell alerts, SMS review asks, and AI reply drafts. Independent
            operators need something harder: a scorecard that turns guest language into pillar scores,
            SWOT, and a 30-day floor plan.
          </p>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">What the big platforms optimize for</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Birdeye (~$299+/mo):</strong> multi-location marketing suite — listings, review
                generation agents, enterprise dashboards.
              </li>
              <li>
                <strong>Podium (~$249–$399+/mo):</strong> SMS-first inbox — review requests, webchat,
                payments.
              </li>
              <li>
                <strong>Reputation.com:</strong> enterprise monitoring and governance across large
                portfolios.
              </li>
            </ul>
            <p className="mt-3 text-slate-700 leading-7">
              Those tools are excellent at volume and response workflows. They are not built as an
              operator scorecard for a single independent restaurant that needs to know which pillar
              to coach this week.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">What Guest Signal ships instead</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>
                <strong>Pillar scoring</strong> — Experience (45%), Operational Reliability (30%),
                Emotional Connection (25%), plus Service and Food &amp; Beverage display pillars.
              </li>
              <li>
                <strong>Evidence SWOT</strong> — strengths/weaknesses tied to scores and mention
                volume, with opportunities and competitive threats.
              </li>
              <li>
                <strong>30-day floor playbooks</strong> — each pillar tile includes the next coaching
                move, not just a chart.
              </li>
              <li>
                <strong>Owner executive brief</strong> — one paragraph: what to protect, what to fix.
              </li>
              <li>
                <strong>Price built for independents</strong> — Monitor from $149/mo (founding promo
                available), not a $299+ enterprise stack.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">When to choose which</h2>
            <p className="mt-3 text-slate-700 leading-7">
              Choose an inbox suite if you need SMS sales + review asks across dozens of locations.
              Choose Guest Signal if you want a monthly operator scorecard that tells the floor what
              to fix — and a free snapshot to prove the model before you buy.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <ServicesIntakeLink href="/snapshot/" className="btn-primary">
              Get your free scorecard snapshot
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
      </Section>
    </div>
  );
}
