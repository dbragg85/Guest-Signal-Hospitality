#!/usr/bin/env node
/**
 * Lead intake → restaurant + Yelp rubric snapshot + portal scorecard.
 *
 * 1. Picks pending service-tier rows from public.lead_intake_submissions (free snapshot + three paid
 *    plans). Generic "general" contact leads are skipped unless LEAD_INTAKE_FREE_SNAPSHOT_ONLY=1
 *    (legacy: only free_snapshot).
 * 2. Pulls Google Maps reviews via Apify when APIFY_TOKEN + APIFY_GOOGLE_ACTOR_ID are set (see
 *    scripts/lib/apify-google-reviews.mjs). Uses prior completed calendar month in SCORING_TIMEZONE
 *    (default America/New_York) and caps total reviews at LEAD_INTAKE_MAX_REVIEWS (default 50).
 * 3. Optional Yelp: set LEAD_INTAKE_ENABLE_YELP=1 plus APIFY_YELP_ACTOR_ID. Yelp URL: set LEAD_INTAKE_APIFY_YELP_URL
 *    for a fixed test URL, or set YELP_FUSION_API_KEY so the script resolves https://www.yelp.com/biz/... from
 *    business name + city/state/zip on the lead (no customer Yelp field required).
 * 4. On failure / empty in-window reviews: uses 15 synthetic reviews (same rubric) as google-sourced mocks.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
 *   LEAD_INTAKE_ID — process a single row
 *   LEAD_INTAKE_FREE_SNAPSHOT_ONLY=1 — restrict to free_snapshot only (default processes all service plans)
 *   LEAD_INTAKE_APIFY_YELP_URL — optional override Yelp biz URL (otherwise YELP_FUSION_API_KEY resolves from lead)
 *   YELP_FUSION_API_KEY — Yelp Fusion v3 key; business search by lead business + location → Yelp URL for Apify
 *   APIFY_TOKEN, APIFY_YELP_ACTOR_ID — same as monthly pipeline
 *   DRY_RUN=1 — no writes
 *   FORCE_REPROCESS=1 — re-run even if restaurant_id is set
 *   LEAD_INTAKE_INVITE_PORTAL_USERS=1 — invite lead email via Supabase Auth + upsert memberships (viewer)
 *   LEAD_INTAKE_INVITE_REDIRECT_URL — where Supabase sends the user after "Accept invite" (default: SITE/portal/welcome/)
 *   LEAD_INTAKE_PORTAL_BASE_URL — sign-in + magic link base (default: SITE/portal); welcome email links use this
 *   NEXT_PUBLIC_SITE_URL — used for the two defaults above when unset (fallback https://guestsignalhospitality.com)
 *   RESEND_API_KEY + RESEND_FROM — after conversion + portal membership, send the submitter a welcome email
 *     (portal URLs + optional one-click magic link). See https://resend.com — verify sending domain in Resend.
 *   LEAD_INTAKE_WELCOME_EMAIL_DELAY_MS — optional wait (ms) after DB conversion + portal membership before the
 *     welcome email (default 0 locally; GitHub Actions defaults 300000 = 5m). Max 2h.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { pullYelpReviewsViaApify } from "./lib/apify-yelp-actor.mjs";
import { resolveYelpBusinessUrlFromLead } from "./lib/yelp-fusion-resolve-url.mjs";
import { pullGoogleReviewsViaApify } from "./lib/apify-google-reviews.mjs";
import {
  buildFifteenMockApifyItems,
  getEnv,
  lastCompletedMonthWindow,
  lastCompletedMonthWindowInTimeZone,
  monthLabelFromDate,
  normalizeApifyItem,
  parseNumber,
  toIsoDate,
} from "./lib/guest-signal-rubric.mjs";
import {
  SERVICE_INQUIRY_PLANS,
  normalizeInquiryPlan,
  persistRubricSnapshotFromPeriodReviews,
} from "./lib/rubric-scorecard-persist.mjs";
import { purgeRestaurantSnapshotData } from "./lib/purge-restaurant-snapshot-data.mjs";
import {
  extractGooglePlaceProfileFromApifyItems,
  restaurantPatchFromGooglePlaceProfile,
} from "./lib/google-place-profile-from-apify.mjs";

function siteOrigin() {
  return getEnv("NEXT_PUBLIC_SITE_URL", { fallback: "https://guestsignalhospitality.com" }).replace(/\/+$/, "");
}

/** Public portal sign-in root (no trailing slash), e.g. https://example.com/portal */
function portalBaseUrl() {
  const explicit = getEnv("LEAD_INTAKE_PORTAL_BASE_URL", { fallback: "" }).trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  return `${siteOrigin()}/portal`;
}

/** Supabase Auth invite "redirectTo" — must be listed under Supabase → Auth → URL configuration → Redirect URLs */
function inviteAcceptRedirectUrl() {
  const explicit = getEnv("LEAD_INTAKE_INVITE_REDIRECT_URL", { fallback: "" }).trim();
  if (explicit) return explicit;
  return `${siteOrigin()}/portal/welcome/`;
}

function appendGithubJobSummary(markdown) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    fs.appendFileSync(path, `${markdown}\n`, "utf8");
  } catch (e) {
    console.warn("Could not write GITHUB_STEP_SUMMARY:", e?.message || e);
  }
}

/**
 * When the job finds nothing to process, explain why (counts + recent rows).
 * Helps debug wrong Supabase project, general contact submissions, or already-converted leads.
 */
async function logNoMatchingLeadsHelp(supabase, ctx) {
  const { freeSnapshotOnly, singleId, force } = ctx;
  const plans = freeSnapshotOnly ? ["free_snapshot"] : SERVICE_INQUIRY_PLANS;

  if (singleId) {
    const { data: one, error } = await supabase
      .from("lead_intake_submissions")
      .select("id, inquiry_plan, processing_status, restaurant_id, created_at, business")
      .eq("id", singleId)
      .maybeSingle();
    if (error) {
      console.log(`LEAD_INTAKE_ID lookup failed: ${error.message}`);
      appendGithubJobSummary(
        `## Lead intake — no match\n\n**LEAD_INTAKE_ID** lookup failed: \`${error.message}\``,
      );
      return;
    }
    if (!one) {
      console.log(
        `::warning::LEAD_INTAKE_ID=${singleId} not found in lead_intake_submissions (wrong project URL/secret?).`,
      );
      appendGithubJobSummary(
        `## Lead intake — no match\n\n**LEAD_INTAKE_ID** \`${singleId}\` **not found** in \`lead_intake_submissions\`. GitHub **SUPABASE_URL** / service role may point at a different project than the website.`,
      );
      return;
    }
    console.log("LEAD_INTAKE_ID row snapshot:", JSON.stringify(one, null, 2));
    if (!plans.includes(one.inquiry_plan)) {
      console.log(
        `::notice::That row inquiry_plan="${one.inquiry_plan}" — this job only processes: ${plans.join(", ")}. Submit via /snapshot/ (or paid plan at /services/inquiry/?plan=signal_*).`,
      );
    }
    if (one.processing_status !== "pending") {
      console.log(
        `::notice::That row processing_status="${one.processing_status}" — only "pending" rows are picked up. Already converted leads stay out of the queue.`,
      );
    }
    if (one.restaurant_id && !force) {
      console.log(
        "::notice::That row already has restaurant_id. Re-run with repo Variable/Secret FORCE_REPROCESS=1 if you intentionally want another pass.",
      );
    }
    appendGithubJobSummary(
      `## Lead intake — targeted row\n\n\`\`\`json\n${JSON.stringify(one, null, 2)}\n\`\`\`\n\n` +
        `- **inquiry_plan** must be one of: ${plans.map((p) => "`" + p + "`").join(", ")}\n` +
        `- **processing_status** must be \`pending\` to process\n` +
        `- If **restaurant_id** is set, set repo Variable **FORCE_REPROCESS=1** to re-run (unless you only needed to inspect this row).\n\n` +
        `Data lives in **Supabase tables**, not in a SQL file produced by this Action.`,
    );
    return;
  }

  const countExact = async (builder) => {
    const { count, error } = await builder;
    if (error) return { n: null, err: error.message };
    return { n: count ?? 0, err: null };
  };

  const { n: pendingService, err: e1 } = await countExact(
    supabase
      .from("lead_intake_submissions")
      .select("*", { count: "exact", head: true })
      .eq("processing_status", "pending")
      .in("inquiry_plan", plans),
  );
  const { n: pendingServiceLinked, err: e2 } = await countExact(
    supabase
      .from("lead_intake_submissions")
      .select("*", { count: "exact", head: true })
      .eq("processing_status", "pending")
      .in("inquiry_plan", plans)
      .not("restaurant_id", "is", null),
  );
  const { n: pendingGeneral, err: e3 } = await countExact(
    supabase
      .from("lead_intake_submissions")
      .select("*", { count: "exact", head: true })
      .eq("processing_status", "pending")
      .eq("inquiry_plan", "general"),
  );
  const { n: totalRows, err: e4 } = await countExact(
    supabase.from("lead_intake_submissions").select("*", { count: "exact", head: true }),
  );

  if (e1 || e2 || e3 || e4) {
    console.log(
      `Diagnostic counts unavailable: ${[e1, e2, e3, e4].filter(Boolean).join("; ")}`,
    );
  } else {
    console.log(
      `Diagnostics: total_rows=${totalRows} pending_service_plans=${pendingService} pending_service_but_linked=${pendingServiceLinked} pending_general=${pendingGeneral} force=${force}`,
    );
  }

  const { data: recent, error: recentErr } = await supabase
    .from("lead_intake_submissions")
    .select("id, inquiry_plan, processing_status, restaurant_id, created_at, business")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!recentErr && recent?.length) {
    console.log("Most recent submissions (up to 5):");
    for (const r of recent) {
      console.log(
        `  - ${r.id} plan=${r.inquiry_plan} status=${r.processing_status} restaurant_id=${r.restaurant_id ? "set" : "null"} business=${JSON.stringify(r.business)}`,
      );
    }
  }

  let notice =
    "No pending service-tier leads to process. Check diagnostics above. Common fixes: submit from /snapshot/ (not plain /contact); confirm GitHub SUPABASE_URL matches the project where the form posts; if the row is already converted, it will not run again.";
  if (pendingGeneral > 0 && (pendingService === 0 || pendingService == null)) {
    notice =
      `You have ${pendingGeneral} pending row(s) with inquiry_plan=general (plain contact form). This job skips those — use a plan URL so inquiry_plan is free_snapshot or a paid key.`;
  }
  if (pendingService > 0 && pendingServiceLinked === pendingService && !force) {
    notice =
      "Pending service rows all already have restaurant_id (unusual). Try FORCE_REPROCESS=1 or reset processing_status in Studio if you need a re-run.";
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    console.log(`::notice::${notice}`);
  }

  const countLines =
    e1 || e2 || e3 || e4
      ? `Count queries failed: ${[e1, e2, e3, e4].filter(Boolean).join("; ")}`
      : [
          `| Metric | Value |`,
          `| --- | --- |`,
          `| Total rows in lead_intake_submissions | ${totalRows} |`,
          `| Pending + service plan (${plans.join(", ")}) | ${pendingService} |`,
          `| Pending + service + restaurant_id set | ${pendingServiceLinked} |`,
          `| Pending + inquiry_plan=general (skipped) | ${pendingGeneral} |`,
          `| FORCE_REPROCESS | ${force} |`,
        ].join("\n");

  const recentLines =
    !recentErr && recent?.length
      ? [
          ``,
          `### Most recent submissions (newest first)`,
          ``,
          `| id (prefix) | inquiry_plan | processing_status | restaurant_id | business |`,
          `| --- | --- | --- | --- | --- |`,
          ...recent.map((r) => {
            const idShort = String(r.id).slice(0, 8);
            const rid = r.restaurant_id ? "set" : "null";
            const biz = String(r.business ?? "").replace(/\|/g, "\\|").slice(0, 40);
            return `| ${idShort}… | ${r.inquiry_plan} | ${r.processing_status} | ${rid} | ${biz} |`;
          }),
        ].join("\n")
      : "\n_No rows in lead_intake_submissions (empty table or no read access)._";

  appendGithubJobSummary(
    [
      `## Lead intake snapshot — nothing processed`,
      ``,
      `The workflow **succeeded** but **did not create or update snapshot data** because no row matched the queue.`,
      ``,
      `### Where data actually goes`,
      ``,
      `- Intake form → **Supabase** table \`lead_intake_submissions\` (check **Table Editor** in the **same** project as your site’s anon key).`,
      `- This job → same DB: new \`restaurants\` row (if needed), \`review_observations\`, \`snapshots\`, scorecard tables, then marks the lead \`converted\`.`,
      `- **GitHub does not download a .sql file** for you — open **Supabase** to see rows.`,
      ``,
      `### Diagnostics (from service_role query of that project)`,
      ``,
      countLines,
      recentLines,
      ``,
      `### What to fix`,
      ``,
      notice,
    ].join("\n"),
  );
}

function slugifyBase(name) {
  const s = String(name || "venue")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return s || "venue";
}

async function ensureUniqueSlug(supabase, base) {
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    const suffix = Math.random().toString(36).slice(2, 8);
    candidate = `${base}-${suffix}`.slice(0, 80);
  }
  throw new Error("Could not allocate unique restaurant slug");
}

function formatAddress(lead) {
  const parts = [lead.street_address, lead.city, lead.state, lead.zip].filter(
    (p) => p && String(p).trim() && String(p).trim() !== "—"
  );
  return parts.length ? parts.join(", ") : null;
}

function envFlag(name, fallback = "0") {
  return ["1", "true", "yes"].includes((getEnv(name, { fallback }) || "").toLowerCase());
}

const MAX_WELCOME_EMAIL_DELAY_MS = 2 * 60 * 60 * 1000;

function envNonNegativeIntMs(name, fallbackMs) {
  const raw = (getEnv(name, { fallback: String(fallbackMs) }) || "").trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return fallbackMs;
  return Math.min(n, MAX_WELCOME_EMAIL_DELAY_MS);
}

function delayMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invite by email or resolve existing auth user; returns user id or null.
 */
async function ensurePortalUser(supabase, email, displayName) {
  const e = String(email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) return null;

  const redirectTo = inviteAcceptRedirectUrl();

  const { data: invited, error: invErr } = await supabase.auth.admin.inviteUserByEmail(e, {
    data: { full_name: String(displayName || "").trim() || e },
    redirectTo,
  });

  if (!invErr && invited?.user?.id) {
    console.log(`Auth: invite issued for ${e}`);
    return invited.user.id;
  }

  const msg = String(invErr?.message || "");
  const maybeExists =
    /already|registered|exists/i.test(msg) ||
    invErr?.code === "email_exists" ||
    invErr?.status === 422;

  if (maybeExists) {
    const pageSize = 200;
    for (let page = 1; page <= 10; page++) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
        page,
        perPage: pageSize,
      });
      if (listErr) {
        console.warn("Auth: listUsers failed:", listErr.message);
        break;
      }
      const u = list?.users?.find((x) => (x.email || "").toLowerCase() === e);
      if (u?.id) {
        console.log(`Auth: matched existing user for ${e}`);
        return u.id;
      }
      if ((list?.users?.length || 0) < pageSize) break;
    }
    console.warn(`Auth: could not resolve existing user for ${e} (${msg})`);
    return null;
  }

  console.warn(`Auth: inviteUserByEmail failed for ${e}:`, msg);
  return null;
}

async function upsertMembershipViewer(supabase, userId, restaurantId) {
  const { error } = await supabase.from("memberships").upsert(
    {
      user_id: userId,
      restaurant_id: restaurantId,
      role: "viewer",
    },
    { onConflict: "user_id,restaurant_id" },
  );
  if (error) throw error;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * One-time sign-in link for the lead’s email (redirects to dashboard after auth).
 */
async function tryGenerateMagicLink(supabase, email, redirectTo) {
  const e = String(email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) return null;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: e,
    options: { redirectTo: String(redirectTo || "").trim() || undefined },
  });
  if (error) {
    console.warn("Auth: generateLink (magiclink) failed:", error.message);
    return null;
  }
  const link = data?.properties?.action_link;
  return typeof link === "string" && link.startsWith("http") ? link : null;
}

/**
 * Transactional welcome after portal viewer membership exists. Uses Resend when configured.
 * Failures are logged only — lead is already marked converted.
 */
async function sendPortalWelcomeEmailResend({
  toEmail,
  displayName,
  restaurantName,
  restaurantSlug,
  portalBase,
  dashboardUrl,
  magicLink,
}) {
  const apiKey = getEnv("RESEND_API_KEY", { fallback: "" }).trim();
  const from = getEnv("RESEND_FROM", { fallback: "" }).trim();
  if (!apiKey || !from) {
    console.log(
      "Portal welcome email skipped (set RESEND_API_KEY + RESEND_FROM to email the submitter via Resend).",
    );
    return;
  }

  const to = String(toEmail || "").trim().toLowerCase();
  if (!to.includes("@")) return;

  const subject = "Your Guest Signal client portal is ready";
  const greeting = displayName?.trim() ? `Hi ${displayName.trim()},` : "Hi,";
  const welcomeUrl = `${String(portalBase).replace(/\/+$/, "")}/welcome/`;
  const textLines = [
    greeting,
    "",
    "Your snapshot is ready in the Guest Signal client portal.",
    "",
    "WHICH EMAIL TO USE",
    `Always use this exact address for sign-in and magic links: ${to}`,
    "It is the same email you entered on the intake form.",
    "",
    "STEP 1 — SUPABASE INVITE (SET YOUR PASSWORD)",
    "You should have a separate email from Supabase titled like \"You have been invited\".",
    `Open that message and click Accept invitation. You will be taken to our secure page to create your password:`,
    welcomeUrl,
    "Stay on that page until you finish — the address bar may contain a long token; that is normal.",
    "",
    "STEP 2 — SIGN IN ANY TIME AFTER THAT",
    `Portal sign-in: ${portalBase}/`,
    `Your dashboard (${String(restaurantName || "your location").trim()}): ${dashboardUrl}`,
    "",
    "OPTIONAL — ONE-CLICK MAGIC LINK (NO PASSWORD NEEDED ONCE)",
    magicLink
      ? `If you prefer not to use a password right now, you can use this one-time link (expires): ${magicLink}`
      : "On the portal sign-in page you can also choose \"Email me a magic link\" using the same email address.",
    "",
    "If anything fails, reply to this thread or contact your Guest Signal operator.",
    "",
    "— Guest Signal Hospitality",
  ];
  const text = textLines.join("\n");

  const magicBlock = magicLink
    ? `<p><strong>Optional — one-click sign-in</strong> (expires):<br/><a href="${escapeHtml(magicLink)}">Open magic link</a> <span style="color:#64748b">If it stops working, use password or Magic link on the portal.</span></p>`
    : `<p>You can also use <strong>Magic link</strong> on the <a href="${escapeHtml(`${portalBase}/`)}">portal sign-in</a> page with the email above.</p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:36rem">
<p>${escapeHtml(greeting)}</p>
<p>Your snapshot is ready in the <strong>Guest Signal</strong> client portal.</p>
<h2 style="font-size:1rem;margin-top:1.25rem">Which email to use</h2>
<p>Always sign in with: <strong style="word-break:break-all">${escapeHtml(to)}</strong> — the same address you used on the intake form.</p>
<h2 style="font-size:1rem;margin-top:1.25rem">Step 1 — Create your password</h2>
<p>You should have a separate message from <strong>Supabase</strong> (invitation). Open it and click <strong>Accept invitation</strong>. You will land on our page to choose your password:</p>
<p><a href="${escapeHtml(welcomeUrl)}">${escapeHtml(welcomeUrl)}</a></p>
<p style="font-size:0.875rem;color:#64748b">If the address bar shows a long fragment after you click the invite link, leave it in place until you finish.</p>
<h2 style="font-size:1rem;margin-top:1.25rem">Step 2 — Your dashboard</h2>
<p><a href="${escapeHtml(dashboardUrl)}">Open your location dashboard</a> (${escapeHtml(String(restaurantName || "").trim() || restaurantSlug)})</p>
<p>After password setup, you can always return via <a href="${escapeHtml(`${portalBase}/`)}">portal sign-in</a>.</p>
${magicBlock}
<p style="margin-top:1.5rem;font-size:0.875rem;color:#64748b">Questions? Reply to your operator or Guest Signal Hospitality.</p>
<p>— Guest Signal Hospitality</p>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn("Resend portal welcome email failed:", res.status, body);
      return;
    }
    console.log(`Email: portal welcome sent to ${to}`);
  } catch (err) {
    console.warn("Resend portal welcome email error:", err?.message || err);
  }
}

async function loadReviewsForLead(lead, periodStartIso, periodEndIso, options = {}) {
  const requireLiveApify = options.requireLiveApify === true;
  const token = getEnv("APIFY_TOKEN", { fallback: "" }).trim();
  const googleActor = getEnv("APIFY_GOOGLE_ACTOR_ID", { fallback: "" }).trim();
  const yelpActor = getEnv("APIFY_YELP_ACTOR_ID", { fallback: "" }).trim();
  const yelpUrlOverride = getEnv("LEAD_INTAKE_APIFY_YELP_URL", { fallback: "" }).trim();
  const enableYelp = ["1", "true", "yes"].includes(
    (getEnv("LEAD_INTAKE_ENABLE_YELP", { fallback: "0" }) || "").toLowerCase(),
  );
  const maxTotal = Math.min(500, Math.max(1, Number(getEnv("LEAD_INTAKE_MAX_REVIEWS", { fallback: "50" }))));

  const sourceBits = [];
  const combined = [];
  let yelpUrlUsed = null;
  let rawGoogleItems = [];

  if (!token || !googleActor) {
    if (requireLiveApify) {
      throw new Error(
        "LEAD_INTAKE_REQUIRE_APIFY=1 but APIFY_TOKEN and/or APIFY_GOOGLE_ACTOR_ID is missing.",
      );
    }
    console.warn(
      "[lead-intake] Apify Google skipped (no Apify runs): set APIFY_TOKEN and APIFY_GOOGLE_ACTOR_ID on the GitHub Actions workflow env (repo Secrets / Variables). Without both, every intake uses mock reviews for the scoring month unless you re-ingest later.",
    );
  }

  if (token && googleActor) {
    try {
      console.log("Attempting Apify Google pull…");
      const rawGoogle = await pullGoogleReviewsViaApify({
        lead,
        token,
        actorId: googleActor,
        reviewWindow: { startIso: periodStartIso, endIso: periodEndIso },
      });
      rawGoogleItems = rawGoogle;
      const sliced = rawGoogle.slice(0, maxTotal);
      const parsedG = sliced.map((item) => normalizeApifyItem(item, "google")).filter(Boolean);
      combined.push(...parsedG);
      sourceBits.push(`google_raw=${rawGoogle.length}`);
    } catch (e) {
      console.warn("Apify Google pull failed:", e?.message || e);
      sourceBits.push(`google_error=${String(e?.message || e).slice(0, 120)}`);
    }
  } else {
    sourceBits.push("google_skipped_missing_token_or_actor");
  }

  let effectiveYelpUrl = yelpUrlOverride;
  if (enableYelp && token && yelpActor && !effectiveYelpUrl) {
    const resolved = await resolveYelpBusinessUrlFromLead(lead);
    if (resolved) {
      effectiveYelpUrl = resolved;
      sourceBits.push("yelp_url_auto=fusion_search");
      console.log("Yelp: resolved business URL via Fusion API for Apify pull.");
    } else {
      sourceBits.push("yelp_skipped_no_url_set_YELP_FUSION_API_KEY_or_LEAD_INTAKE_APIFY_YELP_URL");
    }
  }

  if (enableYelp && token && yelpActor && effectiveYelpUrl) {
    try {
      console.log("Attempting Apify Yelp pull…");
      const rawYelp = await pullYelpReviewsViaApify({
        yelpUrl: effectiveYelpUrl,
        token,
        actorId: yelpActor,
        periodStartIso,
        periodEndIso,
      });
      yelpUrlUsed = effectiveYelpUrl;
      const room = Math.max(0, maxTotal - combined.length);
      const sliced = rawYelp.slice(0, room || maxTotal);
      const parsedY = sliced.map((item) => normalizeApifyItem(item, "yelp")).filter(Boolean);
      combined.push(...parsedY);
      sourceBits.push(`yelp_raw=${rawYelp.length}`);
    } catch (e) {
      console.warn("Apify Yelp pull failed:", e?.message || e);
      sourceBits.push(`yelp_error=${String(e?.message || e).slice(0, 120)}`);
    }
  }

  let periodReviews = combined.filter((review) => {
    if (!review.review_date) return false;
    return review.review_date >= periodStartIso && review.review_date <= periodEndIso;
  });
  if (combined.length) {
    const outside = combined.filter(
      (r) =>
        r.review_date &&
        (r.review_date < periodStartIso || r.review_date > periodEndIso),
    ).length;
    const noDate = combined.filter((r) => !r.review_date).length;
    console.log(
      `Scoring month [${periodStartIso}…${periodEndIso}]: kept ${periodReviews.length} / ${combined.length} reviews (${outside} before/after month excluded from rubric, ${noDate} unparsed date).`,
    );
  }

  periodReviews.sort((a, b) => String(b.review_date).localeCompare(String(a.review_date)));
  periodReviews = periodReviews.slice(0, maxTotal);

  let sourceNote = `live_${sourceBits.join(";")}`;

  if (combined.length > 0 && periodReviews.length === 0) {
    if (requireLiveApify) {
      throw new Error(
        `LEAD_INTAKE_REQUIRE_APIFY=1 and Apify returned reviews, but none were in scoring window ${periodStartIso}..${periodEndIso}.`,
      );
    }
    console.warn("Apify returned rows but none fall in the scoring window — using mock dataset.");
    sourceNote = "apify_outside_window_mock_15";
  }

  if (!periodReviews.length) {
    if (requireLiveApify) {
      throw new Error(
        "LEAD_INTAKE_REQUIRE_APIFY=1 and no in-window live reviews were available; refusing mock fallback.",
      );
    }
    console.log("Using 15-review mock dataset (same Guest Signal rubric scoring).");
    const mockItems = buildFifteenMockApifyItems(periodStartIso, periodEndIso, "google");
    periodReviews = mockItems.map((item) => normalizeApifyItem(item, "google")).filter(Boolean);
    sourceNote = sourceNote.includes("live_") ? `empty_or_unparsed_mock_15;${sourceNote}` : "mock_15_rubric_fallback";
  }

  const googlePlaceProfile = extractGooglePlaceProfileFromApifyItems(rawGoogleItems);

  return { periodReviews, sourceNote, yelpUrlUsed, googlePlaceProfile };
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());
  const force = ["1", "true", "yes"].includes((getEnv("FORCE_REPROCESS", { fallback: "0" }) || "").toLowerCase());
  const freeSnapshotOnly = ["1", "true", "yes"].includes(
    (getEnv("LEAD_INTAKE_FREE_SNAPSHOT_ONLY", { fallback: "0" }) || "").toLowerCase(),
  );
  const invitePortalUsers = envFlag("LEAD_INTAKE_INVITE_PORTAL_USERS", "0");
  const requirePortalProvisioning = invitePortalUsers && envFlag("LEAD_INTAKE_REQUIRE_PORTAL_PROVISIONING", "1");
  const requireLiveApify = envFlag("LEAD_INTAKE_REQUIRE_APIFY", "1");
  const singleId = getEnv("LEAD_INTAKE_ID", { fallback: "" });
  const welcomeEmailDelayMs = envNonNegativeIntMs("LEAD_INTAKE_WELCOME_EMAIL_DELAY_MS", 0);
  if (welcomeEmailDelayMs > 0) {
    console.log(
      `Welcome email delay: ${welcomeEmailDelayMs}ms (${Math.round(welcomeEmailDelayMs / 60000)} min) after conversion before Resend.`,
    );
  }

  const tz = getEnv("SCORING_TIMEZONE", { fallback: "America/New_York" });
  const { start, end } = lastCompletedMonthWindowInTimeZone(tz);
  const periodStartIso = toIsoDate(start);
  const periodEndIso = toIsoDate(end);
  const periodLabel = getEnv("PERIOD_LABEL", { fallback: monthLabelFromDate(start) });

  console.log(
    `Scoring window = prior completed calendar month (${tz}): ${periodLabel} (${periodStartIso} → ${periodEndIso} as UTC date boundaries from local month).`,
  );
  if (requireLiveApify) {
    console.log("Apify: strict mode enabled — run fails if live Google reviews are unavailable.");
  }
  if (invitePortalUsers) {
    console.log("Portal: LEAD_INTAKE_INVITE_PORTAL_USERS enabled — will invite + upsert memberships after snapshot.");
    if (requirePortalProvisioning) {
      console.log("Portal: strict mode enabled — lead remains failed unless invite + membership both succeed.");
    }
  } else {
    console.warn(
      "Portal invites are disabled (LEAD_INTAKE_INVITE_PORTAL_USERS is false). Snapshot conversion will complete without auth user/profile provisioning.",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const plans = freeSnapshotOnly ? ["free_snapshot"] : SERVICE_INQUIRY_PLANS;

  let query = supabase.from("lead_intake_submissions").select("*").order("created_at", { ascending: true });

  if (singleId) {
    query = query.eq("id", singleId);
    if (!force) {
      query = query.eq("processing_status", "pending");
    }
  } else {
    query = query.eq("processing_status", "pending");
  }

  if (freeSnapshotOnly) {
    query = query.eq("inquiry_plan", "free_snapshot");
  } else {
    query = query.in("inquiry_plan", SERVICE_INQUIRY_PLANS);
  }

  const { data: leads, error: leadsError } = await query;
  if (leadsError) throw leadsError;

  const list = (leads ?? []).filter((row) => {
    if (!plans.includes(row.inquiry_plan)) return false;
    if (singleId && force) return true;
    return force || !row.restaurant_id;
  });
  if (!list.length) {
    console.log("No lead_intake_submissions to process for this query.");
    await logNoMatchingLeadsHelp(supabase, { freeSnapshotOnly, singleId, force });
    return;
  }

  console.log(`Processing ${list.length} lead(s); period ${periodLabel} (${periodStartIso} → ${periodEndIso})`);

  for (const lead of list) {
    console.log(`\n--- Lead ${lead.id} (${lead.business}) ---`);

    if (!dryRun) {
      const { error: stErr } = await supabase
        .from("lead_intake_submissions")
        .update({ processing_status: "processing", pipeline_last_error: null })
        .eq("id", lead.id);
      if (stErr) {
        console.warn("Could not mark lead processing (migration 017 applied?):", stErr.message);
      }
    }

    try {
    if (!dryRun && force && lead.restaurant_id) {
      console.log(`FORCE_REPROCESS: purging prior snapshot/scorecard rows for restaurant ${lead.restaurant_id}…`);
      const purged = await purgeRestaurantSnapshotData(supabase, lead.restaurant_id);
      console.log(JSON.stringify(purged));
    }

    const baseSlug = slugifyBase(lead.business);

    let restaurant;
    if (lead.restaurant_id) {
      if (dryRun) {
        restaurant = {
          id: lead.restaurant_id,
          slug: `${baseSlug}-existing`,
          name: lead.business,
        };
      } else {
        const { data: row, error: fetchErr } = await supabase
          .from("restaurants")
          .select("id, slug, name, website, competitors")
          .eq("id", lead.restaurant_id)
          .single();
        if (fetchErr) throw fetchErr;
        restaurant = row;
      }
    } else {
      const slug = await ensureUniqueSlug(supabase, baseSlug);
      if (dryRun) {
        restaurant = { id: crypto.randomUUID(), slug, name: lead.business };
      } else {
        const website = String(lead.website_url ?? "").trim();
        const { data: ins, error: insErr } = await supabase
          .from("restaurants")
          .insert({
            slug,
            name: lead.business.trim(),
            address: formatAddress(lead),
            website: website && website !== "—" ? website : null,
            // Plan is set via update after snapshot so migration 012 is optional at insert time.
          })
          .select("id, slug, name, website, competitors")
          .single();
        if (insErr) throw insErr;
        restaurant = ins;
      }
    }

    const { periodReviews, sourceNote, yelpUrlUsed, googlePlaceProfile } = await loadReviewsForLead(
      lead,
      periodStartIso,
      periodEndIso,
      { requireLiveApify },
    );

    let leadForDeliverables = lead;
    if (!dryRun && lead.snapshot_summary && typeof lead.snapshot_summary === "string") {
      try {
        leadForDeliverables = { ...lead, snapshot_summary: JSON.parse(lead.snapshot_summary) };
      } catch {
        leadForDeliverables = lead;
      }
    }

    const persisted = await persistRubricSnapshotFromPeriodReviews({
      supabase,
      restaurant,
      periodReviews,
      periodLabel,
      periodStartIso,
      periodEndIso,
      dryRun,
      reviewSourceNote: sourceNote,
      inquiryPlan: lead.inquiry_plan,
      lead: leadForDeliverables,
    });

    if (!dryRun && persisted) {
      const planNorm = normalizeInquiryPlan(lead.inquiry_plan);
      const updates = { intake_inquiry_plan: planNorm };
      if (yelpUrlUsed) {
        updates.yelp_url = yelpUrlUsed;
      }
      const website = String(lead.website_url ?? "").trim();
      if (website && website !== "—") {
        updates.website = website;
      }
      const venuePhone = String(lead.venue_phone ?? "").trim();
      if (venuePhone && venuePhone !== "—") {
        updates.phone = venuePhone;
      }
      const profilePatch = restaurantPatchFromGooglePlaceProfile(googlePlaceProfile);
      Object.assign(updates, profilePatch);
      if (Object.keys(profilePatch).length) {
        console.log(`Restaurant profile from Google/Apify: ${JSON.stringify(profilePatch)}`);
      }
      const { error: planErr } = await supabase.from("restaurants").update(updates).eq("id", restaurant.id);
      if (planErr) {
        console.warn("Could not update restaurants after snapshot (intake_inquiry_plan / yelp_url):", planErr.message);
      }

      let portalMembershipOk = false;
      let portalProvisionError = null;
      if (invitePortalUsers) {
        try {
          const uid = await ensurePortalUser(supabase, lead.email, lead.name);
          if (uid) {
            await upsertMembershipViewer(supabase, uid, restaurant.id);
            console.log(`Portal: viewer membership for ${String(lead.email).trim()} → ${restaurant.slug}`);
            portalMembershipOk = true;
          } else {
            portalProvisionError =
              "Portal provisioning could not resolve a user id from inviteUserByEmail/listUsers.";
          }
        } catch (portalErr) {
          portalProvisionError = String(portalErr?.message || portalErr).slice(0, 500);
          console.warn("Portal invite/membership failed:", portalProvisionError);
        }
      }

      if (invitePortalUsers && requirePortalProvisioning && !portalMembershipOk) {
        const strictPortalError =
          portalProvisionError || "Portal provisioning failed before membership assignment.";
        await supabase
          .from("lead_intake_submissions")
          .update({
            processing_status: "failed",
            pipeline_last_error: strictPortalError,
          })
          .eq("id", lead.id);
        console.warn(
          `Lead ${lead.id} marked failed (strict portal provisioning): ${strictPortalError}`,
        );
        continue;
      }

      const { error: upErr } = await supabase
        .from("lead_intake_submissions")
        .update({
          restaurant_id: restaurant.id,
          processing_status: "converted",
          pipeline_last_error: portalProvisionError,
        })
        .eq("id", lead.id);
      if (upErr) throw upErr;

      const hook = getEnv("LEAD_INTAKE_SUCCESS_WEBHOOK_URL", { fallback: "" });
      if (hook) {
        try {
          await fetch(hook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "lead_intake_converted",
              lead_id: lead.id,
              restaurant_id: restaurant.id,
              slug: restaurant.slug,
              inquiry_plan: lead.inquiry_plan,
              email: lead.email,
              period_label: periodLabel,
            }),
          });
        } catch (hookErr) {
          console.warn("LEAD_INTAKE_SUCCESS_WEBHOOK_URL post failed:", hookErr?.message || hookErr);
        }
      }

      if (portalMembershipOk) {
        const portalBase = portalBaseUrl();
        const dashboardUrl = `${portalBase}/dashboard/${restaurant.slug}/`;
        if (welcomeEmailDelayMs > 0) {
          console.log(
            `Waiting ${welcomeEmailDelayMs}ms before magic link + welcome email (${restaurant.slug})…`,
          );
          await delayMs(welcomeEmailDelayMs);
        }
        const magicLink = await tryGenerateMagicLink(supabase, lead.email, dashboardUrl);
        await sendPortalWelcomeEmailResend({
          toEmail: lead.email,
          displayName: lead.name,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          portalBase,
          dashboardUrl,
          magicLink,
        });
      }
    } else if (!dryRun && !persisted) {
      await supabase
        .from("lead_intake_submissions")
        .update({
          processing_status: "failed",
          pipeline_last_error: "Snapshot not persisted (no score derived or dry run path).",
        })
        .eq("id", lead.id);
    }
    } catch (err) {
      console.error(`Lead ${lead.id} failed:`, err);
      if (!dryRun) {
        const msg = String(err?.message || err).slice(0, 2000);
        await supabase
          .from("lead_intake_submissions")
          .update({ processing_status: "failed", pipeline_last_error: msg })
          .eq("id", lead.id);
      }
    }
  }

  console.log("\nLead intake snapshot run complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
