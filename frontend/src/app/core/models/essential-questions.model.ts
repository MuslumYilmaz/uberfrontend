import { AccessLevel, Difficulty } from './question.model';
import { Tech } from './user.model';

export type EssentialQuestionKind = 'coding' | 'trivia' | 'system-design';
export type EssentialSection = 'javascript-functions' | 'ui-coding' | 'system-design' | 'concepts';
export type EssentialTier = 'must-know' | 'high-leverage';

export type EssentialQuestionRef = {
  tech?: Tech;
  kind: EssentialQuestionKind;
  id: string;
};

export type EssentialCollectionSource = {
  label: string;
  url: string;
};

export type EssentialCollectionItem = {
  id: string;
  rank: number;
  section: EssentialSection;
  tier: EssentialTier;
  score: number;
  primary: EssentialQuestionRef;
  alternates?: EssentialQuestionRef[];
  rationale: string;
  benchmarkTopics: string[];
};

export type EssentialQuestionsCollection = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  benchmarkSources: EssentialCollectionSource[];
  items: EssentialCollectionItem[];
};

export type EssentialResolvedVariant = {
  tech?: Tech;
  kind: EssentialQuestionKind;
  id: string;
  title: string;
  route: any[];
  path: string;
  access: AccessLevel;
  difficulty: Difficulty | 'intermediate';
  techLabel: string;
};

export type EssentialResolvedItem = EssentialCollectionItem & {
  title: string;
  shortDescription: string;
  access: AccessLevel;
  difficulty: Difficulty | 'intermediate';
  technologies: Tech[];
  companies: string[];
  tags: string[];
  route: any[];
  path: string;
  isSystemDesign: boolean;
  variants: EssentialResolvedVariant[];
};

export type EssentialQuestionsResolved = {
  collection: EssentialQuestionsCollection;
  items: EssentialResolvedItem[];
};
