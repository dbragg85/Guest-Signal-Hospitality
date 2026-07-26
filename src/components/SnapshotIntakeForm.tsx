"use client";

import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { useRef, useState } from "react";
import { brand, freeSnapshot } from "@/content/site";
import { persistLeadIntakeToSupabase } from "@/lib/persistLeadIntake";
import {
  SNAPSHOT_DELIVERABLES,
  SNAPSHOT_INTAKE_PATH,
  SNAPSHOT_PRIORITY_OPTIONS,
} from "@/lib/snapshot/constants";
import { buildSnapshotFocusNote, buildSnapshotSummaryForStorage } from "@/lib/snapshot/build-summary";
import { recommendSnapshotPlan } from "@/lib/snapshot/recommend-plan";
import type { SnapshotPlanRecommendation, SnapshotPriority } from "@/lib/snapshot/types";
import { trackEvent } from "@/lib/tracking";

const DEFAULT_CONTACT_ENDPOINT =
  "https://formsubmit.co/ajax/audit@guestsignalhospitality.com";

export function SnapshotIntakeForm() {
  const formStartTracked = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [recommendation, setRecommendation] = useState<SnapshotPlanRecommendation | null>(null);
  const [savedOnline, setSavedOnline] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const business = (formData.get("business") as string).trim();
    const websiteUrl = (formData.get("websiteUrl") as string).trim();
    const gbpUrl = (formData.get("gbpUrl") as string).trim();
    const streetAddress = (formData.get("streetAddress") as string).trim();
    const city = (formData.get("city") as string).trim();
    const state = (formData.get("state") as string).trim();
    const zip = (formData.get("zip") as string).trim();
    const snapshotPriority = formData.get("snapshotPriority") as SnapshotPriority;
    const message = (formData.get("message") as string).trim();

    if (!SNAPSHOT_PRIORITY_OPTIONS.some((o) => o.value === snapshotPriority)) {
      setSubmitError("Please select your current priority.");
      setIsSubmitting(false);
      return;
    }

    const rec = recommendSnapshotPlan(snapshotPriority);
    const snapshotSummary = buildSnapshotSummaryForStorage({
      snapshotPriority,
      recommendedPlanKey: rec.planKey,
      recommendedPlanName: rec.planName,
    });
    const snapshotFocus = buildSnapshotFocusNote(snapshotPriority, message);

    try {
      const supabaseResult = await persistLeadIntakeToSupabase({
        inquiryPlan: "free_snapshot",
        name,
        email,
        business,
        streetAddress,
        city,
        state,
        zip,
        conceptType: "",
        locationCount: "",
        snapshotFocus,
        goals: "",
        competitorsNote: "",
        socialPresenceNote: "",
        venuePhone: "",
        websiteUrl,
        gbpUrl,
        operatingHoursNote: "",
        message,
        snapshotPriority,
        recommendedPlan: rec.planKey,
        snapshotSummary,
      });

      if (supabaseResult.blockedDuplicate) {
        const dupMsg =
          supabaseResult.blockedDuplicateCode === "active_venue_profile"
            ? `We already have an intake in progress for this restaurant and location. Email ${brand.email} if you need help.`
            : supabaseResult.blockedDuplicateCode === "recent_converted_email"
              ? `We recently processed a snapshot for this email. Check your inbox for the portal invite, or email ${brand.email}.`
              : `An intake is already in progress for this email. We will finish your snapshot soon—or email ${brand.email}.`;
        setSubmitError(dupMsg);
        trackEvent("snapshot_intake_duplicate_blocked", {
          code: supabaseResult.blockedDuplicateCode ?? "active_email",
        });
        return;
      }

      if (supabaseResult.attempted && !supabaseResult.rowInserted) {
        setSubmitError(
          supabaseResult.insertErrorMessage?.trim()
            ? `We could not save your submission: ${supabaseResult.insertErrorMessage}`
            : `We could not save your submission. Please email ${brand.email}.`,
        );
        return;
      }

      const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || DEFAULT_CONTACT_ENDPOINT;
      const requestBody = new FormData();
      requestBody.append("name", name);
      requestBody.append("email", email);
      requestBody.append("business", business);
      requestBody.append("inquiryPlan", "free_snapshot");
      requestBody.append("snapshotPriority", snapshotPriority);
      requestBody.append("recommendedPlan", rec.planKey);
      requestBody.append("websiteUrl", websiteUrl || "—");
      requestBody.append("gbpUrl", gbpUrl || "—");
      requestBody.append("streetAddress", streetAddress || "—");
      requestBody.append("city", city || "—");
      requestBody.append("state", state || "—");
      requestBody.append("zip", zip || "—");
      requestBody.append("snapshotFocus", snapshotFocus);
      requestBody.append("message", message || "—");
      requestBody.append("leadIntakeId", supabaseResult.leadIntakeId ?? "—");
      requestBody.append("submissionClientKey", supabaseResult.submissionClientKey ?? "—");
      requestBody.append("_subject", `Guest Signal — Free Snapshot: ${business || name}`);
      requestBody.append("_template", "table");
      requestBody.append("_captcha", "false");

      let emailNotifyOk = false;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: requestBody,
          headers: { Accept: "application/json" },
        });
        emailNotifyOk = response.ok;
        if (!response.ok) {
          console.warn("FormSubmit notification failed:", response.status);
        }
      } catch (notifyErr) {
        console.warn("FormSubmit notification error:", notifyErr);
      }

      if (!supabaseResult.rowInserted) {
        throw new Error("Snapshot was not saved to the database.");
      }

      form.reset();
      setRecommendation(rec);
      setSavedOnline(supabaseResult.rowInserted);
      setSubmitted(true);
      trackEvent("snapshot_intake_success", {
        recommendedPlan: rec.planKey,
        emailNotifyOk,
      });
      if (!emailNotifyOk) {
        trackEvent("snapshot_intake_formsubmit_failed", { leadIntakeId: supabaseResult.leadIntakeId });
      }
    } catch (error) {
      console.error(error);
      setSubmitError(`Submission failed. Please retry or email ${brand.email}.`);
      trackEvent("snapshot_intake_fail", {});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && recommendation) {
    return (
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-green-900">
              Snapshot request received
            </h1>
            <p className="mt-4 text-green-800">
              We will deliver your Guest Signal Snapshot within 48 hours, including review sentiment,
              Google Business Profile visibility notes, website and mobile health, basic SEO
              opportunities, competitor positioning, top three action priorities, and a recommended
              plan fit.
            </p>
            {savedOnline === false ? (
              <p className="mt-4 text-sm text-amber-950/90">
                Your request was emailed to our team. If you do not hear from us within one business day,
                contact{" "}
                <a href={`mailto:${brand.email}`} className="font-semibold underline">
                  {brand.email}
                </a>
                .
              </p>
            ) : null}

            <div className="mt-8 rounded-2xl border border-amber-200/80 bg-white p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/90">
                Recommended plan fit
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{recommendation.planName}</h2>
              <p className="mt-2 text-sm text-slate-600">{recommendation.rationale}</p>
              <p className="mt-3 text-sm font-medium text-slate-800">
                Want the monthly version while we build your snapshot? Start now — cancel anytime.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <StripeCheckoutButton
                  planKey={recommendation.planKey}
                  label={`Start ${recommendation.planName}`}
                  className="btn-primary"
                />
                <ServicesIntakeLink
                  href={recommendation.ctaHref}
                  className="btn-secondary inline-block text-center"
                >
                  Ask a question first
                </ServicesIntakeLink>
                <Link href="/snapshot/" className="inline-block px-4 py-3 text-center text-sm font-semibold text-slate-600 underline underline-offset-4">
                  Another location
                </Link>
              </div>
            </div>

            <p className="mt-6 text-sm text-green-900/80">
              <Link href={SNAPSHOT_INTAKE_PATH} className="font-semibold underline">
                Submit another location
              </Link>
              {" · "}
              <Link href="/services/" className="font-semibold underline">
                Compare all plans
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-sm font-medium text-slate-500">
          <Link href="/services/" className="text-slate-700 hover:underline">
            ← Plans
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/portal/" className="text-slate-700 hover:underline">
            Client portal sign-in
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Free snapshot: your score, themes, and next three fixes
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Takes about two minutes. No card. We read Google and Yelp, then send a private scorecard
          you can use in the next manager meeting.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">You get:</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {SNAPSHOT_DELIVERABLES.slice(0, 4).map((d) => (
              <li key={d.key} className="flex items-start gap-2">
                <span className="font-semibold text-amber-800">—</span>
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Already know you need monthly monitoring?</p>
            <p className="mt-1 text-sm text-slate-600">
              Skip the free snapshot queue and start Signal Monitor now—scorecard every month, cancel anytime.
            </p>
          </div>
          <div className="mt-3 min-w-[14rem] shrink-0 sm:mt-0">
            <StripeCheckoutButton
              planKey="signal_monitor"
              label="Start Signal Monitor — $149/mo"
              className="btn-secondary w-full"
            />
          </div>
        </div>

        <form
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          onSubmit={handleSubmit}
          onFocusCapture={() => {
            if (formStartTracked.current) return;
            formStartTracked.current = true;
            trackEvent("form_start", { form: "free_snapshot" });
          }}
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Restaurant name</span>
              <input
                name="business"
                required
                autoComplete="organization"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
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
                <span className="text-sm font-semibold">Work email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">What should we prioritize?</span>
              <select
                name="snapshotPriority"
                required
                defaultValue=""
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="" disabled>
                  Select one
                </option>
                {SNAPSHOT_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Location</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
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
              </div>
              <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  Optional details (website, Google listing, street)
                </summary>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Website URL</span>
                    <input
                      name="websiteUrl"
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Google Business Profile link</span>
                    <input
                      name="gbpUrl"
                      type="url"
                      inputMode="url"
                      placeholder="https://maps.google.com/..."
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Street address</span>
                    <input
                      name="streetAddress"
                      autoComplete="street-address"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">ZIP</span>
                    <input
                      name="zip"
                      autoComplete="postal-code"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Anything else?</span>
                    <textarea
                      name="message"
                      rows={2}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                </div>
              </details>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              data-track="snapshot_intake_submit"
            >
              {isSubmitting ? "Sending…" : freeSnapshot.buttonText}
            </button>
            {submitError ? <p className="text-sm font-medium text-red-700">{submitError}</p> : null}
            <p className="text-xs text-slate-500">{freeSnapshot.trustText}</p>
          </div>
        </form>
      </div>
    </section>
  );
}
