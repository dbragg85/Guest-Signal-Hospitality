export type Market = {
  slug: string;
  city: string;
  state: string;
  stateCode: string;
  regionLabel: string;
  searchPhrase: string;
  blurb: string;
};

/** Priority restaurant markets for SEO + prospect expansion beyond Cincinnati. */
export const markets: Market[] = [
  {
    slug: "cincinnati-oh",
    city: "Cincinnati",
    state: "Ohio",
    stateCode: "OH",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Cincinnati Ohio",
    blurb:
      "Home market. Dense independent dining, sports-driven peaks, and guests who compare you to the next neighborhood over.",
  },
  {
    slug: "columbus-oh",
    city: "Columbus",
    state: "Ohio",
    stateCode: "OH",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Columbus Ohio",
    blurb:
      "Fast-growing campus and suburb dining where Google ratings and speed-of-response decide weeknight choices.",
  },
  {
    slug: "louisville-ky",
    city: "Louisville",
    state: "Kentucky",
    stateCode: "KY",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Louisville Kentucky",
    blurb:
      "Bourbon-tourism traffic plus loyal locals—review themes around hospitality consistency cut through quickly.",
  },
  {
    slug: "indianapolis-in",
    city: "Indianapolis",
    state: "Indiana",
    stateCode: "IN",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Indianapolis Indiana",
    blurb:
      "Event weekends and neighborhood gems compete for the same search pack—scorecards keep priorities clear.",
  },
  {
    slug: "nashville-tn",
    city: "Nashville",
    state: "Tennessee",
    stateCode: "TN",
    regionLabel: "South",
    searchPhrase: "independent restaurants in Nashville Tennessee",
    blurb:
      "High review velocity and tourist noise. Operators need theme clarity, not another dashboard.",
  },
  {
    slug: "chicago-il",
    city: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Chicago Illinois",
    blurb:
      "Neighborhood competition is ruthless. Google ratings and reply quality show up in reservation demand.",
  },
  {
    slug: "austin-tx",
    city: "Austin",
    state: "Texas",
    stateCode: "TX",
    regionLabel: "South",
    searchPhrase: "independent restaurants in Austin Texas",
    blurb:
      "New concepts launch constantly. Visibility and review response speed protect early momentum.",
  },
  {
    slug: "denver-co",
    city: "Denver",
    state: "Colorado",
    stateCode: "CO",
    regionLabel: "West",
    searchPhrase: "independent restaurants in Denver Colorado",
    blurb:
      "Seasonal swings and outdoor dining expectations make recurring guest themes easy to miss without a score.",
  },
  {
    slug: "atlanta-ga",
    city: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    regionLabel: "South",
    searchPhrase: "independent restaurants in Atlanta Georgia",
    blurb:
      "Multi-neighborhood dining where local pack rankings and reputation recovery both matter.",
  },
  {
    slug: "charlotte-nc",
    city: "Charlotte",
    state: "North Carolina",
    stateCode: "NC",
    regionLabel: "South",
    searchPhrase: "independent restaurants in Charlotte North Carolina",
    blurb:
      "Banking-town weekdays and weekend destination dining—operators need crisp monthly priorities.",
  },
  {
    slug: "pittsburgh-pa",
    city: "Pittsburgh",
    state: "Pennsylvania",
    stateCode: "PA",
    regionLabel: "Northeast",
    searchPhrase: "independent restaurants in Pittsburgh Pennsylvania",
    blurb:
      "Neighborhood loyalty is strong, but Google still decides first-time guests from searches.",
  },
  {
    slug: "cleveland-oh",
    city: "Cleveland",
    state: "Ohio",
    stateCode: "OH",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Cleveland Ohio",
    blurb:
      "Revitalized dining corridors where review themes reveal service and value gaps early.",
  },
  {
    slug: "detroit-mi",
    city: "Detroit",
    state: "Michigan",
    stateCode: "MI",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Detroit Michigan",
    blurb:
      "Independent energy is high. Structured reputation reads help owners staff and train with focus.",
  },
  {
    slug: "minneapolis-mn",
    city: "Minneapolis",
    state: "Minnesota",
    stateCode: "MN",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Minneapolis Minnesota",
    blurb:
      "Seasonality and neighborhood identity show up in reviews—monthly scorecards keep teams aligned.",
  },
  {
    slug: "kansas-city-mo",
    city: "Kansas City",
    state: "Missouri",
    stateCode: "MO",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in Kansas City Missouri",
    blurb:
      "BBQ destinations and new independents share search real estate—ratings and themes decide clicks.",
  },
  {
    slug: "st-louis-mo",
    city: "St. Louis",
    state: "Missouri",
    stateCode: "MO",
    regionLabel: "Midwest",
    searchPhrase: "independent restaurants in St Louis Missouri",
    blurb:
      "Neighborhood restaurants win on consistency. Guest Signal turns review language into a short action list.",
  },
];

export function getMarket(slug: string): Market | undefined {
  return markets.find((market) => market.slug === slug);
}
