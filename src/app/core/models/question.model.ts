// src/app/core/models/question.model.ts
export type QuestionType = 'trivia' | 'coding';
export type Technology = 'javascript' | 'angular';
export type Difficulty = 'easy' | 'intermediate' | 'hard';

export interface StructuredDescription {
  text: string;
  examples?: string[];
}

export interface Question {
  id: string;
  title: string;
  description: string;
  answer?: string;
  type: QuestionType;
  technology: Technology;
  difficulty: Difficulty;
  tags: string[];
  importance: number;
  code?: string;
  solution?: string;
  starterCode?: string;
  tests?: string;
  examples?: string[]; // fallback if structured description lacks examples
}
