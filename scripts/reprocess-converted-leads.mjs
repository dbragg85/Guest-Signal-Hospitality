#!/usr/bin/env node
/**
 * Purge old snapshot/scorecard data for converted leads, reset them one-by-one, re-run intake processing.
 *
 * Usage:
 *   node --env-file=.env.local scripts/reprocess-converted-leads.mjs
 *   DRY_RUN=1 node --env-file=.env.local scripts/reprocess-converted-leads.mjs
 *   REPROCESS_INQUIRY_PLANS=free_snapshot node --env-file=.env.local scripts/reprocess-converted-leads.mjs
 *   SKIP_INTAKE_RUN=1 node --env-file=.env.local scripts/reprocess-converted-leads.mjs
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * For intake re-run: APIFY_TOKEN, APIFY_GOOGLE_ACTOR_ID (or LEAD_INTAKE_REQUIRE_APIFY=0 for mock fallback)
 */
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { getEnv } from "./lib/guest-signal-rubric.mjs";
import { SERVICE_INQUIRY_PLANS } from "./lib/rubric-scorecard-persist.mjs";
import { purgeRestaurantSnapshotData } from "./lib/purge-restaurant-snapshot-data.mjs";

function envFlag(name, fallback = "0") {
  return ["1", "true", "yes"].includes((getEnv(name, { fallback }) || "").toLowerCase());
}

function plansFromEnv() {
  const raw = (getEnv("REPROCESS_INQUIRY_PLANS", { fallback: "free_snapshot" }) || "").trim();
  if (raw === "all" || raw === "service") return [...SERVICE_INQUIRY_PLANS];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function runIntakeForLead(leadId) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/process-lead-intake-snapshot.mjs"], {
      stdio: "inherit",
      env: {
        ...process.env,
        LEAD_INTAKE_ID: leadId,
        FORCE_REPROCESS: "1",
        LEAD_INTAKE_INVITE_PORTAL_USERS: process.env.LEAD_INTAKE_INVITE_PORTAL_USERS ?? "0",
      },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Lead ${leadId} intake exited with code ${code}`));
    });
  });
}

async function main() {
  const dryRun = envFlag("DRY_RUN");
  const skipIntake = envFlag("SKIP_INTAKE_RUN");
  const plans = plansFromEnv();

  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: leads, error: leadsErr } = await supabase
    .from("lead_intake_submissions")
    .select("id, business, inquiry_plan, processing_status, restaurant_id, email, created_at")
    .in("processing_status", ["converted", "pending", "processing"])
    .in("inquiry_plan", plans)
    .not("restaurant_id", "is", null)
    .order("created_at", { ascending: true });
  if (leadsErr) throw leadsErr;

  const converted = (leads ?? []).filter((l) => l.processing_status === "converted");
  if (!converted.length) {
    console.log(`No converted leads found for plans: ${plans.join(", ")}`);
    return;
  }

  console.log(`Found ${converted.length} converted lead(s) to reprocess (${plans.join(", ")}).`);

  const purgedRestaurants = new Set();

  for (const lead of converted) {
    console.log(`\n=== ${lead.business} (${lead.id}) ===`);

    if (lead.restaurant_id && !purgedRestaurants.has(lead.restaurant_id)) {
      console.log(`Purging snapshot data for restaurant ${lead.restaurant_id}…`);
      const purged = await purgeRestaurantSnapshotData(supabase, lead.restaurant_id, { dryRun });
      console.log(JSON.stringify(purged));
      purgedRestaurants.add(lead.restaurant_id);
    }

    if (dryRun) {
      console.log("DRY_RUN: would reset this lead to pending and re-run intake.");
      continue;
    }

    const { error: resetErr } = await supabase
      .from("lead_intake_submissions")
      .update({ processing_status: "pending", pipeline_last_error: null })
      .eq("id", lead.id);
    if (resetErr) {
      console.error(`Could not reset lead ${lead.id} to pending:`, resetErr.message);
      continue;
    }

    if (skipIntake) {
      console.log("SKIP_INTAKE_RUN=1 — lead left pending for manual intake run.");
      continue;
    }

    console.log("Running intake processor…");
    await runIntakeForLead(lead.id);
    console.log(`Done: ${lead.business}`);
  }

  console.log("\nReprocess pass complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
