import { ANALYTICS_EVENT_SET, type AnalyticsEventName } from "@/lib/analytics-events";
import { getFirstTouchAttribution, getSessionId } from "@/lib/attribution";

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

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = ANALYTICS_EVENT_SET.has(name) ? name : null;
  if (!normalizedName) {
    console.warn("[tracking:event] ignored unsupported event", name);
    return;
  }

  const properties = safeProperties(payload);
  if (normalizedName === "page_view") Object.assign(properties, getFirstTouchAttribution());
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

  const persist = () => {
    void import("@/lib/supabase/client").then(({ createAnonClientForLeadIntake }) => {
      const supabase = createAnonClientForLeadIntake();
      if (!supabase) return;
      void supabase
        .from("site_events")
        .insert({
          event_name: normalizedName,
          path: window.location.pathname.slice(0, 300) || "/",
          session_id: getSessionId(),
          properties,
        })
        .then(({ error }) => {
          if (error) console.warn("[tracking:event] persistence failed", error.message);
        });
    });
  };

  if (normalizedName === "page_view") {
    window.setTimeout(persist, 1200);
  } else {
    persist();
  }
}
