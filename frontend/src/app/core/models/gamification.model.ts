export interface DashboardNextAction {
  id: string;
  title: string;
  description: string;
  route: string;
  cta: string;
}

export type DashboardPrepGoalTech = 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';
export type DashboardPrepGoalLevel = 'foundation' | 'intermediate' | 'senior';
export type DashboardReadinessBand = 'Starting' | 'Developing' | 'Interview-ready' | 'Strong';

export interface DashboardPrepGoal {
  tech: DashboardPrepGoalTech;
  level: DashboardPrepGoalLevel;
  label: string;
}

export interface DashboardPrepTargetProfile {
  label: string;
  summary: string;
  targets: {
    coding?: number;
    concepts: number;
    debug: number;
    tradeoffs: number;
  };
  breadth: {
    coding?: number;
    concepts: number;
  };
  difficulty?: {
    advanced?: number;
    hard?: number;
  };
  conceptOnly: boolean;
}

export interface DashboardReadinessComponent {
  id: 'coding' | 'concepts' | 'debug' | 'tradeoffs' | 'consistency';
  label: string;
  score: number;
  max: number;
  current: number;
  effectiveCurrent?: number;
  target: number;
  percent: number;
  route: string;
  breadth?: {
    solved: number;
    required: number;
    percent: number;
    gaps: Array<{
      id: string;
      label: string;
      solved: number;
      target: number;
    }>;
    dominant?: {
      id: string;
      label: string;
      solved: number;
      target: number;
    };
  };
  freshness?: {
    fresh: number;
    aging: number;
    stale: number;
    latestAt?: string;
  };
  feedback?: DashboardPrepComponentFeedback;
}

export interface DashboardPrepDrill {
  title: string;
  route: string;
  family: 'question' | 'incident' | 'tradeoff-battle';
  reason: string;
  cta: string;
}

export interface DashboardPrepComponentFeedback {
  attempts: number;
  failRuns: number;
  passRate: number;
  repeatedFailures: number;
  topFailureCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface DashboardPrepFeedbackSignal {
  id: string;
  kind: 'coding';
  bucket: string;
  bucketLabel?: string;
  label: string;
  severity?: 'high' | 'medium' | 'low' | string;
  attempts: number;
  failRuns?: number;
  passRate: number;
  latestAt: string;
  category?: string;
  lang?: 'js' | 'ts' | 'web' | 'react' | 'angular' | 'vue' | string;
  questionId?: string;
  route?: string;
  accessible?: boolean;
  access?: 'free' | 'premium' | string;
  reason: string;
}

export interface DashboardPrepFeedback {
  windowDays: number;
  summary: string;
  weakSignals: DashboardPrepFeedbackSignal[];
  strengthSignals: DashboardPrepFeedbackSignal[];
}

export interface DashboardCoverageGapQuestionFeedback {
  status: 'not-tried' | 'needs-review' | 'passed-recently' | string;
  attempts: number;
  passRate: number;
  latestAt?: string;
  category?: string;
  lang?: 'js' | 'ts' | 'web' | 'react' | 'angular' | 'vue' | string;
}

export interface DashboardCoverageGapQuestion {
  id: string;
  title: string;
  route: string;
  access: 'free' | 'premium' | string;
  difficulty: string;
  importanceScore?: number;
  essentialRank?: number;
  rationale?: string;
  feedback?: DashboardCoverageGapQuestionFeedback;
}

export interface DashboardCoverageGap {
  id: string;
  label: string;
  kind: 'coding' | 'concepts';
  route: string;
  priorityScore?: number;
  source?: 'essential-60' | 'catalog' | string;
  solved?: number;
  target?: number;
  available?: number;
  questions?: DashboardCoverageGapQuestion[];
}

export interface DashboardPrepLoop {
  goal: DashboardPrepGoal;
  targetProfile?: DashboardPrepTargetProfile;
  readiness: {
    score: number;
    band: DashboardReadinessBand;
    cap?: {
      maxScore: number;
      reason: string;
    };
    components: DashboardReadinessComponent[];
  };
  weaknesses: DashboardReadinessComponent[];
  coverageGaps?: DashboardCoverageGap[];
  feedback?: DashboardPrepFeedback;
  nextDrill: DashboardPrepDrill;
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

export interface DashboardQuestionProgress {
  solvedCount: number;
  totalCount: number;
  solvedPercent: number;
  topTopics: DashboardTopicProgress[];
}

export interface DashboardIncidentProgress {
  passedCount: number;
  totalCount: number;
  passedPercent: number;
}

export interface DashboardTradeoffBattleProgress {
  completedCount: number;
  totalCount: number;
  completedPercent: number;
}

export interface DashboardPracticeProgress {
  completedCount: number;
  totalCount: number;
  completedPercent: number;
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
  questions: DashboardQuestionProgress;
  incidents: DashboardIncidentProgress;
  tradeoffBattles?: DashboardTradeoffBattleProgress;
  practice: DashboardPracticeProgress;
}

export interface DashboardAchievement {
  id: string;
  title: string;
  reason: string;
  icon: string;
  theme: string;
  current: number;
  target: number;
  progress: number;
  unlocked: boolean;
  earnedAt?: string;
}

export interface AchievementAward {
  id: string;
  title: string;
  reason: string;
  icon: string;
  theme: string;
  current: number;
  target: number;
  progress: number;
  earnedAt: string;
}

export interface DashboardAchievements {
  summary: {
    unlockedCount: number;
    totalCount: number;
  };
  unlocked: DashboardAchievement[];
  next: DashboardAchievement[];
  unseen?: AchievementAward[];
}

export interface DashboardGamificationSettings {
  weeklyGoalEnabled: boolean;
  weeklyGoalTarget: number;
  showStreakWidget: boolean;
  dailyChallengeTech?: 'auto' | 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';
}

export interface DashboardGamificationResponse {
  nextBestAction: DashboardNextAction;
  dailyChallenge: DashboardDailyChallenge;
  weeklyGoal: DashboardWeeklyGoal;
  xpLevel: DashboardXpLevel;
  progress: DashboardProgress;
  achievements?: DashboardAchievements;
  prepLoop?: DashboardPrepLoop;
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
  achievementAwards?: AchievementAward[];
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

export interface PrepGoalUpdateResponse {
  goal: DashboardPrepGoal;
}
