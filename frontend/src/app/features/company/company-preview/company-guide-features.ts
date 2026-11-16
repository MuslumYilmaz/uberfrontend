/**
 * The company guide redesign ships behind three switches, one per change, so each can be turned off on its own: the
 * SEO rollback rule turns off `lockedQuestions` alone if the most clicked guides lose impressions or position. Every
 * guide's process lists reported questions, which the layout needs; a spec fails for a guide without them.
 */
export type CompanyGuideFeatures = {
  /** No source links in the upper page: rows say who reported a round and when, and one collapsed list ends the page. */
  readonly sourcesAtEnd: boolean;
  /** One reported-question list with its first row open and the rest locked; the prep sections lock with it. */
  readonly lockedQuestions: boolean;
  /** Per-round question counts, frequency and NEW tags, the one free unlock and the priced offer in the list. */
  readonly premiumPull: boolean;
};

export const COMPANY_GUIDE_FEATURES: CompanyGuideFeatures = {
  sourcesAtEnd: true,
  lockedQuestions: true,
  premiumPull: true,
};
