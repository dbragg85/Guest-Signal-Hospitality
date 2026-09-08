export type FirstTouchAttribution = {
  session_id: string;
  landing_path: string;
  ref_host?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

const SESSION_KEY = "guest_signal_session_id";
const ATTRIBUTION_KEY = "guest_signal_first_touch";

const clean = (value: string | null, max = 80) => {
  const normalized = value?.trim().replace(/[\x00-\x1F\x7F]/g, "");
  return normalized ? normalized.slice(0, max) : undefined;
};

export function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch { /* storage unavailable; keep the journey functional */ }
  const created = crypto.randomUUID();
  try { window.localStorage.setItem(SESSION_KEY, created); } catch { /* non-blocking */ }
  return created;
}

export function getFirstTouchAttribution(): FirstTouchAttribution {
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(ATTRIBUTION_KEY); } catch { /* recapture */ }
  if (stored) {
    try { return JSON.parse(stored) as FirstTouchAttribution; } catch { /* recapture */ }
  }
  const params = new URLSearchParams(window.location.search);
  let refHost: string | undefined;
  try {
    const candidate = document.referrer ? new URL(document.referrer).hostname : "";
    if (candidate && candidate !== window.location.hostname) refHost = clean(candidate, 120);
  } catch { /* malformed referrer */ }
  const value: FirstTouchAttribution = {
    session_id: getSessionId(),
    landing_path: window.location.pathname.slice(0, 300) || "/",
    ref_host: refHost,
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_content: clean(params.get("utm_content")),
  };
  try { window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value)); } catch { /* non-blocking */ }
  return value;
}
