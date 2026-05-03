import { Suspense } from "react";
import { LeadIntakeForm } from "@/components/LeadIntakeForm";

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div>
          <section className="border-b bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-14">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Contact
              </h1>
              <p className="mt-3 text-slate-600">Loading form…</p>
            </div>
          </section>
        </div>
      }
    >
      <LeadIntakeForm mode="contact" />
    </Suspense>
  );
}
