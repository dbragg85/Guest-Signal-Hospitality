import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function notifyNtfy(message: string, title: string) {
  const topic = Deno.env.get("NTFY_TOPIC")?.trim();
  if (!topic) return;
  const server =
    Deno.env.get("NTFY_SERVER_URL")?.trim().replace(/\/+$/, "") || "https://ntfy.sh";
  const headers: Record<string, string> = {
    Title: title,
    Priority: "default",
    Tags: "email,white_check_mark",
  };
  const accessToken = Deno.env.get("NTFY_ACCESS_TOKEN")?.trim();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  await fetch(`${server}/${topic}`, {
    method: "POST",
    headers,
    body: message,
  }).catch(() => {});
}

const MAX_REQUEST_SIZE = 8192; // 8KB - smaller for action endpoints

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    return json({ error: "payload_too_large" }, 413);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "function_not_configured" }, 500);
  }

  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
    return json({ error: "invalid_token" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const { data: actionRow, error: actionError } = await admin
    .from("prospect_approval_actions")
    .select("id,prospect_id,action")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();
  if (actionError) return json({ error: "lookup_failed" }, 500);
  if (!actionRow) return json({ error: "expired_or_used" }, 410);

  const update =
    actionRow.action === "approve"
      ? {
          status: "approved",
          approved_at: now,
          send_status: "pending",
          send_error: null,
        }
      : { status: "dismissed", send_status: "not_ready", send_error: null };
  const { data: prospect, error: decisionError } = await admin
    .from("prospect_queue")
    .update(update)
    .eq("id", actionRow.prospect_id)
    .eq("status", "approval_required")
    .select("id,business_name,status,contact_email,send_status")
    .maybeSingle();
  if (decisionError) return json({ error: "decision_failed" }, 500);

  await admin
    .from("prospect_approval_actions")
    .update({ used_at: now })
    .eq("prospect_id", actionRow.prospect_id)
    .is("used_at", null);

  if (!prospect) {
    return json({ error: "already_decided" }, 409);
  }

  if (actionRow.action === "deny") {
    await notifyNtfy(
      `Denied outreach for ${prospect.business_name}.`,
      "Prospect denied",
    );
    return json({
      ok: true,
      decision: "deny",
      business_name: prospect.business_name,
    });
  }

  const contactEmail = String(prospect.contact_email ?? "").trim().toLowerCase();
  if (!contactEmail) {
    await admin
      .from("prospect_queue")
      .update({
        send_status: "not_ready",
        send_error: "Approved via ntfy. Add contact_email in the portal to schedule send.",
      })
      .eq("id", prospect.id);
    await notifyNtfy(
      `${prospect.business_name} approved. Add the public business email in the portal to schedule delivery.`,
      "Approved — email needed",
    );
    return json({
      ok: true,
      decision: "approve",
      needs_contact_email: true,
      business_name: prospect.business_name,
      portal: "https://guestsignalhospitality.com/portal/dashboard/",
    });
  }

  // Schedule send through the existing authenticated sender path using service invocation.
  const sendUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/send-approved-prospect`;
  try {
    const sendResponse = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prospectId: prospect.id,
        serviceInvoke: true,
      }),
    });
    const sendBody = await sendResponse.text();
    if (!sendResponse.ok) {
      await admin
        .from("prospect_queue")
        .update({
          send_status: "failed",
          send_error: `Post-approve schedule failed: ${sendBody.slice(0, 500)}`,
        })
        .eq("id", prospect.id);
      await notifyNtfy(
        `${prospect.business_name} approved, but scheduling failed. Check the portal.`,
        "Approved — schedule failed",
      );
      return json({
        ok: true,
        decision: "approve",
        scheduled: false,
        business_name: prospect.business_name,
      });
    }
    await notifyNtfy(
      `${prospect.business_name} approved and scheduled for the next Tue–Thu 9:45 AM ET window.`,
      "Approved & scheduled",
    );
    return json({
      ok: true,
      decision: "approve",
      scheduled: true,
      business_name: prospect.business_name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("prospect_queue")
      .update({
        send_status: "failed",
        send_error: `Post-approve schedule failed: ${message.slice(0, 500)}`,
      })
      .eq("id", prospect.id);
    return json({
      ok: true,
      decision: "approve",
      scheduled: false,
      business_name: prospect.business_name,
    });
  }
});
