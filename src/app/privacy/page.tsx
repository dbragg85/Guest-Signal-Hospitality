import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the Guest Signal Hospitality privacy policy for details about data collection, form submissions, and communication preferences.",
};

export default function PrivacyPage() {
  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-slate-600">Last updated: May 8, 2026</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-slate-700">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
          <p className="mt-2">
            We collect the information you provide through forms, such as your name, email, business
            details, and project context. We also collect basic website analytics and operational logs
            needed to maintain service quality.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">How we use information</h2>
          <p className="mt-2">
            We use submitted information to respond to inquiries, deliver reports, provide client
            services, and improve our offerings. We do not sell your personal information.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Data sharing</h2>
          <p className="mt-2">
            We may share data with service providers that help us operate this site and deliver
            services (for example hosting, analytics, or communication tools). Those providers process
            data only as needed for those functions.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            For privacy questions or requests, contact us at audit@guestsignalhospitality.com.
          </p>
        </div>
      </section>
    </div>
  );
}
