export const ANALYTICS_EVENTS = [
  "page_view", "cta_click", "form_start", "form_validation_fail",
  "snapshot_intake_success", "snapshot_intake_fail", "contact_submit_success",
  "contact_submit_fail", "lead_intake_duplicate_blocked",
  "lead_intake_supabase_insert_fail", "lead_intake_id_lookup_fail",
  "lead_intake_supabase_insert_ok", "lead_intake_formsubmit_failed",
  "snapshot_intake_duplicate_blocked", "snapshot_intake_formsubmit_failed",
  "portal_upgrade_click", "newsletter_submit_success", "newsletter_submit_fail",
  "checkout_start", "checkout_created", "checkout_fail", "checkout_returned", "checkout_cancelled",
  "snapshot_delivered", "permission_requested", "permission_granted",
  "permission_denied", "follow_up_sent", "sales_action_clicked", "sales_action_booked",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export const ANALYTICS_EVENT_SET = new Set<string>(ANALYTICS_EVENTS);
