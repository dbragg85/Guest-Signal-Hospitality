const DEFAULT_ORIGIN = "https://guestsignalhospitality.com";

/** Public site origin for metadata, sitemap, and robots (GitHub Pages / production). */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}
