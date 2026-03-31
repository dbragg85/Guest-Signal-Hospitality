export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const eventPayload = {
    event: name,
    source: "guest_signal_site",
    ...payload,
  };

  const win = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(eventPayload);
    return;
  }

  console.info("[tracking:event]", eventPayload);
}
