#!/usr/bin/env node
/**
 * Rewrite unsent prospect drafts with AI-personalized VP-marketing copy.
 * Scrapes website metadata to reference business history and philosophy.
 */
import {
  buildProspectOutreachCopy,
  buildProspectOutreachCopyAsync,
} from "./lib/prospect-outreach-copy.mjs";
import { isAIAvailable } from "./lib/ai-outreach-copy.mjs";
import { serviceClient } from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const skipAI = ["1", "true", "yes"].includes((process.env.SKIP_AI ?? "").toLowerCase());
const maxConcurrent = Math.max(1, Math.min(Number(process.env.AI_CONCURRENCY) || 3, 10));
const supabase = serviceClient();

const { data: rows, error } = await supabase
  .from("prospect_queue")
  .select(
    "id,business_name,city,state,website_url,status,send_status,draft_subject,draft_body,public_signals",
  )
  .in("status", ["approval_required", "approved", "researched"])
  .in("send_status", ["not_ready", "pending", "failed", "scheduled"])
  .order("fit_score", { ascending: false });
if (error) throw error;

const useAI = !skipAI && isAIAvailable();
console.log(`Rewriting ${rows?.length ?? 0} prospect draft(s)...`);
console.log(`AI enhancement: ${useAI ? "enabled" : "disabled (set OPENAI_API_KEY to enable)"}`);

let updated = 0;
let aiEnhanced = 0;
const samples = [];

async function rewriteProspect(row) {
  const signals = row.public_signals && typeof row.public_signals === "object" ? row.public_signals : {};

  let copy;
  if (useAI && row.website_url) {
    copy = await buildProspectOutreachCopyAsync({
      businessName: row.business_name,
      city: row.city,
      state: row.state,
      rating: signals.rating,
      reviewsCount: signals.reviews_count,
      category: signals.category,
      websiteUrl: row.website_url,
      skipAI: false,
    });
  } else {
    copy = buildProspectOutreachCopy({
      businessName: row.business_name,
      city: row.city,
      state: row.state,
      rating: signals.rating,
      reviewsCount: signals.reviews_count,
      category: signals.category,
    });
  }

  const nextSignals = {
    ...signals,
    outreach_voice: copy.voice,
    rating_band: copy.rating_band,
    volume_band: copy.volume_band,
    ...(copy.ai_used
      ? {
          ai_model: copy.ai_model,
          context_scraped: copy.context_scraped,
          context_useful: copy.context_useful,
          business_context: copy.business_context,
        }
      : {}),
  };

  return {
    row,
    copy,
    nextSignals,
    isAIEnhanced: Boolean(copy.ai_used),
  };
}

const allRows = rows ?? [];
for (let i = 0; i < allRows.length; i += maxConcurrent) {
  const batch = allRows.slice(i, i + maxConcurrent);
  const results = await Promise.all(batch.map(rewriteProspect));

  for (const { row, copy, nextSignals, isAIEnhanced } of results) {
    if (isAIEnhanced) aiEnhanced++;

    if (samples.length < 5) {
      samples.push({
        business_name: row.business_name,
        website_url: row.website_url,
        ai_enhanced: isAIEnhanced,
        ai_model: copy.ai_model || null,
        context_useful: copy.context_useful || false,
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
    updated++;
  }
}

console.log(
  JSON.stringify(
    {
      dry_run: dryRun,
      ai_available: isAIAvailable(),
      ai_used: useAI,
      candidates: allRows.length,
      updated,
      ai_enhanced: aiEnhanced,
      samples,
    },
    null,
    2,
  ),
);
