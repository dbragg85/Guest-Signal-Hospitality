/** SEO resource hub: URLs use trailing slash (static export). */
export const resourceArticles = [
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
] as const;

export type ResourceSlug = (typeof resourceArticles)[number]["slug"];
