#!/usr/bin/env node
/**
 * Remove prospect drafts without contact emails from the queue.
 * Keeps only rows that have a usable contact_email (or place_emails fallback).
 *
 * Options:
 *   DRY_RUN=1 — preview only
 *   DELETE_MODE=dismiss — set status dismissed instead of delete (default: delete)
 */
import { serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const dismissMode = (process.env.DELETE_MODE ?? "").toLowerCase() === "dismiss";
const supabase = serviceClient();

const STATUSES = ["approval_required", "researched", "approved"];

const { data: prospects, error } = await supabase
  .from("prospect_queue")
  .select("id,business_name,city,state,status,contact_email,public_signals")
  .in("status", STATUSES)
  .order("created_at", { ascending: true })
  .limit(2000);

if (error) {
  console.error("Failed to fetch prospects:", error.message);
  process.exit(1);
}

function contactEmail(p) {
  return typeof p.contact_email === "string" ? p.contact_email.trim() : "";
}

function placeEmail(p) {
  const signals = p.public_signals && typeof p.public_signals === "object" ? p.public_signals : {};
  const placeEmails = Array.isArray(signals.place_emails) ? signals.place_emails : [];
  return placeEmails.find((e) => typeof e === "string" && e.includes("@")) || "";
}

// Promote scrape emails into contact_email before deciding what to remove.
let promoted = 0;
for (const p of prospects ?? []) {
  if (contactEmail(p).includes("@")) continue;
  const email = placeEmail(p);
  if (!email) continue;
  const { error: promoteError } = await supabase
    .from("prospect_queue")
    .update({
      contact_email: email,
      public_signals: {
        ...(p.public_signals && typeof p.public_signals === "object" ? p.public_signals : {}),
        contact_email_source: "place_emails",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", p.id);
  if (!promoteError) {
    p.contact_email = email;
    promoted += 1;
  }
}

const noEmailProspects = (prospects ?? []).filter((p) => !contactEmail(p).includes("@"));
const keepCount = (prospects ?? []).length - noEmailProspects.length;

console.log(
  JSON.stringify(
    {
      scanned: (prospects ?? []).length,
      promoted_place_emails: promoted,
      keep_with_email: keepCount,
      remove_without_email: noEmailProspects.length,
      by_status: noEmailProspects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
    },
    null,
    2,
  ),
);

if (dryRun) {
  console.log("Dry run — no changes made.");
  console.log(
    JSON.stringify(
      noEmailProspects.slice(0, 40).map((p) => ({
        business_name: p.business_name,
        city: p.city,
        state: p.state,
        status: p.status,
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

if (noEmailProspects.length === 0) {
  console.log("No prospects without email to clean up.");
  process.exit(0);
}

const ids = noEmailProspects.map((p) => p.id);
// Batch deletes to avoid URL length limits
const chunkSize = 80;
let removed = 0;
for (let i = 0; i < ids.length; i += chunkSize) {
  const chunk = ids.slice(i, i + chunkSize);
  if (dismissMode) {
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .in("id", chunk);
    if (updateError) {
      console.error("Failed to dismiss prospects:", updateError.message);
      process.exit(1);
    }
  } else {
    const { error: deleteError } = await supabase
      .from("prospect_queue")
      .delete()
      .in("id", chunk);
    if (deleteError) {
      console.error("Failed to delete prospects:", deleteError.message);
      process.exit(1);
    }
  }
  removed += chunk.length;
}

console.log(
  dismissMode
    ? `Dismissed ${removed} prospect(s) without email.`
    : `Deleted ${removed} prospect(s) without email from the queue.`,
);
