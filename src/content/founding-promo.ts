/** Founding Monitor offer — first 100 clients. Stripe code cannot include "#". */
export const foundingPromo = {
  active: true,
  brandCode: "GUEST#1",
  /** Customer-facing Stripe promotion code (alphanumeric only). */
  stripeCode: "GUEST1",
  planKey: "signal_monitor" as const,
  introPrice: "$99",
  introPriceCents: 9900,
  regularPrice: "$149",
  regularPriceCents: 14900,
  discountCents: 5000,
  months: 3,
  maxRedemptions: 100,
  headline: "Founding offer: Signal Monitor $99/mo for 3 months",
  shortBanner:
    "GUEST#1 founding offer — Signal Monitor $99/mo for 3 months (first 100). Code GUEST1 · then $149/mo. Cancel anytime.",
  checkoutHint: "Code GUEST1 applied at checkout for founding clients (first 100).",
  ctaLabel: "Start Monitor — $99/mo intro",
  compactCtaLabel: "Monitor — $99 intro",
} as const;

export function monitorCheckoutLabel(compact = false): string {
  if (!foundingPromo.active) {
    return compact ? "Monitor — $149" : "Start Signal Monitor — $149/mo";
  }
  return compact ? foundingPromo.compactCtaLabel : foundingPromo.ctaLabel;
}
