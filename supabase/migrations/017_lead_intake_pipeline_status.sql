-- Extend lead intake lifecycle for automation (processing / failed) + error text.

alter table public.lead_intake_submissions
  drop constraint if exists lead_intake_submissions_processing_status_check;

alter table public.lead_intake_submissions
  add constraint lead_intake_submissions_processing_status_check
  check (
    processing_status in (
      'pending',
      'processing',
      'reviewed',
      'converted',
      'spam',
      'failed'
    )
  );

alter table public.lead_intake_submissions
  add column if not exists pipeline_last_error text;

comment on column public.lead_intake_submissions.pipeline_last_error is
  'Last automation error (Apify, scoring, or portal invite); cleared when a run starts.';
