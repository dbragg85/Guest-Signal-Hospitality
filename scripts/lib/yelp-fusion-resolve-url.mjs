import { getEnv } from "./guest-signal-rubric.mjs";

/**
 * Resolve a Yelp business page URL from lead fields using Yelp Fusion API v3
 * (https://docs.developer.yelp.com/docs/fusion-intro). No customer input required.
 *
 * Env: YELP_FUSION_API_KEY — create at https://www.yelp.com/developers/v3/manage_app
 */
export async function resolveYelpBusinessUrlFromLead(lead) {
  const key = getEnv("YELP_FUSION_API_KEY", { fallback: "" }).trim();
  if (!key) return null;

  const term = String(lead?.business || "").trim();
  const city = String(lead?.city || "").trim();
  const state = String(lead?.state || "").trim();
  const zip = String(lead?.zip || "").trim();
  const location = [city, state, zip].filter((p) => p && p !== "—").join(", ");

  if (!term || !location) {
    console.warn("Yelp Fusion resolve skipped: need business name and city/state or zip on the lead.");
    return null;
  }

  const params = new URLSearchParams({
    term,
    location,
    limit: "5",
  });

  const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  const rawText = await res.text();
  if (!res.ok) {
    console.warn(`Yelp Fusion search failed (${res.status}):`, rawText.slice(0, 300));
    return null;
  }

  let body;
  try {
    body = JSON.parse(rawText);
  } catch {
    return null;
  }

  const businesses = Array.isArray(body?.businesses) ? body.businesses : [];
  for (const b of businesses) {
    const url = typeof b?.url === "string" ? b.url.trim() : "";
    if (url.startsWith("https://www.yelp.com/biz")) return url;
  }

  return null;
}
