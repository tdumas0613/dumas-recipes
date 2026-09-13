export const SITE_NAME = "Dumas Family Recipes";

export const SITE_TAGLINE =
  "Recipes we've made more than once, written down properly so the second time is easier than the first.";

/**
 * Set NEXT_PUBLIC_SITE_URL in the Vercel project once a domain exists.
 * Falls back to localhost so absolute URLs (sitemap, RSS, JSON-LD) still
 * resolve to something valid in dev and in a build with no env configured.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
