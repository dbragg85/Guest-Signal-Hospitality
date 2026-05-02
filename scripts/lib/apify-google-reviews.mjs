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

export function buildGoogleApifyInput(lead) {
  const rawTemplate = getEnv("APIFY_GOOGLE_INPUT_TEMPLATE_JSON", { fallback: "" });
  const maxReviews = Number(getEnv("LEAD_INTAKE_MAX_REVIEWS", { fallback: "50" }));

  const placeOrSearchUrl =
    getEnv("APIFY_GOOGLE_START_URL", { fallback: "" }) || buildGoogleMapsSearchUrlFromLead(lead);

  if (!placeOrSearchUrl) {
    throw new Error("Google Apify: set APIFY_GOOGLE_START_URL or provide business + address on the lead.");
  }

  if (rawTemplate) {
    const templated = rawTemplate
      .replaceAll("{{GOOGLE_URL}}", placeOrSearchUrl)
      .replaceAll("{{google_url}}", placeOrSearchUrl)
      .replaceAll("{{MAX_REVIEWS}}", String(maxReviews));
    return JSON.parse(templated);
  }

  return {
    startUrls: [{ url: placeOrSearchUrl }],
    maxReviews,
    reviewsSort: "newest",
  };
}

/**
 * Pull raw Google Maps / Google reviews dataset items via Apify.
 * Actor ID from env APIFY_GOOGLE_ACTOR_ID (e.g. compass/crawler actor).
 */
export async function pullGoogleReviewsViaApify({ lead, token, actorId }) {
  const input = buildGoogleApifyInput(lead);
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
