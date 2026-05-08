import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Guest Signal Hospitality terms of service for website use, deliverables, and service limitations.",
};

export default function TermsPage() {
  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-slate-600">Last updated: May 8, 2026</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-slate-700">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Use of this website</h2>
          <p className="mt-2">
            By using this website, you agree to use it for lawful purposes only and not to interfere
            with normal operation, security, or accessibility.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Service information</h2>
          <p className="mt-2">
            Content on this website is provided for general information and may be updated at any time.
            Final deliverables, timelines, and scope are defined in written service agreements.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Limitation of liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, Guest Signal Hospitality is not liable for indirect
            or consequential damages arising from use of this website or reliance on website content.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to audit@guestsignalhospitality.com.
          </p>
        </div>
      </section>
    </div>
  );
}
