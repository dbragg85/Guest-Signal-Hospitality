-- Guest Signal client portal — multi-tenant + super admin
-- Run in Supabase SQL Editor (or supabase db push) after creating a project.

-- Extensions
create extension if not exists "pgcrypto";

-- Restaurants (tenants)
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Profile per auth user (super admin flag for your main operator account)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Membership: which users may access which restaurant scorecards
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  unique (user_id, restaurant_id)
);

-- Scorecard rows (extend columns as your product grows)
create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  period text not null,
  score int,
  headline text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- New auth users get a profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.scorecards enable row level security;

-- Profiles: own row only
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Restaurants: super admin sees all; others see restaurants they belong to
create policy "restaurants_select"
  on public.restaurants for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
    or exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.restaurant_id = restaurants.id
    )
  );

-- Memberships: read own rows; super admin reads all
create policy "memberships_select"
  on public.memberships for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
    or user_id = auth.uid()
  );

-- Scorecards: super admin reads all; members read their restaurants
create policy "scorecards_select"
  on public.scorecards for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
    or exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.restaurant_id = scorecards.restaurant_id
    )
  );

-- Optional: service role inserts scorecards via backend jobs (bypass RLS with service key)
-- Client apps should not insert scorecards from the browser without policies.

-- Seed Boca (idempotent)
insert into public.restaurants (slug, name)
values ('boca', 'Boca')
on conflict (slug) do nothing;

insert into public.scorecards (restaurant_id, period, score, headline, data)
select r.id,
  'Q1 2025',
  84,
  'Guest Signal snapshot',
  '{"experience_quality": 86, "operational_reliability": 81, "emotional_connection": 82}'::jsonb
from public.restaurants r
where r.slug = 'boca'
and not exists (
  select 1 from public.scorecards s where s.restaurant_id = r.id and s.period = 'Q1 2025'
);
