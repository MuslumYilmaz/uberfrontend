/**
 * Guides with the account gate on. A visitor without an account reads the structure and a lead-in: the round names,
 * who they apply to, how many public reports stand behind each, the first technical round in full and the first
 * practice prompt with its answer guide. What each other round asks, the sources and the other prompts open with a
 * free account; the answer guides and the Premium practice open with Premium.
 *
 * The gate goes out in waves so Search Console can be read page by page: the first wave is guides with no clicks in
 * the 28 days to 30 October 2026. The gated text stays in the HTML under `.premium-locked` with `data-nosnippet`, and
 * the page's structured data marks it, so search engines index it and quote only what a visitor reads.
 */
export const GATED_COMPANY_GUIDES: ReadonlySet<string> = new Set([
  'google',
  'netflix',
  'meta',
  'apple',
  'microsoft',
  'stripe',
  'uber',
  'tesla',
  'zalando',
  'spotify',
]);

export const isCompanyGuideGated = (slug: string): boolean => GATED_COMPANY_GUIDES.has(slug);
