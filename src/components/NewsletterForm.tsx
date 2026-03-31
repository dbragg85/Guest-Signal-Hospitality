"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackEvent } from "@/lib/tracking";

const DEFAULT_ENDPOINT = "https://formsubmit.co/ajax/audit@guestsignalhospitality.com";

export function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT || DEFAULT_ENDPOINT, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");

    try {
      const requestBody = new FormData();
      requestBody.append("email", email);
      requestBody.append("_subject", "New Guest Signal newsletter signup");
      requestBody.append("_captcha", "false");
      requestBody.append("_template", "table");

      const response = await fetch(endpoint, {
        method: "POST",
        body: requestBody,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Newsletter submit failed: ${response.status}`);
      }

      form.reset();
      setStatus("success");
      setMessage("Thanks. You're subscribed and will receive the next report.");
      trackEvent("newsletter_submit_success", { hasEmail: email.length > 0 });
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Submission failed. Please try again or email audit@guestsignalhospitality.com.");
      trackEvent("newsletter_submit_fail");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        required
      />
      <button
        type="submit"
        className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        data-track="newsletter_submit"
      >
        {isSubmitting ? "Submitting..." : "Subscribe"}
      </button>
      {status !== "idle" ? (
        <p className={`text-sm sm:basis-full ${status === "success" ? "text-green-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
