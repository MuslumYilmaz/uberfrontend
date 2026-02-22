export type MasteryPathAvailability = 'active' | 'coming-soon';

export type MasteryItemType = 'trivia' | 'predict' | 'coding' | 'checkpoint';

export type MasteryDifficulty = 'easy' | 'intermediate' | 'hard';

export type MasteryUnlockRule =
  | {
      kind: 'none';
      label: string;
    }
  | {
      kind: 'checkpoint';
      checkpointItemId: string;
      label: string;
    };

export type MasteryActionTarget = {
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  label?: string;
};

export type MasteryTheme = {
  accent: string;
  accentSoft: string;
  surfaceTint: string;
};

export type MasteryScoring = {
  knowledgeWeight: number;
  codingWeight: number;
};

export type MasteryModule = {
  id: string;
  title: string;
  scoreBand: string;
  summary: string;
  learningGoals: string[];
  commonMistakes: string[];
  unlockRule: MasteryUnlockRule;
};

export type MasteryItem = {
  id: string;
  moduleId: string;
  type: MasteryItemType;
  title: string;
  summary: string;
  difficulty: MasteryDifficulty;
  estimatedMinutes: number;
  tags?: string[];
  xp: number;
  target?: MasteryActionTarget;
};

export type MasteryPath = {
  pathId: string;
  frameworkSlug: string;
  availability: MasteryPathAvailability;
  title: string;
  subtitle: string;
  description: string;
  theme: MasteryTheme;
  scoring: MasteryScoring;
  modules: MasteryModule[];
  items: MasteryItem[];
};

export type MasteryModuleView = {
  module: MasteryModule;
  items: MasteryItem[];
  totalCount: number;
  completedCount: number;
  completionPercent: number;
  locked: boolean;
};

export type MasteryProgressState = {
  completedItemIds: string[];
  updatedAt: string;
};
