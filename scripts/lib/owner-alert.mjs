/**
 * Owner alerts for lead intake / free scorecard pipeline (ntfy + Resend email).
 */

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

/**
 * @param {{
 *   title: string,
 *   message: string,
 *   tags?: string[],
 *   priority?: number,
 * }} opts
 */
export async function notifyOwnerNtfy(opts) {
  const topic = env("NTFY_TOPIC", "Guest_Signal");
  if (!topic) return { ok: false, skipped: true, reason: "no_topic" };
  const server = env("NTFY_SERVER_URL", "https://ntfy.sh").replace(/\/+$/, "");
  /** @type {Record<string, string>} */
  const headers = {
    Title: opts.title.slice(0, 120),
    Priority: String(opts.priority ?? 4),
    Tags: (opts.tags || ["rotating_light", "scorecard"]).join(","),
    "Content-Type": "text/plain",
  };
  const token = env("NTFY_ACCESS_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${server}/${topic}`, {
      method: "POST",
      headers,
      body: opts.message.slice(0, 3500),
    });
    if (!res.ok) {
      console.warn(`Owner ntfy failed (${res.status}):`, await res.text());
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.warn("Owner ntfy error:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * @param {{ subject: string, text: string, html?: string }} opts
 */
export async function notifyOwnerEmail(opts) {
  const apiKey = env("RESEND_API_KEY");
  const toRaw = env("OWNER_REPORT_EMAIL_TO", env("LEAD_INTAKE_OWNER_EMAIL", "audit@guestsignalhospitality.com"));
  if (!apiKey || !toRaw) {
    console.warn("Owner email skipped (RESEND_API_KEY or OWNER_REPORT_EMAIL_TO missing)");
    return { ok: false, skipped: true };
  }
  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const from =
    env("OWNER_REPORT_EMAIL_FROM") ||
    env("RESEND_FROM") ||
    "Guest Signal <audit@guestsignalhospitality.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject.slice(0, 200),
        text: opts.text,
        html: opts.html || undefined,
      }),
    });
    if (!res.ok) {
      console.warn(`Owner email failed (${res.status}):`, await res.text());
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.warn("Owner email error:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Dual-channel owner alert (ntfy + email). Never throws.
 * @param {{
 *   title: string,
 *   message: string,
 *   emailSubject?: string,
 *   tags?: string[],
 *   priority?: number,
 * }} opts
 */
export async function alertOwner(opts) {
  const [ntfy, email] = await Promise.all([
    notifyOwnerNtfy(opts),
    notifyOwnerEmail({
      subject: opts.emailSubject || opts.title,
      text: opts.message,
    }),
  ]);
  return { ntfy, email };
}
