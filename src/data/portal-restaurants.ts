/**
 * Canonical list for static export (`generateStaticParams`) and SQL seed alignment.
 * Add a row here + redeploy when onboarding a new restaurant page; run matching INSERT in Supabase.
 */
export const PORTAL_RESTAURANTS = [
  { slug: "boca", name: "Boca" },
  { slug: "bourbon-house-pizza-florence", name: "Bourbon House Pizza (Florence)" },
  { slug: "bridges-nepali-cuisine-northside", name: "Bridges Nepali Cuisine (Northside)" },
  { slug: "mitas", name: "Mita's" },
  { slug: "cozys-cafe-and-pub", name: "Cozy's Cafe and Pub" },
  { slug: "elis-bbq-riverside", name: "Eli's BBQ (Riverside)" },
  { slug: "ghost-kitchen-pizza", name: "Ghost Kitchen Pizza" },
  { slug: "herb-and-thelmas-tavern", name: "Herb & Thelma's Tavern" },
  { slug: "knotty-pine-on-the-bayou", name: "Knotty Pine on the Bayou" },
  { slug: "libbys-southern-comfort", name: "Libby's Southern Comfort" },
  { slug: "lisse-steakhuis", name: "Lisse Steakhuis" },
  { slug: "mazunte-taqueria", name: "Mazunte Taqueria" },
  { slug: "the-bakers-table", name: "The Baker's Table" },
  { slug: "the-park-diner", name: "The Park Diner" },
] as const;

export type PortalRestaurantSlug = (typeof PORTAL_RESTAURANTS)[number]["slug"];

export function isPortalRestaurantSlug(s: string): s is PortalRestaurantSlug {
  return PORTAL_RESTAURANTS.some((r) => r.slug === s);
}
