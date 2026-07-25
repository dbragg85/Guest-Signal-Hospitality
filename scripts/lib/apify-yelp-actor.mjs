import { getEnv } from "./guest-signal-rubric.mjs";

/**
 * Cap for one Yelp actor run (per business). Default 10 — matches small monthly windows and Apify free-tier messaging.
 * agents/yelp-reviews: `maxItems`. tri_angle/yelp-review-scraper: `maxReviewsPerUrl`.
 */
export function yelpMaxItemsPerRun() {
  const parsed = Number(getEnv("YELP_MAX_ITEMS", { fallback: "10" }));
  const requested = Number.isFinite(parsed) ? parsed : 10;
  return Math.min(500, Math.max(1, Math.floor(requested)));
}

/**
 * @param {string} [actorId]
 * @returns {"agents" | "tri_angle"}
 */
export function detectYelpInputStyle(actorId) {
  const override = (getEnv("YELP_INPUT_STYLE", { fallback: "auto" }) || "").trim().toLowerCase();
  if (override === "agents" || override === "tri_angle") return override;

  const id = String(actorId ?? "").trim();
  if (
    /^c7MfRDqfYvZWOtMrJ$/i.test(id) ||
    id.includes("agents~yelp-reviews") ||
    id.includes("agents/yelp-reviews")
  ) {
    return "agents";
  }
  return "tri_angle";
}

/**
 * Build Yelp actor input.
 * - [agents/yelp-reviews](https://apify.com/agents/yelp-reviews): `startUrls` (string[]), `sortBy`, `maxItems` — no server-side publish-date filter in actor input; Guest Signal filters `review_date` to PERIOD_* after ingest.
 * - [tri_angle/yelp-review-scraper](https://apify.com/tri_angle/yelp-review-scraper): `startUrls` [{url}], `maxReviewsPerUrl`, optional `dateFrom` / `dateTo`, `language`.
 *
 * @param {string} yelpUrl - Canonical Yelp /biz/… URL
 * @param {{ periodStartIso?: string, periodEndIso?: string, actorId?: string }} [options]
 */
export function buildApifyInput(yelpUrl, options = {}) {
  const periodStartIso = String(options.periodStartIso ?? "").trim();
  const periodEndIso = String(options.periodEndIso ?? "").trim();
  const actorId = options.actorId;
  const rawTemplate = getEnv("APIFY_YELP_INPUT_TEMPLATE_JSON", { fallback: "" });
  const cap = yelpMaxItemsPerRun();
  const sortBy = (getEnv("YELP_SORT_BY", { fallback: "newest" }) || "newest").trim() || "newest";

  if (rawTemplate) {
    const templated = rawTemplate
      .replaceAll("{{YELP_URL}}", yelpUrl)
      .replaceAll("{{yelp_url}}", yelpUrl)
      .replaceAll("{{PERIOD_START}}", periodStartIso)
      .replaceAll("{{PERIOD_END}}", periodEndIso)
      .replaceAll("{{MAX_ITEMS}}", String(cap))
      .replaceAll("{{SORT_BY}}", sortBy);
    return JSON.parse(templated);
  }

  const style = detectYelpInputStyle(actorId);

  if (style === "agents") {
    // actors/yelp-reviews has no date-range input; pull newest maxItems, then pipelines keep only
    // reviews whose parsed review_date falls in PERIOD_START…PERIOD_END (see run-monthly-yelp-pipeline.mjs).
    return {
      startUrls: [yelpUrl],
      sortBy,
      maxItems: cap,
    };
  }

  const input = {
    startUrls: [{ url: yelpUrl }],
    maxReviewsPerUrl: cap,
  };
  const lang = (getEnv("YELP_APIFY_LANGUAGE", { fallback: "" }) || "").trim();
  if (lang) input.language = lang;
  if (periodStartIso) input.dateFrom = periodStartIso;
  if (periodEndIso) input.dateTo = periodEndIso;
  return input;
}

/**
 * @param {{ token: string, actorId: string, input: object, runQuery?: Record<string, string|number> }} opts
 * runQuery.maxItems — forwarded as Apify run query `maxItems` (billing / pay-per-result cap; see Apify run API).
 */
export async function startApifyRun({ token, actorId, input, runQuery = {} }) {
  const params = new URLSearchParams({ token });
  const runMax = runQuery.maxItems;
  if (runMax != null && runMax !== "" && Number.isFinite(Number(runMax))) {
    params.set("maxItems", String(Math.floor(Number(runMax))));
  }

  const response = await fetch(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?${params.toString()}`,
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

export async function waitForApifyRun({ token, runId, timeoutMs: timeoutOverride } = {}) {
  const parsedTimeout = Number(
    timeoutOverride ?? getEnv("APIFY_YELP_TIMEOUT_MS", { fallback: "600000" }),
  );
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 600000;
  const startedAt = Date.now();
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
    if (Date.now() - startedAt >= timeoutMs) {
      try {
        await fetch(
          `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}/abort?token=${encodeURIComponent(token)}`,
          { method: "POST" },
        );
      } catch {
        // Best effort: callers still receive a deterministic timeout.
      }
      throw new Error(`Apify Yelp run ${runId} exceeded ${timeoutMs}ms and was aborted.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

export async function fetchApifyDatasetItems({ token, datasetId, clean = true }) {
  const cleanParam = clean ? "true" : "false";
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=${cleanParam}&format=json`
  );
  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

/**
 * Returns normalized review rows (same shape as normalizeApifyItem output) or throws.
 */
export async function pullYelpReviewsViaApify({ yelpUrl, token, actorId, periodStartIso, periodEndIso } = {}) {
  const cap = yelpMaxItemsPerRun();
  const input = buildApifyInput(yelpUrl, { periodStartIso, periodEndIso, actorId });
  const addRunMaxQuery = !["0", "false", "no"].includes(
    (getEnv("APIFY_YELP_RUN_MAX_ITEMS_QUERY", { fallback: "1" }) || "").toLowerCase(),
  );
  const run = await startApifyRun({
    token,
    actorId,
    input,
    runQuery: addRunMaxQuery ? { maxItems: cap } : {},
  });
  const finalRun = await waitForApifyRun({ token, runId: run.id });
  if (finalRun.status !== "SUCCEEDED") {
    throw new Error(`Apify run ${run.id} ended with status ${finalRun.status}`);
  }
  const datasetClean = !["0", "false", "no"].includes(
    (getEnv("YELP_DATASET_CLEAN", { fallback: "false" }) || "").toLowerCase(),
  );
  const rawItems = await fetchApifyDatasetItems({
    token,
    datasetId: finalRun.defaultDatasetId,
    clean: datasetClean,
  });
  return rawItems;
}
