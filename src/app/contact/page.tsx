"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { trackEvent } from "@/lib/tracking";

const DEFAULT_CONTACT_ENDPOINT = "https://formsubmit.co/ajax/audit@guestsignalhospitality.com";

function ContactForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (searchParams?.get("sent") === "1") {
      setSubmitted(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const business = formData.get("business") as string;
    const googleUrl = formData.get("googleUrl") as string;
    const message = formData.get("message") as string;
    const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || DEFAULT_CONTACT_ENDPOINT;

    try {
      const requestBody = new FormData();
      requestBody.append("name", name);
      requestBody.append("email", email);
      requestBody.append("business", business);
      requestBody.append("googleUrl", googleUrl || "Not provided");
      requestBody.append("message", message || "No message provided");
      requestBody.append("_subject", `New Guest Signal contact lead: ${business || name}`);
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
        hasGoogleUrl: Boolean(googleUrl),
        hasMessage: Boolean(message),
      });
    } catch (error) {
      console.error(error);
      setSubmitError("Submission failed. Please retry or email audit@guestsignalhospitality.com.");
      trackEvent("contact_submit_fail");
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
                Your message has been received. We'll respond to you at the email address you provided within 24 hours.
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
            Contact
          </h1>
          <p className="mt-3 text-slate-600">
            Share your restaurant name and link (Google listing if possible). We'll respond with next steps.
          </p>

          <form
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Name</span>
                <input
                  name="name"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Restaurant / Business</span>
                <input
                  name="business"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Google Listing URL (optional)</span>
                <input
                  name="googleUrl"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">What are you trying to improve?</span>
                <textarea
                  name="message"
                  rows={5}
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
              {submitError ? <p className="text-sm font-medium text-red-700">{submitError}</p> : null}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div>
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Contact
            </h1>
            <p className="mt-3 text-slate-600">
              Share your restaurant name and link (Google listing if possible). We'll respond with next steps.
            </p>
          </div>
        </section>
      </div>
    }>
      <ContactForm />
    </Suspense>
  );
}
