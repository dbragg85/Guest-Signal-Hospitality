-- Public website lead / intake submissions (contact + plan-specific flows).
-- Browser uses the Supabase anon key; only INSERT is allowed for anon.
-- Super admins read rows in Table Editor or via authenticated SQL.

create table if not exists public.lead_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inquiry_plan text not null,
  name text not null,
  email text not null,
  business text not null,
  street_address text,
  city text,
  state text,
  zip text,
  concept_type text,
  location_count text,
  snapshot_focus text,
  goals text,
  competitors_note text,
  message text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'reviewed', 'converted', 'spam')),
  source text not null default 'website_contact',
  restaurant_id uuid references public.restaurants (id) on delete set null
);

create index if not exists lead_intake_submissions_created_at_idx
  on public.lead_intake_submissions (created_at desc);

create index if not exists lead_intake_submissions_processing_idx
  on public.lead_intake_submissions (processing_status)
  where processing_status = 'pending';

comment on table public.lead_intake_submissions is
  'Website contact and plan intake. Automations (scrape, snapshot, portal invite) can key off processing_status and restaurant_id.';

alter table public.lead_intake_submissions enable row level security;

create policy "lead_intake_anon_insert"
  on public.lead_intake_submissions for insert
  to anon
  with check (
    length(trim(name)) >= 1
    and length(trim(email)) >= 3
    and position('@' in trim(email)) > 1
    and length(trim(business)) >= 1
    and length(trim(inquiry_plan)) >= 1
  );

create policy "lead_intake_super_admin_select"
  on public.lead_intake_submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "lead_intake_super_admin_update"
  on public.lead_intake_submissions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
