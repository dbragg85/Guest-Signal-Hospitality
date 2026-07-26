/**
 * Apify Reddit collection for Guest Signal (restaurant communities + searches).
 *
 * Uses public scrapers (default: trudax/reddit-scraper-lite). Does NOT send
 * Reddit username/password to Apify — login via third-party scrapers risks bans.
 * Store REDDIT_USERNAME / REDDIT_PASSWORD in secrets for future official API /
 * first-party posting, not for Apify actor input.
 */

import {
  startApifyRun,
  waitForApifyRun,
  fetchApifyDatasetItems,
} from "./apify-yelp-actor.mjs";
import {
  defaultRedditSearches,
  subredditStartUrls,
  RESTAURANT_SUBREDDITS,
} from "./reddit-communities.mjs";

export const DEFAULT_REDDIT_ACTOR_ID = "trudax~reddit-scraper-lite";

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

/**
 * @param {{
 *   mode?: "subreddits" | "searches" | "both",
 *   maxItems?: number,
 *   sort?: string,
 *   subreddits?: string[],
 *   searches?: string[],
 * }} [options]
 */
export function buildRedditApifyInput(options = {}) {
  const mode = options.mode || env("APIFY_REDDIT_MODE", "both") || "both";
  const maxItemsRaw = options.maxItems ?? Number(env("APIFY_REDDIT_MAX_ITEMS", "40") || 40);
  const maxItems = Math.min(200, Math.max(5, Number(maxItemsRaw) || 40));
  const sort = options.sort || env("APIFY_REDDIT_SORT", "hot") || "hot";
  const subs = options.subreddits?.length
    ? options.subreddits
    : RESTAURANT_SUBREDDITS.slice(0, Number(env("APIFY_REDDIT_SUB_LIMIT", "12") || 12));
  const searches = options.searches?.length
    ? options.searches
    : defaultRedditSearches().slice(0, Number(env("APIFY_REDDIT_SEARCH_LIMIT", "10") || 10));

  /** @type {Record<string, unknown>} */
  const input = {
    maxItems,
    maxPostCount: maxItems,
    maxComments: 0,
    skipComments: true,
    includeMediaLinks: false,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
  };

  if (mode === "searches") {
    input.searches = searches;
    input.searchPosts = true;
    input.searchComments = false;
    input.searchCommunities = false;
    input.searchUsers = false;
  } else if (mode === "subreddits") {
    input.startUrls = subredditStartUrls(subs, /** @type {"hot"} */ (sort));
  } else {
    // both: prefer startUrls for communities; add a short search batch
    input.startUrls = subredditStartUrls(subs, /** @type {"hot"} */ (sort));
    input.searches = searches.slice(0, 6);
  }

  const template = env("APIFY_REDDIT_INPUT_TEMPLATE_JSON");
  if (template) {
    return JSON.parse(
      template
        .replaceAll("{{MAX_ITEMS}}", String(maxItems))
        .replaceAll("{{SORT}}", sort),
    );
  }

  return input;
}

/**
 * @param {{
 *   token?: string,
 *   actorId?: string,
 *   mode?: "subreddits" | "searches" | "both",
 *   maxItems?: number,
 *   timeoutMs?: number,
 * }} [opts]
 */
export async function pullRedditRestaurantSignalsViaApify(opts = {}) {
  const token = opts.token || env("APIFY_TOKEN");
  if (!token) throw new Error("APIFY_TOKEN is required for Reddit collection");

  const actorId =
    opts.actorId || env("APIFY_REDDIT_ACTOR_ID") || DEFAULT_REDDIT_ACTOR_ID;
  const input = buildRedditApifyInput({
    mode: opts.mode,
    maxItems: opts.maxItems,
  });

  const run = await startApifyRun({ token, actorId, input });
  const finished = await waitForApifyRun({
    token,
    runId: run.id,
    timeoutMs: opts.timeoutMs ?? Number(env("APIFY_REDDIT_TIMEOUT_MS", "300000") || 300000),
  });

  if (finished.status !== "SUCCEEDED") {
    throw new Error(`Reddit Apify run ${run.id} ended with status ${finished.status}`);
  }

  const items = await fetchApifyDatasetItems({
    token,
    datasetId: finished.defaultDatasetId,
  });

  return {
    runId: run.id,
    actorId,
    itemCount: Array.isArray(items) ? items.length : 0,
    items: Array.isArray(items) ? items : [],
    input,
  };
}

/**
 * Normalize Apify Reddit dataset rows into compact signal objects.
 * @param {unknown[]} items
 */
export function normalizeRedditSignals(items) {
  const out = [];
  for (const raw of items || []) {
    if (!raw || typeof raw !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (raw);
    const title = String(row.title || row.postTitle || "").trim();
    const body = String(row.body || row.text || row.selftext || row.parsedCommunityDescription || "").trim();
    const url = String(row.url || row.postUrl || row.communityUrl || "").trim();
    const community = String(
      row.communityName || row.parsedCommunityName || row.subreddit || row.community || "",
    )
      .replace(/^r\//i, "")
      .trim();
    const created = String(
      row.createdAt || row.parsedCreationDate || row.created || row.timestamp || "",
    ).trim();
    const dataType = String(row.dataType || row.type || "post").toLowerCase();

    if (!title && !body && !community) continue;

    out.push({
      dataType,
      community: community || null,
      title: title.slice(0, 300) || null,
      body: body.slice(0, 1200) || null,
      url: url || null,
      createdAt: created || null,
      upVotes: Number.isFinite(Number(row.upVotes ?? row.ups ?? row.score))
        ? Number(row.upVotes ?? row.ups ?? row.score)
        : null,
      numberOfComments: Number.isFinite(Number(row.numberOfComments ?? row.num_comments))
        ? Number(row.numberOfComments ?? row.num_comments)
        : null,
    });
  }
  return out;
}

/**
 * Derive lightweight trend terms from Reddit titles for newsletter fusion.
 * @param {ReturnType<typeof normalizeRedditSignals>} signals
 * @param {number} [limit]
 */
export function redditSignalsToTrendTerms(signals, limit = 15) {
  const counts = new Map();
  for (const s of signals) {
    const community = s.community ? `r/${s.community}` : null;
    if (community) counts.set(community, (counts.get(community) || 0) + 1);
    const title = s.title || "";
    if (title.length >= 12 && title.length <= 100) {
      counts.set(title, (counts.get(title) || 0) + 0.5);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, weight]) => ({ term, weight }));
}
