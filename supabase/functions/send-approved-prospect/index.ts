import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_ORIGIN =
  Deno.env.get("SITE_ORIGIN")?.replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin =
    origin === SITE_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin)
      ? origin
      : SITE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function zonedDateToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const atGuess = zonedParts(guess, timeZone);
  const representedAsUtc = Date.UTC(
    Number(atGuess.year),
    Number(atGuess.month) - 1,
    Number(atGuess.day),
    Number(atGuess.hour),
    Number(atGuess.minute),
  );
  return new Date(guess.getTime() - (representedAsUtc - guess.getTime()));
}

function nextRestaurantOwnerSendTime(now = new Date()) {
  const timeZone = "America/New_York";
  const local = zonedParts(now, timeZone);
  const localDate = new Date(
    Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day)),
  );
  for (let offset = 0; offset < 10; offset += 1) {
    const date = new Date(localDate);
    date.setUTCDate(date.getUTCDate() + offset);
    const weekday = date.getUTCDay();
    if (![2, 3, 4].includes(weekday)) continue;
    const candidate = zonedDateToUtc(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      9,
      45,
      timeZone,
    );
    if (candidate.getTime() > now.getTime() + 30 * 60 * 1000) return candidate;
  }
  throw new Error("Unable to calculate the next outreach window.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  const postalAddress = Deno.env.get("OUTREACH_POSTAL_ADDRESS");
  const replyTo = Deno.env.get("OUTREACH_REPLY_TO") || "audit@guestsignalhospitality.com";
  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !resendKey ||
    !resendFrom ||
    !postalAddress
  ) {
    return json(req, { error: "function_not_configured" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json(req, { error: "unauthorized" }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError || !user) return json(req, { error: "unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.is_super_admin !== true) {
    return json(req, { error: "forbidden" }, 403);
  }

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return json(req, { error: "invalid_json" }, 400);
  }
  const prospectId = requestBody.prospectId;
  if (!validUuid(prospectId)) return json(req, { error: "invalid_prospect_id" }, 400);

  const { data: prospect, error: claimError } = await admin
    .from("prospect_queue")
    .update({ send_status: "sending", send_error: null })
    .eq("id", prospectId)
    .eq("status", "approved")
    .in("send_status", ["pending", "failed"])
    .select("id,business_name,contact_email,draft_subject,draft_body")
    .maybeSingle();
  if (claimError) return json(req, { error: "claim_failed" }, 500);

  if (!prospect) {
    const { data: existing } = await admin
      .from("prospect_queue")
      .select("status,send_status")
      .eq("id", prospectId)
      .maybeSingle();
    if (existing?.send_status === "sent" || existing?.status === "contacted") {
      return json(req, { ok: true, already_sent: true });
    }
    return json(req, { error: "not_approved_or_not_ready" }, 409);
  }

  const contactEmail = String(prospect.contact_email ?? "").trim().toLowerCase();
  const subject = String(prospect.draft_subject ?? "").trim();
  const draftBody = String(prospect.draft_body ?? "").trim();
  if (!contactEmail || !subject || !draftBody) {
    await admin
      .from("prospect_queue")
      .update({ send_status: "failed", send_error: "Missing recipient, subject, or body." })
      .eq("id", prospectId);
    return json(req, { error: "incomplete_draft" }, 400);
  }

  const complianceFooter =
    `\n\nGuest Signal Hospitality · ${postalAddress}\n` +
    `If you would rather not receive another message, reply “no thanks.”`;
  const snapshotUrl = `${SITE_ORIGIN}/snapshot/`;
  const text = `${draftBody}\n\nSee how the snapshot works: ${snapshotUrl}${complianceFooter}`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">${escapeHtml(
    draftBody,
  ).replaceAll("\n", "<br>")}<p style="margin:24px 0"><a href="${snapshotUrl}" style="color:#92400e;font-weight:600">See how the free snapshot works</a></p><hr style="margin:24px 0;border:0;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#6b7280">${escapeHtml(
    `Guest Signal Hospitality · ${postalAddress}`,
  )}<br>If you would rather not receive another message, reply “no thanks.”</p></div>`;

  try {
    const scheduledFor = nextRestaurantOwnerSendTime();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `prospect-outreach-${prospectId}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [contactEmail],
        reply_to: replyTo,
        subject,
        text,
        html,
        scheduled_at: scheduledFor.toISOString(),
      }),
    });
    const responseBody = await response.text();
    if (!response.ok) throw new Error(`Resend ${response.status}: ${responseBody.slice(0, 500)}`);

    let messageId: string | null = null;
    try {
      const parsed = JSON.parse(responseBody);
      messageId = typeof parsed?.id === "string" ? parsed.id : null;
    } catch {
      // A successful response without JSON is still a successful delivery request.
    }

    const { error: finishError } = await admin
      .from("prospect_queue")
      .update({
        send_status: "scheduled",
        scheduled_for: scheduledFor.toISOString(),
        send_error: null,
        sent_message_id: messageId,
      })
      .eq("id", prospectId);
    if (finishError) throw finishError;
    return json(req, {
      ok: true,
      message_id: messageId,
      scheduled_for: scheduledFor.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("prospect_queue")
      .update({ send_status: "failed", send_error: message.slice(0, 1000) })
      .eq("id", prospectId);
    return json(req, { error: "send_failed", detail: message.slice(0, 300) }, 502);
  }
});
