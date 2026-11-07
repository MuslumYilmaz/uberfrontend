/**
 * Merge Request Review mode: a coding task opens as a merge request to review in writing, then to improve in the
 * workspace, then to compare with a sample review. GitLab's frontend technical interview runs this way.
 */
export type ReviewModeFramework = 'react' | 'angular' | 'vue';

export type ReviewModeFile = {
  readonly path: string;
  /** The file before the merge request; empty for a file the request adds. */
  readonly before: string;
  /** The file as the merge request leaves it, which is also what the workspace opens with. */
  readonly after: string;
};

export type ReviewModeSeverity = 'blocker' | 'major' | 'minor' | 'nit';

export type ReviewModeComment = {
  readonly path: string;
  /** A line of the file after the request. */
  readonly line: number;
  readonly severity: ReviewModeSeverity;
  readonly title: string;
  readonly body: string;
  /** The fix is among the ones the workspace checks. */
  readonly checked: boolean;
};

export type ReviewModeScenario = {
  readonly schemaVersion: string;
  readonly id: string;
  readonly title: string;
  readonly access: 'free' | 'premium';
  /** The whole session, review and fixes, as the interview books it. */
  readonly sessionMinutes: number;
  readonly supportedQuestions: Readonly<Partial<Record<ReviewModeFramework, string>>>;
  readonly mergeRequest: {
    readonly title: string;
    readonly description: string;
    readonly issue: { readonly title: string; readonly requirements: readonly string[] };
    readonly files: readonly ReviewModeFile[];
  };
  readonly sampleReview: { readonly summary: string; readonly comments: readonly ReviewModeComment[] };
};

export type ReviewModePhase = 'review' | 'fix' | 'compare';

/** What the reader wrote and where they are, kept on this device. */
export type ReviewModeDraft = {
  /** The review is on screen; leaving it keeps the comments for the next start. */
  readonly open: boolean;
  readonly startedAt: number;
  readonly phase: ReviewModePhase;
  /** Comments by file path. */
  readonly comments: Readonly<Record<string, string>>;
  readonly summary: string;
};
