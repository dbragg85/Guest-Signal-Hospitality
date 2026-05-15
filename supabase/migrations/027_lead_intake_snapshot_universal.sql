-- Universal free snapshot intake: priority, GBP link, recommended plan, structured summary.

alter table public.lead_intake_submissions
  add column if not exists gbp_url text,
  add column if not exists snapshot_priority text,
  add column if not exists recommended_plan text,
  add column if not exists snapshot_summary jsonb;

comment on column public.lead_intake_submissions.gbp_url is
  'Optional Google Business Profile / Maps listing URL from snapshot intake.';
comment on column public.lead_intake_submissions.snapshot_priority is
  'Snapshot lead magnet priority: reviews, google_visibility, seo, website, competitors, social_reputation, unsure.';
comment on column public.lead_intake_submissions.recommended_plan is
  'Client-side recommended paid plan key after snapshot intake: signal_monitor, signal_growth, or signal_elevate.';
comment on column public.lead_intake_submissions.snapshot_summary is
  'JSON: deliverables scope, priority label, recommended plan — for ops and automation.';
