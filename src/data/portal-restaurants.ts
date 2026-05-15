/**
 * Legacy static-export slug list (Boca, Mita's, etc.) — retired.
 * Portal restaurants now come only from Supabase (memberships + RLS).
 * Intake-created venues use /portal/dashboard/ after sign-in.
 */
export const PORTAL_RESTAURANTS = [] as const;

export type PortalRestaurantSlug = string;

/** @deprecated Static slug allowlist removed; any slug from the DB is valid in the dashboard. */
export function isPortalRestaurantSlug(_s: string): _s is PortalRestaurantSlug {
  return false;
}

/** Legacy demo slugs — keep in sync with scripts/lib/demo-restaurant-slugs.mjs */
export const DEMO_RESTAURANT_SLUGS = [
  "boca",
  "bourbon-house-pizza-florence",
  "bridges-nepali-cuisine-northside",
  "mitas",
  "cozys-cafe-and-pub",
  "elis-bbq-riverside",
  "ghost-kitchen-pizza",
  "herb-and-thelmas-tavern",
  "knotty-pine-on-the-bayou",
  "libbys-southern-comfort",
  "lisse-steakhuis",
  "mazunte-taqueria",
  "the-bakers-table",
  "the-park-diner",
  "west-shine-family-restaurant",
] as const;
