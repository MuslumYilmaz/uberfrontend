export interface DashboardNextAction {
  id: string;
  title: string;
  description: string;
  route: string;
  cta: string;
}

export interface DashboardDailyChallenge {
  dayKey: string;
  questionId: string;
  title: string;
  kind: 'coding' | 'trivia' | 'debug';
  tech: string;
  difficulty: string;
  route: string;
  available?: boolean;
  completed: boolean;
  streak: {
    current: number;
    longest: number;
  };
}

export interface DashboardWeeklyGoal {
  enabled: boolean;
  target: number;
  completed: number;
  progress: number;
  weekKey: string;
  bonusXp: number;
  bonusGranted: boolean;
}

export interface DashboardXpLevel {
  totalXp: number;
  level: number;
  levelStepXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface DashboardTopicProgress {
  topic: string;
  label: string;
  solved: number;
  total: number;
  percent: number;
}

export interface DashboardProgress {
  solvedCount: number;
  totalCount: number;
  solvedPercent: number;
  topTopics: DashboardTopicProgress[];
}

export interface DashboardGamificationSettings {
  showStreakWidget: boolean;
  dailyChallengeTech?: 'auto' | 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';
}

export interface DashboardGamificationResponse {
  nextBestAction: DashboardNextAction;
  dailyChallenge: DashboardDailyChallenge;
  weeklyGoal: DashboardWeeklyGoal;
  xpLevel: DashboardXpLevel;
  progress: DashboardProgress;
  settings: DashboardGamificationSettings;
}

export interface DailyChallengeCompleteResponse {
  completed?: boolean;
  alreadyCompleted?: boolean;
  dayKey: string;
  streak: { current: number; longest: number };
  streakIncremented?: boolean;
  streakBroken?: boolean;
  weeklyGoal: {
    completed: number;
    target: number;
    progress: number;
    reached: boolean;
    bonusGranted: boolean;
  };
  xpAwarded?: number;
  levelUp?: boolean;
  xp?: DashboardXpLevel;
}

export interface WeeklyGoalUpdateResponse {
  weeklyGoal: {
    enabled: boolean;
    target: number;
    completed: number;
    progress: number;
    weekKey: string;
  };
  settings: DashboardGamificationSettings;
}
