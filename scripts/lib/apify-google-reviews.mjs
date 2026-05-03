import { getEnv } from "./guest-signal-rubric.mjs";
import { startApifyRun, waitForApifyRun, fetchApifyDatasetItems } from "./apify-yelp-actor.mjs";

/**
 * Build a Google Maps search URL from intake address (no place ID required).
 * Many Google Maps review Apify actors accept search URLs as startUrls.
 */
export function buildGoogleMapsSearchUrlFromLead(lead) {
  const parts = [
    lead?.business,
    lead?.street_address,
    lead?.city,
    lead?.state,
    lead?.zip,
  ]
    .map((p) => (p && String(p).trim() && String(p).trim() !== "—" ? String(p).trim() : ""))
    .filter(Boolean);
  const q = parts.join(", ");
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * @param {object} lead - Business + address for Maps search URL.
 * @param {object} [options]
 * @param {{ startIso: string, endIso: string }} [options.reviewWindow] - Scoring month (YYYY-MM-DD UTC).
 *   When set, default input adds `reviewsStartDate` so newest-first scrapers skip older months
 *   (saves maxReviews budget vs pulling March when you only ingest April). Many store actors
 *   accept this key (e.g. solidcode/google-maps-reviews-scraper); unknown keys are usually ignored.
 * @param {number} [options.maxReviewsOverride] - Cap passed to actor (else LEAD_INTAKE_MAX_REVIEWS).
 */
export function buildGoogleApifyInput(lead, options = {}) {
  const { reviewWindow, maxReviewsOverride } = options;
  const rawTemplate = getEnv("APIFY_GOOGLE_INPUT_TEMPLATE_JSON", { fallback: "" });
  const maxReviews = Math.min(
    500,
    Math.max(
      1,
      Number(
        maxReviewsOverride != null && Number.isFinite(Number(maxReviewsOverride))
          ? maxReviewsOverride
          : getEnv("LEAD_INTAKE_MAX_REVIEWS", { fallback: "50" }),
      ),
    ),
  );

  const placeOrSearchUrl =
    getEnv("APIFY_GOOGLE_START_URL", { fallback: "" }) || buildGoogleMapsSearchUrlFromLead(lead);

  if (!placeOrSearchUrl) {
    throw new Error("Google Apify: set APIFY_GOOGLE_START_URL or provide business + address on the lead.");
  }

  const periodStart = String(reviewWindow?.startIso ?? "").trim();
  const periodEnd = String(reviewWindow?.endIso ?? "").trim();

  if (rawTemplate) {
    const templated = rawTemplate
      .replaceAll("{{GOOGLE_URL}}", placeOrSearchUrl)
      .replaceAll("{{google_url}}", placeOrSearchUrl)
      .replaceAll("{{MAX_REVIEWS}}", String(maxReviews))
      .replaceAll("{{PERIOD_START}}", periodStart)
      .replaceAll("{{PERIOD_END}}", periodEnd);
    return JSON.parse(templated);
  }

  const input = {
    startUrls: [{ url: placeOrSearchUrl }],
    maxReviews,
    reviewsSort: "newest",
  };

  const filterOff = ["0", "false", "no"].includes(
    (getEnv("APIFY_GOOGLE_SCORING_PERIOD_FILTER", { fallback: periodStart ? "1" : "0" }) || "").toLowerCase(),
  );
  if (periodStart && !filterOff) {
    input.reviewsStartDate = periodStart;
    if (
      periodEnd &&
      ["1", "true", "yes"].includes((getEnv("APIFY_GOOGLE_EMIT_REVIEWS_END_DATE", { fallback: "0" }) || "").toLowerCase())
    ) {
      input.reviewsEndDate = periodEnd;
    }
  }

  return input;
}

/**
 * Pull raw Google Maps / Google reviews dataset items via Apify.
 * Actor ID from env APIFY_GOOGLE_ACTOR_ID (e.g. compass/crawler actor).
 */
export async function pullGoogleReviewsViaApify({ lead, token, actorId, reviewWindow, maxReviewsOverride } = {}) {
  const input = buildGoogleApifyInput(lead, { reviewWindow, maxReviewsOverride });
  const run = await startApifyRun({ token, actorId, input });
  const finalRun = await waitForApifyRun({ token, runId: run.id });
  if (finalRun.status !== "SUCCEEDED") {
    throw new Error(`Google Apify run ${run.id} ended with status ${finalRun.status}`);
  }
  return fetchApifyDatasetItems({
    token,
    datasetId: finalRun.defaultDatasetId,
  });
}
