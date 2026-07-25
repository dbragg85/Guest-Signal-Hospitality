"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { PLAN_INQUIRY_LABELS, isPlanInquiryKey, type PlanInquiryKey } from "@/content/site";
import { trackEvent } from "@/lib/tracking";

export function CheckoutReturnBanner() {
  const searchParams = useSearchParams();
  const tracked = useRef(false);
  const status = searchParams?.get("checkout");
  const planRaw = searchParams?.get("plan");
  const planKey = isPlanInquiryKey(planRaw) && planRaw !== "free_snapshot"
    ? (planRaw as Exclude<PlanInquiryKey, "free_snapshot">)
    : "signal_monitor";
  const planLabel = PLAN_INQUIRY_LABELS[planKey] ?? "your plan";

  useEffect(() => {
    if (tracked.current) return;
    if (status !== "success" && status !== "cancelled") return;
    tracked.current = true;
    trackEvent("cta_click", {
      action: status === "success" ? "checkout_return_success" : "checkout_return_cancelled",
      plan_key: planKey,
    });
  }, [status, planKey]);

  if (status === "success") {
    return (
      <div className="border-b border-green-200 bg-green-50">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-5">
          <p className="text-sm font-semibold text-green-950">Payment started — welcome aboard</p>
          <p className="mt-1 text-sm text-green-900/90">
            Your {planLabel} checkout completed. Watch for a Stripe receipt and a portal invite at
            the email you used. Questions?{" "}
            <Link href="/contact/" className="font-semibold underline underline-offset-2">
              Contact us
            </Link>{" "}
            or{" "}
            <Link href="/portal/" className="font-semibold underline underline-offset-2">
              open the portal
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-950">Checkout paused — no charge</p>
            <p className="mt-1 text-sm text-amber-950/90">
              You can restart {planLabel} anytime, or grab a free snapshot first if you want proof
              before paying.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-start">
            <StripeCheckoutButton
              planKey={planKey}
              label={`Resume ${planLabel}`}
              className="btn-primary w-full whitespace-nowrap px-5 py-3"
            />
            <Link
              href="/snapshot/"
              className="btn-secondary w-full whitespace-nowrap px-5 py-3 text-center"
            >
              Free snapshot
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
