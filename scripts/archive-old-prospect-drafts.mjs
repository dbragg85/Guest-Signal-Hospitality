#!/usr/bin/env node
/**
 * Dismiss old template-based prospect drafts to make room for fresh AI-generated ones.
 * Sets status to 'dismissed' for drafts that haven't been approved or sent.
 */
import { serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const supabase = serviceClient();

const { data: drafts, error } = await supabase
  .from("prospect_queue")
  .select("id,business_name,city,state,status,public_signals")
  .in("status", ["approval_required", "researched"])
  .order("created_at", { ascending: true });

if (error) {
  console.error("Failed to fetch drafts:", error.message);
  process.exit(1);
}

const oldDrafts = (drafts ?? []).filter((d) => {
  const signals = d.public_signals && typeof d.public_signals === "object" ? d.public_signals : {};
  return !signals.ai_model;
});

console.log(`Found ${oldDrafts.length} old template-based draft(s) to dismiss.`);

if (dryRun) {
  console.log("Dry run — no changes made.");
  console.log(JSON.stringify(oldDrafts.map((d) => ({
    business_name: d.business_name,
    city: d.city,
    state: d.state,
    status: d.status,
  })), null, 2));
  process.exit(0);
}

if (oldDrafts.length === 0) {
  console.log("No old drafts to dismiss.");
  process.exit(0);
}

const ids = oldDrafts.map((d) => d.id);
const { error: updateError } = await supabase
  .from("prospect_queue")
  .update({ status: "dismissed" })
  .in("id", ids);

if (updateError) {
  console.error("Failed to dismiss drafts:", updateError.message);
  process.exit(1);
}

console.log(`Dismissed ${oldDrafts.length} old draft(s). They won't appear in the approval queue.`);
