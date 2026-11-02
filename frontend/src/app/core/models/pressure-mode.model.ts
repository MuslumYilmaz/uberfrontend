import { FrameworkTest } from './question.model';

export type PressureModeFramework = 'react' | 'angular' | 'vue';
export type PressureModeFrameworkMap = Partial<Record<PressureModeFramework, string>>;

export interface PressureModeRound {
  id: string;
  title: string;
  interviewerPrompt: string;
  constraints: string[];
  frameworkTests: FrameworkTest[];
}

export interface PressureModeDebrief {
  title: string;
  summary: string;
  takeaways: string[];
  frameworkNotes: PressureModeFrameworkMap;
}

export interface PressureModeScenario {
  schemaVersion: string;
  id: string;
  family: string;
  title: string;
  access: 'free' | 'premium';
  estimatedMinutes: number;
  supportedQuestions: PressureModeFrameworkMap;
  rounds: PressureModeRound[];
  debrief: PressureModeDebrief;
  solutionAssets: PressureModeFrameworkMap;
}

export interface PressureModeProgressState {
  activeRoundIndex: number;
  clearedRounds: number;
  completed: boolean;
}
