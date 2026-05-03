-- Per-review frozen audit trail for Guest Signal rubric v1: keyword-derived categories,
-- rubric band score per mentioned category, text snapshot, and role (mention vs star-only).
-- Join to review_observations + snapshots for customer-facing score defense.

create table if not exists public.rubric_review_attributions (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.snapshots (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  review_observation_id uuid not null references public.review_observations (id) on delete cascade,
  period_label text not null,
  source text not null
    check (
      source in (
        'google',
        'yelp',
        'tripadvisor',
        'facebook',
        'doordash',
        'ubereats'
      )
    ),
  external_review_id text not null,
  review_date date,
  rating numeric(3, 1),
  review_text_snapshot text not null default '',
  categories_mentioned text[] not null default '{}'::text[],
  rubric_score_by_category jsonb not null default '{}'::jsonb,
  rubric_role text not null
    check (rubric_role in ('mention_scored', 'written_uncategorized', 'star_only')),
  scoring_model text not null default 'guest_signal_rubric_v1',
  created_at timestamptz not null default now(),
  unique (snapshot_id, review_observation_id)
);

create index if not exists rubric_review_attributions_snapshot_idx
  on public.rubric_review_attributions (snapshot_id);

create index if not exists rubric_review_attributions_restaurant_period_idx
  on public.rubric_review_attributions (restaurant_id, period_label desc);

create index if not exists rubric_review_attributions_observation_idx
  on public.rubric_review_attributions (review_observation_id);

comment on table public.rubric_review_attributions is
  'Frozen rubric v1 per-review attribution for a snapshot: text snapshot, categories_mentioned, rubric_score_by_category (95/85/70/50/30 per hit), rubric_role. Service_role jobs write; super_admin read via RLS.';

alter table public.rubric_review_attributions enable row level security;

drop policy if exists "rubric_review_attributions_super_admin_select" on public.rubric_review_attributions;
drop policy if exists "rubric_review_attributions_super_admin_insert" on public.rubric_review_attributions;
drop policy if exists "rubric_review_attributions_super_admin_update" on public.rubric_review_attributions;
drop policy if exists "rubric_review_attributions_super_admin_delete" on public.rubric_review_attributions;

create policy "rubric_review_attributions_super_admin_select"
  on public.rubric_review_attributions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "rubric_review_attributions_super_admin_insert"
  on public.rubric_review_attributions for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "rubric_review_attributions_super_admin_update"
  on public.rubric_review_attributions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "rubric_review_attributions_super_admin_delete"
  on public.rubric_review_attributions for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
