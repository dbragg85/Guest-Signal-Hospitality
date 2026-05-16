-- Signal Elevate: menu text for intelligence deliverables + upgrade tracking.

alter table public.lead_intake_submissions
  add column if not exists menu_text text,
  add column if not exists menu_source_url text;

comment on column public.lead_intake_submissions.menu_text is
  'Paste or extracted menu copy for Elevate menu intelligence (items, sections, prices).';

comment on column public.lead_intake_submissions.menu_source_url is
  'Optional public menu PDF or web menu URL when client does not paste text.';

alter table public.restaurants
  add column if not exists menu_text text,
  add column if not exists menu_source_url text,
  add column if not exists menu_updated_at timestamptz;

comment on column public.restaurants.menu_text is
  'Latest menu copy on file for Elevate clustering and pricing perception work.';

comment on column public.restaurants.menu_source_url is
  'Source URL for menu (PDF or web) when not pasted inline.';
