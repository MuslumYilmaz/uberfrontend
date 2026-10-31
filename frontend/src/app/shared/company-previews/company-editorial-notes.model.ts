import type { AuthoredFaq, AuthoredRoundSpotlight } from './authored-company-preview.model';

/** An internal route or an in-page anchor on the same preview (process table stage, official pages, reports). */
export type EditorialLink = {
  readonly label: string;
  readonly path?: string;
  readonly fragment?: string;
};

export type EditorialBullet = {
  readonly text: string;
  readonly link?: EditorialLink;
};

export type EditorialPrepStep = {
  readonly label: string;
  readonly path: string;
  readonly access: 'free' | 'premium';
  readonly why: string;
};

export type EditorialSection = {
  readonly kicker: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly EditorialBullet[];
};

/**
 * The per-company editorial layer of a catalog-driven company preview.
 * The counts, samples, public reports, official pages and process table stay catalog-driven;
 * these notes replace the shared template copy with company-specific text. Only the SEO fields
 * are required, so a thin company can ship a title and a subtitle alone.
 */
export type CompanyEditorialNotes = {
  readonly slug: string;
  /** At most 60 characters and unique across the site (duplicate titles fail seo:meta-check). */
  readonly title: string;
  readonly h1: string;
  /** Between 70 and 160 characters. */
  readonly description: string;
  readonly hero?: {
    readonly kicker?: string;
    readonly subtitle: string;
  };
  readonly intro?: readonly string[];
  /** What public interview reports describe: loop shape, screening platform, frontend rounds, caveats. */
  readonly reportsDescribe?: EditorialSection;
  /** Named rounds rendered between the reports section and the reported process table. */
  readonly roundSpotlights?: readonly AuthoredRoundSpotlight[];
  readonly prepSteps?: {
    readonly kicker: string;
    readonly title: string;
    readonly intro?: string;
    readonly steps: readonly EditorialPrepStep[];
  };
  readonly faqs?: {
    readonly kicker: string;
    readonly title: string;
    readonly items: readonly AuthoredFaq[];
  };
  /** schema.org `about` names for the CollectionPage. */
  readonly about?: readonly string[];
};
