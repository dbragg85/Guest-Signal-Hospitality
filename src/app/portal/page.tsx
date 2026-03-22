import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalLoginForm } from "@/components/PortalLoginForm";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "Sign in to your Guest Signal scorecards. Operational intelligence for restaurant teams.",
};

export default function PortalPage() {
  return (
    <div className="border-b gradient-primary">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
          Client portal
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Access Your Guest Signal Snapshot
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Sign in with the email your operator invited (e.g.{" "}
          <span className="font-medium text-slate-800">
            admin@bocacincinnati.com
          </span>
          ). Super admin accounts can open any restaurant&apos;s scorecard.
        </p>
        <Suspense
          fallback={
            <p className="mt-10 text-sm text-slate-500">Loading sign-in…</p>
          }
        >
          <PortalLoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-slate-500">
          <Link
            href="/portal/demo/"
            className="font-semibold text-amber-800 underline-offset-4 hover:underline"
          >
            View the sales demo (no login)
          </Link>
          {" · "}
          <Link
            href="/"
            className="font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
