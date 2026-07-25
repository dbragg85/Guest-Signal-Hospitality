#!/usr/bin/env node
/**
 * Rewrite unsent prospect drafts with personalized VP-marketing copy.
 */
import { buildProspectOutreachCopy } from "./lib/prospect-outreach-copy.mjs";
import { serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const supabase = serviceClient();

const { data: rows, error } = await supabase
  .from("prospect_queue")
  .select(
    "id,business_name,city,state,status,send_status,draft_subject,draft_body,public_signals",
  )
  .in("status", ["approval_required", "approved", "researched"])
  .in("send_status", ["not_ready", "pending", "failed", "scheduled"])
  .order("fit_score", { ascending: false });
if (error) throw error;

let updated = 0;
const samples = [];
for (const row of rows ?? []) {
  const signals = row.public_signals && typeof row.public_signals === "object" ? row.public_signals : {};
  const copy = buildProspectOutreachCopy({
    businessName: row.business_name,
    city: row.city,
    state: row.state,
    rating: signals.rating,
    reviewsCount: signals.reviews_count,
    category: signals.category,
  });
  const nextSignals = {
    ...signals,
    outreach_voice: copy.voice,
    rating_band: copy.rating_band,
    volume_band: copy.volume_band,
  };

  if (samples.length < 3) {
    samples.push({
      business_name: row.business_name,
      subject: copy.draft_subject,
      body: copy.draft_body,
    });
  }

  if (dryRun) continue;

  const { error: updateError } = await supabase
    .from("prospect_queue")
    .update({
      draft_subject: copy.draft_subject,
      draft_body: copy.draft_body,
      public_signals: nextSignals,
    })
    .eq("id", row.id);
  if (updateError) throw updateError;
  updated += 1;
}

console.log(
  JSON.stringify(
    {
      dry_run: dryRun,
      candidates: rows?.length ?? 0,
      updated,
      samples,
    },
    null,
    2,
  ),
);
