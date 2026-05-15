#!/usr/bin/env node
/**
 * Purge old snapshot/scorecard data for converted leads, reset them to pending, then re-run intake processing.
 *
 * Usage:
 *   node scripts/reprocess-converted-leads.mjs
 *   DRY_RUN=1 node scripts/reprocess-converted-leads.mjs
 *   REPROCESS_INQUIRY_PLANS=free_snapshot node scripts/reprocess-converted-leads.mjs
 *   SKIP_INTAKE_RUN=1 node scripts/reprocess-converted-leads.mjs   # purge + reset only
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * For intake re-run: APIFY_TOKEN, APIFY_GOOGLE_ACTOR_ID (or mock fallback if LEAD_INTAKE_REQUIRE_APIFY=0)
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

function runIntakeProcessor(env) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/process-lead-intake-snapshot.mjs"], {
      stdio: "inherit",
      env: { ...process.env, ...env, FORCE_REPROCESS: "1" },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`process-lead-intake-snapshot.mjs exited with code ${code}`));
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
    .eq("processing_status", "converted")
    .in("inquiry_plan", plans)
    .not("restaurant_id", "is", null)
    .order("created_at", { ascending: true });
  if (leadsErr) throw leadsErr;

  if (!leads?.length) {
    console.log(`No converted leads found for plans: ${plans.join(", ")}`);
    return;
  }

  console.log(`Found ${leads.length} converted lead(s) to reprocess (${plans.join(", ")}).`);

  const restaurantIds = new Set();
  for (const lead of leads) {
    if (lead.restaurant_id) restaurantIds.add(lead.restaurant_id);
  }

  for (const restaurantId of restaurantIds) {
    const related = leads.filter((l) => l.restaurant_id === restaurantId);
    const label = related.map((l) => l.business).join(", ");
    console.log(`\nPurging snapshot data for restaurant ${restaurantId} (${label})…`);
    const purged = await purgeRestaurantSnapshotData(supabase, restaurantId, { dryRun });
    console.log(JSON.stringify(purged, null, 2));
  }

  if (!dryRun) {
    const leadIds = leads.map((l) => l.id);
    const { error: resetErr } = await supabase
      .from("lead_intake_submissions")
      .update({
        processing_status: "pending",
        pipeline_last_error: null,
      })
      .in("id", leadIds);
    if (resetErr) throw resetErr;
    console.log(`\nReset ${leadIds.length} lead(s) to processing_status=pending.`);
  } else {
    console.log("\nDRY_RUN: would reset leads to pending without running intake.");
    return;
  }

  if (skipIntake) {
    console.log("\nSKIP_INTAKE_RUN=1 — run manually:\n  FORCE_REPROCESS=1 node scripts/process-lead-intake-snapshot.mjs");
    return;
  }

  console.log("\nStarting lead intake processor (FORCE_REPROCESS=1)…\n");
  await runIntakeProcessor({ FORCE_REPROCESS: "1" });
  console.log("\nReprocess complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
