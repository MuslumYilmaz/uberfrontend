export type QuestionType = 'trivia' | 'coding';
export type Technology = 'javascript' | 'angular';
export type Difficulty = 'easy' | 'intermediate' | 'hard';

export interface Question {
  id: string;
  title: string;
  description: string;
  answer?: string;
  type: 'coding' | 'trivia';
  technology: string;
  difficulty: Difficulty;    // ← now a union, not just `string`
  tags: string[];
  importance: number;        // ← required
  stackblitzEmbedUrl?: string;
  stackblitzSolutionUrl?: string;
}