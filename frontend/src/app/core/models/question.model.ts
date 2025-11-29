export type QuestionType = 'trivia' | 'coding' | 'system-design';
export type Technology = 'javascript' | 'angular';
export type Difficulty = 'easy' | 'intermediate' | 'hard';

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

export interface Question {
  id: string;
  title: string;
  answer?: string;
  description?: string | StructuredDescription;
  solution?: string;
  solutionTs?: string;
  solutionBlock?: StructuredSolution;
  type: QuestionType;
  technology: Technology;
  difficulty: Difficulty;
  tags: string[];
  importance: number;
  code?: string;
  starterCode?: string;
  tests?: string;
  examples?: string[]; // fallback if structured description lacks examples
  companies?: string[];  // e.g. ["google", "meta"] or ["Google"]
}
