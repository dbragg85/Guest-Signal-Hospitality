-- Service tier chosen on the public intake form (mirrors lead_intake_submissions.inquiry_plan after processing).

alter table public.restaurants
  add column if not exists intake_inquiry_plan text;

comment on column public.restaurants.intake_inquiry_plan is
  'Plan selected at intake: free_snapshot, signal_monitor, signal_growth, or signal_elevate.';
