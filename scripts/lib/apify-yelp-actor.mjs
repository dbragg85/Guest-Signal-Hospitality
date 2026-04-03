import { getEnv } from "./guest-signal-rubric.mjs";

export function buildApifyInput(yelpUrl) {
  const rawTemplate = getEnv("APIFY_YELP_INPUT_TEMPLATE_JSON", { fallback: "" });
  if (!rawTemplate) {
    return {
      startUrls: [{ url: yelpUrl }],
      maxReviews: Number(getEnv("MAX_REVIEWS_PER_LOCATION", { fallback: "250" })),
      sortBy: "newest",
    };
  }

  const templated = rawTemplate
    .replaceAll("{{YELP_URL}}", yelpUrl)
    .replaceAll("{{yelp_url}}", yelpUrl);

  return JSON.parse(templated);
}

export async function startApifyRun({ token, actorId, input }) {
  const response = await fetch(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify run start failed (${response.status}): ${await response.text()}`);
  }

  const body = await response.json();
  return body.data;
}

export async function waitForApifyRun({ token, runId }) {
  for (;;) {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`
    );
    if (!response.ok) {
      throw new Error(`Apify run poll failed (${response.status}): ${await response.text()}`);
    }
    const body = await response.json();
    const status = body.data?.status;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      return body.data;
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

export async function fetchApifyDatasetItems({ token, datasetId }) {
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true&format=json`
  );
  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

/**
 * Returns normalized review rows (same shape as normalizeApifyItem output) or throws.
 */
export async function pullYelpReviewsViaApify({ yelpUrl, token, actorId }) {
  const input = buildApifyInput(yelpUrl);
  const run = await startApifyRun({ token, actorId, input });
  const finalRun = await waitForApifyRun({ token, runId: run.id });
  if (finalRun.status !== "SUCCEEDED") {
    throw new Error(`Apify run ${run.id} ended with status ${finalRun.status}`);
  }
  const rawItems = await fetchApifyDatasetItems({
    token,
    datasetId: finalRun.defaultDatasetId,
  });
  return rawItems;
}
