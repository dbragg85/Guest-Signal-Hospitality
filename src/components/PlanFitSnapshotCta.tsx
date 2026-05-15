import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";

export function PlanFitSnapshotCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto mt-12 max-w-2xl rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 px-8 py-10 text-center shadow-sm md:mt-14 md:px-10 ${className}`}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        Not Sure Which Plan Fits?
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
        Start with a free Guest Signal Snapshot. We&apos;ll review your restaurant&apos;s reviews,
        Google visibility, website health, and local SEO signals, then recommend whether Monitor,
        Growth, or Elevate makes the most sense.
      </p>
      <ServicesIntakeLink
        href="/snapshot/"
        className="btn-primary mt-6 inline-block px-8 py-3"
        data-track="plan_fit_cta_snapshot"
      >
        Get Your Free Snapshot
      </ServicesIntakeLink>
      <p className="mt-4 text-xs leading-relaxed text-slate-500 md:text-sm">
        No obligation. No credit card required. Built for independent restaurants that want clearer
        visibility before committing to monthly support.
      </p>
    </div>
  );
}
