-- Phase 1 measurement integrity: canonical taxonomy, durable attribution,
-- idempotent Stripe lifecycle processing, and retained-revenue reporting.

alter table public.site_events drop constraint if exists site_events_event_name_check;
alter table public.site_events add constraint site_events_event_name_check check (event_name in (
  'page_view','cta_click','form_start','form_validation_fail',
  'snapshot_intake_success','snapshot_intake_fail','contact_submit_success','contact_submit_fail',
  'lead_intake_duplicate_blocked','lead_intake_supabase_insert_fail','lead_intake_id_lookup_fail',
  'lead_intake_supabase_insert_ok','lead_intake_formsubmit_failed',
  'snapshot_intake_duplicate_blocked','snapshot_intake_formsubmit_failed',
  'portal_upgrade_click','newsletter_submit_success','newsletter_submit_fail',
  'checkout_start','checkout_created','checkout_fail','checkout_returned','checkout_cancelled',
  'snapshot_delivered','permission_requested','permission_granted','permission_denied',
  'follow_up_sent','sales_action_clicked','sales_action_booked'
));

alter table public.lead_intake_submissions
  add column if not exists first_touch_attribution jsonb not null default '{}'::jsonb
    check (jsonb_typeof(first_touch_attribution) = 'object' and octet_length(first_touch_attribution::text) <= 2048);

alter table public.sales_opportunities
  add column if not exists first_touch_attribution jsonb not null default '{}'::jsonb,
  add column if not exists subscription_status text not null default 'pending'
    check (subscription_status in ('pending','active','cancelled','payment_failed','refunded')),
  add column if not exists cancelled_at timestamptz,
  add column if not exists payment_failed_at timestamptz,
  add column if not exists refunded_at timestamptz;

create index if not exists sales_opportunities_stripe_customer_idx
  on public.sales_opportunities (stripe_customer_id) where stripe_customer_id is not null;
create index if not exists sales_opportunities_stripe_subscription_idx
  on public.sales_opportunities (stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing','processed','failed')),
  claimed_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);
alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;

create or replace function public.claim_stripe_webhook_event(p_event_id text, p_event_type text)
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed text;
begin
  insert into public.stripe_webhook_events (stripe_event_id, event_type, status)
  values (p_event_id, p_event_type, 'processing')
  on conflict (stripe_event_id) do update set
    status = 'processing', claimed_at = now(), error_message = null
  where stripe_webhook_events.status = 'failed'
     or (stripe_webhook_events.status = 'processing' and stripe_webhook_events.claimed_at < now() - interval '5 minutes')
  returning stripe_event_id into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_stripe_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text) to service_role;

drop trigger if exists lead_intake_copy_attribution on public.lead_intake_submissions;
-- Replace the original function so attribution is copied atomically with the row.
create or replace function public.create_sales_opportunity_from_intake()
returns trigger language plpgsql security definer set search_path = public as $$
declare estimated_monthly_value integer;
begin
  estimated_monthly_value := case new.inquiry_plan
    when 'signal_monitor' then 14900 when 'signal_growth' then 49900
    when 'signal_elevate' then 99900 else 0 end;
  insert into public.sales_opportunities (
    lead_intake_id, stage, plan_key, monthly_value_cents, is_test,
    next_action_at, first_touch_attribution
  ) values (
    new.id, 'new', new.inquiry_plan, estimated_monthly_value, false,
    now() + interval '1 day', new.first_touch_attribution
  ) on conflict (lead_intake_id) do update
    set first_touch_attribution = excluded.first_touch_attribution;
  return new;
end;
$$;
revoke all on function public.create_sales_opportunity_from_intake() from public, anon, authenticated, service_role;

create or replace view public.retained_revenue_metrics as
select
  coalesce(sum(monthly_value_cents) filter (where won_at >= date_trunc('month', now())), 0) as gross_new_mrr_cents,
  coalesce(sum(monthly_value_cents) filter (where subscription_status = 'active'), 0) as active_mrr_cents,
  coalesce(sum(monthly_value_cents) filter (where subscription_status = 'cancelled'), 0) as churned_mrr_cents,
  count(*) filter (where subscription_status = 'refunded') as refunds,
  count(*) filter (where subscription_status = 'payment_failed') as payment_failures
from public.sales_opportunities where is_test = false;
revoke all on public.retained_revenue_metrics from public, anon, authenticated;
grant select on public.retained_revenue_metrics to service_role;
