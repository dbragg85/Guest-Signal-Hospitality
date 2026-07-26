/** SEO resource hub: URLs use trailing slash (static export). */
export const resourceArticles = [
  {
    slug: "restaurant-review-management",
    title: "Restaurant review management",
    description:
      "Restaurant review management for operators: monitoring, response SLAs, theme scorecards, and weekly floor moves—beyond inbox tools.",
    headline: "Restaurant review management: scorecards, not just inboxes",
  },
  {
    slug: "restaurant-review-scorecard",
    title: "Restaurant review scorecard",
    description:
      "What a restaurant review scorecard should measure: weighted pillars, theme friction, SWOT, and three floor moves—not a vanity star average.",
    headline: "Restaurant review scorecard: pillars, themes, and weekly moves",
  },
  {
    slug: "guest-recovery-solutions",
    title: "Guest recovery solutions",
    description:
      "Guest recovery solutions for restaurants: 48-hour reply discipline, floor recovery language, and theme fixes that protect Google ratings.",
    headline: "Guest recovery solutions for restaurants: floor playbooks that stick",
  },
  {
    slug: "respond-to-restaurant-reviews",
    title: "Respond to restaurant reviews",
    description:
      "How to respond to restaurant reviews on Google and Yelp: 48-hour SLAs, reply shapes for 1★–5★, and when to escalate to floor fixes.",
    headline: "How to respond to restaurant reviews on Google and Yelp",
  },
  {
    slug: "restaurant-review-monitoring",
    title: "Restaurant review monitoring",
    description:
      "Restaurant review monitoring for operators: Google and Yelp themes, risk alerts, and monthly scorecards—not just star averages.",
    headline: "Restaurant review monitoring: themes, alerts, and scorecards",
  },
  {
    slug: "google-reviews-for-restaurants",
    title: "Google Reviews for restaurants",
    description:
      "Why Google reviews drive local demand, which themes matter, and how to turn feedback into training and messaging priorities.",
    headline: "Google Reviews for restaurants: from noise to a clear plan",
  },
  {
    slug: "yelp-reviews-for-restaurants",
    title: "Yelp reviews for restaurants",
    description:
      "How Yelp reviews affect restaurants alongside Google: themes to track, reply discipline, and dual-source scorecards.",
    headline: "Yelp reviews for restaurants: themes, replies, and scorecards",
  },
  {
    slug: "restaurant-reputation",
    title: "Restaurant reputation",
    description:
      "Restaurant reputation for operators: Google and Yelp themes, response discipline, and a weekly scorecard cadence that protects guest perception.",
    headline: "Restaurant reputation: reviews, themes, and weekly scorecards",
  },
  {
    slug: "guest-signal-vs-review-tools",
    title: "Guest Signal vs review tools",
    description:
      "How Guest Signal’s pillar scorecards and SWOT playbooks differ from Birdeye, Podium, and other review inbox platforms.",
    headline: "Guest Signal vs Birdeye, Podium, and review inbox tools",
  },

  {
    slug: "cincinnati-restaurant-reputation",
    title: "Cincinnati restaurant reputation",
    description:
      "How Cincinnati-area restaurants can protect and improve guest perception with structured review intelligence and scorecards.",
    headline: "Cincinnati restaurant reputation and guest experience",
  },
  {
    slug: "florence-sc-restaurant-reputation",
    title: "Florence SC restaurant reputation",
    description:
      "Restaurant reputation for Florence, South Carolina: Google and Yelp themes, response discipline, and weekly scorecards for local demand.",
    headline: "Florence SC restaurant reputation: reviews, themes, and scorecards",
  },
  {
    slug: "charlotte-nc-restaurant-reputation",
    title: "Charlotte NC restaurant reputation",
    description:
      "Restaurant reputation for Charlotte, North Carolina: Google and Yelp themes, response discipline, and weekly scorecards for local demand.",
    headline: "Charlotte NC restaurant reputation: reviews, themes, and scorecards",
  },
  {
    slug: "nashville-tn-restaurant-reputation",
    title: "Nashville TN restaurant reputation",
    description:
      "Restaurant reputation for Nashville, Tennessee: high review velocity, tourist noise, themes, and weekly scorecards for local demand.",
    headline: "Nashville TN restaurant reputation: reviews, themes, and scorecards",
  },
  {
    slug: "columbus-oh-restaurant-reputation",
    title: "Columbus OH restaurant reputation",
    description:
      "Restaurant reputation for Columbus, Ohio: campus and suburb dining, Google and Yelp themes, response speed, and weekly scorecards.",
    headline: "Columbus OH restaurant reputation: reviews, themes, and scorecards",
  },

  {
    slug: "google-restaurant-ratings",
    title: "Google restaurant ratings",
    description:
      "How Google restaurant ratings shape Maps and search demand, what moves them, and how to turn rating risk into weekly priorities.",
    headline: "Google restaurant ratings: how they shape local demand",
  },
  {
    slug: "restaurant-seo-google-ratings",
    title: "Restaurant SEO and Google ratings",
    description:
      "How restaurant SEO and Google ratings work together for local pack visibility—with a practical weekly operator checklist.",
    headline: "Restaurant SEO and Google ratings: win local search",
  },
  {
    slug: "improve-google-restaurant-rating",
    title: "Improve Google restaurant rating",
    description:
      "A practical operator playbook to improve your Google restaurant rating: response speed, recurring themes, review velocity, and a weekly cadence that sticks.",
    headline: "How to improve your Google restaurant rating (operator playbook)",
  },
  {
    slug: "get-more-restaurant-reviews",
    title: "Get more restaurant reviews",
    description:
      "How to get more restaurant reviews on Google and Yelp ethically: ask timing, QR habits, response discipline, and quality over star-chasing.",
    headline: "How to get more restaurant reviews without star-chasing",
  },
] as const;

export type ResourceSlug = (typeof resourceArticles)[number]["slug"];
