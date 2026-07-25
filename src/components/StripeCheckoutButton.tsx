"use client";

import { useState } from "react";
import type { PlanInquiryKey } from "@/content/site";
import { trackEvent } from "@/lib/tracking";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

type Props = {
  planKey: Exclude<PlanInquiryKey, "free_snapshot">;
  label: string;
  className?: string;
};

export function StripeCheckoutButton({ planKey, label, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    trackEvent("cta_click", { action: `checkout_${planKey}`, plan_key: planKey });
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON) {
        throw new Error("Checkout is not configured yet.");
      }
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON}`,
            apikey: SUPABASE_ANON,
          },
          body: JSON.stringify({ planKey }),
        },
      );
      const payload = (await response.json()) as { url?: string; error?: string; detail?: string };
      if (!response.ok || !payload.url) {
        if (payload.error === "stripe_not_configured") {
          throw new Error("Stripe is not connected yet. Add STRIPE_SECRET_KEY to continue.");
        }
        throw new Error(payload.detail || payload.error || "Unable to start checkout.");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className={className}
        data-track={`checkout_${planKey}`}
      >
        {loading ? "Starting checkout…" : label}
      </button>
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
