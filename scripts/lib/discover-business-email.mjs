#!/usr/bin/env node

const EMAIL_RE =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const BLOCKED_LOCAL = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "postmaster",
  "webmaster",
]);

const BLOCKED_HOST_PARTS = [
  "example.com",
  "sentry.io",
  "wixpress.com",
  "godaddy.com",
  "squarespace.com",
  "shopify.com",
  "cloudflare.com",
  "google.com",
  "gstatic.com",
  "schema.org",
  "w3.org",
  "facebook.com",
  "instagram.com",
  "yelp.com",
  "tripadvisor.com",
];

const ROLE_BONUS = {
  info: 40,
  hello: 38,
  contact: 36,
  reservations: 34,
  reserve: 32,
  booking: 30,
  dine: 28,
  events: 26,
  catering: 24,
  hospitality: 22,
  manager: 18,
  owner: 16,
  gm: 14,
  office: 12,
};

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^mailto:/i, "")
    .split("?")[0]
    .replace(/[>),.;]+$/g, "");
}

function isValidEmail(email) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function emailScore(email, websiteHost) {
  const [local, host] = email.split("@");
  if (!local || !host) return -100;
  if (BLOCKED_LOCAL.has(local)) return -100;
  if (BLOCKED_HOST_PARTS.some((part) => host.includes(part))) return -100;
  if (local.includes("noreply") || local.includes("no-reply")) return -100;

  let score = 10;
  const role = local.split(/[._+-]/)[0];
  score += ROLE_BONUS[role] ?? 0;
  if (websiteHost && (host === websiteHost || host.endsWith(`.${websiteHost}`))) {
    score += 50;
  }
  if (local.includes(".")) score += 2;
  return score;
}

function extractEmails(html) {
  const found = new Set();
  for (const match of html.matchAll(/mailto:([^"'>\s]+)/gi)) {
    found.add(normalizeEmail(match[1]));
  }
  for (const match of html.matchAll(EMAIL_RE)) {
    found.add(normalizeEmail(match[0]));
  }
  return [...found].filter(isValidEmail);
}

function candidatePaths(websiteUrl) {
  let base;
  try {
    base = new URL(websiteUrl);
  } catch {
    return [];
  }
  if (!/^https?:$/i.test(base.protocol)) return [];
  if (/facebook\.com|instagram\.com|yelp\.com|tripadvisor\.com/i.test(base.hostname)) {
    return [];
  }
  const roots = [
    "/",
    "/contact",
    "/contact-us",
    "/contactus",
    "/about",
    "/about-us",
    "/reservations",
    "/reserve",
    "/private-events",
    "/events",
  ];
  return roots.map((path) => new URL(path, base).toString());
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "GuestSignalHospitality/1.0 (+https://guestsignalhospitality.com/; public-contact discovery)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType) && contentType) {
      return "";
    }
    const text = await response.text();
    return text.slice(0, 350_000);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export function pickBestPublicEmail(candidates, websiteUrl) {
  const websiteHost = hostFromUrl(websiteUrl);
  let best = null;
  for (const email of candidates) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) continue;
    const score = emailScore(normalized, websiteHost);
    if (score < 20) continue;
    if (!best || score > best.score) {
      best = { email: normalized, score };
    }
  }
  return best?.email ?? null;
}

export function emailsFromPlaceItem(item) {
  const raw = [
    item.email,
    item.emails,
    item.contactEmail,
    item.ownerEmail,
    ...(Array.isArray(item.emails) ? item.emails : []),
  ]
    .flat()
    .map(normalizeEmail)
    .filter(isValidEmail);
  return [...new Set(raw)];
}

export async function discoverBusinessEmail({ websiteUrl, placeEmails = [] } = {}) {
  const fromPlace = pickBestPublicEmail(placeEmails, websiteUrl);
  if (fromPlace) {
    return { email: fromPlace, source: "public_listing" };
  }

  const paths = candidatePaths(websiteUrl);
  if (!paths.length) return { email: null, source: null };

  const found = new Set();
  for (const path of paths) {
    const html = await fetchText(path);
    if (!html) continue;
    for (const email of extractEmails(html)) found.add(email);
  }
  const email = pickBestPublicEmail([...found], websiteUrl);
  return { email, source: email ? "website_public_page" : null };
}
