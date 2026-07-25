-- Stripe conversion tracking + 7-day growth goals with intervention approvals.

alter table public.automation_runs
  drop constraint if exists automation_runs_run_kind_check;
alter table public.automation_runs
  add constraint automation_runs_run_kind_check check (
    run_kind in (
      'daily_report',
      'codex_operator',
      'prospect_research',
      'prospect_ntfy_notify',
      'prospect_email_enrich',
      'growth_goal_eval'
    )
  );

alter table public.sales_opportunities
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists customer_email text;

create unique index if not exists sales_opportunities_stripe_checkout_uidx
  on public.sales_opportunities (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.growth_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  target_conversions integer not null check (target_conversions > 0),
  window_days integer not null check (window_days > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active' check (
    status in ('active', 'achieved', 'missed', 'cancelled')
  ),
  plan_keys text[] not null default array['signal_monitor','signal_growth','signal_elevate'],
  notes text
);

create index if not exists growth_goals_active_idx
  on public.growth_goals (status, ends_at)
  where status = 'active';

create table if not exists public.growth_goal_evaluations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  goal_id uuid not null references public.growth_goals(id) on delete cascade,
  conversions integer not null default 0,
  hours_elapsed numeric not null,
  hours_remaining numeric not null,
  attainable boolean not null,
  verdict text not null,
  evidence jsonb not null default '{}'::jsonb,
  proposed_interventions jsonb not null default '[]'::jsonb
);

create index if not exists growth_goal_evaluations_goal_time_idx
  on public.growth_goal_evaluations (goal_id, created_at desc);

create table if not exists public.growth_interventions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  goal_id uuid not null references public.growth_goals(id) on delete cascade,
  evaluation_id uuid references public.growth_goal_evaluations(id) on delete set null,
  kind text not null check (
    kind in (
      'homepage_cta_push',
      'checkout_intro_offer',
      'prospect_outreach_push',
      'snapshot_cta_push'
    )
  ),
  title text not null,
  rationale text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (
    status in ('proposed', 'approved', 'applied', 'denied', 'expired')
  ),
  approved_at timestamptz,
  applied_at timestamptz,
  denied_at timestamptz,
  apply_result text
);

create index if not exists growth_interventions_status_idx
  on public.growth_interventions (status, created_at desc);

create table if not exists public.growth_intervention_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  intervention_id uuid not null references public.growth_interventions(id) on delete cascade,
  action text not null check (action in ('approve', 'deny')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

alter table public.growth_goals enable row level security;
alter table public.growth_goal_evaluations enable row level security;
alter table public.growth_interventions enable row level security;
alter table public.growth_intervention_actions enable row level security;

revoke all on table public.growth_goals from public, anon, authenticated;
revoke all on table public.growth_goal_evaluations from public, anon, authenticated;
revoke all on table public.growth_interventions from public, anon, authenticated;
revoke all on table public.growth_intervention_actions from public, anon, authenticated;

grant select on table public.growth_goals to authenticated;
grant select on table public.growth_goal_evaluations to authenticated;
grant select on table public.growth_interventions to authenticated;

drop policy if exists "growth_goals_super_admin_select" on public.growth_goals;
create policy "growth_goals_super_admin_select"
  on public.growth_goals for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin));

drop policy if exists "growth_evals_super_admin_select" on public.growth_goal_evaluations;
create policy "growth_evals_super_admin_select"
  on public.growth_goal_evaluations for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin));

drop policy if exists "growth_interventions_super_admin_select" on public.growth_interventions;
create policy "growth_interventions_super_admin_select"
  on public.growth_interventions for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin));

-- Seed the active 7-day / 3-conversion goal if none exists.
insert into public.growth_goals (
  name, target_conversions, window_days, starts_at, ends_at, status, notes
)
select
  'Three paid plan conversions in 7 days',
  3,
  7,
  now(),
  now() + interval '7 days',
  'active',
  'Operator goal: run Guest Signal like an owner-operated business with 12-hour attainability checks.'
where not exists (
  select 1 from public.growth_goals where status = 'active'
);
