import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalWelcomePasswordForm } from "@/components/PortalWelcomePasswordForm";

export const metadata: Metadata = {
  title: "Create your portal password",
  description:
    "Finish your Guest Signal client portal invite: set your password, then open your snapshot dashboard.",
};

export default function PortalWelcomePage() {
  return (
    <div className="border-b gradient-primary">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">Client portal</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Create your portal password
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          You arrived here from your <strong>invitation email</strong>. Choose a password you will use with the{" "}
          <strong>same email address</strong> you gave us on your intake form. After you save, we take you straight to
          your dashboard.
        </p>
        <Suspense fallback={<p className="mt-10 text-sm text-slate-500">Loading…</p>}>
          <PortalWelcomePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
