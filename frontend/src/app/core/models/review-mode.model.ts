/**
 * Review mode, in two formats.
 * - review: a coding task opens as a merge request to review in writing, then to improve in the workspace, then to
 *   compare with a sample review. GitLab's frontend technical interview runs this way.
 * - find: a task opens as code to read without running it: mark the lines that are wrong and say why, then compare
 *   with a sample answer, and only then fix it in the workspace. Capital One's case asks for the bug in an intern's
 *   code "without coding the fix".
 */
export type ReviewModeFramework = 'react' | 'angular' | 'vue';
/** The techs whose tasks can open a review: the framework panels, and plain JavaScript for the find format. */
export type ReviewModeTech = ReviewModeFramework | 'javascript';
export type ReviewModeFormat = 'review' | 'find';

export type ReviewModeFile = {
  readonly path: string;
  /** The file before the merge request; empty for a file the request adds, and for the code a find case reads. */
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
  readonly format: ReviewModeFormat;
  /**
   * The interview, as it is booked. Without `reviewMinutes` it covers the written review too; with them, it covers the
   * fixes and the comparison that follow it.
   */
  readonly sessionMinutes: number;
  /** A written review sent ahead of the interview has its own clock, as GitLab's "up to an hour of review". */
  readonly reviewMinutes?: number;
  readonly supportedQuestions: Readonly<Partial<Record<ReviewModeTech, string>>>;
  /**
   * find: the calculation to work by hand before reading the code, as the case asks for one, and the sample's working.
   */
  readonly workedExample?: { readonly prompt: string; readonly answer: string };
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
  /** When the written review was handed in and the interview's clock began; absent before then. */
  readonly interviewStartedAt?: number;
  readonly phase: ReviewModePhase;
  /** Comments by file path; in a find case, by marked line, as `<path>#L<line>`. */
  readonly comments: Readonly<Record<string, string>>;
  readonly summary: string;
  /** A find case's worked example, by hand. */
  readonly example: string;
};
