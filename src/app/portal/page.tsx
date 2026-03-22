import Link from "next/link";
import type { Metadata } from "next";
import { PortalLoginForm } from "@/components/PortalLoginForm";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "Access your Guest Signal snapshot preview—illustrative demo for prospective clients.",
};

export default function PortalPage() {
  return (
    <div className="border-b gradient-primary">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
          Client portal
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Access Your Guest Signal Snapshot
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          This is a guided preview of your snapshot experience—built with sample
          data so you can see how ongoing monitoring and reporting come to life.
        </p>
        <PortalLoginForm />
        <p className="mt-8 text-center text-sm text-slate-500">
          Prefer to start fresh?{" "}
          <Link
            href="/"
            className="font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Return to the homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
