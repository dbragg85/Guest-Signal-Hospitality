#!/usr/bin/env node
/**
 * Pull reviews via Apify [Restaurant Review Aggregator](https://apify.com/tri_angle/restaurant-review-aggregator)
 * (Google Maps place discovery, then Yelp / Google / TripAdvisor / Facebook / DoorDash / Uber Eats).
 * Upserts `review_observations` for rows whose `review_date` falls in PERIOD_START..PERIOD_END (UTC).
 *
 * Requires migration 023 (extended `source` check). Normalize with `normalizeApifyItem(_, "restaurant-aggregator")`.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APIFY_TOKEN,
 *      APIFY_RESTAURANT_AGGREGATOR_ACTOR_ID (optional; default tri_angle~restaurant-review-aggregator),
 *      PERIOD_START, PERIOD_END (optional; prior completed month), RESTAURANT_SLUGS, DRY_RUN=1,
 *      Optional: pass a single slug as argv[2] (e.g. `node …/run-restaurant-aggregator-ingest.mjs west-shine-family-restaurant`)
 *      — same as RESTAURANT_SLUGS with one entry; without either, all restaurants are processed (alphabetical order).
 *      APIFY_GOOGLE_START_URL (optional global override per run — same as Google monthly ingest),
 *      AGGREGATOR_MAX_REVIEWS_PER_PLACE_PROVIDER (default 15, max 100),
 *      APIFY_AGGREGATOR_PROVIDERS — comma list; omit for all six providers,
 *      APIFY_AGGREGATOR_INPUT_TEMPLATE_JSON — optional full JSON template ({{MAPS_URL}}, {{PERIOD_START}}, …),
 *      AGGREGATOR_INGEST_THROTTLE_MS (default 3000) — delay between restaurants.
 *
 * Rubric rebuild: set RUBRIC_REVIEW_SOURCES to include platforms you ingested (default rebuild is still google,yelp).
 */
import { createClient } from "@supabase/supabase-js";
import { pullRestaurantAggregatorReviewsViaApify } from "./lib/apify-restaurant-aggregator.mjs";
import { getEnv, normalizeApifyItem } from "./lib/guest-signal-rubric.mjs";

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function lastCompletedMonthWindowUtc() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(thisMonthStart.getUTCFullYear(), thisMonthStart.getUTCMonth(), 0));
  return { start, end };
}

function monthLabelFromDate(date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function restaurantToLead(row) {
  const name = String(row.name ?? "").trim();
  const address = String(row.address ?? "").trim();
  return {
    business: name || "Restaurant",
    street_address: address || "",
    city: "",
    state: "",
    zip: "",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });

  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());

  const token = getEnv("APIFY_TOKEN", { required: !dryRun });
  const actorId = getEnv("APIFY_RESTAURANT_AGGREGATOR_ACTOR_ID", { fallback: "" }).trim();

  const providedStart = getEnv("PERIOD_START", { fallback: "" });
  const providedEnd = getEnv("PERIOD_END", { fallback: "" });
  const defaultWindow = lastCompletedMonthWindowUtc();
  const periodStart = parseDateOnly(providedStart) ?? defaultWindow.start;
  const periodEnd = parseDateOnly(providedEnd) ?? defaultWindow.end;
  if (periodEnd < periodStart) {
    throw new Error("PERIOD_END must be on/after PERIOD_START");
  }
  const periodStartIso = toIsoDate(periodStart);
  const periodEndIso = toIsoDate(periodEnd);
  const periodLabel = getEnv("PERIOD_LABEL", { fallback: monthLabelFromDate(periodStart) });

  const slugArg = process.argv[2]?.trim();
  const slugFilterRaw = slugArg || getEnv("RESTAURANT_SLUGS", { fallback: "" });
  const slugFilter = new Set(
    slugFilterRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const throttleMs = Math.max(0, Number(getEnv("AGGREGATOR_INGEST_THROTTLE_MS", { fallback: "3000" })) || 0);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurants, error: rErr } = await supabase.from("restaurants").select("id, slug, name, address").order("name");
  if (rErr) throw rErr;

  const candidates = (restaurants ?? []).filter((row) => {
    if (!slugFilter.size) return true;
    return slugFilter.has(String(row.slug));
  });

  console.log(
    `Restaurant Review Aggregator ingest — ${periodLabel} (${periodStartIso} → ${periodEndIso} UTC), ${candidates.length} restaurant(s)${slugFilter.size ? ` [slugs: ${[...slugFilter].join(", ")}]` : " (all — set RESTAURANT_SLUGS or pass slug as argv[2])"}, dryRun=${dryRun}`,
  );

  let upserted = 0;
  let skipped = 0;
  let failures = 0;
  let dryListed = 0;

  for (let i = 0; i < candidates.length; i += 1) {
    const row = candidates[i];
    const lead = restaurantToLead(row);
    const slug = String(row.slug);

    if (dryRun) {
      console.log(`[dry-run] [${slug}] would run aggregator for "${lead.business}" (${lead.street_address || "no address"})`);
      dryListed += 1;
      continue;
    }

    try {
      console.log(`[${slug}] Apify Restaurant Review Aggregator pull (reviewsFromDate=${periodStartIso} when set)…`);
      const raw = await pullRestaurantAggregatorReviewsViaApify({
        lead,
        token,
        actorId: actorId || undefined,
        reviewWindow: { startIso: periodStartIso, endIso: periodEndIso },
      });
      const parsed = raw.map((item) => normalizeApifyItem(item, "restaurant-aggregator")).filter(Boolean);
      const inWindow = parsed.filter((review) => {
        if (!review.review_date) return false;
        return review.review_date >= periodStartIso && review.review_date <= periodEndIso;
      });
      const droppedOutside = parsed.filter(
        (r) => r.review_date && (r.review_date < periodStartIso || r.review_date > periodEndIso),
      ).length;
      const droppedNoDate = parsed.filter((r) => !r.review_date).length;

      const bySource = new Map();
      for (const r of inWindow) {
        bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
      }
      const bySourceStr = [...bySource.entries()].map(([k, v]) => `${k}=${v}`).join(", ") || "none";

      console.log(
        `[${slug}] raw=${raw.length} parsed=${parsed.length} in_window=${inWindow.length} (${bySourceStr}; ${droppedOutside} outside window, ${droppedNoDate} no date)`,
      );

      if (!inWindow.length) {
        skipped += 1;
        console.warn(`[${slug}] No reviews in scoring window; nothing upserted.`);
      } else {
        const inserts = inWindow.map((review) => ({
          restaurant_id: row.id,
          ...review,
        }));
        const { error: upsertErr } = await supabase
          .from("review_observations")
          .upsert(inserts, { onConflict: "restaurant_id,source,external_review_id", ignoreDuplicates: false });
        if (upsertErr) throw upsertErr;
        upserted += 1;
        console.log(`[${slug}] Upserted ${inserts.length} review_observations row(s).`);
      }
    } catch (e) {
      failures += 1;
      console.warn(`[${slug}] Failed:`, e?.message || e);
    }

    if (throttleMs > 0 && i < candidates.length - 1) {
      await sleep(throttleMs);
    }
  }

  if (dryRun) {
    console.log(`\nDone (dry run). restaurants_listed=${dryListed}`);
  } else {
    console.log(
      `\nDone. restaurants_upserted=${upserted} skipped_no_reviews_in_window=${skipped} apify_or_db_errors=${failures}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
