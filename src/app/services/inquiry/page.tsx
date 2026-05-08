import { Suspense } from "react";
import type { Metadata } from "next";
import { LeadIntakeForm } from "@/components/LeadIntakeForm";

export const metadata: Metadata = {
  title: "Start Your Free Snapshot",
  description:
    "Start your Guest Signal Hospitality plan intake to receive a restaurant guest experience snapshot with review sentiment themes, strengths, and risk areas.",
};

export default function ServicesInquiryPage() {
  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Plan intake</h1>
          <p className="mt-3 text-slate-600">
            Share a few details about your restaurant so we can deliver the right snapshot or
            monitoring plan. You will get a confirmation by email after submission.
          </p>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="mx-auto max-w-3xl px-4 py-10">
            <p className="text-slate-600">Loading…</p>
          </section>
        }
      >
        <LeadIntakeForm mode="service" />
      </Suspense>
    </div>
  );
}
