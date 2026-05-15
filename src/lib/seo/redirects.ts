/** Legacy newsletter URL slugs → canonical short slugs under /insights/ */
export const legacyNewsletterRedirects: Record<string, string> = {
  "2026-04-15-this-week-in-hospitality-signals-menu-value-positioning-for-repeat-vi":
    "menu-value-positioning",
  "2026-04-22-this-week-in-hospitality-signals-service-consistency-under-pressure-d":
    "service-consistency",
  "2026-04-29-this-week-in-hospitality-signals-guest-recovery-playbooks-for-frontli":
    "guest-recovery-playbooks",
  "2026-04-08-this-week-in-hospitality-signals-review-response-speed-that-protects-":
    "review-response-speed",
  "2026-05-06-this-week-in-hospitality-signals-local-marketing-signal-alignment-wit":
    "restaurant-local-marketing",
  "2026-05-09-this-week-in-hospitality-signals-restaurant-value-menus":
    "restaurant-value-menus",
};

export function getLegacyRedirectTarget(
  slug: string,
  dynamicLegacyMap?: Record<string, string>,
): string | null {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return dynamicLegacyMap?.[clean] ?? legacyNewsletterRedirects[clean] ?? null;
}

export function buildLegacySlugMap(
  entries: Array<{ legacySlug?: string; slug: string }>,
): Record<string, string> {
  const map: Record<string, string> = { ...legacyNewsletterRedirects };
  for (const entry of entries) {
    const legacy = entry.legacySlug?.replace(/^\/+|\/+$/g, "");
    const target = entry.slug.replace(/^\/+|\/+$/g, "");
    if (legacy && target) map[legacy] = target;
  }
  return map;
}

export function getAllLegacyNewsletterSlugs(): string[] {
  return Object.keys(legacyNewsletterRedirects);
}
