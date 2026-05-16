import type { ElevateDeliverablesPayload } from "@/lib/elevate/portal-elevate";

export function ElevateDeliverablesPanel({
  deliverables,
}: {
  deliverables: ElevateDeliverablesPayload;
}) {
  const items = deliverables.items ?? [];

  return (
    <section aria-labelledby="elevate-deliverables-heading" className="mt-10">
      <h2 id="elevate-deliverables-heading" className="text-2xl font-semibold tracking-tight text-slate-900">
        Signal Elevate deliverables
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Premium managed layer
        {deliverables.period_label ? ` (${deliverables.period_label})` : ""} — menu intelligence,
        social scope, and execution priorities from your intake.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 to-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
            {item.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
                {item.bullets.map((line, idx) => (
                  <li key={`${item.key}-${idx}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
