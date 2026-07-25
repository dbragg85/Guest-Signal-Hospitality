-- Supabase may add explicit API-role EXECUTE grants when functions are created.
-- Trigger functions must not be callable over RPC; metrics are service-role only.

revoke all on function public.create_sales_opportunity_from_intake()
  from public, anon, authenticated, service_role;

revoke all on function public.growth_operator_metrics(integer)
  from public, anon, authenticated;
grant execute on function public.growth_operator_metrics(integer)
  to service_role;
