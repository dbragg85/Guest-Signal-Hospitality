alter table public.prospect_queue
  add column if not exists approval_notified_at timestamptz;

create table if not exists public.prospect_approval_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prospect_id uuid not null references public.prospect_queue(id) on delete cascade,
  action text not null check (action in ('approve', 'deny')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists prospect_approval_actions_pending_idx
  on public.prospect_approval_actions (token_hash, expires_at)
  where used_at is null;

alter table public.prospect_approval_actions enable row level security;

-- No browser policies: only service-role automation and the approval Edge
-- Function may create or consume action tokens.
revoke all on table public.prospect_approval_actions
  from public, anon, authenticated;

comment on table public.prospect_approval_actions is
  'Short-lived, one-time ntfy actions for approving or denying prospect drafts.';
