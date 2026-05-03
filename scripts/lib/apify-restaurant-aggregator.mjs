import { getEnv } from "./guest-signal-rubric.mjs";
import { startApifyRun, waitForApifyRun, fetchApifyDatasetItems } from "./apify-yelp-actor.mjs";
import { buildGoogleMapsSearchUrlFromLead } from "./apify-google-reviews.mjs";

/** @see https://apify.com/tri_angle/restaurant-review-aggregator */
export const DEFAULT_RESTAURANT_AGGREGATOR_ACTOR_ID = "tri_angle~restaurant-review-aggregator";

/**
 * @param {object} lead - Same shape as Google ingest (`business`, `street_address`, …).
 * @param {object} [options]
 * @param {{ startIso: string, endIso?: string }} [options.reviewWindow] - Passed as `reviewsFromDate` (Google + TripAdvisor per actor docs).
 * @param {number} [options.maxReviewsPerPlaceAndProvider] - Cap per place per provider (default AGGREGATOR_MAX_REVIEWS_PER_PLACE_PROVIDER).
 */
export function buildRestaurantAggregatorApifyInput(lead, options = {}) {
  const { reviewWindow, maxReviewsPerPlaceAndProvider } = options;
  const rawTemplate = getEnv("APIFY_AGGREGATOR_INPUT_TEMPLATE_JSON", { fallback: "" });
  const mapsUrl =
    getEnv("APIFY_GOOGLE_START_URL", { fallback: "" }).trim() || buildGoogleMapsSearchUrlFromLead(lead);
  if (!mapsUrl) {
    throw new Error(
      "Restaurant aggregator Apify: set APIFY_GOOGLE_START_URL or provide business + address on the restaurant row.",
    );
  }

  const periodStart = String(reviewWindow?.startIso ?? "").trim();
  const periodEnd = String(reviewWindow?.endIso ?? "").trim();
  const maxPer = Math.min(
    100,
    Math.max(
      1,
      Number(
        maxReviewsPerPlaceAndProvider != null && Number.isFinite(Number(maxReviewsPerPlaceAndProvider))
          ? maxReviewsPerPlaceAndProvider
          : getEnv("AGGREGATOR_MAX_REVIEWS_PER_PLACE_PROVIDER", { fallback: "15" }),
      ),
    ),
  );

  const providersRaw = getEnv("APIFY_AGGREGATOR_PROVIDERS", { fallback: "" }).trim();
  const providers = providersRaw
    ? providersRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : undefined;

  if (rawTemplate) {
    const templated = rawTemplate
      .replaceAll("{{GOOGLE_MAPS_URL}}", mapsUrl)
      .replaceAll("{{MAPS_URL}}", mapsUrl)
      .replaceAll("{{PERIOD_START}}", periodStart)
      .replaceAll("{{PERIOD_END}}", periodEnd)
      .replaceAll("{{MAX_REVIEWS_PER_PLACE}}", String(maxPer));
    return JSON.parse(templated);
  }

  const input = {
    startUrls: [{ url: mapsUrl }],
    maxPlaces: 1,
    maxReviewsPerPlaceAndProvider: maxPer,
  };
  if (providers?.length) input.providers = providers;
  if (periodStart) input.reviewsFromDate = periodStart;
  return input;
}

/**
 * Pull unified multi-platform review rows from tri_angle Restaurant Review Aggregator.
 *
 * @param {object} opts
 * @param {object} opts.lead
 * @param {string} opts.token - APIFY_TOKEN
 * @param {string} [opts.actorId] - Defaults to APIFY_RESTAURANT_AGGREGATOR_ACTOR_ID or tri_angle~restaurant-review-aggregator
 */
export async function pullRestaurantAggregatorReviewsViaApify({
  lead,
  token,
  actorId,
  reviewWindow,
  maxReviewsPerPlaceAndProvider,
} = {}) {
  const resolvedActor =
    String(actorId ?? "").trim() ||
    getEnv("APIFY_RESTAURANT_AGGREGATOR_ACTOR_ID", { fallback: DEFAULT_RESTAURANT_AGGREGATOR_ACTOR_ID });
  const input = buildRestaurantAggregatorApifyInput(lead, { reviewWindow, maxReviewsPerPlaceAndProvider });
  const run = await startApifyRun({ token, actorId: resolvedActor, input });
  const finalRun = await waitForApifyRun({ token, runId: run.id });
  if (finalRun.status !== "SUCCEEDED") {
    throw new Error(`Restaurant aggregator Apify run ${run.id} ended with status ${finalRun.status}`);
  }
  return fetchApifyDatasetItems({
    token,
    datasetId: finalRun.defaultDatasetId,
  });
}
