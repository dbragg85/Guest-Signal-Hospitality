#!/usr/bin/env node
/**
 * Backfill restaurants.google_rating, price_level, price_level_label, logo_url from stored Apify raw rows.
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-restaurant-google-profile.mjs
 *   RESTAURANT_SLUG=trophy-pizza-evendale node --env-file=.env.local scripts/backfill-restaurant-google-profile.mjs
 *   DRY_RUN=1 node --env-file=.env.local scripts/backfill-restaurant-google-profile.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./lib/guest-signal-rubric.mjs";
import {
  extractGooglePlaceProfileFromApifyItems,
  restaurantPatchFromGooglePlaceProfile,
} from "./lib/google-place-profile-from-apify.mjs";

const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());
const slugFilter = (getEnv("RESTAURANT_SLUG", { fallback: "" }) || "").trim();

async function main() {
  const supabase = createClient(
    getEnv("SUPABASE_URL", { required: true }),
    getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true }),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let restaurantQuery = supabase.from("restaurants").select("id, slug, name").order("slug");
  if (slugFilter) restaurantQuery = restaurantQuery.eq("slug", slugFilter);

  const { data: restaurants, error: rErr } = await restaurantQuery;
  if (rErr) throw rErr;

  let updated = 0;
  let skipped = 0;

  for (const restaurant of restaurants ?? []) {
    const { data: obs, error: oErr } = await supabase
      .from("review_observations")
      .select("raw")
      .eq("restaurant_id", restaurant.id)
      .eq("source", "google")
      .not("raw", "is", null)
      .limit(30);
    if (oErr) throw oErr;

    const rawItems = (obs ?? []).map((row) => row.raw).filter(Boolean);
    const profile = extractGooglePlaceProfileFromApifyItems(rawItems);
    const patch = restaurantPatchFromGooglePlaceProfile(profile);

    if (!Object.keys(patch).length) {
      console.log(`— ${restaurant.slug}: no place profile in Apify raw rows`);
      skipped += 1;
      continue;
    }

    console.log(`✓ ${restaurant.slug}:`, JSON.stringify(patch));
    if (!dryRun) {
      const { error: uErr } = await supabase.from("restaurants").update(patch).eq("id", restaurant.id);
      if (uErr) throw uErr;
    }
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped}${dryRun ? " (DRY_RUN)" : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
