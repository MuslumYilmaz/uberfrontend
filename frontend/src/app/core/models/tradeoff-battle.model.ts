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
}

export interface TradeoffBattleScoreBand {
  label: string;
  min: number;
  max: number;
  summary: string;
}

export interface TradeoffBattleScenario {
  meta: TradeoffBattleListItem;
  scenario: string;
  options: TradeoffBattleOption[];
  evaluationDimensions: string[];
  scoreBands: TradeoffBattleScoreBand[];
  exemplarReasoning: string[];
  antiPatterns: string[];
}
