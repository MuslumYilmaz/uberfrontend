import { Tech } from './user.model';
import { EntitledUser, isProActive } from '../utils/entitlements.util';

export type QuestionType = 'trivia' | 'coding' | 'system-design';
export type Technology = Tech;
export type Difficulty = 'easy' | 'intermediate' | 'hard';
export type AccessLevel = 'free' | 'premium';

export type QuestionKind = 'trivia' | 'coding';

export type StructuredDescription = {
  summary?: string;           // replaces plain text
  arguments?: StructuredArgument[];
  returns?: StructuredReturn;
  examples?: string[];        // code snippets (strings)
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
};

export type QuestionInterviewFocus = {
  summary?: string;
  tests?: string[];
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

export interface Question {
  id: string;
  title: string;
  author?: string;        // default handled in UI/SEO when omitted
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
