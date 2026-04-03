"use client";

import { Suspense } from "react";
import { LeadIntakeForm } from "@/components/LeadIntakeForm";

export default function ServicesInquiryPage() {
  return (
    <Suspense
      fallback={
        <div>
          <section className="border-b bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-14">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Plan intake
              </h1>
              <p className="mt-3 text-slate-600">Loading…</p>
            </div>
          </section>
        </div>
      }
    >
      <LeadIntakeForm mode="service" />
    </Suspense>
  );
}
