export type InterviewLevel = 'junior' | 'mid' | 'senior';
export type InterviewTrack = 'core-web' | 'react' | 'angular' | 'vue';
export type InterviewFormat = 'coding' | 'system-design';
export type InterviewAccessMode = 'off' | 'internal' | 'public';
export type InterviewSessionStatus =
  | 'mcq_active'
  | 'coding_ready'
  | 'coding_active'
  | 'system_design_active'
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
  format: InterviewFormat;
  level?: InterviewLevel;
  track?: InterviewTrack;
  updatedAt?: string;
}

export interface InterviewResultLink {
  sessionId: string;
  format: InterviewFormat;
  completedAt?: string;
  level?: InterviewLevel;
  track?: InterviewTrack;
  correct?: number;
  total?: number;
  practiceSignal?: InterviewSystemDesignPracticeSignal;
}

export interface InterviewTargetAvailability {
  level: InterviewLevel;
  track: InterviewTrack;
  format: InterviewFormat;
  available: boolean;
}

export interface InterviewAvailabilityTiming {
  mcqSeconds: number;
  codingReadySeconds: number;
  systemDesignSeconds: Record<InterviewLevel, number>;
}

export interface InterviewFormatAvailability {
  format: InterviewFormat;
  enabled: boolean;
  unavailableReason: string | null;
}

export interface InterviewAvailability {
  enabled: boolean;
  accessMode: InterviewAccessMode;
  unavailableReason: string | null;
  quota: InterviewQuota | null;
  quotas: Record<InterviewFormat, InterviewQuota | null>;
  activeSession: InterviewSessionLink | null;
  lastResults: InterviewResultLink[];
  targets: InterviewTargetAvailability[];
  formats: InterviewChoice<InterviewFormat>[];
  formatAvailability: InterviewFormatAvailability[];
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

export type InterviewSystemDesignStep =
  | 'clarifications'
  | 'requirements'
  | 'architecture'
  | 'decisions'
  | 'twist';

export type InterviewSystemDesignConnectionType = string;

export interface InterviewSystemDesignClarification {
  id: string;
  prompt: string;
  answer: string | null;
}

export interface InterviewSystemDesignRequirement {
  id: string;
  label: string;
  description?: string;
}

export interface InterviewSystemDesignLane {
  id: string;
  label: string;
  description?: string;
}

export interface InterviewSystemDesignCard {
  id: string;
  label: string;
  description?: string;
}

export interface InterviewSystemDesignRationale {
  id: string;
  label: string;
}

export interface InterviewSystemDesignDecisionOption {
  id: string;
  label: string;
  description?: string;
}

export interface InterviewSystemDesignDecision {
  id: string;
  prompt: string;
  options: InterviewSystemDesignDecisionOption[];
  rationales: InterviewSystemDesignRationale[];
}

export interface InterviewSystemDesignTwistAction {
  id: string;
  label: string;
  description?: string;
}

export interface InterviewSystemDesignTwist {
  revealed: boolean;
  prompt: string | null;
  actions: InterviewSystemDesignTwistAction[];
  maxActions: number;
}

export interface InterviewSystemDesignScenario {
  id: string;
  revision: number;
  title: string;
  prompt: string;
  sourceContentId: string | null;
  estimatedSeconds: number;
  selectionLimits: {
    clarifications: number;
    priorities: number;
    connections: number;
    rationalesPerDecision: number;
    twistActions: number;
    scratchpadChars: number;
  };
  clarifications: InterviewSystemDesignClarification[];
  requirements: InterviewSystemDesignRequirement[];
  lanes: InterviewSystemDesignLane[];
  cards: InterviewSystemDesignCard[];
  decisions: InterviewSystemDesignDecision[];
  connectionTypes: InterviewChoice<InterviewSystemDesignConnectionType>[];
}

export interface InterviewSystemDesignPlacement {
  cardId: string;
  laneId: string;
  order: number;
}

export interface InterviewSystemDesignConnection {
  id: string;
  fromCardId: string;
  toCardId: string;
  type: InterviewSystemDesignConnectionType;
}

export interface InterviewSystemDesignDecisionAnswer {
  decisionId: string;
  optionId: string;
  rationaleIds: string[];
}

export interface InterviewSystemDesignDraft {
  currentStep: InterviewSystemDesignStep;
  selectedClarificationIds: string[];
  prioritizedRequirementIds: string[];
  placements: InterviewSystemDesignPlacement[];
  connections: InterviewSystemDesignConnection[];
  decisions: InterviewSystemDesignDecisionAnswer[];
  selectedTwistActionIds: string[];
  scratchpad: string;
  hash: string | null;
  revision: number | null;
  updatedAt: string | null;
}

export interface InterviewSystemDesignState {
  stage: 'initial' | 'twist';
  deadlineAt: string | null;
  scenario: InterviewSystemDesignScenario | null;
  revealedClarificationIds: string[];
  draft: InterviewSystemDesignDraft | null;
  twist: InterviewSystemDesignTwist;
}

export interface InterviewSession {
  id: string;
  status: InterviewSessionStatus;
  format: InterviewFormat;
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
  systemDesign: InterviewSystemDesignState | null;
}

export interface CreateInterviewSessionRequest {
  level: InterviewLevel;
  track: InterviewTrack;
  viewportWidth: number;
  format?: InterviewFormat;
  systemDesignSourceContentId?: string;
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

export interface SaveInterviewSystemDesignDraftRequest {
  draft: Omit<InterviewSystemDesignDraft, 'hash' | 'revision' | 'updatedAt'>;
  mutationId: string;
}

export interface InterviewSystemDesignMutationResult {
  version: number | null;
  draft: InterviewSystemDesignDraft | null;
  session: InterviewSession | null;
  replayed: boolean;
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

export type InterviewSystemDesignAxisStatus =
  | 'strong-evidence'
  | 'developing'
  | 'needs-focus'
  | 'not-evaluated';

export type InterviewSystemDesignPracticeSignal =
  | 'not-enough-evidence'
  | 'needs-focus'
  | 'on-track'
  | 'strong-system-design-session';

export interface InterviewSystemDesignAxisResult {
  id: string;
  label: string;
  status: InterviewSystemDesignAxisStatus;
  evidence: string[];
}

export interface InterviewSystemDesignContradiction {
  id: string;
  severity: 'major' | 'critical';
  label: string;
  explanation: string;
}

export interface InterviewSystemDesignSummary {
  priorities: Array<{ id: string; title: string; rank: number }>;
  lanes: Array<{
    id: string;
    title: string;
    cards: Array<{ id: string; title: string; order: number }>;
  }>;
  connections: Array<{
    fromCardId: string;
    fromTitle: string;
    toCardId: string;
    toTitle: string;
    typeId: string;
    typeTitle: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    option: { id: string; label: string };
    rationales: Array<{ id: string; label: string }>;
  }>;
  twistActions: Array<{ id: string; label: string }>;
}

export interface InterviewSystemDesignResult {
  sourceContentId: string | null;
  scenarioId: string;
  scenarioTitle: string;
  outcome: 'submitted' | 'timed_out' | 'abandoned' | 'pending' | string;
  partialEvidence: boolean;
  practiceSignal: InterviewSystemDesignPracticeSignal;
  axes: InterviewSystemDesignAxisResult[];
  contradictions: InterviewSystemDesignContradiction[];
  remediationTopics: string[];
  designSnapshot: InterviewSystemDesignDraft | null;
  summary: InterviewSystemDesignSummary;
  frameworkLens: {
    title: string;
    prompt: string;
  } | null;
  timing: InterviewTiming;
}

export interface InterviewResult {
  sessionId: string;
  interviewFormat: InterviewFormat;
  level: InterviewLevel;
  track: InterviewTrack;
  completedAt: string | null;
  score: InterviewScoreSummary;
  sections: InterviewSectionResult[];
  questions: InterviewMcqResult[];
  remediationTopics: string[];
  coding: InterviewCodingResult | null;
  systemDesign: InterviewSystemDesignResult | null;
  disclaimer: string;
  mcqTiming: InterviewTiming;
  codingTiming: InterviewTiming | null;
  xpAwarded: 0;
}
