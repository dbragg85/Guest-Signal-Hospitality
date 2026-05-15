-- Fix portal RLS "stack depth limit exceeded".
-- Causes: (1) restaurants_select subquery on memberships re-applies memberships RLS;
-- (2) memberships_select subquery on profiles hits lwg-tenant is_admin() policy which re-reads profiles.
-- Use security definer helpers so checks bypass nested RLS.

-- Shared project: is_admin() must not read profiles under RLS (infinite recursion).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(p.is_super_admin, false) = true
        or (to_jsonb(p) ? 'role' and (to_jsonb(p)->>'role') = 'admin')
      )
  );
$$;

create or replace function public.auth_user_is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.auth_user_can_access_restaurant(rid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.auth_user_is_super_admin()
    or exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.restaurant_id = rid
    );
$$;

revoke all on function public.auth_user_is_super_admin() from public;
revoke all on function public.auth_user_can_access_restaurant(uuid) from public;
grant execute on function public.auth_user_is_super_admin() to authenticated, anon;
grant execute on function public.auth_user_can_access_restaurant(uuid) to authenticated, anon;

drop policy if exists "restaurants_select" on public.restaurants;
create policy "restaurants_select"
  on public.restaurants for select
  using (public.auth_user_can_access_restaurant(id));

drop policy if exists "memberships_select" on public.memberships;
create policy "memberships_select"
  on public.memberships for select
  using (public.auth_user_is_super_admin() or user_id = auth.uid());

drop policy if exists "scorecards_select" on public.scorecards;
create policy "scorecards_select"
  on public.scorecards for select
  using (public.auth_user_can_access_restaurant(restaurant_id));
