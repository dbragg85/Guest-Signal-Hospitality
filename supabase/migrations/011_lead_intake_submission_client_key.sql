-- Correlate browser submissions with FormSubmit email: anon cannot SELECT rows after INSERT (RLS),
-- so we store a client-generated UUID and expose a narrow RPC to resolve the public row id.

alter table public.lead_intake_submissions
  add column if not exists submission_client_key uuid;

create unique index if not exists lead_intake_submissions_client_key_uidx
  on public.lead_intake_submissions (submission_client_key)
  where submission_client_key is not null;

comment on column public.lead_intake_submissions.submission_client_key is
  'Opaque id generated in the browser; included in FormSubmit email to join inbox → lead_intake_submissions.id via RPC or manual lookup.';

create or replace function public.fetch_lead_intake_id_by_client_key(p_key uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select li.id
  from public.lead_intake_submissions li
  where li.submission_client_key is not null
    and li.submission_client_key = p_key
  limit 1;
$$;

revoke all on function public.fetch_lead_intake_id_by_client_key(uuid) from public;
grant execute on function public.fetch_lead_intake_id_by_client_key(uuid) to anon, authenticated;
