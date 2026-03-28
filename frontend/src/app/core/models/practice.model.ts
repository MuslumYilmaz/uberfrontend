import { AccessLevel, Difficulty } from './question.model';
import { Tech } from './user.model';

export type PracticeFamily = 'question' | 'incident' | 'code-review' | 'tradeoff-battle';
export type PracticeTechnology = Tech | 'system-design';
export type PracticeDifficulty = Difficulty;
export type PracticeAccess = AccessLevel;

export interface PracticeRegistryItem {
  id: string;
  family: PracticeFamily;
  title: string;
  route: string;
  tech: PracticeTechnology;
  difficulty: PracticeDifficulty;
  summary: string;
  tags: string[];
  access: PracticeAccess;
  estimatedMinutes: number;
  updatedAt: string;
  schemaVersion: string;
  assetRef: string;
}

export interface PracticeProgressCoreRecord {
  family: PracticeFamily;
  id: string;
  started: boolean;
  completed: boolean;
  passed: boolean;
  bestScore: number;
  lastPlayedAt: string | null;
  extension?: Record<string, unknown>;
}

export interface PracticeCatalogEntry {
  key: string;
  label: string;
  icon: string;
  route: string;
  query?: Record<string, string>;
  badge?: string | null;
  family?: PracticeFamily;
  isSupplemental?: boolean;
}

export function createEmptyPracticeProgressRecord(
  family: PracticeFamily,
  id: string,
): PracticeProgressCoreRecord {
  return {
    family,
    id,
    started: false,
    completed: false,
    passed: false,
    bestScore: 0,
    lastPlayedAt: null,
    extension: {},
  };
}
