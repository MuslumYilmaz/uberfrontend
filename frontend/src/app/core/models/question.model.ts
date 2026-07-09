import { Tech } from './user.model';
import { EntitledUser, isProActive } from '../utils/entitlements.util';

export type QuestionType = 'trivia' | 'coding' | 'system-design';
export type Technology = Tech;
export type Difficulty = 'easy' | 'intermediate' | 'hard';
export type AccessLevel = 'free' | 'premium';

export type QuestionKind = 'trivia' | 'coding';

export type StructuredDescription = {
  summary?: string;           // replaces plain text
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

export type StructuredSolution = {
  explanation?: string;
  codeJs?: string;
  codeTs?: string;
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
  | 'key'
  | 'unmountPreview'
  | 'expectNoPreviewLeaks';

export type FrameworkTestStep = {
  type?: FrameworkTestStepType;
  action?: FrameworkTestStepType;
  selector?: string;
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
  expected?: string | boolean | number;
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
  type: QuestionType;
  technology: Technology;
  access: AccessLevel;
  difficulty: Difficulty;
  tags: string[];
  importance: number;
  code?: string;
  starterCode?: string;
  tests?: string;
  frameworkTests?: FrameworkTest[];
  examples?: string[]; // fallback if structured description lacks examples
  companies?: string[];  // e.g. ["google", "meta"] or ["Google"]
  decisionGraphAsset?: string;
  decisionGraphKey?: string;
  incidentCard?: TriviaIncidentCard;
}

export const isQuestionLockedForTier = (
  q: Pick<Question, 'access'>,
  user?: EntitledUser | null
): boolean => q.access === 'premium' && !isProActive(user);
