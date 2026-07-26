/**
 * Official Reddit API client (script app + password grant).
 *
 * Required env:
 *   REDDIT_CLIENT_ID
 *   REDDIT_CLIENT_SECRET
 *   REDDIT_USERNAME
 *   REDDIT_PASSWORD
 * Optional:
 *   REDDIT_USER_AGENT (default identifies Guest Signal Hosp script)
 */

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const OAUTH_BASE = "https://oauth.reddit.com";

/** @type {{ accessToken: string, expiresAt: number } | null} */
let cachedToken = null;

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

function requiredEnv(name) {
  const value = env(name);
  if (!value) throw new Error(`${name} is required for Reddit API posting`);
  return value;
}

export function redditApiConfigured() {
  return Boolean(
    env("REDDIT_CLIENT_ID") &&
      env("REDDIT_CLIENT_SECRET") &&
      env("REDDIT_USERNAME") &&
      env("REDDIT_PASSWORD"),
  );
}

export function redditUserAgent() {
  const username = env("REDDIT_USERNAME", "GuestSignalHosp");
  return (
    env("REDDIT_USER_AGENT") ||
    `web:guest-signal-hosp:v0.1.0 (by /u/${username})`
  );
}

/**
 * @returns {Promise<string>}
 */
export async function getRedditAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = requiredEnv("REDDIT_CLIENT_ID");
  const clientSecret = requiredEnv("REDDIT_CLIENT_SECRET");
  const username = requiredEnv("REDDIT_USERNAME");
  const password = requiredEnv("REDDIT_PASSWORD");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": redditUserAgent(),
    },
    body,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    const detail = json.error || json.message || JSON.stringify(json).slice(0, 200);
    throw new Error(`Reddit auth failed (${response.status}): ${detail}`);
  }

  cachedToken = {
    accessToken: String(json.access_token),
    expiresAt: now + Number(json.expires_in || 3600) * 1000,
  };
  return cachedToken.accessToken;
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: URLSearchParams | Record<string, string>, json?: boolean }} [opts]
 */
export async function redditOauthRequest(path, opts = {}) {
  const token = await getRedditAccessToken();
  const method = opts.method || "GET";
  /** @type {Record<string, string>} */
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": redditUserAgent(),
  };

  /** @type {RequestInit} */
  const init = { method, headers };

  if (opts.body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body =
      opts.body instanceof URLSearchParams
        ? opts.body
        : new URLSearchParams(opts.body);
  }

  const url = path.startsWith("http") ? path : `${OAUTH_BASE}${path}`;
  const response = await fetch(url, init);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Reddit API ${method} ${path} failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  return data;
}

/**
 * Submit a text (self) post.
 * @param {{ subreddit: string, title: string, text: string, nsfw?: boolean, spoiler?: boolean }} input
 */
export async function submitRedditTextPost(input) {
  const subreddit = String(input.subreddit || "")
    .replace(/^r\//i, "")
    .trim();
  if (!subreddit) throw new Error("subreddit is required");
  if (!input.title?.trim()) throw new Error("title is required");
  if (!input.text?.trim()) throw new Error("text is required");

  const data = await redditOauthRequest("/api/submit", {
    method: "POST",
    body: {
      api_type: "json",
      kind: "self",
      sr: subreddit,
      title: input.title.trim().slice(0, 300),
      text: input.text.trim(),
      nsfw: input.nsfw ? "true" : "false",
      spoiler: input.spoiler ? "true" : "false",
      resubmit: "true",
    },
  });

  const errors = data?.json?.errors;
  if (Array.isArray(errors) && errors.length) {
    throw new Error(`Reddit submit errors: ${JSON.stringify(errors)}`);
  }

  const result = data?.json?.data || {};
  return {
    kind: "post",
    id: result.id || null,
    name: result.name || null,
    url: result.url || null,
    raw: data,
  };
}

/**
 * Comment on a post or comment.
 * @param {{ parentFullname: string, text: string }} input
 *   parentFullname e.g. t3_abc123 (post) or t1_abc123 (comment)
 */
export async function submitRedditComment(input) {
  const parent = String(input.parentFullname || "").trim();
  const text = String(input.text || "").trim();
  if (!parent) throw new Error("parentFullname is required");
  if (!text) throw new Error("comment text is required");

  const data = await redditOauthRequest("/api/comment", {
    method: "POST",
    body: {
      api_type: "json",
      thing_id: parent,
      text,
    },
  });

  const errors = data?.json?.errors;
  if (Array.isArray(errors) && errors.length) {
    throw new Error(`Reddit comment errors: ${JSON.stringify(errors)}`);
  }

  const things = data?.json?.data?.things || [];
  const first = things[0]?.data || {};
  return {
    kind: "comment",
    id: first.id || null,
    name: first.name || null,
    permalink: first.permalink
      ? `https://www.reddit.com${first.permalink}`
      : null,
    raw: data,
  };
}

/**
 * Parse a Reddit post URL or short id into a t3_ fullname.
 * @param {string} urlOrId
 */
export function postFullnameFromUrl(urlOrId) {
  const raw = String(urlOrId || "").trim();
  if (!raw) return null;
  if (/^t3_[a-z0-9]+$/i.test(raw)) return raw.toLowerCase();
  if (/^[a-z0-9]+$/i.test(raw) && raw.length <= 10) return `t3_${raw.toLowerCase()}`;

  const match = raw.match(/\/comments\/([a-z0-9]+)\//i);
  if (match) return `t3_${match[1].toLowerCase()}`;
  return null;
}

/**
 * Lightweight identity check (confirms auth works).
 */
export async function getRedditMe() {
  return redditOauthRequest("/api/v1/me");
}
