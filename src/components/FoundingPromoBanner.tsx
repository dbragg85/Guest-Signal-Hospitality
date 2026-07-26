import Link from "next/link";
import { foundingPromo } from "@/content/founding-promo";

export function FoundingPromoBanner() {
  if (!foundingPromo.active) return null;

  return (
    <div className="border-b border-amber-800/30 bg-amber-950 text-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:px-5">
        <p className="leading-snug">
          <span className="font-semibold tracking-wide text-amber-200">{foundingPromo.brandCode}</span>
          {" — "}
          Signal Monitor <span className="font-semibold">{foundingPromo.introPrice}/mo</span> for{" "}
          {foundingPromo.months} months
          <span className="text-amber-100/80">
            {" "}
            (first {foundingPromo.maxRedemptions}). Then {foundingPromo.regularPrice}/mo.
          </span>
          <span className="mt-0.5 block text-xs text-amber-200/90 sm:mt-0 sm:inline sm:before:content-['·_']">
            Use code <span className="font-mono font-semibold">{foundingPromo.stripeCode}</span> at
            checkout
          </span>
        </p>
        <Link
          href="/services/"
          className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-950 transition-colors hover:bg-amber-300"
          data-track="founding_promo_banner_cta"
        >
          Claim founding rate
        </Link>
      </div>
    </div>
  );
}
