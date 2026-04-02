'use client'

import { useMemo, useState } from 'react'

const ISSUE_TARGETS: Record<string, string> = {
  'issue-02': '#issue-02-files',
  'issue-01': '#issue-01-files',
}

export default function ArchiveSelector() {
  const [issue, setIssue] = useState('issue-02')

  const targetHref = useMemo(() => ISSUE_TARGETS[issue] ?? ISSUE_TARGETS['issue-02'], [issue])

  return (
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
        <option value="issue-02">Issue 02 (April 1, 2026)</option>
        <option value="issue-01">Issue 01 (March 25, 2026)</option>
      </select>
      <a className="btn-primary shrink-0 px-4 py-2.5 text-center" href={targetHref}>
        Open
      </a>
    </div>
  )
}
