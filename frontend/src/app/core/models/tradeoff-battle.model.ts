import { PracticeAccess, PracticeDifficulty, PracticeTechnology } from './practice.model';

export interface TradeoffBattleListItem {
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

export interface TradeoffBattleOption {
  id: string;
  label: string;
  summary: string;
  whenItWins: string[];
  watchOutFor: string[];
}

export interface TradeoffBattleMatrixCell {
  optionId: string;
  verdict: 'best-fit' | 'reasonable' | 'stretch';
  note: string;
}

export interface TradeoffBattleMatrixRow {
  id: string;
  title: string;
  prompt: string;
  cells: TradeoffBattleMatrixCell[];
}

export interface TradeoffBattleEvaluationDimension {
  id: string;
  title: string;
  description: string;
}

export interface TradeoffBattleStrongAnswer {
  title: string;
  summary: string;
  reasoning: string[];
  recommendation?: string;
}

export interface TradeoffBattlePushbackCard {
  question: string;
  answer: string;
}

export interface TradeoffBattleAnswerExample {
  level: 'weak' | 'decent' | 'strong';
  title: string;
  answer: string;
  whyItWorks: string;
}

export interface TradeoffBattleScenario {
  meta: TradeoffBattleListItem;
  scenario: string;
  prompt: string;
  options: TradeoffBattleOption[];
  decisionMatrix: TradeoffBattleMatrixRow[];
  evaluationDimensions: TradeoffBattleEvaluationDimension[];
  strongAnswer: TradeoffBattleStrongAnswer;
  interviewerPushback: TradeoffBattlePushbackCard[];
  answerExamples: TradeoffBattleAnswerExample[];
  answerFramework: string[];
  antiPatterns: string[];
}

export interface TradeoffBattleProgressRecord {
  started: boolean;
  completed: boolean;
  analysisRevealed: boolean;
  lastPlayedAt: string | null;
  selectedOptionId: string;
}

export function createEmptyTradeoffBattleProgressRecord(): TradeoffBattleProgressRecord {
  return {
    started: false,
    completed: false,
    analysisRevealed: false,
    lastPlayedAt: null,
    selectedOptionId: '',
  };
}
