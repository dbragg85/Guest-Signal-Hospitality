-- Optional Elevate-tier context: @handles / page names (not Google/Yelp URLs).
alter table public.lead_intake_submissions
  add column if not exists social_presence_note text;

comment on column public.lead_intake_submissions.social_presence_note is
  'Elevate intake: primary social handles or page names for tracking/management alignment.';
