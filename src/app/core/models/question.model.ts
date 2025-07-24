export type QuestionType = 'trivia' | 'coding';
export type Technology = 'javascript' | 'angular';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  technology: Technology;
  difficulty: Difficulty;
  tags: string[];
  importance: number;           // 1–5
  stackblitzEmbedUrl?: string;  // for coding challenges
  stackblitzSolutionUrl?: string;
}