"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { isPlanInquiryKey, PLAN_INQUIRY_LABELS } from "@/content/site";
import { persistLeadIntakeToSupabase } from "@/lib/persistLeadIntake";
import { trackEvent } from "@/lib/tracking";

const DEFAULT_CONTACT_ENDPOINT =
  "https://formsubmit.co/ajax/audit@guestsignalhospitality.com";

const CONCEPT_TYPES = [
  "Full service",
  "Fast casual",
  "Quick service / QSR",
  "Bar or nightlife",
  "Café / bakery",
  "Hotel F&B",
  "Other",
] as const;

const LOCATION_BUCKETS = [
  "1 location",
  "2–5 locations",
  "6+ locations",
] as const;

function ContactForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const planKey = useMemo(() => {
    const raw = searchParams?.get("plan");
    return isPlanInquiryKey(raw) ? raw : null;
  }, [searchParams]);

  const isSnapshot = planKey === "free_snapshot";
  const isPaidPlan =
    planKey === "signal_monitor" ||
    planKey === "signal_growth" ||
    planKey === "signal_elevate";
  const showCompetitorField =
    planKey === "signal_growth" || planKey === "signal_elevate";
  const isServiceIntake = planKey !== null;

  useEffect(() => {
    if (searchParams?.get("sent") === "1") {
      setSubmitted(true);
    }
  }, [searchParams]);

  const heading = planKey
    ? PLAN_INQUIRY_LABELS[planKey]
    : "Contact";
  const subcopy = isSnapshot
    ? "Tell us where you operate—we use your venue address to locate the right listings and build your snapshot. No need to paste Google or Yelp links."
    : isPaidPlan
      ? "Share context on your restaurant and goals so we can scope onboarding and reporting."
      : "Share your restaurant name and how we can help. Optional address helps us locate the right listings without asking for review URLs.";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const business = formData.get("business") as string;
    const message = (formData.get("message") as string) || "";
    const streetAddress = (formData.get("streetAddress") as string) || "";
    const city = (formData.get("city") as string) || "";
    const state = (formData.get("state") as string) || "";
    const zip = (formData.get("zip") as string) || "";
    const conceptType = (formData.get("conceptType") as string) || "";
    const locationCount = (formData.get("locationCount") as string) || "";
    const snapshotFocus = (formData.get("snapshotFocus") as string) || "";
    const goals = (formData.get("goals") as string) || "";
    const competitorsNote = (formData.get("competitorsNote") as string) || "";

    const endpoint =
      process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || DEFAULT_CONTACT_ENDPOINT;

    const planLabel = planKey ? PLAN_INQUIRY_LABELS[planKey] : "General inquiry";

    try {
      const supabaseResult = await persistLeadIntakeToSupabase({
        inquiryPlan: planKey || "general",
        name,
        email,
        business,
        streetAddress,
        city,
        state,
        zip,
        conceptType,
        locationCount,
        snapshotFocus,
        goals,
        competitorsNote,
        message,
      });
      if (supabaseResult.attempted && supabaseResult.errorMessage) {
        console.warn(
          "[contact] Supabase lead_intake_submissions insert failed:",
          supabaseResult.errorMessage,
        );
        trackEvent("lead_intake_supabase_insert_fail", {
          planKey: planKey ?? "general",
          message: supabaseResult.errorMessage,
        });
      } else if (supabaseResult.attempted) {
        trackEvent("lead_intake_supabase_insert_ok", {
          planKey: planKey ?? "general",
        });
      }

      const requestBody = new FormData();
      requestBody.append("name", name);
      requestBody.append("email", email);
      requestBody.append("business", business);
      requestBody.append("inquiryPlan", planKey || "general");
      requestBody.append("streetAddress", streetAddress || "—");
      requestBody.append("city", city || "—");
      requestBody.append("state", state || "—");
      requestBody.append("zip", zip || "—");
      requestBody.append("conceptType", conceptType || "—");
      requestBody.append("locationCount", locationCount || "—");
      requestBody.append("snapshotFocus", snapshotFocus || "—");
      requestBody.append("goals", goals || "—");
      requestBody.append("competitorsNote", competitorsNote || "—");
      requestBody.append("message", message || "—");
      requestBody.append(
        "_subject",
        `Guest Signal — ${planLabel}: ${business || name}`,
      );
      requestBody.append("_template", "table");
      requestBody.append("_captcha", "false");

      const response = await fetch(endpoint, {
        method: "POST",
        body: requestBody,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Contact submit failed: ${response.status}`);
      }

      form.reset();
      setSubmitted(true);
      trackEvent("contact_submit_success", {
        planKey: planKey ?? "general",
        isServiceIntake,
      });
    } catch (error) {
      console.error(error);
      setSubmitError(
        "Submission failed. Please retry or email audit@guestsignalhospitality.com.",
      );
      trackEvent("contact_submit_fail", { planKey: planKey ?? "general" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl text-green-900">
                Thank You!
              </h1>
              <p className="mt-4 text-lg text-green-700">
                Your message has been received. We&apos;ll respond to you at the
                email address you provided within 24 hours.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {heading}
          </h1>
          <p className="mt-3 text-slate-600">{subcopy}</p>

          <form
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Your name</span>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  Restaurant / business name
                </span>
                <input
                  name="business"
                  required
                  autoComplete="organization"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              {isServiceIntake ? (
                <>
                  <fieldset className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <legend className="px-1 text-sm font-semibold text-slate-800">
                      {isSnapshot
                        ? "Venue location (we use this to find your public listings)"
                        : "Primary location"}
                    </legend>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">
                        Street address
                        {isSnapshot ? "" : " (recommended)"}
                      </span>
                      <input
                        name="streetAddress"
                        required={isSnapshot}
                        autoComplete="street-address"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="grid gap-2 sm:col-span-1">
                        <span className="text-sm font-medium">City</span>
                        <input
                          name="city"
                          required
                          autoComplete="address-level2"
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">State</span>
                        <input
                          name="state"
                          required
                          autoComplete="address-level1"
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">ZIP</span>
                        <input
                          name="zip"
                          required
                          autoComplete="postal-code"
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>
                  </fieldset>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">Concept type</span>
                    <select
                      name="conceptType"
                      required={isSnapshot}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                    >
                      <option value="">
                        {isSnapshot ? "Select one" : "Optional"}
                      </option>
                      {CONCEPT_TYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">
                      Number of locations
                    </span>
                    <select
                      name="locationCount"
                      required={isSnapshot}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                    >
                      <option value="">
                        {isSnapshot ? "Select one" : "Optional"}
                      </option>
                      {LOCATION_BUCKETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  {isSnapshot ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">
                        What should we prioritize in your snapshot?
                      </span>
                      <span className="text-xs text-slate-500">
                        Examples: recent rating dip, new opening, staffing or
                        speed complaints, competitor pressure, delivery/review
                        mix.
                      </span>
                      <textarea
                        name="snapshotFocus"
                        required
                        rows={4}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  ) : null}

                  {isPaidPlan ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">
                        Goals for the next 90 days
                      </span>
                      <textarea
                        name="goals"
                        rows={4}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  ) : null}

                  {showCompetitorField ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">
                        Competitors or comps you care about (names &
                        neighborhoods — not required to paste URLs)
                      </span>
                      <textarea
                        name="competitorsNote"
                        rows={3}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  ) : null}
                </>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-semibold">
                  {isServiceIntake
                    ? "Anything else we should know?"
                    : "What are you trying to improve?"}
                </span>
                <textarea
                  name="message"
                  rows={isServiceIntake ? 3 : 5}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                data-track="contact_submit"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
              {submitError ? (
                <p className="text-sm font-medium text-red-700">{submitError}</p>
              ) : null}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div>
          <section className="border-b bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-14">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Contact
              </h1>
              <p className="mt-3 text-slate-600">Loading form…</p>
            </div>
          </section>
        </div>
      }
    >
      <ContactForm />
    </Suspense>
  );
}
