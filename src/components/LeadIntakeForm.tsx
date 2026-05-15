"use client";

import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  brand,
  freeSnapshot,
  isPlanInquiryKey,
  PLAN_INQUIRY_LABELS,
  pricingPlans,
  type PlanInquiryKey,
} from "@/content/site";
import { persistLeadIntakeToSupabase } from "@/lib/persistLeadIntake";
import { SNAPSHOT_INTAKE_PATH } from "@/lib/snapshot/constants";
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

export type LeadIntakeMode = "contact" | "service";

function paidPlanGoalsLabel(planKey: PlanInquiryKey | null): string {
  if (planKey === "signal_monitor") {
    return "What should we baseline first for reputation and Google visibility?";
  }
  if (planKey === "signal_growth") {
    return "Goals for local visibility, GBP, and conversion (next 90 days)";
  }
  if (planKey === "signal_elevate") {
    return "Goals for managed reputation, review response, and executive reporting";
  }
  return "Goals for the next 90 days";
}

function paidPlanGoalsHint(planKey: PlanInquiryKey | null): string | null {
  if (planKey === "signal_monitor") {
    return "Examples: rating trend, review themes, Google listing gaps, competitor rating context, areas you want on the monthly scorecard.";
  }
  if (planKey === "signal_growth") {
    return "Examples: local search visibility, GBP posts/specials, website booking or menu CTAs, up to 5 competitors to track, conversion pages to improve.";
  }
  if (planKey === "signal_elevate") {
    return "Examples: review response tone, social channels to coordinate, recovery SLAs, monthly exec readout priorities.";
  }
  return null;
}

export function LeadIntakeForm({ mode }: { mode: LeadIntakeMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serviceIntakeSavedOnline, setServiceIntakeSavedOnline] = useState<
    boolean | null
  >(null);
  /** Next `useSearchParams()` can miss `plan` on static export (e.g. /inquiry?plan= without trailing slash). */
  const [planFromLocation, setPlanFromLocation] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (mode !== "service") {
      setPlanFromLocation(null);
      return;
    }
    const fromNext = searchParams?.get("plan");
    if (isPlanInquiryKey(fromNext)) {
      setPlanFromLocation(null);
      return;
    }
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("plan");
    if (isPlanInquiryKey(fromUrl)) setPlanFromLocation(fromUrl);
    else setPlanFromLocation(null);
  }, [mode, searchParams]);

  const planKey = useMemo(() => {
    const raw = searchParams?.get("plan") ?? planFromLocation;
    return isPlanInquiryKey(raw) ? raw : null;
  }, [searchParams, planFromLocation]);

  const isSnapshot = planKey === "free_snapshot";
  const isPaidPlan =
    planKey === "signal_monitor" ||
    planKey === "signal_growth" ||
    planKey === "signal_elevate";
  const showCompetitorField =
    planKey === "signal_growth" || planKey === "signal_elevate";
  const showSocialPresenceField = planKey === "signal_elevate";
  const isServiceIntake = planKey !== null;
  const serviceRouteBase = "/services/inquiry/";

  useEffect(() => {
    if (searchParams?.get("sent") === "1") {
      setSubmitted(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode === "service" && planKey === "free_snapshot") {
      router.replace(SNAPSHOT_INTAKE_PATH);
    }
  }, [mode, planKey, router]);

  const heading = planKey
    ? PLAN_INQUIRY_LABELS[planKey]
    : mode === "service"
      ? "Request a plan"
      : "Contact";
  const subcopy = isSnapshot
    ? "Tell us where you operate—we use your venue address to locate the right listings and build your snapshot. No need to paste Google or Yelp links."
    : isPaidPlan
      ? "This intake is scoped to your selected plan so we can onboard you faster than a generic contact form."
      : mode === "service"
        ? "Choose a plan below to open the right questionnaire."
        : "Share your restaurant name and how we can help.";

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
    const socialPresenceNote =
      (formData.get("socialPresenceNote") as string) || "";
    const venuePhone = (formData.get("venuePhone") as string) || "";
    const websiteUrl = (formData.get("websiteUrl") as string) || "";
    const operatingHoursNote =
      (formData.get("operatingHoursNote") as string) || "";

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
        socialPresenceNote,
        venuePhone,
        websiteUrl,
        operatingHoursNote,
        message,
      });

      if (supabaseResult.blockedDuplicate) {
        const dupMsg =
          supabaseResult.blockedDuplicateCode === "active_venue_profile"
            ? `We already have an intake in progress for this restaurant name, contact name, and location (city / state / ZIP). If you submitted earlier, please wait for processing to finish. For help, email ${brand.email}.`
            : supabaseResult.blockedDuplicateCode === "recent_converted_email"
              ? `We already processed an intake for this email address in the last few days. Check your inbox for the portal invite, or email ${brand.email} if you need a new link or another location onboarded.`
              : `This email address already has an intake in progress. Please wait for our team to finish setting up your snapshot (or check your inbox). To reach us directly, email ${brand.email}.`;
        setSubmitError(dupMsg);
        trackEvent("lead_intake_duplicate_blocked", {
          planKey: planKey ?? "general",
          code: supabaseResult.blockedDuplicateCode ?? "active_email",
        });
        return;
      }

      if (supabaseResult.attempted && !supabaseResult.rowInserted) {
        setSubmitError(
          supabaseResult.insertErrorMessage?.trim()
            ? `We could not save your submission: ${supabaseResult.insertErrorMessage}`
            : "We could not save your submission. Please try again or email audit@guestsignalhospitality.com.",
        );
        trackEvent("lead_intake_supabase_insert_fail", {
          planKey: planKey ?? "general",
          message: supabaseResult.insertErrorMessage ?? "unknown",
        });
        return;
      }

      if (supabaseResult.rowInserted && supabaseResult.lookupErrorMessage) {
        console.warn(
          "[contact] lead_intake id lookup failed (apply migration 011?):",
          supabaseResult.lookupErrorMessage,
        );
        trackEvent("lead_intake_id_lookup_fail", {
          planKey: planKey ?? "general",
          message: supabaseResult.lookupErrorMessage,
        });
      } else if (supabaseResult.attempted && supabaseResult.rowInserted) {
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
      requestBody.append("socialPresenceNote", socialPresenceNote || "—");
      requestBody.append("venuePhone", venuePhone || "—");
      requestBody.append("websiteUrl", websiteUrl || "—");
      requestBody.append("operatingHoursNote", operatingHoursNote || "—");
      requestBody.append("message", message || "—");
      requestBody.append("leadIntakeId", supabaseResult.leadIntakeId ?? "—");
      requestBody.append(
        "submissionClientKey",
        supabaseResult.submissionClientKey ?? "—",
      );
      const subjectRef =
        supabaseResult.leadIntakeId != null
          ? ` [SQL ${supabaseResult.leadIntakeId.slice(0, 8)}]`
          : "";
      requestBody.append(
        "_subject",
        `Guest Signal — ${planLabel}: ${business || name}${subjectRef}`,
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
      setServiceIntakeSavedOnline(
        isServiceIntake ? supabaseResult.rowInserted : null,
      );
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

  if (mode === "service" && planKey === "free_snapshot") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">
        <p>Redirecting to the free snapshot form…</p>
      </section>
    );
  }

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
              {serviceIntakeSavedOnline === false ? (
                <p className="mt-5 max-w-xl mx-auto text-left text-sm leading-relaxed text-amber-950/90">
                  We also delivered your request to our team by email. If you
                  don&apos;t hear from us within one business day, reach us at{" "}
                  <a
                    href={`mailto:${brand.email}`}
                    className="font-semibold text-green-900 underline underline-offset-2"
                  >
                    {brand.email}
                  </a>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (mode === "service" && !planKey) {
    return (
      <div>
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <p className="text-sm font-medium text-slate-500">
              <Link href="/services/" className="text-slate-700 hover:underline">
                ← Plans
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {heading}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">{subcopy}</p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <ServicesIntakeLink
                href={SNAPSHOT_INTAKE_PATH}
                className="rounded-3xl border-2 border-stone-200 bg-white p-8 shadow-sm transition hover:border-amber-500/40 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold">{freeSnapshot.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {freeSnapshot.description.slice(0, 120)}…
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-amber-800">
                  Start intake →
                </span>
              </ServicesIntakeLink>
              {pricingPlans.map((p) => (
                <ServicesIntakeLink
                  key={p.inquiryKey}
                  href={`${serviceRouteBase}?plan=${p.inquiryKey}`}
                  className={`rounded-3xl border-2 p-8 shadow-sm transition hover:shadow-md ${
                    p.popular
                      ? "border-slate-900 bg-gradient-to-br from-stone-50 to-white ring-1 ring-amber-500/20 hover:border-amber-600/50"
                      : "border-stone-200 bg-white hover:border-amber-500/40"
                  }`}
                >
                  <h2 className="text-xl font-semibold">{p.name}</h2>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {p.price}
                    <span className="text-base font-normal text-slate-600">
                      /{p.period}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-amber-800">
                    Plan-specific questions →
                  </span>
                </ServicesIntakeLink>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-slate-600">
              General questions?{" "}
              <Link href="/contact" className="font-semibold underline underline-offset-2">
                Contact us
              </Link>{" "}
              without selecting a plan.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          {mode === "service" ? (
            <p className="text-sm font-medium text-slate-500">
              <ServicesIntakeLink href="/services/inquiry/" className="text-slate-700 hover:underline">
                ← Choose a different plan
              </ServicesIntakeLink>
              <span className="mx-2 text-slate-300">·</span>
              <Link href="/services/" className="text-slate-700 hover:underline">
                Plans overview
              </Link>
            </p>
          ) : null}
          <h1 className={`text-3xl font-semibold tracking-tight md:text-4xl ${mode === "service" ? "mt-2" : ""}`}>
            {heading}
          </h1>
          <p className="mt-3 text-slate-600">{subcopy}</p>

          {mode === "contact" ? (
            <p className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950/90">
              <span className="font-semibold">Choosing a paid plan or free snapshot?</span> Use{" "}
              <Link href="/services/" className="font-semibold underline underline-offset-2">
                Plans
              </Link>{" "}
              → <span className="font-medium">Get started</span> so we can ask the right questions for your tier—we
              keep this contact form lighter on purpose.
            </p>
          ) : null}

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
                      Venue location (we use this to find your public listings)
                    </legend>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Street address</span>
                      <input
                        name="streetAddress"
                        required={isServiceIntake}
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

                  {isSnapshot ? (
                    <fieldset className="grid gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                      <legend className="px-1 text-sm font-semibold text-slate-800">
                        Snapshot build details (optional but speeds up matching)
                      </legend>
                      <p className="text-xs text-slate-600 -mt-1">
                        We locate public listings from your address. These fields help when names or plazas collide—we
                        never ask for Google or Yelp URLs.
                      </p>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">
                          Public phone shown on your door or website
                        </span>
                        <span className="text-xs text-slate-500">
                          Often matches Google Business Profile; use the main guest-facing line.
                        </span>
                        <input
                          name="venuePhone"
                          type="tel"
                          autoComplete="tel"
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">Official website (if you have one)</span>
                        <input
                          name="websiteUrl"
                          type="url"
                          inputMode="url"
                          placeholder="https://"
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">Typical operating hours</span>
                        <span className="text-xs text-slate-500">
                          e.g. Tue–Sun 11am–10pm; helps interpret review timing and rush patterns.
                        </span>
                        <textarea
                          name="operatingHoursNote"
                          rows={2}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </fieldset>
                  ) : null}

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">Concept type</span>
                    <select
                      name="conceptType"
                      required={isServiceIntake}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                    >
                      <option value="">Select one</option>
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
                      required={isServiceIntake}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                    >
                      <option value="">Select one</option>
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
                        {paidPlanGoalsLabel(planKey)}
                      </span>
                      {paidPlanGoalsHint(planKey) ? (
                        <span className="text-xs text-slate-500">
                          {paidPlanGoalsHint(planKey)}
                        </span>
                      ) : null}
                      <textarea
                        name="goals"
                        required
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

                  {showSocialPresenceField ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">
                        Social tracking & management (Elevate)
                      </span>
                      <span className="text-xs text-slate-500">
                        Handles or page names (e.g. @yourrestaurant on Instagram). Tell us if you want us to prioritize
                        mentions, DMs, or review cross-signals. We do not need Google or Yelp URLs—we locate listings from
                        your venue address.
                      </span>
                      <textarea
                        name="socialPresenceNote"
                        rows={3}
                        placeholder="e.g. Instagram @…, Facebook page name, TikTok @…"
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
