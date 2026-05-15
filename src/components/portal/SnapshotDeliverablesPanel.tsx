import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import type { SnapshotDeliverablesPayload } from "@/lib/snapshot/portal-deliverables";

export function SnapshotDeliverablesPanel({
  deliverables,
  showPlanCta = true,
}: {
  deliverables: SnapshotDeliverablesPayload;
  showPlanCta?: boolean;
}) {
  const items = deliverables.items ?? [];
  const plan = deliverables.recommended_plan;

  return (
    <section aria-labelledby="snapshot-deliverables-heading" className="mt-10">
      <h2
        id="snapshot-deliverables-heading"
        className="text-2xl font-semibold tracking-tight text-slate-900"
      >
        Your snapshot deliverables
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Complimentary baseline from your intake
        {deliverables.period_label ? ` (${deliverables.period_label})` : ""} — aligned with what we
        promise on the free snapshot form.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50/90 to-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
            {item.bullets && item.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
                {item.bullets.map((line, idx) => (
                  <li key={`${item.key}-${idx}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {showPlanCta && plan ? <SnapshotPlanFitCta plan={plan} /> : null}
    </section>
  );
}

function SnapshotPlanFitCta({
  plan,
}: {
  plan: NonNullable<SnapshotDeliverablesPayload["recommended_plan"]>;
}) {
  const href = plan.ctaPath ?? `/services/inquiry/?plan=${plan.key}`;
  return (
    <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-6 text-center md:text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/80">
        Recommended plan fit
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {plan.name} <span className="text-base font-normal text-slate-600">({plan.price})</span>
      </p>
      <p className="mt-2 text-sm text-slate-600">{plan.rationale}</p>
      <SnapshotPlanFitCtaActions plan={plan} href={href} />
    </div>
  );
}

function SnapshotPlanFitCtaActions({
  plan,
  href,
}: {
  plan: NonNullable<SnapshotDeliverablesPayload["recommended_plan"]>;
  href: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
      <ServicesIntakeLink href={href} className="btn-primary inline-block text-sm">
        Explore {plan.name}
      </ServicesIntakeLink>
      <Link href="/services/" className="btn-secondary inline-block text-sm">
        Compare all plans
      </Link>
    </div>
  );
}
