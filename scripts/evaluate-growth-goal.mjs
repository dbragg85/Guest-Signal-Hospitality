#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import {
  finishAutomationRun,
  recordAutomationRun,
  requiredEnv,
  serviceClient,
} from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const siteOrigin =
  process.env.SITE_ORIGIN?.trim().replace(/\/+$/, "") ||
  "https://guestsignalhospitality.com";

function actionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") };
}

function proposeInterventions({ conversions, hoursRemaining, pageViews, ctaClicks, pendingProspects }) {
  const proposals = [];
  if (conversions < 3) {
    proposals.push({
      kind: "checkout_intro_offer",
      title: "Enable 20% off first month checkout offer",
      rationale:
        "Paid conversions are behind pace. A one-time intro coupon can raise checkout completion without permanent price cuts.",
      payload: { percent_off: 20 },
    });
  }
  if (pageViews < 40 || ctaClicks < 5) {
    proposals.push({
      kind: "snapshot_cta_push",
      title: "Push free snapshot CTA harder on homepage",
      rationale:
        `Traffic/CTA volume is low (page_views=${pageViews}, cta_clicks=${ctaClicks}). Stronger snapshot CTA should feed paid upgrades.`,
      payload: { emphasis: "free_snapshot_first" },
    });
  }
  if (pendingProspects > 0) {
    proposals.push({
      kind: "prospect_outreach_push",
      title: "Re-ping outstanding prospect drafts on ntfy",
      rationale: `${pendingProspects} approval-ready drafts can create pipeline if owners respond this week.`,
      payload: { notify_only: true },
    });
  } else {
    proposals.push({
      kind: "homepage_cta_push",
      title: "Tighten homepage plan CTAs toward Signal Growth",
      rationale:
        "No pending prospect drafts. Shift homepage plan CTA copy toward the $499 Growth plan to raise AOV and conversion odds.",
      payload: { preferred_plan: "signal_growth" },
    });
  }
  return proposals.slice(0, 3);
}

function assessAttainability({
  conversions,
  target,
  hoursElapsed,
  hoursRemaining,
  pageViews,
  ctaClicks,
}) {
  if (conversions >= target) {
    return {
      attainable: true,
      verdict: "achieved",
      detail: `Goal met with ${conversions}/${target} paid conversions.`,
    };
  }
  if (hoursRemaining <= 0) {
    return {
      attainable: false,
      verdict: "missed",
      detail: `Window closed at ${conversions}/${target} conversions.`,
    };
  }

  const daysRemaining = hoursRemaining / 24;
  const needed = target - conversions;

  // Hard unattainable thresholds for a cold funnel.
  if (conversions === 0 && hoursElapsed >= 48 && pageViews < 25) {
    return {
      attainable: false,
      verdict: "unattainable_without_changes",
      detail:
        "Zero conversions after 48h with very low traffic. Need CTA/offer/outreach changes.",
    };
  }
  if (needed >= 3 && daysRemaining <= 3) {
    return {
      attainable: false,
      verdict: "unattainable_without_changes",
      detail: `Need ${needed} conversions with only ${daysRemaining.toFixed(1)} days left.`,
    };
  }
  if (needed >= 2 && daysRemaining <= 1.5) {
    return {
      attainable: false,
      verdict: "unattainable_without_changes",
      detail: `Need ${needed} conversions with ${daysRemaining.toFixed(1)} days left.`,
    };
  }
  if (needed >= 1 && daysRemaining <= 0.5 && ctaClicks < 3) {
    return {
      attainable: false,
      verdict: "unattainable_without_changes",
      detail: "Less than 12 hours remain with insufficient checkout intent signals.",
    };
  }

  return {
    attainable: true,
    verdict: "on_track_or_recoverable",
    detail: `Need ${needed} more conversion(s) in ${daysRemaining.toFixed(1)} day(s). Continue current motion.`,
  };
}

async function notifyInterventions(supabase, interventions) {
  const topic = process.env.NTFY_TOPIC?.trim();
  const server =
    process.env.NTFY_SERVER_URL?.trim().replace(/\/+$/, "") || "https://ntfy.sh";
  if (!topic || !interventions.length) return 0;

  const actionBase = `${requiredEnv("SUPABASE_URL").replace(/\/+$/, "")}/functions/v1/growth-intervention-action`;
  let sent = 0;
  for (const intervention of interventions) {
    const approve = actionToken();
    const deny = actionToken();
    const expiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
    const { error: tokenError } = await supabase.from("growth_intervention_actions").insert([
      {
        intervention_id: intervention.id,
        action: "approve",
        token_hash: approve.tokenHash,
        expires_at: expiresAt,
      },
      {
        intervention_id: intervention.id,
        action: "deny",
        token_hash: deny.tokenHash,
        expires_at: expiresAt,
      },
    ]);
    if (tokenError) throw tokenError;

    const headers = { "Content-Type": "application/json" };
    const ntfyToken = process.env.NTFY_ACCESS_TOKEN?.trim();
    if (ntfyToken) headers.Authorization = `Bearer ${ntfyToken}`;
    const response = await fetch(server, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic,
        title: `Approve growth change: ${intervention.title}`,
        message: [
          intervention.rationale,
          "",
          "Approve only if you want this change applied toward the 3-conversion / 7-day goal.",
        ].join("\n"),
        priority: 5,
        tags: ["warning", "chart_with_upwards_trend"],
        actions: [
          {
            action: "http",
            label: "Approve change",
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
            label: "Portal",
            url: `${siteOrigin}/portal/dashboard/`,
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`ntfy failed (${response.status}): ${await response.text()}`);
    }
    sent += 1;
  }
  return sent;
}

const supabase = serviceClient();
let runId;

try {
  runId = await recordAutomationRun(supabase, {
    run_kind: "growth_goal_eval",
    status: "started",
  });

  const { data: goal, error: goalError } = await supabase
    .from("growth_goals")
    .select("*")
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (goalError) throw goalError;
  if (!goal) throw new Error("No active growth goal found.");

  const now = Date.now();
  const start = new Date(goal.starts_at).getTime();
  const end = new Date(goal.ends_at).getTime();
  const hoursElapsed = Math.max(0, (now - start) / 36e5);
  const hoursRemaining = Math.max(0, (end - now) / 36e5);

  const { count: conversions, error: conversionError } = await supabase
    .from("sales_opportunities")
    .select("id", { count: "exact", head: true })
    .eq("stage", "won")
    .eq("is_test", false)
    .gte("won_at", goal.starts_at)
    .lte("won_at", goal.ends_at)
    .in("plan_key", goal.plan_keys ?? ["signal_monitor", "signal_growth", "signal_elevate"]);
  if (conversionError) throw conversionError;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: pageViews } = await supabase
    .from("site_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "page_view")
    .gte("occurred_at", since);
  const { count: ctaClicks } = await supabase
    .from("site_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "cta_click")
    .gte("occurred_at", since);
  const { count: pendingProspects } = await supabase
    .from("prospect_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "approval_required");

  const assessment = assessAttainability({
    conversions: conversions ?? 0,
    target: goal.target_conversions,
    hoursElapsed,
    hoursRemaining,
    pageViews: pageViews ?? 0,
    ctaClicks: ctaClicks ?? 0,
  });

  const proposals = assessment.attainable
    ? []
    : proposeInterventions({
        conversions: conversions ?? 0,
        hoursRemaining,
        pageViews: pageViews ?? 0,
        ctaClicks: ctaClicks ?? 0,
        pendingProspects: pendingProspects ?? 0,
      });

  if (!dryRun) {
    const { data: evaluation, error: evalError } = await supabase
      .from("growth_goal_evaluations")
      .insert({
        goal_id: goal.id,
        conversions: conversions ?? 0,
        hours_elapsed: Number(hoursElapsed.toFixed(2)),
        hours_remaining: Number(hoursRemaining.toFixed(2)),
        attainable: assessment.attainable,
        verdict: assessment.verdict,
        evidence: {
          page_views_7d: pageViews ?? 0,
          cta_clicks_7d: ctaClicks ?? 0,
          pending_prospects: pendingProspects ?? 0,
          detail: assessment.detail,
        },
        proposed_interventions: proposals,
      })
      .select("id")
      .single();
    if (evalError) throw evalError;

    if (assessment.verdict === "achieved") {
      await supabase
        .from("growth_goals")
        .update({ status: "achieved", updated_at: new Date().toISOString() })
        .eq("id", goal.id);
    } else if (assessment.verdict === "missed") {
      await supabase
        .from("growth_goals")
        .update({ status: "missed", updated_at: new Date().toISOString() })
        .eq("id", goal.id);
    }

    const created = [];
    for (const proposal of proposals) {
      const { data: row, error } = await supabase
        .from("growth_interventions")
        .insert({
          goal_id: goal.id,
          evaluation_id: evaluation.id,
          kind: proposal.kind,
          title: proposal.title,
          rationale: proposal.rationale,
          payload: proposal.payload,
          status: "proposed",
        })
        .select("id,title,rationale")
        .single();
      if (error) throw error;
      created.push(row);
    }

    const ntfySent = await notifyInterventions(supabase, created);
    await finishAutomationRun(supabase, runId, {
      status: assessment.attainable ? "succeeded" : "approval_required",
      summary: `${assessment.verdict}: ${conversions ?? 0}/${goal.target_conversions} conversions; ${assessment.detail}`,
      metrics: {
        conversions: conversions ?? 0,
        target: goal.target_conversions,
        hours_elapsed: hoursElapsed,
        hours_remaining: hoursRemaining,
        attainable: assessment.attainable,
        interventions_proposed: created.length,
        ntfy_notifications: ntfySent,
      },
    });
    console.log(
      JSON.stringify(
        {
          verdict: assessment.verdict,
          conversions: conversions ?? 0,
          target: goal.target_conversions,
          attainable: assessment.attainable,
          detail: assessment.detail,
          interventions: created.map((row) => row.title),
          ntfy_notifications: ntfySent,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      JSON.stringify(
        {
          dry_run: true,
          verdict: assessment.verdict,
          conversions: conversions ?? 0,
          proposals,
        },
        null,
        2,
      ),
    );
    await finishAutomationRun(supabase, runId, {
      status: "skipped",
      summary: "Growth goal evaluation dry-run",
    });
  }
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object"
        ? [error.message, error.code, error.details].filter(Boolean).join(" | ") ||
          JSON.stringify(error)
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
