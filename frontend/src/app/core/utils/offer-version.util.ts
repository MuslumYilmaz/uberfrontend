export const PRICING_BASELINE_OFFER_VERSION = 'pricing_baseline_v1';
export const PRICING_V2_OFFER_VERSION = 'interview_sprint_v2';
export const PRICING_V3_OFFER_VERSION = 'interview_sprint_v3';

/**
 * Offer version baked into prerendered HTML. Production runs the sprint family,
 * so the static page must render it too; the checkout config replaces it after
 * hydration and only an unreachable config leaves this default in place.
 */
export const PRERENDER_OFFER_VERSION = PRICING_V2_OFFER_VERSION;

const SPRINT_OFFER_PATTERN = /^interview_sprint_v(?:[2-9]|[1-9]\d+)$/;

/**
 * The sprint layout (three primary plans, lifetime as a secondary option, product
 * proof, post-purchase success page) applies to interview_sprint_v2 and every later
 * sprint version, so a price switch under a new version label keeps the page intact.
 */
export function isSprintOfferVersion(version: unknown): boolean {
  return SPRINT_OFFER_PATTERN.test(String(version ?? '').trim().toLowerCase());
}
