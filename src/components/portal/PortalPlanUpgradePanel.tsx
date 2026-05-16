import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { pricingPlans, type PlanInquiryKey } from "@/content/site";

export function PortalPlanUpgradePanel({
  recommendedPlanKey,
  restaurantSlug,
  restaurantName,
}: {
  recommendedPlanKey?: PlanInquiryKey | string | null;
  restaurantSlug?: string;
  restaurantName?: string;
}) {
  const rec = recommendedPlanKey && pricingPlans.some((p) => p.inquiryKey === recommendedPlanKey)
    ? (recommendedPlanKey as PlanInquiryKey)
    : null;

  const upgradeQs = restaurantSlug
    ? `&upgrade=1&venue=${encodeURIComponent(restaurantSlug)}`
    : "&upgrade=1";

  return (
    <section
      aria-labelledby="portal-upgrade-plans-heading"
      className="rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-lg sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/90">
        Upgrade from your free snapshot
      </p>
      <h2
        id="portal-upgrade-plans-heading"
        className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
      >
        Turn this scorecard into ongoing intelligence
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
        You already have your baseline Guest Signal Score and deliverables
        {restaurantName ? ` for ${restaurantName}` : ""}. Choose a monthly plan to add recurring
        runs, alerts, competitor tracking, and—on Elevate—menu intelligence and managed review
        responses.
      </p>
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => {
          const isRec = rec === plan.inquiryKey;
          return (
            <li
              key={plan.inquiryKey}
              className={`flex flex-col rounded-2xl border p-5 shadow-sm ${
                isRec
                  ? "border-amber-500/60 bg-white ring-2 ring-amber-400/30"
                  : "border-stone-200 bg-white"
              }`}
            >
              {isRec ? (
                <span className="mb-2 inline-block w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                  Best fit from your snapshot
                </span>
              ) : plan.popular ? (
                <span className="mb-2 inline-block w-fit rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {plan.badge ?? "Popular"}
                </span>
              ) : plan.badge ? (
                <span className="mb-2 inline-block w-fit rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  {plan.badge}
                </span>
              ) : (
                <span className="mb-2 block h-5" aria-hidden />
              )}
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {plan.price}
                <span className="text-sm font-normal text-slate-600">/{plan.period}</span>
              </p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{plan.description}</p>
              <ul className="mt-3 space-y-1 text-[11px] leading-snug text-slate-600">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-1.5">
                    <span className="text-amber-700" aria-hidden>
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <ServicesIntakeLink
                href={`/services/inquiry/?plan=${plan.inquiryKey}${upgradeQs}`}
                className={`mt-4 inline-block w-full text-center text-sm ${
                  isRec ? "btn-primary" : "btn-secondary"
                }`}
                data-track={`portal_upgrade_${plan.inquiryKey}`}
              >
                {plan.buttonText}
              </ServicesIntakeLink>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-xs text-slate-500 sm:text-left">
        Same email and venue as your snapshot keeps your portal access. Questions?{" "}
        <a href="/contact/" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
          Book a consultation
        </a>
      </p>
    </section>
  );
}
