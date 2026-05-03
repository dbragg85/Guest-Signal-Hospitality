-- Allow the public intake form to detect duplicate submissions still in the automation queue
-- (pending / processing) before INSERT. Callable by anon; no SELECT policy on the table required.

create or replace function public.check_lead_intake_submission_blocked(
  p_email text,
  p_business text,
  p_name text,
  p_city text,
  p_state text,
  p_zip text
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
      lower(trim(coalesce(p_zip, ''))) as zp
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

comment on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text) is
  'Returns {blocked, code?} for anon intake: blocks when same email or same name+business+city+state+zip has a pending/processing row.';

revoke all on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text) from public;
grant execute on function public.check_lead_intake_submission_blocked(text, text, text, text, text, text) to anon, authenticated;
