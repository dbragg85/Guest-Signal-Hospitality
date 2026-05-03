-- Per-period scoring batch + per-review GSS breakdown (Google monthly pipeline).
-- Service_role jobs write; portal clients use RLS like review_observations.
--
-- If a legacy or partial table named review_batches already exists without period_label,
-- CREATE TABLE IF NOT EXISTS would be skipped and CREATE INDEX would error (42703).
do $repair$
begin
  if to_regclass('public.review_batches') is not null
     and not exists (
       select 1
       from information_schema.columns c
       where c.table_schema = 'public'
         and c.table_name = 'review_batches'
         and c.column_name = 'period_label'
     ) then
    execute 'drop table if exists public.review_scores cascade';
    execute 'drop table public.review_batches cascade';
  end if;
end;
$repair$;

create table if not exists public.review_batches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  scoring_model text not null default 'guest_signal_google_gss_v1',
  snapshot_id uuid references public.snapshots (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, period_label, scoring_model)
);

create index if not exists review_batches_restaurant_period_idx
  on public.review_batches (restaurant_id, period_label desc);

create index if not exists review_batches_snapshot_id_idx
  on public.review_batches (snapshot_id);

create table if not exists public.review_scores (
  id uuid primary key default gen_random_uuid(),
  review_batch_id uuid not null references public.review_batches (id) on delete cascade,
  review_observation_id uuid not null references public.review_observations (id) on delete cascade,
  source text not null check (source in ('google', 'yelp')),
  review_date date,
  rating numeric(3, 1),
  categories_mentioned text[] not null default '{}'::text[],
  sentiment_by_category jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (review_batch_id, review_observation_id)
);

create index if not exists review_scores_batch_idx
  on public.review_scores (review_batch_id);

create index if not exists review_scores_observation_idx
  on public.review_scores (review_observation_id);

comment on table public.review_batches is
  'One row per restaurant + period + scoring_model; links snapshot to per-review scores.';

comment on table public.review_scores is
  'Per review_observation GSS mention/sentiment breakdown for a review_batch.';

alter table public.review_batches enable row level security;
alter table public.review_scores enable row level security;

drop policy if exists "review_batches_super_admin_select" on public.review_batches;
drop policy if exists "review_batches_super_admin_insert" on public.review_batches;
drop policy if exists "review_batches_super_admin_update" on public.review_batches;
drop policy if exists "review_batches_super_admin_delete" on public.review_batches;

create policy "review_batches_super_admin_select"
  on public.review_batches for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_batches_super_admin_insert"
  on public.review_batches for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_batches_super_admin_update"
  on public.review_batches for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_batches_super_admin_delete"
  on public.review_batches for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "review_scores_super_admin_select" on public.review_scores;
drop policy if exists "review_scores_super_admin_insert" on public.review_scores;
drop policy if exists "review_scores_super_admin_update" on public.review_scores;
drop policy if exists "review_scores_super_admin_delete" on public.review_scores;

create policy "review_scores_super_admin_select"
  on public.review_scores for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_scores_super_admin_insert"
  on public.review_scores for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_scores_super_admin_update"
  on public.review_scores for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "review_scores_super_admin_delete"
  on public.review_scores for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
