-- Optional fields to speed up free snapshot matching (venue phone, public site, hours).
-- We still locate Google/Yelp-style listings from address; these reduce ambiguity.

alter table public.lead_intake_submissions
  add column if not exists venue_phone text,
  add column if not exists website_url text,
  add column if not exists operating_hours_note text;

comment on column public.lead_intake_submissions.venue_phone is
  'Public-facing phone shown on listings; helps match the correct GBP/Yelp entity.';
comment on column public.lead_intake_submissions.website_url is
  'Official site URL if any; optional disambiguation — we do not require Google/Yelp URLs.';
comment on column public.lead_intake_submissions.operating_hours_note is
  'Typical hours or schedule notes for context when building the snapshot.';
