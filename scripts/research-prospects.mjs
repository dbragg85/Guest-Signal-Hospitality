#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import {
  fetchApifyDatasetItems,
  startApifyRun,
  waitForApifyRun,
} from "./lib/apify-yelp-actor.mjs";
import {
  discoverBusinessEmail,
  emailsFromPlaceItem,
} from "./lib/discover-business-email.mjs";
import {
  finishAutomationRun,
  recordAutomationRun,
  requiredEnv,
  serviceClient,
} from "./lib/growth-operator.mjs";
import {
  prospectMarkets,
  resolveProspectMarket,
} from "./lib/prospect-markets.mjs";
import {
  buildProspectOutreachCopy,
  buildProspectOutreachCopyAsync,
} from "./lib/prospect-outreach-copy.mjs";
import { isAIAvailable } from "./lib/ai-outreach-copy.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const notifyOnly = ["1", "true", "yes"].includes(
  (process.env.NOTIFY_ONLY ?? "").toLowerCase(),
);
const enrichOnly = ["1", "true", "yes"].includes(
  (process.env.ENRICH_EMAILS_ONLY ?? "").toLowerCase(),
);
const requireNtfy = ["1", "true", "yes"].includes(
  (process.env.REQUIRE_NTFY ?? (dryRun ? "0" : "1")).toLowerCase(),
);
const maxProspects = Math.max(1, Math.min(Number(process.env.PROSPECT_MAX_RESULTS) || 100, 200));
const perMarketLimit = Math.max(1, Math.min(Number(process.env.PROSPECT_PER_MARKET) || 10, 25));
const minimumFit = Math.max(0, Math.min(Number(process.env.PROSPECT_MIN_FIT_SCORE) || 55, 100));
const selectedMarketSlugs = process.env.PROSPECT_MARKETS?.trim()
  ? process.env.PROSPECT_MARKETS.split(",").map((s) => s.trim().toLowerCase())
  : null;
const allMarkets = !["0", "false", "no"].includes(
  (process.env.PROSPECT_ALL_MARKETS ?? "1").toLowerCase(),
);
const forcedMarket = resolveProspectMarket({
  slug: process.env.PROSPECT_MARKET_SLUG,
  searchQuery: process.env.PROSPECT_SEARCH_QUERY,
});
const siteOrigin =
  process.env.SITE_ORIGIN?.trim().replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

function actorInput(market, maxResults) {
  const template = process.env.APIFY_PROSPECT_INPUT_TEMPLATE_JSON?.trim();
  if (template) {
    return JSON.parse(
      template
        .replaceAll("{{SEARCH_QUERY}}", market.searchPhrase)
        .replaceAll("{{LOCATION_QUERY}}", market.locationQuery)
        .replaceAll("{{MAX_RESULTS}}", String(maxResults)),
    );
  }
  return {
    searchStringsArray: [market.searchPhrase],
    locationQuery: market.locationQuery,
    maxCrawledPlacesPerSearch: maxResults,
    language: "en",
    skipClosedPlaces: true,
    scrapeContacts: true,
    maxImages: 0,
  };
}

function marketsForRun() {
  if (!allMarkets || process.env.PROSPECT_MARKET_SLUG?.trim() || process.env.PROSPECT_SEARCH_QUERY?.trim()) {
    return [forcedMarket];
  }
  
  // Filter to specific markets if PROSPECT_MARKETS is set (e.g., "cincinnati-oh,columbus-oh,nashville-tn")
  if (selectedMarketSlugs?.length) {
    const filtered = prospectMarkets.filter((m) => selectedMarketSlugs.includes(m.slug));
    if (filtered.length) return filtered;
  }
  
  // Rotate starting market daily so all service markets get coverage over time.
  const dayNum = Math.floor(Date.now() / 86_400_000);
  const start = dayNum % prospectMarkets.length;
  return [...prospectMarkets.slice(start), ...prospectMarkets.slice(0, start)];
}

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePlace(item, market) {
  const businessName = text(item.title ?? item.name, 200);
  if (!businessName) return null;
  const city = text(item.city, 100) || market.city;
  const state = text(item.state, 30) || market.stateCode || "OH";
  const rating = number(item.totalScore ?? item.rating);
  const reviewsCount = number(item.reviewsCount ?? item.reviewCount);
  const website = text(item.website, 500) || null;
  const sourceUrl = text(item.url ?? item.googleMapsUrl, 500) || null;
  const category = text(item.categoryName ?? item.category, 100) || null;
  const marketCity = market.city.toLowerCase().replace(/\./g, "");
  const cityNorm = city.toLowerCase().replace(/\./g, "");

  let fitScore = 35;
  if (cityNorm.includes(marketCity) || marketCity.includes(cityNorm)) fitScore += 15;
  if (market.slug === "cincinnati-oh" && cityNorm.includes("cincinnati")) fitScore += 5;
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
    `market:${market.slug}`,
  ].filter(Boolean);
  const rationale = signalParts.length
    ? `Public profile signals: ${signalParts.join(", ")}.`
    : `Public restaurant profile found in the ${market.city} market.`;

  const placeEmails = emailsFromPlaceItem(item);
  const copy = buildProspectOutreachCopy({
    businessName,
    city,
    state,
    rating,
    reviewsCount,
    category,
  });
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
      place_emails: placeEmails,
      market_slug: market.slug,
      outreach_voice: copy.voice,
      rating_band: copy.rating_band,
      volume_band: copy.volume_band,
    },
    _place_emails: placeEmails,
    draft_subject: copy.draft_subject,
    draft_body: copy.draft_body,
  };
}

async function enhanceProspectWithAI(prospect) {
  if (!prospect.website_url || !isAIAvailable()) {
    return prospect;
  }

  try {
    const signals = prospect.public_signals || {};
    const copy = await buildProspectOutreachCopyAsync({
      businessName: prospect.business_name,
      city: prospect.city,
      state: prospect.state,
      rating: signals.rating,
      reviewsCount: signals.reviews_count,
      category: signals.category,
      websiteUrl: prospect.website_url,
      skipAI: false,
    });

    if (copy.ai_used) {
      return {
        ...prospect,
        draft_subject: copy.draft_subject,
        draft_body: copy.draft_body,
        public_signals: {
          ...signals,
          outreach_voice: copy.voice,
          rating_band: copy.rating_band,
          volume_band: copy.volume_band,
          ai_model: copy.ai_model,
          context_scraped: copy.context_scraped,
          context_useful: copy.context_useful,
          business_context: copy.business_context,
        },
      };
    }
  } catch (error) {
    console.warn(`AI enhancement failed for ${prospect.business_name}: ${error.message}`);
  }

  return prospect;
}

async function enhanceProspectsWithAI(prospects, maxConcurrent = 3) {
  if (!isAIAvailable()) {
    console.log("OPENAI_API_KEY not configured; using template-based copy.");
    return prospects;
  }

  console.log(`Enhancing ${prospects.length} prospect(s) with AI-generated copy...`);
  const enhanced = [];
  let aiEnhanced = 0;

  for (let i = 0; i < prospects.length; i += maxConcurrent) {
    const batch = prospects.slice(i, i + maxConcurrent);
    const results = await Promise.all(batch.map(enhanceProspectWithAI));
    for (const result of results) {
      if (result.public_signals?.ai_model) aiEnhanced++;
      enhanced.push(result);
    }
  }

  console.log(`AI enhancement complete: ${aiEnhanced}/${prospects.length} prospects enhanced.`);
  return enhanced;
}

async function researchAcrossMarkets({ token, actorId }) {
  const markets = marketsForRun();
  const collected = [];
  const seen = new Set();
  const marketsTouched = [];

  for (const market of markets) {
    if (collected.length >= maxProspects) break;
    const remaining = maxProspects - collected.length;
    const take = Math.min(perMarketLimit, remaining);
    console.log(
      `Prospect market: ${market.slug} · ${market.searchPhrase} · fetching ${take} prospects`,
    );
    const run = await startApifyRun({
      token,
      actorId,
      input: actorInput(market, take),
      runQuery: { maxItems: take },
    });
    const completed = await waitForApifyRun({ token, runId: run.id });
    if (completed.status !== "SUCCEEDED") {
      console.warn(`Actor ${run.id} for ${market.slug} ended ${completed.status}; continuing.`);
      continue;
    }
    const items = await fetchApifyDatasetItems({
      token,
      datasetId: completed.defaultDatasetId,
    });
    marketsTouched.push(market.slug);
    for (const item of items) {
      if (collected.length >= maxProspects) break;
      const prospect = normalizePlace(item, market);
      if (!prospect) continue;
      const key = `${prospect.business_name}|${prospect.city}|${prospect.state}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(prospect);
    }
  }

  return { prospects: collected, marketsTouched };
}

async function scheduleApprovedProspect(prospectId) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/+$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${supabaseUrl}/functions/v1/send-approved-prospect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prospectId, serviceInvoke: true }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`schedule failed (${response.status}): ${body.slice(0, 400)}`);
  }
}

async function enrichProspectEmails(supabase, researchedProspects = []) {
  const byKey = new Map(
    researchedProspects.map((prospect) => [
      `${prospect.business_name}|${prospect.city}|${prospect.state}`.toLowerCase(),
      prospect,
    ]),
  );

  const { data: targets, error } = await supabase
    .from("prospect_queue")
    .select(
      "id,business_name,city,state,website_url,contact_email,status,send_status,public_signals",
    )
    .in("status", ["approval_required", "approved"])
    .is("contact_email", null)
    .order("fit_score", { ascending: false })
    .limit(40);
  if (error) throw error;

  let discovered = 0;
  let scheduled = 0;
  for (const row of targets ?? []) {
    const key = `${row.business_name}|${row.city}|${row.state}`.toLowerCase();
    const researched = byKey.get(key);
    const placeEmails =
      researched?._place_emails ??
      (Array.isArray(row.public_signals?.place_emails)
        ? row.public_signals.place_emails
        : []);
    const { email, source } = await discoverBusinessEmail({
      websiteUrl: row.website_url,
      placeEmails,
    });
    if (!email) continue;

    const nextSignals = {
      ...(row.public_signals && typeof row.public_signals === "object"
        ? row.public_signals
        : {}),
      contact_email_source: source,
    };
    const { error: updateError } = await supabase
      .from("prospect_queue")
      .update({
        contact_email: email,
        public_signals: nextSignals,
        send_status: row.status === "approved" ? "pending" : row.send_status,
        send_error: null,
      })
      .eq("id", row.id)
      .is("contact_email", null);
    if (updateError) throw updateError;
    discovered += 1;

    if (row.status === "approved") {
      try {
        await scheduleApprovedProspect(row.id);
        scheduled += 1;
      } catch (scheduleError) {
        const message =
          scheduleError instanceof Error
            ? scheduleError.message
            : String(scheduleError);
        await supabase
          .from("prospect_queue")
          .update({
            send_status: "failed",
            send_error: message.slice(0, 1000),
          })
          .eq("id", row.id);
      }
    }
  }

  const { data: retryTargets, error: retryError } = await supabase
    .from("prospect_queue")
    .select("id,business_name")
    .eq("status", "approved")
    .not("contact_email", "is", null)
    .in("send_status", ["failed", "pending", "not_ready"])
    .limit(40);
  if (retryError) throw retryError;

  for (const row of retryTargets ?? []) {
    const { error: pendingError } = await supabase
      .from("prospect_queue")
      .update({ send_status: "pending", send_error: null })
      .eq("id", row.id);
    if (pendingError) throw pendingError;
    try {
      await scheduleApprovedProspect(row.id);
      scheduled += 1;
    } catch (scheduleError) {
      const message =
        scheduleError instanceof Error
          ? scheduleError.message
          : String(scheduleError);
      await supabase
        .from("prospect_queue")
        .update({
          send_status: "failed",
          send_error: message.slice(0, 1000),
        })
        .eq("id", row.id);
    }
  }

  return { discovered, scheduled };
}

function actionToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

async function notifyPendingApprovals(supabase, { force = false } = {}) {
  const topic = process.env.NTFY_TOPIC?.trim();
  const server = process.env.NTFY_SERVER_URL?.trim().replace(/\/+$/, "") || "https://ntfy.sh";
  if (!topic) {
    if (requireNtfy) {
      throw new Error("NTFY_TOPIC is required for prospect approval notifications.");
    }
    console.log("NTFY_TOPIC is not configured; approval notifications skipped.");
    return 0;
  }

  let query = supabase
    .from("prospect_queue")
    .select(
      "id,business_name,fit_score,rationale,draft_subject,draft_body,contact_email",
    )
    .eq("status", "approval_required")
    .order("fit_score", { ascending: false })
    .limit(20);
  if (!force) query = query.is("approval_notified_at", null);
  const { data: pending, error: pendingError } = await query;
  if (pendingError) throw pendingError;

  let sent = 0;
  for (const prospect of pending ?? []) {
    if (force) {
      await supabase
        .from("prospect_approval_actions")
        .delete()
        .eq("prospect_id", prospect.id)
        .is("used_at", null);
    }
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
    const recipient = text(prospect.contact_email, 180);
    const message = [
      `Fit score: ${prospect.fit_score}/100`,
      recipient
        ? `To: ${recipient} · Approve schedules Tue–Thu 9:45 AM ET`
        : "No public email found yet — Approve will ask for one",
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
        title: recipient
          ? `Approve send: ${prospect.business_name}`
          : `Approve outreach: ${prospect.business_name}`,
        message,
        priority: 4,
        tags: ["email", "memo"],
        actions: [
          {
            action: "http",
            label: recipient ? "Approve & schedule" : "Approve",
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
    run_kind: enrichOnly
      ? "prospect_email_enrich"
      : notifyOnly
        ? "prospect_ntfy_notify"
        : "prospect_research",
    status: "started",
  });

  if (enrichOnly) {
    if (dryRun) {
      await finishAutomationRun(supabase, runId, {
        status: "skipped",
        summary: "Dry-run email enrichment skipped writes.",
        metrics: { dry_run: true, enrich_only: true },
      });
      process.exit(0);
    }
    const emailEnrichment = await enrichProspectEmails(supabase);
    const ntfyNotifications = await notifyPendingApprovals(supabase, { force: true });
    await finishAutomationRun(supabase, runId, {
      status: "succeeded",
      summary:
        `Found ${emailEnrichment.discovered} public email(s); ` +
        `scheduled ${emailEnrichment.scheduled} already-approved draft(s); ` +
        `sent ${ntfyNotifications} ntfy approval ping(s).`,
      metrics: {
        emails_discovered: emailEnrichment.discovered,
        approved_scheduled: emailEnrichment.scheduled,
        ntfy_notifications: ntfyNotifications,
        enrich_only: true,
      },
    });
    process.exit(0);
  }

  if (notifyOnly) {
    if (dryRun) {
      const { count, error } = await supabase
        .from("prospect_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "approval_required");
      if (error) throw error;
      await finishAutomationRun(supabase, runId, {
        status: "skipped",
        summary: `Dry-run notify-only: ${count ?? 0} draft(s) would be sent to ntfy.`,
        metrics: { approval_required: count ?? 0, dry_run: true, notify_only: true },
      });
      process.exit(0);
    }

    const ntfyNotifications = await notifyPendingApprovals(supabase, { force: true });
    await finishAutomationRun(supabase, runId, {
      status: ntfyNotifications > 0 ? "approval_required" : "succeeded",
      summary: `Re-sent ${ntfyNotifications} ntfy Approve/Deny notification(s).`,
      metrics: { ntfy_notifications: ntfyNotifications, notify_only: true },
    });
    process.exit(0);
  }

  const token = requiredEnv("APIFY_TOKEN");
  const actorId =
    process.env.APIFY_PROSPECT_ACTOR_ID?.trim() ||
    "compass~crawler-google-places";
  const { prospects: rawProspects, marketsTouched } = await researchAcrossMarkets({ token, actorId });

  const skipAIEnhancement = ["1", "true", "yes"].includes(
    (process.env.SKIP_AI_ENHANCEMENT ?? "").toLowerCase(),
  );
  const prospects = skipAIEnhancement
    ? rawProspects
    : await enhanceProspectsWithAI(rawProspects);

  const rowsForUpsert = prospects.map(({ _place_emails, ...row }) => row);

  if (dryRun) {
    const enrichedPreview = [];
    for (const prospect of prospects.slice(0, 5)) {
      const discovery = await discoverBusinessEmail({
        websiteUrl: prospect.website_url,
        placeEmails: prospect._place_emails ?? [],
      });
      const signals = prospect.public_signals || {};
      enrichedPreview.push({
        business_name: prospect.business_name,
        website_url: prospect.website_url,
        contact_email: discovery.email,
        contact_email_source: discovery.source,
        ai_enhanced: Boolean(signals.ai_model),
        ai_model: signals.ai_model || null,
        context_scraped: signals.context_scraped || false,
        context_useful: signals.context_useful || false,
        business_context: signals.business_context || null,
        draft_subject: prospect.draft_subject,
        draft_body: prospect.draft_body?.slice(0, 300) + (prospect.draft_body?.length > 300 ? "..." : ""),
      });
    }
    const aiStats = {
      ai_available: isAIAvailable(),
      ai_enhanced_count: prospects.filter((p) => p.public_signals?.ai_model).length,
      total_prospects: prospects.length,
    };
    console.log(
      JSON.stringify(
        { markets_touched: marketsTouched, ai_stats: aiStats, prospects: rowsForUpsert, email_preview: enrichedPreview },
        null,
        2,
      ),
    );
  } else if (rowsForUpsert.length) {
    const { error } = await supabase
      .from("prospect_queue")
      .upsert(rowsForUpsert, {
        onConflict: "business_name,city,state",
        // Never reset a human-approved/contacted/dismissed prospect on a later research run.
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const emailEnrichment = dryRun
    ? { discovered: 0, scheduled: 0 }
    : await enrichProspectEmails(supabase, prospects);
  const ntfyNotifications = dryRun ? 0 : await notifyPendingApprovals(supabase);
  const approvalCount = prospects.filter((item) => item.status === "approval_required").length;
  const aiEnhancedCount = prospects.filter((p) => p.public_signals?.ai_model).length;
  const contextScrapedCount = prospects.filter((p) => p.public_signals?.context_scraped).length;
  await finishAutomationRun(supabase, runId, {
    status: approvalCount > 0 ? "approval_required" : "succeeded",
    summary:
      `${prospects.length} public businesses researched across ${marketsTouched.length} market(s); ` +
      `${aiEnhancedCount} AI-personalized draft(s); ` +
      `${emailEnrichment.discovered} public email(s) found; ` +
      `${emailEnrichment.scheduled} approved draft(s) scheduled; ` +
      `${approvalCount} draft(s) require approval via ntfy.`,
    metrics: {
      markets_touched: marketsTouched,
      all_markets: allMarkets,
      researched: prospects.length,
      approval_required: approvalCount,
      emails_discovered: emailEnrichment.discovered,
      approved_scheduled: emailEnrichment.scheduled,
      ntfy_notifications: ntfyNotifications,
      dry_run: dryRun,
      ai_available: isAIAvailable(),
      ai_enhanced: aiEnhancedCount,
      context_scraped: contextScrapedCount,
    },
  });
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object"
        ? [error.message, error.code, error.details, error.hint]
            .filter(Boolean)
            .join(" | ") || JSON.stringify(error)
        : String(error);
  if (runId) {
    await finishAutomationRun(supabase, runId, {
      status: "failed",
      error_message: message.slice(0, 2000),
    }).catch(() => {});
  }
  console.error(message);
  process.exit(1);
}
