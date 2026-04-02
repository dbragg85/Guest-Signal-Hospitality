-- Yelp source ingestion support for monthly scorecard pipeline.
-- Adds source-specific review counts and mention-aware category scoring.

alter table public.restaurants
  add column if not exists yelp_url text;

alter table public.snapshots
  add column if not exists google_reviews_analyzed int,
  add column if not exists yelp_reviews_analyzed int;

alter table public.snapshot_category_scores
  add column if not exists mentions int;

create table if not exists public.review_observations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  source text not null check (source in ('google', 'yelp')),
  external_review_id text,
  review_date date,
  rating numeric(3,1),
  review_text text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (restaurant_id, source, external_review_id)
);

create index if not exists review_observations_restaurant_source_date_idx
  on public.review_observations (restaurant_id, source, review_date desc);

create index if not exists snapshot_category_scores_mentions_idx
  on public.snapshot_category_scores (snapshot_id, category, mentions);
