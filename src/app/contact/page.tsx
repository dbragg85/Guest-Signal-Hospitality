import { Suspense } from "react";
import type { Metadata } from "next";
import { LeadIntakeForm } from "@/components/LeadIntakeForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Guest Signal Hospitality to request your restaurant guest experience snapshot and discuss review sentiment monitoring, scorecards, and improvement support.",
};

export default function ContactPage() {
  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact</h1>
          <p className="mt-3 text-slate-600">
            Request your free Guest Signal Snapshot and tell us your priorities. We work with
            independent restaurant owners who want clearer insight into guest feedback and reputation
            trends.
          </p>
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
