-- Recovery / idempotent re-apply: fixes ERROR 42710 "policy ... already exists" when
-- `010` RLS policies were run twice or accidentally merged into a later migration paste.
-- Safe to run multiple times. Does not touch `011` (submission_client_key + RPC).

drop policy if exists "lead_intake_anon_insert" on public.lead_intake_submissions;
drop policy if exists "lead_intake_super_admin_select" on public.lead_intake_submissions;
drop policy if exists "lead_intake_super_admin_update" on public.lead_intake_submissions;

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
