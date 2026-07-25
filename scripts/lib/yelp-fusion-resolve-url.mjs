import { getEnv } from "./guest-signal-rubric.mjs";

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function nameSimilarity(left, right) {
  const a = new Set(normalizeName(left).split(" ").filter(Boolean));
  const b = new Set(normalizeName(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / new Set([...a, ...b]).size;
}

export function selectBestYelpBusiness(businesses, lead) {
  const targetName = String(lead?.business ?? "").trim();
  const targetPhone = normalizePhone(lead?.venue_phone ?? lead?.phone);
  const targetCity = normalizeName(lead?.city);
  const targetState = normalizeName(lead?.state);
  const targetZip = String(lead?.zip ?? "").trim();

  const ranked = businesses
    .map((business) => {
      const url = typeof business?.url === "string" ? business.url.trim() : "";
      if (!url.startsWith("https://www.yelp.com/biz")) return null;

      const similarity = nameSimilarity(targetName, business?.name);
      const candidatePhone = normalizePhone(business?.phone ?? business?.display_phone);
      const phoneMatch = Boolean(targetPhone && candidatePhone && targetPhone === candidatePhone);
      const location = business?.location ?? {};
      let score = similarity * 60;
      if (phoneMatch) score += 100;
      if (targetZip && String(location.zip_code ?? "").trim() === targetZip) score += 30;
      if (targetCity && normalizeName(location.city) === targetCity) score += 15;
      if (targetState && normalizeName(location.state) === targetState) score += 10;
      return { business, url, score, similarity, phoneMatch };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || (!best.phoneMatch && best.similarity < 0.5)) return null;
  return best.business;
}

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
  const best = selectBestYelpBusiness(businesses, lead);
  return typeof best?.url === "string" ? best.url.trim() : null;
}
