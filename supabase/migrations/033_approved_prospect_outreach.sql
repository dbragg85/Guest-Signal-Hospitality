-- Human-approved outreach delivery state. Recipient email is entered manually
-- by the owner; the research pipeline does not enrich or infer personal emails.

alter table public.prospect_queue
  add column if not exists contact_email text,
  add column if not exists send_status text not null default 'not_ready',
  add column if not exists send_error text,
  add column if not exists sent_message_id text;

alter table public.prospect_queue
  drop constraint if exists prospect_queue_contact_email_check;
alter table public.prospect_queue
  add constraint prospect_queue_contact_email_check check (
    contact_email is null
    or (
      length(contact_email) between 5 and 320
      and contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  );

alter table public.prospect_queue
  drop constraint if exists prospect_queue_send_status_check;
alter table public.prospect_queue
  add constraint prospect_queue_send_status_check check (
    send_status in ('not_ready', 'pending', 'sending', 'sent', 'failed')
  );

create index if not exists prospect_queue_send_status_idx
  on public.prospect_queue (send_status, approved_at)
  where status = 'approved';

comment on column public.prospect_queue.contact_email is
  'Owner-verified public business contact email. Never inferred by the research job.';
comment on column public.prospect_queue.send_status is
  'Idempotent delivery state for an owner-approved outreach draft.';
