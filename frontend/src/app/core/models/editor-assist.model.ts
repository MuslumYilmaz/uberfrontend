export type StuckLevel = 0 | 1 | 2 | 3;
export type EditorAssistLang = 'js' | 'ts';

export type FailureCategory =
  | 'missing-return'
  | 'undefined-access'
  | 'wrong-function-call'
  | 'type-mismatch'
  | 'off-by-one'
  | 'async-promise-mismatch'
  | 'reference-error'
  | 'assertion-mismatch'
  | 'syntax-error'
  | 'timeout'
  | 'mutability-side-effect'
  | 'edge-case'
  | 'unknown';

export interface AttemptRunRecord {
  questionId: string;
  lang: EditorAssistLang;
  ts: number;
  passCount: number;
  totalCount: number;
  firstFailName: string;
  errorLine: string;
  signature: string;
  codeHash: string;
  codeChanged: boolean;
  interviewMode: boolean;
  errorCategory?: FailureCategory;
  tags?: string[];
  recordKey?: string;
  syncedAt?: number;
}

export interface StuckState {
  level: StuckLevel;
  signature: string;
  consecutiveCount: number;
  firstSeenTs: number;
  lastSeenTs: number;
  dismissedUntilTs?: number;
}

export interface FailureHint {
  ruleId: string;
  title: string;
  why: string;
  actions: string[];
  confidence: number;
}

export interface WeaknessSummary {
  topicOrTag: string;
  category: FailureCategory;
  failCount: number;
  lastSeenTs: number;
  drillUrl: string;
}

export interface RubberDuckState {
  questionId: string;
  note: string;
  doneStepIndexes: number[];
  signature?: string;
  updatedAt: number;
}

export interface InterviewModeSession {
  questionId: string;
  startedAt: number;
  durationMin: 15 | 30 | 45;
  runs: number;
  bestPassPct: number;
  updatedAt: number;
}

export interface AssistSyncRequest {
  runs: AttemptRunRecord[];
  cursorTs?: number;
  limit?: number;
}

export interface AssistSyncResponse {
  runs: AttemptRunRecord[];
  cursorTs: number;
  stats?: {
    received: number;
    upserted: number;
    deduped: number;
    returned: number;
  };
}
