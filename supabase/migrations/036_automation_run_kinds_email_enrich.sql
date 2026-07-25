alter table public.automation_runs
  drop constraint if exists automation_runs_run_kind_check;

alter table public.automation_runs
  add constraint automation_runs_run_kind_check check (
    run_kind in (
      'daily_report',
      'codex_operator',
      'prospect_research',
      'prospect_ntfy_notify',
      'prospect_email_enrich'
    )
  );

comment on column public.prospect_queue.contact_email is
  'Public business contact email discovered from listings/website pages, or owner-verified in the portal.';
