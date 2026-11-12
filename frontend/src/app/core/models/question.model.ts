import { Tech } from './user.model';
import { EntitledUser, isProActive } from '../utils/entitlements.util';

export type QuestionType = 'trivia' | 'coding' | 'system-design';
export type Technology = Tech;
export type Difficulty = 'easy' | 'intermediate' | 'hard';
export type AccessLevel = 'free' | 'premium';

export type QuestionKind = 'trivia' | 'coding';
export type QuestionFormat = 'output';
export type OutputRuntime = 'browser' | 'node';

export interface OutputQuestionOption {
  id: string;
  lines: string[];
}

export interface OutputChallenge {
  language: 'javascript';
  runtime: OutputRuntime;
  responseType: 'single-choice';
  prompt: string;
  code: string;
  options: OutputQuestionOption[];
  correctOptionId: string;
  explanation: string;
}

export type StructuredDescription = {
  summary?: string;           // replaces plain text
  text?: string;              // legacy/debug prompt text when summary is absent
  specs?: StructuredDescriptionSpecs;
  arguments?: StructuredArgument[];
  returns?: StructuredReturn;
  examples?: string[];        // code snippets (strings)
};

export type StructuredDescriptionSpecs = {
  practice?: string[];
  requirements?: string[];
  acceptanceCriteria?: string[];
  expectedBehaviorIntro?: string;
  expectedBehavior?: string[];
  implementationNotes?: string[];
  commonMistakes?: string[];
  interviewExplanation?: string;
  testingChecklist?: string[];
  techFocus?: string[];
  faq?: QuestionFaqItem[];
};

export type StructuredArgument = {
  name: string;
  type?: string;
  desc?: string;
};

export type StructuredReturn = {
  type?: string;
  desc?: string;
};

export interface PremiumPreviewContent {
  summary: string;
  learningOutcomes: string[]; // 3–5 complete bullets
  unlockDescription: string;
}

export type StructuredSolution = {
  explanation?: string;
  codeJs?: string;
  codeTs?: string;
};

export type QuestionPreviewSample = {
  /** What the quote is, such as "A comment from the sample review". */
  label: string;
  quote: string;
  note?: string;
};

export type QuestionSeo = {
  title?: string;
  description?: string;
  h1?: string;
  h1IntentLabel?: string;
};

export type QuestionInterviewFocus = {
  summary?: string;
  tests?: string[];
};

export type FrameworkTestStepType =
  | 'expectExists'
  | 'expectText'
  | 'expectNoText'
  | 'expectDisabled'
  | 'click'
  | 'submit'
  | 'mouseDown'
  | 'pointerDown'
  | 'wait'
  | 'waitForText'
  | 'setValue'
  | 'expectValue'
  | 'expectFocused'
  | 'expectCount'
  | 'waitForCount'
  | 'expectAttribute'
  | 'expectClass'
  | 'mockHttp'
  | 'expectHttpRequest'
  | 'key'
  | 'unmountPreview'
  | 'expectNoPreviewTimers'
  | 'expectNoPreviewLeaks'
  | 'expectChecked'
  | 'expectLineThrough'
  | 'mockRandom'
  | 'expectStandsOut'
  | 'expectColor'
  | 'expectReferenced'
  | 'expectIndented'
  | 'mockStorage'
  | 'expectStorage'
  | 'expectName'
  | 'expectLiveRegion';

/**
 * Finds elements the way a user or a screen reader does instead of by CSS selector: by role and accessible name
 * (the name also matches the visible text), by label, or by an element's own text. Hidden elements never match.
 * `near` keeps the matches that sit closest to another element, such as the Reply button of one comment.
 */
export type FrameworkTestLocator = {
  role?: string;
  name?: string;
  label?: string;
  text?: string;
  near?: FrameworkTestLocator;
};

export type FrameworkTestStep = {
  type?: FrameworkTestStepType;
  action?: FrameworkTestStepType;
  selector?: string;
  by?: FrameworkTestLocator;
  index?: number;
  text?: string;
  match?: 'equals' | 'contains';
  disabled?: boolean;
  timeoutMs?: number;
  durationMs?: number;
  value?: string;
  key?: string;
  count?: number;
  attribute?: string;
  className?: string;
  url?: string;
  method?: string;
  status?: number;
  error?: string;
  bodyContains?: string;
  /** expectChecked takes true, false or 'mixed' (an indeterminate checkbox). */
  expected?: string | boolean | number;
  /** mockRandom: Math.random returns these in turn, from before the preview boots. */
  values?: number[];
  /** expectStandsOut: the group the target must look different from. */
  among?: { selector?: string; by?: FrameworkTestLocator };
  /** expectColor: the color family the target shows, named as a person would. */
  hue?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'grey' | 'transparent';
  /** expectColor: the CSS color property read, background-color unless set. */
  property?: string;
  /** expectIndented: the element the target must start further right than. */
  than?: { selector?: string; by?: FrameworkTestLocator };
  /** mockStorage: the check's localStorage entries, set before the preview boots. */
  entries?: Record<string, string>;
  /** expectLiveRegion: how the live region around the target announces, polite or assertive. */
  politeness?: string;
  /** expectLiveRegion: whether the live region announces itself whole. */
  atomic?: boolean;
};

export type FrameworkTest = {
  id: string;
  name: string;
  steps: FrameworkTestStep[];
};

export type TriviaIncidentOption = {
  id: string;
  label: string;
};

export type TriviaIncidentCard = {
  title?: string;
  scenario: string;
  options: TriviaIncidentOption[];
  correctOptionId: string;
  rereadPrompt?: string;
};

export type QuestionFaqItem = {
  question: string;
  answer: string;
};

/** A public interview report or reference that informed a practice question. */
export type QuestionSource = {
  label: string;
  url: string;        // https only
  publisher: string;  // e.g. "PracHub", "Glassdoor"
  date: string;       // YYYY-MM or YYYY-MM-DD
  note?: string;      // what the source can and cannot establish
  company?: string;   // slug of the company the account concerns; required for the company page report block
};

export interface Question {
  id: string;
  title: string;
  author?: string;        // default handled in UI/SEO when omitted
  publishedAt?: string;   // ISO date string (optional)
  updatedAt?: string;     // ISO date string (optional)
  answer?: string;
  description?: string | StructuredDescription;
  solution?: string;
  solutionTs?: string;
  solutionBlock?: StructuredSolution;
  seo?: QuestionSeo;
  interviewFocus?: QuestionInterviewFocus;
  premiumPreview?: PremiumPreviewContent;
  type: QuestionType;
  technology: Technology;
  access: AccessLevel;
  difficulty: Difficulty;
  tags: string[];
  importance: number;
  estimatedMinutes?: number;
  questionFormat?: QuestionFormat;
  outputChallenge?: OutputChallenge;
  code?: string;
  starterCode?: string;
  tests?: string;
  /** How long each JavaScript test may run before it fails as timed out; the runner's default is 1000 ms. */
  testTimeoutMs?: number;
  frameworkTests?: FrameworkTest[];
  /** Overrides the default reading of `frameworkTests` (one check or fewer is 'smoke'): framework-check-coverage.util. */
  checkCoverage?: 'smoke' | 'full';
  examples?: string[]; // fallback if structured description lacks examples
  companies?: string[];  // e.g. ["google", "meta"] or ["Google"]
  sources?: QuestionSource[];
  decisionGraphAsset?: string;
  decisionGraphKey?: string;
  pressureModeAsset?: string;
  /** A merge request to review before the fixes, as in GitLab's technical interview (see review-mode.model.ts). */
  reviewModeAsset?: string;
  /** One short quote from a Premium task, shown on its lock page so a visitor can judge the format before paying. */
  previewSample?: QuestionPreviewSample;
  incidentCard?: TriviaIncidentCard;
}

export const isQuestionLockedForTier = (
  q: Pick<Question, 'access'>,
  user?: EntitledUser | null
): boolean => q.access === 'premium' && !isProActive(user);
