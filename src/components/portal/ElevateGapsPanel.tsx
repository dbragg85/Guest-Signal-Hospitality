import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import type { ElevateGap, ElevateUnlockPreview } from "@/lib/elevate/portal-elevate";

export function ElevateUnlockPreviewPanel({ preview }: { preview: ElevateUnlockPreview }) {
  return (
    <section aria-labelledby="elevate-preview-heading" className="mt-10">
      <h2 id="elevate-preview-heading" className="text-xl font-semibold text-slate-900">
        {preview.headline ?? "Signal Elevate deliverables"}
      </h2>
      {preview.gaps_count != null && preview.gaps_count > 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          {preview.gaps_count} input{preview.gaps_count === 1 ? "" : "s"} still needed after upgrade
          — see below. Adding your menu resolves most menu intelligence gaps immediately.
        </p>
      ) : null}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {(preview.items ?? []).map((item) => (
          <li
            key={item.key}
            className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-5 opacity-90"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Elevate only
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ElevateGapsPanel({
  gaps,
  restaurantSlug,
  isElevatePlan,
}: {
  gaps: ElevateGap[];
  restaurantSlug?: string;
  isElevatePlan?: boolean;
}) {
  if (!gaps.length) return null;

  const elevateHref = `/services/inquiry/?plan=signal_elevate${
    restaurantSlug ? `&upgrade=1&venue=${encodeURIComponent(restaurantSlug)}` : "&upgrade=1"
  }`;

  return (
    <section aria-labelledby="elevate-gaps-heading" className="mt-10">
      <h2 id="elevate-gaps-heading" className="text-xl font-semibold text-slate-900">
        {isElevatePlan ? "Complete your Elevate setup" : "What we need for full Elevate deliverables"}
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        {isElevatePlan
          ? "Submit the items below (menu paste is fastest) so we can publish menu intelligence, social tracking, and response drafting on your next refresh."
          : "These are the inputs Signal Elevate uses beyond your free snapshot. You can provide them on upgrade intake—menu paste resolves menu clustering without a separate call."}
      </p>
      <ul className="mt-6 space-y-4">
        {gaps.map((gap) => (
          <li
            key={gap.key}
            className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{gap.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{gap.clientAsk}</p>
            {gap.key === "menu_upload" ? (
              <p className="mt-3 text-xs text-slate-500">
                <strong className="text-slate-700">Yes — drop in your menu:</strong> paste sections
                and items (with prices if you have them) on Elevate intake, or link a public PDF /
                web menu. We parse line items and match them to review language.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <ServicesIntakeLink href={elevateHref} className="btn-primary text-sm">
          {isElevatePlan ? "Update Elevate intake" : "Upgrade to Signal Elevate"}
        </ServicesIntakeLink>
        <Link href="/services/" className="btn-secondary text-sm">
          Compare plans
        </Link>
      </div>
    </section>
  );
}
