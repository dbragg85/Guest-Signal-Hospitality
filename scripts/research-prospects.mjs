#!/usr/bin/env node
import {
  fetchApifyDatasetItems,
  startApifyRun,
  waitForApifyRun,
} from "./lib/apify-yelp-actor.mjs";
import {
  finishAutomationRun,
  recordAutomationRun,
  requiredEnv,
  serviceClient,
} from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const maxProspects = Math.max(1, Math.min(Number(process.env.PROSPECT_MAX_RESULTS) || 20, 50));
const minimumFit = Math.max(0, Math.min(Number(process.env.PROSPECT_MIN_FIT_SCORE) || 55, 100));
const searchQuery =
  process.env.PROSPECT_SEARCH_QUERY?.trim() ||
  "independent restaurants in Cincinnati Ohio";

function actorInput() {
  const template = process.env.APIFY_PROSPECT_INPUT_TEMPLATE_JSON?.trim();
  if (template) {
    return JSON.parse(
      template
        .replaceAll("{{SEARCH_QUERY}}", searchQuery)
        .replaceAll("{{MAX_RESULTS}}", String(maxProspects)),
    );
  }
  return {
    searchStringsArray: [searchQuery],
    locationQuery: "Cincinnati, Ohio, USA",
    maxCrawledPlacesPerSearch: maxProspects,
    language: "en",
    skipClosedPlaces: true,
  };
}

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePlace(item) {
  const businessName = text(item.title ?? item.name, 200);
  if (!businessName) return null;
  const city = text(item.city, 100) || "Cincinnati";
  const state = text(item.state, 30) || "OH";
  const rating = number(item.totalScore ?? item.rating);
  const reviewsCount = number(item.reviewsCount ?? item.reviewCount);
  const website = text(item.website, 500) || null;
  const sourceUrl = text(item.url ?? item.googleMapsUrl, 500) || null;
  const category = text(item.categoryName ?? item.category, 100) || null;

  let fitScore = 35;
  if (city.toLowerCase().includes("cincinnati")) fitScore += 15;
  if (reviewsCount != null && reviewsCount >= 50) fitScore += 15;
  if (reviewsCount != null && reviewsCount >= 250) fitScore += 10;
  if (rating != null && rating >= 3.4 && rating <= 4.6) fitScore += 15;
  if (website) fitScore += 5;
  if (category?.toLowerCase().includes("restaurant")) fitScore += 5;
  fitScore = Math.min(fitScore, 100);

  const signalParts = [
    rating != null ? `${rating.toFixed(1)} public rating` : null,
    reviewsCount != null ? `${reviewsCount} public reviews` : null,
    category,
  ].filter(Boolean);
  const rationale = signalParts.length
    ? `Public profile signals: ${signalParts.join(", ")}.`
    : "Public restaurant profile found in the Cincinnati market.";

  return {
    business_name: businessName,
    website_url: website,
    source_url: sourceUrl,
    city,
    state,
    fit_score: fitScore,
    status: fitScore >= minimumFit ? "approval_required" : "researched",
    rationale,
    public_signals: {
      rating,
      reviews_count: reviewsCount,
      category,
    },
    draft_subject: `Complimentary Guest Signal snapshot for ${businessName}`,
    draft_body:
      `Hi ${businessName} team,\n\n` +
      `I was reviewing public guest-feedback signals for independent Cincinnati restaurants and found your profile. ` +
      `Guest Signal Hospitality can prepare a complimentary snapshot showing recurring guest themes, reputation risks, and practical next steps.\n\n` +
      `Would you like me to prepare one for your team? There is no obligation or credit card required.\n\n` +
      `— Guest Signal Hospitality`,
  };
}

const supabase = serviceClient();
let runId;

try {
  runId = await recordAutomationRun(supabase, {
    run_kind: "prospect_research",
    status: "started",
  });

  const token = requiredEnv("APIFY_TOKEN");
  const actorId =
    process.env.APIFY_PROSPECT_ACTOR_ID?.trim() ||
    "compass~crawler-google-places";
  const run = await startApifyRun({
    token,
    actorId,
    input: actorInput(),
    runQuery: { maxItems: maxProspects },
  });
  const completed = await waitForApifyRun({ token, runId: run.id });
  if (completed.status !== "SUCCEEDED") {
    throw new Error(`Prospect actor ${run.id} ended with status ${completed.status}`);
  }

  const items = await fetchApifyDatasetItems({
    token,
    datasetId: completed.defaultDatasetId,
  });
  const prospects = items.map(normalizePlace).filter(Boolean).slice(0, maxProspects);

  if (dryRun) {
    console.log(JSON.stringify(prospects, null, 2));
  } else if (prospects.length) {
    const { error } = await supabase
      .from("prospect_queue")
      .upsert(prospects, {
        onConflict: "business_name,city,state",
        // Never reset a human-approved/contacted/dismissed prospect on a later research run.
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const approvalCount = prospects.filter((item) => item.status === "approval_required").length;
  await finishAutomationRun(supabase, runId, {
    status: approvalCount > 0 ? "approval_required" : "succeeded",
    summary: `${prospects.length} public businesses researched; ${approvalCount} draft(s) require approval.`,
    metrics: {
      researched: prospects.length,
      approval_required: approvalCount,
      dry_run: dryRun,
    },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (runId) {
    await finishAutomationRun(supabase, runId, {
      status: "failed",
      error_message: message.slice(0, 2000),
    }).catch(() => {});
  }
  console.error(message);
  process.exit(1);
}
