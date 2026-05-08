/** SEO resource hub: URLs use trailing slash (static export). */
export const resourceArticles = [
  {
    slug: "restaurant-review-monitoring",
    title: "Restaurant review monitoring",
    description:
      "What to track monthly when you watch Google (and Yelp) reviews—volume, themes, risks, and owner-ready next steps.",
    headline: "Restaurant review monitoring that operators actually use",
  },
  {
    slug: "google-reviews-for-restaurants",
    title: "Google Reviews for restaurants",
    description:
      "Why Google reviews drive local demand, which themes matter, and how to turn feedback into training and messaging priorities.",
    headline: "Google Reviews for restaurants: from noise to a clear plan",
  },
  {
    slug: "cincinnati-restaurant-reputation",
    title: "Cincinnati restaurant reputation",
    description:
      "How Cincinnati-area restaurants can protect and improve guest perception with structured review intelligence and scorecards.",
    headline: "Cincinnati restaurant reputation and guest experience",
  },
] as const;

export type ResourceSlug = (typeof resourceArticles)[number]["slug"];
