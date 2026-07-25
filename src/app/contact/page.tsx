import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LeadIntakeForm } from "@/components/LeadIntakeForm";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Ask Guest Signal Hospitality a question about restaurant review scorecards, monthly support, or an existing account.",
};

export default function ContactPage() {
  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">How can we help?</h1>
          <p className="mt-3 text-slate-600">
            Use this form for plan questions, partnerships, or account help. Ready to start? Grab a
            free snapshot or begin Signal Monitor below.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
            <Link href="/snapshot/" className="btn-primary inline-block px-6 py-3 text-center">
              Get your free snapshot
            </Link>
            <div className="min-w-[14rem]">
              <StripeCheckoutButton
                planKey="signal_monitor"
                label="Start Signal Monitor — $149/mo"
                className="btn-secondary w-full px-6 py-3"
              />
            </div>
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="mx-auto max-w-3xl px-4 py-10">
            <p className="text-slate-600">Loading form…</p>
          </section>
        }
      >
        <LeadIntakeForm mode="contact" />
      </Suspense>
    </div>
  );
}
