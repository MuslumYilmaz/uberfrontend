import { FrameworkTest } from './question.model';

export type PressureModeFramework = 'react' | 'angular' | 'vue';

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
  frameworkNotes: Record<PressureModeFramework, string>;
}

export interface PressureModeScenario {
  schemaVersion: string;
  id: string;
  family: string;
  title: string;
  access: 'free' | 'premium';
  estimatedMinutes: number;
  supportedQuestions: Record<PressureModeFramework, string>;
  rounds: PressureModeRound[];
  debrief: PressureModeDebrief;
  solutionAssets: Record<PressureModeFramework, string>;
}

export interface PressureModeProgressState {
  activeRoundIndex: number;
  clearedRounds: number;
  completed: boolean;
}
