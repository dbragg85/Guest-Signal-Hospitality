'use client'

import { useMemo, useState } from 'react'

const ISSUE_CONTENT = {
  'issue-01': {
    label: 'Issue 01 (March 25, 2026)',
    title: 'Guest Signal Report',
    metadataLine: 'Published March 25, 2026 | Issue 01 | 10-15 minute read',
    description:
      'Issue 01 established the core operating thesis: attention spikes are useful only when capture, follow-up, and weekly execution systems convert visits into repeat demand.',
    highlights: [
      'National + regional demand context for independent operators',
      'Greater Cincinnati retention and conversion pressure',
      '90-day execution cadence for owners and managers',
    ],
    snapshot: [
      { label: 'Issue Theme', value: 'Systems', note: 'Signal-to-system execution baseline' },
      { label: 'Core Risk', value: 'Leakage', note: 'Trial visits not converted into repeat traffic' },
      { label: 'Owner Priority', value: 'Cadence', note: 'Install weekly review and assignment discipline' },
    ],
    archiveSummary:
      'Foundational issue focused on converting demand signals into repeatable operator workflows.',
    problemSummary:
      'Most independent operators are not losing because food quality is weak. They are losing because demand intelligence is not turning into repeatable operating behavior.',
    calloutTitle: 'The problem in one line',
    calloutText:
      'Strong food. Weak system. Event visibility drives trial, but retention depends on repeatable follow-up.',
    signals: [
      {
        title: 'National signal',
        text: 'Consumer demand remains resilient, but guest spending behavior is still value-sensitive and consistency-driven.',
      },
      {
        title: 'Regional signal',
        text: 'Great Lakes and Midwest visibility cycles increase both upside for disciplined concepts and competitive pressure for everyone else.',
      },
      {
        title: 'Greater Cincinnati signal',
        text: 'Local momentum is real, but operators without capture and follow-up workflows still show retention gaps after traffic spikes.',
      },
    ],
    implications: [
      {
        title: '1) Capture the first visit',
        text: 'Every first-time guest should enter an owned follow-up path within 24 hours.',
      },
      {
        title: '2) Sharpen your signature narrative',
        text: 'If your concept cannot be explained in one line, your guests cannot repeat it for you.',
      },
      {
        title: '3) Run weekly signal review',
        text: 'Review list growth, repeat indicators, and top friction points weekly with one owner and one due date per fix.',
      },
    ],
    aha: 'Restaurant Week does not create demand. It reveals who already has a system.',
    actionSequence: [
      'Days 1-14: Install one high-visibility capture point and one automated post-visit message.',
      'Days 15-45: Align menu and service messaging around your strongest repeat-visit triggers.',
      'Days 46-90: Publish weekly owner scorecards and track conversion movement.',
    ],
    files: {
      doc: '/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.doc',
      md: '/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.md',
      txt: '/newsletters/issue-01/GUESIGNAL_Newsletter_2026-03-25_Issue-01.txt',
    },
    sources: [
      {
        label: "National Restaurant Association, Economist's Notebook",
        href: 'https://restaurant.org/research-and-media/research/economists-notebook/',
      },
      {
        label: 'National Restaurant Association, State of the Industry',
        href: 'https://restaurant.org/research-and-media/research/state-of-the-restaurant-industry/',
      },
      { label: 'James Beard Foundation Awards', href: 'https://www.jamesbeard.org/awards' },
      {
        label: 'Cincinnati Restaurant Week',
        href: 'https://greatercincinnatirestaurantweek.com/',
      },
      {
        label: 'Cincinnati local restaurant reporting',
        href: 'https://www.citybeat.com/food-drink/',
      },
    ],
  },
  'issue-02': {
    label: 'Issue 02 (April 1, 2026)',
    title: 'Guest Signal Report',
    metadataLine: 'Published April 1, 2026 | Issue 02 | 10-15 minute read',
    description:
      'Issue 02 extends the thesis with current national, regional, and local movement, then maps those signals into immediate owner actions for the next quarter.',
    highlights: [
      'National + regional demand intelligence',
      'Greater Cincinnati conversion pressure',
      'Action plan for the next 90 days',
    ],
    snapshot: [
      { label: 'Demand Pulse', value: 'Up', note: 'Traffic visibility remains elevated' },
      { label: 'Core Risk', value: 'Retention', note: 'First visits still leak without follow-up' },
      { label: 'Owner Priority', value: 'System', note: 'Track list growth + weekly signal review' },
    ],
    archiveSummary:
      'Current issue connecting fresh market context to practical weekly operating moves.',
    problemSummary:
      'Restaurant Week and local press can create demand spikes, but without a conversion and follow-up system, most independents do not retain that momentum.',
    calloutTitle: 'The problem in one line',
    calloutText: 'Strong food. Weak system. Attention does not automatically convert to retention.',
    signals: [
      {
        title: 'National signal',
        text: "The National Restaurant Association's 2026 Restaurant Performance Index updates indicate improving demand conditions with continued price sensitivity.",
      },
      {
        title: 'Regional signal',
        text: 'Great Lakes and Midwest recognition cycles continue to increase visibility pressure in regional markets.',
      },
      {
        title: 'Greater Cincinnati signal',
        text: "Cincinnati's dining scene remains active through local events and media attention, but repeat capture still separates operators.",
      },
    ],
    implications: [
      {
        title: '1) Capture demand in the first visit',
        text: 'Track list growth daily and launch a 24-hour post-visit follow-up message.',
      },
      {
        title: '2) Sharpen your signature',
        text: 'Make your concept easy to repeat in one sentence so guests can market you for free.',
      },
      {
        title: '3) Run a weekly signal review',
        text: 'Convert reviews and local demand cues into one owner task list every Monday.',
      },
    ],
    aha: 'Restaurant Week does not create demand. It exposes which restaurants already have a system.',
    actionSequence: [
      'Days 1-14: Implement one offer capture point and one automated guest follow-up message.',
      'Days 15-45: Refine menu and service messaging around your strongest repeat-visit triggers.',
      'Days 46-90: Publish owner scorecards each week with list growth, repeat visit rate, and top friction points.',
    ],
    files: {
      doc: '/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.doc',
      md: '/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.md',
      txt: '/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.txt',
    },
    sources: [
      {
        label: "National Restaurant Association, Economist's Notebook",
        href: 'https://restaurant.org/research-and-media/research/economists-notebook/',
      },
      { label: 'James Beard Foundation Awards', href: 'https://www.jamesbeard.org/awards' },
      {
        label: 'Cincinnati local restaurant reporting',
        href: 'https://www.citybeat.com/food-drink/',
      },
    ],
  },
}

const ISSUE_OPTIONS = [
  { value: 'issue-01', label: ISSUE_CONTENT['issue-01'].label },
  { value: 'issue-02', label: ISSUE_CONTENT['issue-02'].label },
]

export default function NewsletterPageContent() {
  const [issue, setIssue] = useState('issue-01')
  const current = useMemo(() => ISSUE_CONTENT[issue] ?? ISSUE_CONTENT['issue-01'], [issue])
  const secondaryIssue = issue === 'issue-01' ? 'issue-02' : 'issue-01'
  const secondary = ISSUE_CONTENT[secondaryIssue]

  return (
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
                Select an issue to render the report body, then open source files.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <label className="sr-only" htmlFor="issue">
                Newsletter issue
              </label>
              <select
                id="issue"
                name="issue"
                value={issue}
                onChange={(event) => setIssue(event.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none"
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <a className="btn-primary shrink-0 px-4 py-2.5 text-center" href="#active-issue-files">
                Open
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(250px,1fr)]">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                {current.metadataLine}
              </p>
              <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
                {current.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">{current.description}</p>
              <ul className="mt-5 grid gap-2 text-sm text-slate-100 sm:grid-cols-2">
                {current.highlights.map((item, index) => (
                  <li
                    key={item}
                    className={`rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 ${
                      index === current.highlights.length - 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2" id="active-issue-files">
                <a className="btn-primary text-center" href={current.files.doc}>
                  Download .doc
                </a>
                <a className="btn-secondary border-slate-500 bg-slate-900/70 text-white" href={current.files.md}>
                  Read Markdown
                </a>
                <a className="btn-secondary border-slate-500 bg-slate-900/70 text-white" href={current.files.txt}>
                  Read Plain Text
                </a>
              </div>
            </div>

            <aside className="self-end rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                Operator snapshot
              </p>
              <div className="mt-3 grid gap-2">
                {current.snapshot.map((item) => (
                  <article key={item.label} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
                    <p className="text-xs text-slate-300">{item.note}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Alternate issue</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{secondary.label}</h2>
            <p>{secondary.archiveSummary}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary text-center"
                onClick={() => setIssue(secondaryIssue)}
              >
                Render This Issue
              </button>
              <a className="btn-secondary border-stone-400 bg-white text-slate-900" href={secondary.files.doc}>
                Download .doc
              </a>
              <a className="btn-secondary border-stone-400 bg-white text-slate-900" href={secondary.files.md}>
                Read Markdown
              </a>
              <a className="btn-secondary border-stone-400 bg-white text-slate-900" href={secondary.files.txt}>
                Read Plain Text
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2>The Core Problem</h2>
          <p>{current.problemSummary}</p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3>{current.calloutTitle}</h3>
            <p>{current.calloutText}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2>What We Are Seeing Right Now</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {current.signals.map((signal) => (
              <article key={signal.title} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>{signal.title}</h3>
                <p>{signal.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2>Operator Implications</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {current.implications.map((item) => (
              <article key={item.title} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-slate-800">
            <strong>Aha moment:</strong> {current.aha}
          </p>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2>90-Day Action Sequence</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {current.actionSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2>Sources</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {current.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href}>{source.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
