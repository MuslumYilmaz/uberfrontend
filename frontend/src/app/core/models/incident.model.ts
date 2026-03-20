import { AccessLevel, Difficulty } from './question.model';
import { Tech } from './user.model';

export type IncidentTech = Extract<Tech, 'javascript' | 'react' | 'angular' | 'vue'>;
export type IncidentAccess = AccessLevel;
export type IncidentDifficulty = Difficulty;
export type IncidentEvidenceType = 'log' | 'metric' | 'snippet' | 'note';
export type IncidentStageType = 'single-select' | 'multi-select' | 'priority-order';
export type IncidentRelatedPracticeKind = 'coding' | 'trivia' | 'debug' | 'system-design';
export type IncidentRelatedPracticeTech = Tech | 'system-design';

export interface IncidentListItem {
  id: string;
  title: string;
  tech: IncidentTech;
  difficulty: IncidentDifficulty;
  summary: string;
  signals: string[];
  estimatedMinutes: number;
  tags: string[];
  updatedAt: string;
  access: IncidentAccess;
}

export interface IncidentMeta extends IncidentListItem {}

export interface IncidentEvidenceCard {
  type: IncidentEvidenceType;
  title: string;
  body: string;
  language?: string;
}

export interface IncidentContext {
  symptom: string;
  userImpact: string;
  environment: string;
  evidence: IncidentEvidenceCard[];
}

export interface IncidentOption {
  id: string;
  label: string;
  points: number;
  feedback: string;
  isHarmful?: boolean;
}

export interface IncidentPriorityCandidate {
  id: string;
  label: string;
  description?: string;
}

interface IncidentStageBase {
  id: string;
  type: IncidentStageType;
  title: string;
  prompt: string;
  helperText?: string;
}

export interface IncidentSingleSelectStage extends IncidentStageBase {
  type: 'single-select';
  options: IncidentOption[];
}

export interface IncidentMultiSelectStage extends IncidentStageBase {
  type: 'multi-select';
  options: IncidentOption[];
}

export interface IncidentPriorityOrderStage extends IncidentStageBase {
  type: 'priority-order';
  candidates: IncidentPriorityCandidate[];
  expectedOrder: string[];
  slotWeights: number[];
}

export type IncidentStage =
  | IncidentSingleSelectStage
  | IncidentMultiSelectStage
  | IncidentPriorityOrderStage;

export interface IncidentScoreBand {
  min: number;
  max: number;
  label: string;
  summary: string;
}

export type IncidentTeachingBlock =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'callout';
      title?: string;
      text: string;
      variant?: 'info' | 'success' | 'warning' | 'danger';
    }
  | {
      type: 'checklist' | 'steps';
      title?: string;
      items: string[];
    };

export interface IncidentDebrief {
  scoreBands: IncidentScoreBand[];
  idealRunbook: string[];
  teachingBlocks: IncidentTeachingBlock[];
  optionalReflectionPrompt?: string;
}

export interface IncidentRelatedPractice {
  tech: IncidentRelatedPracticeTech;
  kind: IncidentRelatedPracticeKind;
  id: string;
}

export interface IncidentScenario {
  meta: IncidentMeta;
  context: IncidentContext;
  stages: IncidentStage[];
  debrief: IncidentDebrief;
  relatedPractice: IncidentRelatedPractice[];
}

export interface IncidentProgressRecord {
  started: boolean;
  completed: boolean;
  passed: boolean;
  bestScore: number;
  lastPlayedAt: string | null;
  reflectionNote: string;
}

export interface IncidentSessionState {
  activeStepIndex: number;
  answers: Record<string, string | string[]>;
  submittedStageIds: string[];
}

export function createEmptyIncidentProgressRecord(): IncidentProgressRecord {
  return {
    started: false,
    completed: false,
    passed: false,
    bestScore: 0,
    lastPlayedAt: null,
    reflectionNote: '',
  };
}
