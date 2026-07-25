#!/usr/bin/env node
/**
 * Remove prospects without contact emails from the queue.
 * These prospects cannot be contacted and clutter the approval queue.
 * 
 * Options:
 *   DRY_RUN=1 - Preview what would be deleted without making changes
 *   DELETE_MODE=dismiss - Set status to 'dismissed' instead of deleting (default: delete)
 */
import { serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const dismissMode = (process.env.DELETE_MODE ?? "").toLowerCase() === "dismiss";
const supabase = serviceClient();

const { data: prospects, error } = await supabase
  .from("prospect_queue")
  .select("id,business_name,city,state,status,contact_email,public_signals")
  .in("status", ["approval_required", "researched"])
  .is("contact_email", null)
  .order("created_at", { ascending: true });

if (error) {
  console.error("Failed to fetch prospects:", error.message);
  process.exit(1);
}

const noEmailProspects = (prospects ?? []).filter((p) => {
  const signals = p.public_signals && typeof p.public_signals === "object" ? p.public_signals : {};
  const placeEmails = Array.isArray(signals.place_emails) ? signals.place_emails : [];
  return !p.contact_email && placeEmails.length === 0;
});

console.log(`Found ${noEmailProspects.length} prospect(s) without any discoverable email.`);

if (dryRun) {
  console.log("Dry run — no changes made.");
  console.log(JSON.stringify(noEmailProspects.map((p) => ({
    business_name: p.business_name,
    city: p.city,
    state: p.state,
    status: p.status,
  })), null, 2));
  process.exit(0);
}

if (noEmailProspects.length === 0) {
  console.log("No prospects without email to clean up.");
  process.exit(0);
}

const ids = noEmailProspects.map((p) => p.id);

if (dismissMode) {
  const { error: updateError } = await supabase
    .from("prospect_queue")
    .update({ status: "dismissed" })
    .in("id", ids);

  if (updateError) {
    console.error("Failed to dismiss prospects:", updateError.message);
    process.exit(1);
  }
  console.log(`Dismissed ${noEmailProspects.length} prospect(s) without email.`);
} else {
  const { error: deleteError } = await supabase
    .from("prospect_queue")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("Failed to delete prospects:", deleteError.message);
    process.exit(1);
  }
  console.log(`Deleted ${noEmailProspects.length} prospect(s) without email from the queue.`);
}
