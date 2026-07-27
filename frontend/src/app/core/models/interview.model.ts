export type InterviewLevel = 'junior' | 'mid' | 'senior';
export type InterviewTrack = 'core-web' | 'react' | 'angular' | 'vue';
export type InterviewAccessMode = 'off' | 'internal' | 'public';
export type InterviewSessionStatus =
  | 'mcq_active'
  | 'coding_ready'
  | 'coding_active'
  | 'completed'
  | 'abandoned'
  | 'voided_technical';

export interface InterviewChoice<T extends string | number = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface InterviewQuota {
  remaining: number | null;
  limit: number | null;
  resetAt: string | null;
  unlimited: boolean;
}

export interface InterviewSessionLink {
  id: string;
  status: InterviewSessionStatus;
  level?: InterviewLevel;
  track?: InterviewTrack;
  updatedAt?: string;
}

export interface InterviewResultLink {
  sessionId: string;
  completedAt?: string;
  level?: InterviewLevel;
  track?: InterviewTrack;
  correct?: number;
  total?: number;
}

export interface InterviewTargetAvailability {
  level: InterviewLevel;
  track: InterviewTrack;
  available: boolean;
}

export interface InterviewAvailabilityTiming {
  mcqSeconds: number;
  codingReadySeconds: number;
}

export interface InterviewAvailability {
  enabled: boolean;
  accessMode: InterviewAccessMode;
  unavailableReason: string | null;
  quota: InterviewQuota | null;
  activeSession: InterviewSessionLink | null;
  lastResults: InterviewResultLink[];
  targets: InterviewTargetAvailability[];
  levels: InterviewChoice<InterviewLevel>[];
  tracks: InterviewChoice<InterviewTrack>[];
  minViewportWidth: number;
  timing: InterviewAvailabilityTiming;
}

export function interviewAvailabilityAllowsRole(
  availability: Pick<InterviewAvailability, 'enabled' | 'accessMode'> | null | undefined,
  role: 'user' | 'admin' | string | null | undefined,
): boolean {
  if (!availability?.enabled || availability.accessMode === 'off') return false;
  if (availability.accessMode === 'internal') return role === 'admin';
  return availability.accessMode === 'public';
}

export interface InterviewMcqOption {
  id: string;
  label: string;
}

export interface InterviewMcqQuestion {
  id: string;
  revision: number;
  technology: string;
  competency: string;
  prompt: string;
  code?: string;
  codeLanguage?: string;
  options: InterviewMcqOption[];
  estimatedSeconds?: number;
  selectedOptionId: string | null;
}

export interface InterviewCodingFile {
  path: string;
  language: string;
  content: string;
  readOnly: boolean;
}

export interface InterviewCodingRequirement {
  id: string;
  title: string;
  prompt: string;
  constraints: string[];
}

export interface InterviewCodingTask {
  id: string;
  title: string;
  prompt: string;
  runner: 'javascript' | 'framework-preview';
  sourceQuestionId: string;
  sourceContentVersion: string;
  starterAsset: string | null;
  requirements: InterviewCodingRequirement[];
  files: InterviewCodingFile[];
}

export interface InterviewCodingDraft {
  files: InterviewCodingFile[];
  hash: string;
  revision: number | null;
  updatedAt: string | null;
}

export interface InterviewCheckResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  failureKind?: string;
}

export interface InterviewCodingState {
  readyDeadlineAt: string | null;
  deadlineAt: string | null;
  task: InterviewCodingTask | null;
  draft: InterviewCodingDraft | null;
  checkResults: InterviewCheckResult[];
  runCount: number;
}

export interface InterviewSession {
  id: string;
  status: InterviewSessionStatus;
  level: InterviewLevel;
  track: InterviewTrack;
  version: number;
  bankVersion: string;
  serverNow: string;
  mcqDeadlineAt: string | null;
  codingReadyDeadlineAt: string | null;
  questions: InterviewMcqQuestion[];
  currentQuestionIndex: number;
  coding: InterviewCodingState | null;
}

export interface CreateInterviewSessionRequest {
  level: InterviewLevel;
  track: InterviewTrack;
  viewportWidth: number;
}

export interface SaveInterviewAnswerRequest {
  questionId: string;
  optionId: string;
  responseDurationMs?: number;
}

export interface SaveInterviewCodingDraftRequest {
  language: string;
  files: Array<Pick<InterviewCodingFile, 'path' | 'content'>>;
}

export interface InterviewMutationAck {
  version: number | null;
  session: InterviewSession | null;
}

export interface InterviewDraftSaveResult {
  version: number | null;
  draft: InterviewCodingDraft | null;
}

export interface InterviewRunnerCheck {
  id: string;
  name: string;
}

export interface InterviewFrameworkCheckStep {
  type?: string;
  action?: string;
  [key: string]: unknown;
}

export interface InterviewFrameworkCheck extends InterviewRunnerCheck {
  steps: InterviewFrameworkCheckStep[];
}

export interface InterviewJavaScriptRunnerConfig {
  kind: 'javascript';
  language: 'javascript' | 'typescript';
  tests: string;
  testsTs?: string;
  checks: InterviewRunnerCheck[];
}

export interface InterviewFrameworkRunnerConfig {
  kind: 'framework-preview';
  framework: 'react' | 'angular' | 'vue';
  groups: Array<{
    id: string;
    title: string;
    checks: InterviewFrameworkCheck[];
  }>;
}

export type InterviewRunnerConfig =
  | InterviewJavaScriptRunnerConfig
  | InterviewFrameworkRunnerConfig;

export interface InterviewPreparedCheckRun {
  runToken: string;
  expiresAt: string;
  draftHash: string;
  expectedCheckIds: string[];
  runnerConfig: InterviewRunnerConfig;
  evidenceMode: 'client-self-report';
  authoritative: false;
}

export interface InterviewCheckRunResult {
  version: number | null;
  results: InterviewCheckResult[];
}

export interface InterviewScoreSummary {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
}

export interface InterviewSectionResult {
  id: string;
  label: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
}

export interface InterviewMcqResult {
  questionId: string;
  technology: string;
  competency: string;
  prompt: string;
  code: string | null;
  codeLanguage: string | null;
  options: InterviewMcqOption[];
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
  explanation: string;
  remediationTopics: string[];
}

export interface InterviewCodingResult {
  sourceQuestionId: string | null;
  attempted: boolean;
  submitted: boolean;
  locallyVerified: boolean;
  authoritativeEvaluation: false;
  evidenceMode: 'client-self-report';
  passedChecks: number;
  totalChecks: number;
  checks: InterviewCheckResult[];
  rubric: Array<{
    id: string;
    label: string;
    criteria: string[];
    status: 'passed' | 'failed' | 'not_evaluated';
  }>;
}

export interface InterviewTiming {
  usedSeconds: number | null;
  allowedSeconds: number | null;
}

export interface InterviewResult {
  sessionId: string;
  level: InterviewLevel;
  track: InterviewTrack;
  completedAt: string | null;
  score: InterviewScoreSummary;
  sections: InterviewSectionResult[];
  questions: InterviewMcqResult[];
  remediationTopics: string[];
  coding: InterviewCodingResult | null;
  disclaimer: string;
  mcqTiming: InterviewTiming;
  codingTiming: InterviewTiming | null;
  xpAwarded: 0;
}
