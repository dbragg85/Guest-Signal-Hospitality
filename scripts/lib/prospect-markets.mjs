/** Expansion markets for prospect research (keep in sync with src/content/markets.ts). */
export const prospectMarkets = [
  {
    slug: "cincinnati-oh",
    city: "Cincinnati",
    stateCode: "OH",
    locationQuery: "Cincinnati, Ohio, USA",
    searchPhrase: "independent restaurants in Cincinnati Ohio",
  },
  {
    slug: "columbus-oh",
    city: "Columbus",
    stateCode: "OH",
    locationQuery: "Columbus, Ohio, USA",
    searchPhrase: "independent restaurants in Columbus Ohio",
  },
  {
    slug: "louisville-ky",
    city: "Louisville",
    stateCode: "KY",
    locationQuery: "Louisville, Kentucky, USA",
    searchPhrase: "independent restaurants in Louisville Kentucky",
  },
  {
    slug: "indianapolis-in",
    city: "Indianapolis",
    stateCode: "IN",
    locationQuery: "Indianapolis, Indiana, USA",
    searchPhrase: "independent restaurants in Indianapolis Indiana",
  },
  {
    slug: "nashville-tn",
    city: "Nashville",
    stateCode: "TN",
    locationQuery: "Nashville, Tennessee, USA",
    searchPhrase: "independent restaurants in Nashville Tennessee",
  },
  {
    slug: "chicago-il",
    city: "Chicago",
    stateCode: "IL",
    locationQuery: "Chicago, Illinois, USA",
    searchPhrase: "independent restaurants in Chicago Illinois",
  },
  {
    slug: "austin-tx",
    city: "Austin",
    stateCode: "TX",
    locationQuery: "Austin, Texas, USA",
    searchPhrase: "independent restaurants in Austin Texas",
  },
  {
    slug: "denver-co",
    city: "Denver",
    stateCode: "CO",
    locationQuery: "Denver, Colorado, USA",
    searchPhrase: "independent restaurants in Denver Colorado",
  },
  {
    slug: "atlanta-ga",
    city: "Atlanta",
    stateCode: "GA",
    locationQuery: "Atlanta, Georgia, USA",
    searchPhrase: "independent restaurants in Atlanta Georgia",
  },
  {
    slug: "charlotte-nc",
    city: "Charlotte",
    stateCode: "NC",
    locationQuery: "Charlotte, North Carolina, USA",
    searchPhrase: "independent restaurants in Charlotte North Carolina",
  },
  {
    slug: "pittsburgh-pa",
    city: "Pittsburgh",
    stateCode: "PA",
    locationQuery: "Pittsburgh, Pennsylvania, USA",
    searchPhrase: "independent restaurants in Pittsburgh Pennsylvania",
  },
  {
    slug: "cleveland-oh",
    city: "Cleveland",
    stateCode: "OH",
    locationQuery: "Cleveland, Ohio, USA",
    searchPhrase: "independent restaurants in Cleveland Ohio",
  },
  {
    slug: "detroit-mi",
    city: "Detroit",
    stateCode: "MI",
    locationQuery: "Detroit, Michigan, USA",
    searchPhrase: "independent restaurants in Detroit Michigan",
  },
  {
    slug: "minneapolis-mn",
    city: "Minneapolis",
    stateCode: "MN",
    locationQuery: "Minneapolis, Minnesota, USA",
    searchPhrase: "independent restaurants in Minneapolis Minnesota",
  },
  {
    slug: "kansas-city-mo",
    city: "Kansas City",
    stateCode: "MO",
    locationQuery: "Kansas City, Missouri, USA",
    searchPhrase: "independent restaurants in Kansas City Missouri",
  },
  {
    slug: "st-louis-mo",
    city: "St. Louis",
    stateCode: "MO",
    locationQuery: "St. Louis, Missouri, USA",
    searchPhrase: "independent restaurants in St Louis Missouri",
  },
];

export function resolveProspectMarket({ slug, searchQuery } = {}) {
  const fromSlug = slug?.trim()
    ? prospectMarkets.find((m) => m.slug === slug.trim())
    : null;
  if (fromSlug) return fromSlug;

  if (searchQuery?.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const match = prospectMarkets.find(
      (m) =>
        m.searchPhrase.toLowerCase() === q ||
        q.includes(m.city.toLowerCase().replace(".", "")),
    );
    if (match) {
      return { ...match, searchPhrase: searchQuery.trim() };
    }
    return {
      slug: "custom",
      city: "target market",
      stateCode: "",
      locationQuery: searchQuery.trim(),
      searchPhrase: searchQuery.trim(),
    };
  }

  // Rotate weekly across expansion markets (ISO week).
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayNum = Math.floor(utc / 86_400_000);
  const weekIndex = Math.floor(dayNum / 7) % prospectMarkets.length;
  return prospectMarkets[weekIndex];
}
