#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
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
const siteOrigin =
  process.env.SITE_ORIGIN?.trim().replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

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

function actionToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

async function notifyPendingApprovals(supabase) {
  const topic = process.env.NTFY_TOPIC?.trim();
  const server = process.env.NTFY_SERVER_URL?.trim().replace(/\/+$/, "") || "https://ntfy.sh";
  if (!topic) {
    console.log("NTFY_TOPIC is not configured; approval notifications skipped.");
    return 0;
  }

  const { data: pending, error: pendingError } = await supabase
    .from("prospect_queue")
    .select("id,business_name,fit_score,rationale,draft_subject,draft_body")
    .eq("status", "approval_required")
    .is("approval_notified_at", null)
    .order("fit_score", { ascending: false })
    .limit(20);
  if (pendingError) throw pendingError;

  let sent = 0;
  for (const prospect of pending ?? []) {
    const approve = actionToken();
    const deny = actionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: tokenError } = await supabase.from("prospect_approval_actions").insert([
      {
        prospect_id: prospect.id,
        action: "approve",
        token_hash: approve.tokenHash,
        expires_at: expiresAt,
      },
      {
        prospect_id: prospect.id,
        action: "deny",
        token_hash: deny.tokenHash,
        expires_at: expiresAt,
      },
    ]);
    if (tokenError) throw tokenError;

    const actionBase = `${requiredEnv("SUPABASE_URL").replace(/\/+$/, "")}/functions/v1/prospect-approval-action`;
    const message = [
      `Fit score: ${prospect.fit_score}/100`,
      text(prospect.rationale, 240),
      "",
      text(prospect.draft_subject, 180),
      text(prospect.draft_body, 420),
    ]
      .filter(Boolean)
      .join("\n");
    const headers = { "Content-Type": "application/json" };
    const ntfyToken = process.env.NTFY_ACCESS_TOKEN?.trim();
    if (ntfyToken) headers.Authorization = `Bearer ${ntfyToken}`;
    const response = await fetch(server, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic,
        title: `Approve outreach: ${prospect.business_name}`,
        message,
        priority: 4,
        tags: ["email", "memo"],
        actions: [
          {
            action: "http",
            label: "Approve",
            url: `${actionBase}?token=${encodeURIComponent(approve.token)}`,
            method: "POST",
            clear: true,
          },
          {
            action: "http",
            label: "Deny",
            url: `${actionBase}?token=${encodeURIComponent(deny.token)}`,
            method: "POST",
            clear: true,
          },
          {
            action: "view",
            label: "Review in portal",
            url: `${siteOrigin}/portal/dashboard/`,
            clear: false,
          },
        ],
      }),
    });
    if (!response.ok) {
      await supabase
        .from("prospect_approval_actions")
        .delete()
        .eq("prospect_id", prospect.id)
        .is("used_at", null);
      throw new Error(`ntfy publish failed (${response.status}): ${await response.text()}`);
    }

    const { error: notifiedError } = await supabase
      .from("prospect_queue")
      .update({ approval_notified_at: new Date().toISOString() })
      .eq("id", prospect.id);
    if (notifiedError) throw notifiedError;
    sent += 1;
  }
  return sent;
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

  const ntfyNotifications = dryRun ? 0 : await notifyPendingApprovals(supabase);
  const approvalCount = prospects.filter((item) => item.status === "approval_required").length;
  await finishAutomationRun(supabase, runId, {
    status: approvalCount > 0 ? "approval_required" : "succeeded",
    summary: `${prospects.length} public businesses researched; ${approvalCount} draft(s) require approval.`,
    metrics: {
      researched: prospects.length,
      approval_required: approvalCount,
      ntfy_notifications: ntfyNotifications,
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
