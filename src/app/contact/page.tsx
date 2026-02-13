export default function ContactPage() {
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
            action="/api/contact"
            method="post"
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
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Send
              </button>

              <p className="text-xs text-slate-500">
                This demo endpoint logs submissions server-side. Swap it to email (Resend/SendGrid) when ready.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
