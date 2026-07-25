#!/usr/bin/env node
/**
 * Cancel Resend-scheduled outreach and send immediately (or invoke edge sendNow).
 */
import { requiredEnv, serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const supabase = serviceClient();
const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const resendKey = process.env.RESEND_API_KEY?.trim() || "";

const { data: rows, error } = await supabase
  .from("prospect_queue")
  .select(
    "id,business_name,contact_email,send_status,sent_message_id,scheduled_for,draft_subject",
  )
  .eq("status", "approved")
  .in("send_status", ["scheduled", "pending", "failed"])
  .not("contact_email", "is", null)
  .order("scheduled_for", { ascending: true });
if (error) throw error;

const targets = rows ?? [];
console.log(`Found ${targets.length} approved prospect(s) ready to flush.`);

let sent = 0;
let failed = 0;
for (const row of targets) {
  console.log(`→ ${row.business_name} (${row.send_status}) ${row.contact_email}`);
  if (dryRun) continue;

  if (row.sent_message_id && resendKey && row.send_status === "scheduled") {
    const cancel = await fetch(
      `https://api.resend.com/emails/${row.sent_message_id}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}` },
      },
    );
    const cancelBody = await cancel.text();
    if (!cancel.ok && ![404, 409, 422].includes(cancel.status)) {
      console.warn(`  cancel failed (${cancel.status}): ${cancelBody.slice(0, 200)}`);
    } else {
      console.log(`  cancelled Resend message ${row.sent_message_id} (${cancel.status})`);
    }
  }

  const { error: resetError } = await supabase
    .from("prospect_queue")
    .update({
      send_status: "pending",
      send_error: null,
      scheduled_for: null,
      sent_message_id: null,
    })
    .eq("id", row.id);
  if (resetError) {
    console.error(`  reset failed: ${resetError.message}`);
    failed += 1;
    continue;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/send-approved-prospect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prospectId: row.id, serviceInvoke: true, sendNow: true }),
  });
  const body = await response.text();
  if (!response.ok) {
    console.error(`  send failed (${response.status}): ${body.slice(0, 300)}`);
    failed += 1;
    continue;
  }
  console.log(`  sent: ${body.slice(0, 200)}`);
  sent += 1;
}

console.log(JSON.stringify({ dry_run: dryRun, sent, failed, total: targets.length }, null, 2));
if (failed) process.exit(1);
