import { PracticeAccess, PracticeDifficulty, PracticeTechnology } from './practice.model';

export interface CodeReviewListItem {
  id: string;
  title: string;
  tech: PracticeTechnology;
  difficulty: PracticeDifficulty;
  summary: string;
  tags: string[];
  access: PracticeAccess;
  estimatedMinutes: number;
  updatedAt: string;
}

export interface CodeReviewArtifact {
  language: string;
  code: string;
  fileName?: string;
}

export interface CodeReviewSeverityModel {
  levels: string[];
  guidance?: string;
}

export interface CodeReviewScenario {
  meta: CodeReviewListItem;
  artifact: CodeReviewArtifact;
  reviewGoals: string[];
  rubric: string[];
  expectedFindings: string[];
  severityModel: CodeReviewSeverityModel;
  responseMode: 'guided' | 'freeform';
}
