import { Suspense } from "react";
import type { Metadata } from "next";
import { SnapshotIntakeForm } from "@/components/SnapshotIntakeForm";

export const metadata: Metadata = {
  title: "Free Guest Signal Snapshot",
  description:
    "Request your complimentary Guest Signal Snapshot: review sentiment, Google Business Profile visibility, website health, SEO opportunities, competitor context, and a recommended plan fit—delivered within 48 hours.",
  alternates: {
    canonical: "/snapshot/",
  },
};

export default function SnapshotPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-slate-600">Loading…</p>
        </section>
      }
    >
      <SnapshotIntakeForm />
    </Suspense>
  );
}
