-- Allow paid plan intake (Monitor / Growth / Elevate) when the same email recently
-- completed a free snapshot — portal upgrade CTAs must not hit recent_converted_email.

drop function if exists public.check_lead_intake_submission_blocked(text, text, text, text, text, text);

create or replace function public.check_lead_intake_submission_blocked(
  p_email text,
  p_business text,
  p_name text,
  p_city text,
  p_state text,
  p_zip text,
  p_inquiry_plan text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with norm as (
    select
      lower(trim(coalesce(p_email, ''))) as em,
      lower(trim(coalesce(p_business, ''))) as bu,
      lower(trim(coalesce(p_name, ''))) as nm,
      lower(trim(coalesce(p_city, ''))) as ct,
      lower(trim(coalesce(p_state, ''))) as st,
      lower(trim(coalesce(p_zip, ''))) as zp,
      lower(trim(coalesce(p_inquiry_plan, ''))) as plan_key
  ),
  paid_upgrade as (
    select (select plan_key from norm) in (
      'signal_monitor',
      'signal_growth',
      'signal_elevate'
    ) as is_paid
  )
  select
    case
      when (select em from norm) = '' then jsonb_build_object('blocked', false)
      when exists (
        select 1
        from public.lead_intake_submissions li
        where li.processing_status in ('pending', 'processing')
          and lower(trim(li.email)) = (select em from norm)
      ) then jsonb_build_object('blocked', true, 'code', 'active_email')
      when (select is_paid from paid_upgrade) = false
        and exists (
          select 1
          from public.lead_intake_submissions li
          where li.processing_status = 'converted'
            and lower(trim(li.email)) = (select em from norm)
            and li.created_at > (now() - interval '72 hours')
        ) then jsonb_build_object('blocked', true, 'code', 'recent_converted_email')
      when (select bu from norm) <> ''
        and (select nm from norm) <> ''
        and (select ct from norm) <> ''
        and (select st from norm) <> ''
        and (select zp from norm) <> ''
        and exists (
          select 1
          from public.lead_intake_submissions li
          where li.processing_status in ('pending', 'processing')
            and lower(trim(li.business)) = (select bu from norm)
            and lower(trim(coalesce(li.name, ''))) = (select nm from norm)
            and lower(trim(coalesce(li.city, ''))) = (select ct from norm)
            and lower(trim(coalesce(li.state, ''))) = (select st from norm)
            and lower(trim(coalesce(li.zip, ''))) = (select zp from norm)
        ) then jsonb_build_object('blocked', true, 'code', 'active_venue_profile')
      else jsonb_build_object('blocked', false)
    end;
$$;

comment on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text, text) is
  'Blocks duplicate intake: pending/processing email; recent converted email (72h) except paid plan upgrades; pending/processing venue profile.';

revoke all on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text, text) from public;
grant execute on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text, text) to anon, authenticated;
