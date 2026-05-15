import { firstNonEmptyString, firstNonNull, parseNumber } from "./guest-signal-rubric.mjs";

/**
 * Extract listing profile from Compass / Google Maps review actor rows (place fields repeat per review).
 * @param {unknown[]} rawItems
 * @returns {null | {
 *   google_rating: number | null,
 *   price_level: number | null,
 *   price_level_label: string | null,
 *   logo_url: string | null,
 *   latitude: number | null,
 *   longitude: number | null,
 *   phone: string | null,
 *   place_id: string | null,
 *   place_name: string | null,
 * }}
 */
export function extractGooglePlaceProfileFromApifyItems(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length) return null;

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const profile = extractFromApifyRow(item);
    if (profile?.google_rating != null || profile?.logo_url || profile?.price_level_label) {
      return profile;
    }
  }
  return extractFromApifyRow(rawItems[0]);
}

function extractFromApifyRow(item) {
  const totalScore = parsePlaceRating(
    firstNonNull(item, ["totalScore", "placeTotalScore", "placeRating", "averageRating"]),
  );
  const priceRaw = firstNonEmptyString(item, ["price", "priceLevel", "priceTag"]);
  const { price_level, price_level_label } = parsePriceFields(priceRaw, item);

  const imageUrl = firstNonEmptyString(item, [
    "imageUrl",
    "image",
    "thumbnailUrl",
    "placeImageUrl",
    "mainPhotoUrl",
  ]);

  const loc = firstNonNull(item, ["location", "placeLocation", "coordinates"]);
  let latitude = null;
  let longitude = null;
  if (loc && typeof loc === "object") {
    latitude = parseNumber(loc.lat ?? loc.latitude);
    longitude = parseNumber(loc.lng ?? loc.longitude);
  }

  const phone = firstNonEmptyString(item, ["phone", "phoneNumber", "placePhone"]);
  const placeId = firstNonEmptyString(item, ["placeId", "place_id", "cid", "fid"]);
  const placeName = firstNonEmptyString(item, ["title", "placeName", "name"]);

  return {
    google_rating: totalScore,
    price_level,
    price_level_label,
    logo_url: imageUrl || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    phone: phone || null,
    place_id: placeId || null,
    place_name: placeName || null,
  };
}

function parsePlaceRating(value) {
  const n = parseNumber(value);
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 0 || n > 5) return null;
  return Math.round(n * 10) / 10;
}

/**
 * Google Maps price: "$", "$$", "$10–20", "€€", etc.
 * Stores human label + 0–4 tier when inferable.
 */
function parsePriceFields(priceRaw, item) {
  const numericLevel = firstNonNull(item, ["priceLevel", "price_level"]);
  const n = parseNumber(numericLevel);
  if (n != null && Number.isFinite(n) && n >= 0 && n <= 4) {
    return { price_level: Math.round(n), price_level_label: priceRaw || null };
  }

  const label = priceRaw?.trim() || null;
  if (!label) return { price_level: null, price_level_label: null };

  const dollarOnly = label.match(/^\$+$/);
  if (dollarOnly) {
    return { price_level: Math.min(4, label.length), price_level_label: label };
  }

  const euroOnly = label.match(/^€+$/);
  if (euroOnly) {
    return { price_level: Math.min(4, label.length), price_level_label: label };
  }

  const inferred = inferPriceLevelFromRange(label);
  return { price_level: inferred, price_level_label: label };
}

function inferPriceLevelFromRange(label) {
  const nums = label.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (avg < 15) return 1;
  if (avg < 30) return 2;
  if (avg < 60) return 3;
  return 4;
}

/**
 * Build restaurants table patch (only non-null extracted fields).
 * @param {ReturnType<typeof extractGooglePlaceProfileFromApifyItems>} profile
 */
export function restaurantPatchFromGooglePlaceProfile(profile) {
  if (!profile) return {};
  const patch = {};
  if (profile.google_rating != null) patch.google_rating = profile.google_rating;
  if (profile.price_level != null) patch.price_level = profile.price_level;
  if (profile.price_level_label) patch.price_level_label = profile.price_level_label;
  if (profile.logo_url) patch.logo_url = profile.logo_url;
  if (profile.latitude != null) patch.latitude = profile.latitude;
  if (profile.longitude != null) patch.longitude = profile.longitude;
  if (profile.phone) patch.phone = profile.phone;
  return patch;
}
