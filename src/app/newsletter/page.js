import ArchiveSelector from '@/components/newsletter/ArchiveSelector'

export const metadata = {
  title: 'Guest Signal Report | Issue 02',
  description:
    'Guest Signal Report Issue 02 with national, regional, and Greater Cincinnati restaurant intelligence.',
}

export default function NewsletterPage() {

  return (
    <>
      <main className="bg-gradient-to-b from-stone-100 via-white to-stone-100 pb-20 pt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
          <section className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Newsletter archive
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Guest Signal Report</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select an issue, then open it in doc, markdown, or plain text format.
                </p>
              </div>
              <ArchiveSelector />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(250px,1fr)]">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Published April 1, 2026 | Issue 02 | 10-15 minute read
                </p>
                <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Guest Signal Report
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">
                  Cincinnati dining demand is active, but attention does not equal retention. This
                  report connects national and regional movement to practical operating moves local
                  owners can implement immediately.
                </p>
                <ul className="mt-5 grid gap-2 text-sm text-slate-100 sm:grid-cols-2">
                  <li className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    National + regional demand intelligence
                  </li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    Greater Cincinnati conversion pressure
                  </li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 sm:col-span-2">
                    Action plan for the next 90 days
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-2" id="issue-02-files">
                    <a
                      className="btn-primary text-center"
                      href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.doc"
                    >
                      Download .doc
                    </a>
                    <a
                      className="btn-secondary border-slate-500 bg-slate-900/70 text-white"
                      href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.md"
                    >
                      Read Markdown
                    </a>
                    <a
                      className="btn-secondary border-slate-500 bg-slate-900/70 text-white"
                      href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.txt"
                    >
                      Read Plain Text
                    </a>
                </div>
              </div>

              <aside className="self-end rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Operator snapshot
                </p>
                <div className="mt-3 grid gap-2">
                  <article className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Demand Pulse</p>
                    <p className="mt-1 text-xl font-semibold text-white">Up</p>
                    <p className="text-xs text-slate-300">Traffic visibility remains elevated</p>
                  </article>
                  <article className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Core Risk</p>
                    <p className="mt-1 text-xl font-semibold text-white">Retention</p>
                    <p className="text-xs text-slate-300">First visits still leak without follow-up</p>
                  </article>
                  <article className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                      Owner Priority
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">System</p>
                    <p className="text-xs text-slate-300">Track list growth + weekly signal review</p>
                  </article>
                </div>
              </aside>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <div id="issue-01-files">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                Archive issue
              </p>
              <h2 className="mt-2">Issue 01 (March 25, 2026)</h2>
              <p>
                First published issue in the Guest Signal Report series, focused on signal-to-system
                execution for independent restaurants.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="btn-primary text-center"
                  href="/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.doc"
                >
                  Download .doc
                </a>
                <a
                  className="btn-secondary border-stone-400 bg-white text-slate-900"
                  href="/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.md"
                >
                  Read Markdown
                </a>
                <a
                  className="btn-secondary border-stone-400 bg-white text-slate-900"
                  href="/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.txt"
                >
                  Read Plain Text
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2>The Core Problem</h2>
            <p>
              <strong>Strong food. Weak system.</strong> Restaurant Week and local press can
              generate a spike, but without a conversion and follow-up system, demand fades fast.
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3>What this means</h3>
              <p>
                Visibility wins your first look. Retention wins your quarter. Operators with a
                clear story, a capture mechanism, and weekly operating reviews will outperform the
                market noise.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2>What We Are Seeing Right Now</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>National signal</h3>
                <p>
                  The National Restaurant Association&apos;s 2026 Restaurant Performance Index
                  updates show improving demand conditions while guests remain selective on value.
                </p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>Regional signal</h3>
                <p>
                  Great Lakes and Midwest award cycles continue expanding visibility pressure for
                  independent concepts.
                </p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>Greater Cincinnati signal</h3>
                <p>
                  Cincinnati dining attention remains elevated through local event and media
                  cycles, and conversion discipline still separates operators.
                </p>
              </article>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2>Operator Implications</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>1) Capture the first visit</h3>
                <p>Track list growth daily and launch a 24-hour post-visit follow-up message.</p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>2) Sharpen your signature</h3>
                <p>
                  Make your concept easy to repeat in one sentence so guests can market you for
                  free.
                </p>
              </article>
              <article className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>3) Run a weekly signal review</h3>
                <p>
                  Convert reviews and local demand cues into one owner task list every Monday.
                </p>
              </article>
            </div>
            <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-slate-800">
              <strong>Aha moment:</strong> Restaurant Week does not create demand. It exposes which
              restaurants already have a system.
            </p>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2>90-Day Action Sequence</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                <span className="font-semibold text-slate-900">Days 1-14: </span>
                Implement one offer capture point and one automated guest follow-up message.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Days 15-45: </span>
                Refine menu and service messaging around your strongest repeat-visit triggers.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Days 46-90: </span>
                Publish owner scorecards each week: list growth, repeat visit rate, and top review
                friction points.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2>Sources</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <a href="https://restaurant.org/research-and-media/research/economists-notebook/">
                  National Restaurant Association, Economist&apos;s Notebook
                </a>
              </li>
              <li>
                <a href="https://www.jamesbeard.org/awards">James Beard Foundation Awards</a>
              </li>
              <li>
                <a href="https://www.citybeat.com/food-drink/">Cincinnati local restaurant reporting</a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  )
}
