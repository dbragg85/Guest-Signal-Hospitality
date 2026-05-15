#!/usr/bin/env node
/**
 * Remove legacy demo restaurants (Boca, Baker's Table, etc.) and all portal/snapshot artifacts.
 *
 * Usage:
 *   node --env-file=.env.local scripts/purge-demo-restaurants.mjs
 *   DRY_RUN=1 node --env-file=.env.local scripts/purge-demo-restaurants.mjs
 *   PURGE_SLUGS=boca,mitas node --env-file=.env.local scripts/purge-demo-restaurants.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_RESTAURANT_SLUGS } from "./lib/demo-restaurant-slugs.mjs";
import { getEnv } from "./lib/guest-signal-rubric.mjs";
import { purgeRestaurantSnapshotData } from "./lib/purge-restaurant-snapshot-data.mjs";

const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());

function slugsFromEnv() {
  const raw = (getEnv("PURGE_SLUGS", { fallback: "" }) || "").trim();
  if (raw) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEMO_RESTAURANT_SLUGS];
}

async function main() {
  const supabase = createClient(
    getEnv("SUPABASE_URL", { required: true }),
    getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true }),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const slugs = slugsFromEnv();
  console.log(`${dryRun ? "[DRY_RUN] " : ""}Purging ${slugs.length} demo slug(s)…`);

  for (const slug of slugs) {
    const { data: restaurant, error: findErr } = await supabase
      .from("restaurants")
      .select("id, slug, name")
      .eq("slug", slug)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!restaurant) {
      console.log(`— ${slug}: not in database`);
      continue;
    }

    console.log(`\n=== ${restaurant.name} (${slug}) ===`);

    if (dryRun) {
      const summary = await purgeRestaurantSnapshotData(supabase, restaurant.id, { dryRun: true });
      console.log("snapshot purge (dry):", JSON.stringify(summary));
      const { count: obs } = await supabase
        .from("review_observations")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id);
      const { count: mem } = await supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id);
      console.log(`would delete review_observations=${obs ?? 0}, memberships=${mem ?? 0}, restaurant row`);
      continue;
    }

    const purged = await purgeRestaurantSnapshotData(supabase, restaurant.id);
    console.log("snapshots/scorecards:", JSON.stringify(purged));

    const { error: obsErr } = await supabase
      .from("review_observations")
      .delete()
      .eq("restaurant_id", restaurant.id);
    if (obsErr) throw obsErr;

    const { error: memErr } = await supabase.from("memberships").delete().eq("restaurant_id", restaurant.id);
    if (memErr) throw memErr;

    const { error: leadErr } = await supabase
      .from("lead_intake_submissions")
      .update({ restaurant_id: null })
      .eq("restaurant_id", restaurant.id);
    if (leadErr) console.warn(`lead_intake unlink (${slug}):`, leadErr.message);

    const { error: delErr } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    if (delErr) throw delErr;

    console.log(`Deleted restaurant ${slug}`);
  }

  console.log("\nDemo purge complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
