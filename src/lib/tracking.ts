import { createAnonClientForLeadIntake } from "@/lib/supabase/client";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "cta_click",
  "form_start",
  "snapshot_intake_success",
  "snapshot_intake_fail",
  "contact_submit_success",
  "contact_submit_fail",
  "portal_upgrade_click",
  "newsletter_submit_success",
  "newsletter_submit_fail",
]);

const SESSION_KEY = "guest_signal_session_id";

function sessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

function safeProperties(payload: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [rawKey, value] of Object.entries(payload).slice(0, 20)) {
    const key = rawKey.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50);
    if (!key) continue;
    if (typeof value === "string") safe[key] = value.slice(0, 200);
    else if (typeof value === "number" && Number.isFinite(value)) safe[key] = value;
    else if (typeof value === "boolean" || value === null) safe[key] = value;
  }
  return safe;
}

export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = ALLOWED_EVENTS.has(name) ? name : null;
  if (!normalizedName) {
    console.warn("[tracking:event] ignored unsupported event", name);
    return;
  }

  const properties = safeProperties(payload);
  const eventPayload = {
    event: normalizedName,
    source: "guest_signal_site",
    ...properties,
  };

  const win = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(eventPayload);
  } else {
    console.info("[tracking:event]", eventPayload);
  }

  const supabase = createAnonClientForLeadIntake();
  if (!supabase) return;

  void supabase
    .from("site_events")
    .insert({
      event_name: normalizedName,
      path: window.location.pathname.slice(0, 300) || "/",
      session_id: sessionId(),
      properties,
    })
    .then(({ error }) => {
      if (error) console.warn("[tracking:event] persistence failed", error.message);
    });
}
