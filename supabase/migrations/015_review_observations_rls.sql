-- Security: enable RLS on raw review storage (PostgREST exposure).
-- GitHub Actions / scripts use the service_role key, which bypasses RLS.
-- Authenticated portal users have no client policies here today; super admins can inspect in Studio.

alter table public.review_observations enable row level security;

drop policy if exists "review_observations_super_admin_select" on public.review_observations;
drop policy if exists "review_observations_super_admin_insert" on public.review_observations;
drop policy if exists "review_observations_super_admin_update" on public.review_observations;
drop policy if exists "review_observations_super_admin_delete" on public.review_observations;

create policy "review_observations_super_admin_select"
  on public.review_observations for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_observations_super_admin_insert"
  on public.review_observations for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_observations_super_admin_update"
  on public.review_observations for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_observations_super_admin_delete"
  on public.review_observations for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

comment on table public.review_observations is
  'Raw ingested reviews (google/yelp). RLS on; service_role jobs bypass. Anon has no access.';
