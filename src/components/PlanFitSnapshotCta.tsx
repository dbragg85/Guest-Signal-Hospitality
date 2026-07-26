import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";

export function PlanFitSnapshotCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto mt-12 max-w-2xl rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 px-8 py-10 text-center shadow-sm md:mt-14 md:px-10 ${className}`}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        Not Sure Which Plan Fits?
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
        Start with a free Guest Signal Snapshot—or begin Signal Monitor if you already want a monthly
        scorecard. We&apos;ll review reviews, Google visibility, and local SEO signals either way.
      </p>
      <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <ServicesIntakeLink
          href="/snapshot/"
          className="btn-primary inline-block px-6 py-3"
          data-track="plan_fit_cta_snapshot"
        >
          Get Your Free Snapshot
        </ServicesIntakeLink>
        <div className="min-w-[14rem]">
          <StripeCheckoutButton
            planKey="signal_monitor"
            label="Start Signal Monitor — $149/mo"
            className="btn-secondary w-full"
          />
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500 md:text-sm">
        Snapshot needs no card. Monitor is monthly billing, cancel anytime.
      </p>
    </div>
  );
}
