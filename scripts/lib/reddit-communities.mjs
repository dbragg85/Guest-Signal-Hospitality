/**
 * Restaurant / hospitality Reddit communities + local market search seeds.
 * Used by Apify Reddit collection (public listings — no login required).
 */

/** Core operator / industry communities */
export const RESTAURANT_SUBREDDITS = [
  "restaurant",
  "restaurateurs",
  "KitchenConfidential",
  "serverlife",
  "TalesFromYourServer",
  "hospitality",
  "smallbusiness",
  "Entrepreneur",
  "googlemaps",
  "yelp",
  "SEO",
  "LocalSEO",
  "marketing",
  "CustomerService",
  "cincinnati",
  "Columbus",
  "nashville",
  "Charlotte",
  "chicago",
  "Austin",
  "atlanta",
];

/** Search queries that surface restaurant reputation / ops chatter */
export const RESTAURANT_SEARCH_TERMS = [
  "google restaurant reviews",
  "restaurant google rating",
  "restaurant reputation management",
  "negative google review restaurant",
  "restaurant review response",
  "independent restaurant marketing",
  "guest recovery restaurant",
];

/** Priority cities (aligned with src/content/markets.ts) */
export const MARKET_CITIES = [
  "Cincinnati",
  "Columbus",
  "Louisville",
  "Indianapolis",
  "Nashville",
  "Chicago",
  "Austin",
  "Denver",
  "Atlanta",
  "Charlotte",
  "Pittsburgh",
  "Cleveland",
  "Detroit",
  "Minneapolis",
  "Kansas City",
  "St. Louis",
  "Florence SC",
];

/**
 * Build Apify start URLs for subreddit listings.
 * @param {string[]} [subs]
 * @param {"hot"|"new"|"top"|"rising"} [sort]
 */
export function subredditStartUrls(subs = RESTAURANT_SUBREDDITS, sort = "hot") {
  return subs.map((name) => ({
    url: `https://www.reddit.com/r/${name}/${sort}/`,
  }));
}

/**
 * Local market search terms.
 * @param {number} [limit]
 */
export function marketSearchTerms(limit = 12) {
  return MARKET_CITIES.slice(0, limit).flatMap((city) => [
    `${city} restaurant reviews`,
    `${city} restaurant google rating`,
  ]);
}

export function defaultRedditSearches() {
  return [...RESTAURANT_SEARCH_TERMS, ...marketSearchTerms(8)];
}
