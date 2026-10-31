/**
 * Content shape for a fully authored company preview page rendered by the data-driven branch of
 * CompanyPreviewComponent. One module per company exports an `AuthoredCompanyPreview`; the registry in
 * authored-company-previews.ts maps slugs to those modules. OpenAI, Google and Netflix keep their own
 * template branches and are not part of this registry.
 */
export type AuthoredReportedRound = {
  readonly label: string;
  readonly url: string;
};

export type AuthoredPracticePrompt = {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly whatThisMeasures: string;
  readonly clarifyFirst: readonly string[];
  readonly strongAnswer: readonly string[];
  readonly commonMiss: string;
  readonly resourceLabel: string;
  readonly resourcePath: string;
  /** The public interview report this practice version is modelled on, when one exists. */
  readonly reportedRound?: AuthoredReportedRound;
};

export type AuthoredRoleLens = {
  readonly title: string;
  readonly description: string;
  readonly practiceFocus: string;
};

export type AuthoredWalkthroughStep = {
  readonly title: string;
  readonly description: string;
};

export type AuthoredPrepDay = {
  readonly day: string;
  readonly focus: string;
  readonly artifact: string;
};

export type AuthoredFaq = {
  readonly question: string;
  readonly answer: string;
};

export type AuthoredRoundSpotlightFact = {
  readonly label: string;
  readonly value: string;
};

/** One named interview round decoded in the searcher's own words: what it is, how long, on which tool, what was reported. */
export type AuthoredRoundSpotlight = {
  /** Heading id suffix; the rendered heading id is `<slug>-round-<id>`. */
  readonly id: string;
  readonly kicker: string;
  readonly title: string;
  /** Two or three sentences that answer the query directly, before any detail. */
  readonly lede: readonly string[];
  readonly facts: readonly AuthoredRoundSpotlightFact[];
  /** A practice prompt on the same page, by its prompt id. */
  readonly practiceLink?: { readonly label: string; readonly fragment: string };
  /** The reported-process row for this round, by its row id. */
  readonly processLink?: { readonly label: string; readonly fragment: string };
};

export type AuthoredResourceLink = {
  readonly label: string;
  readonly description: string;
  readonly path: string;
};

export type AuthoredSource = {
  readonly label: string;
  readonly url: string;
  readonly note: string;
  /** Interview reports get rel="nofollow"; official company pages keep the default rel. */
  readonly kind: 'official' | 'report';
};

export type AuthoredSectionCopy = {
  readonly kicker: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

export type AuthoredCompanyPreview = {
  readonly slug: string;
  readonly label: string;
  readonly title: string;
  readonly h1: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly trustNote: string;
  readonly hero: {
    readonly kicker: string;
    readonly subtitle: string;
    readonly caveat: string;
    readonly chips: readonly string[];
  };
  readonly studyPriorities: AuthoredSectionCopy;
  readonly sourceBoundary: AuthoredSectionCopy;
  /** Named rounds rendered between the source boundary and the reported process table. */
  readonly roundSpotlights?: readonly AuthoredRoundSpotlight[];
  readonly roleLenses?: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly items: readonly AuthoredRoleLens[];
  };
  readonly prompts: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly itemListName: string;
    readonly items: readonly AuthoredPracticePrompt[];
  };
  readonly walkthrough?: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly steps: readonly AuthoredWalkthroughStep[];
  };
  readonly prepPlan: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly days: readonly AuthoredPrepDay[];
  };
  readonly faqs: {
    readonly kicker: string;
    readonly title: string;
    readonly items: readonly AuthoredFaq[];
  };
  readonly resourceLinks: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly items: readonly AuthoredResourceLink[];
  };
  readonly sources: {
    readonly kicker: string;
    readonly title: string;
    readonly intro: string;
    readonly items: readonly AuthoredSource[];
  };
  readonly cta: {
    readonly kicker: string;
    readonly title: string;
    readonly copy: string;
    readonly buttonLabel: string;
    readonly src: string;
  };
  /** schema.org `about` names for the CollectionPage. */
  readonly about: readonly string[];
  /** Anchor text used on the /companies directory. */
  readonly indexAnchorLabel: string;
};
