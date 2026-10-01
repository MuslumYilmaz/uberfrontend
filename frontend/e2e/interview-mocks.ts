import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page, Request, Route } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect } from './fixtures';

export type InterviewLevel = 'junior' | 'mid' | 'senior';
export type InterviewTrack = 'core-web' | 'react' | 'angular' | 'vue';
export type InterviewFormat = 'coding' | 'system-design';
export type InterviewAccessMode = 'off' | 'internal' | 'public';
export type SessionStatus =
  | 'mcq_active'
  | 'coding_ready'
  | 'coding_active'
  | 'system_design_active'
  | 'completed'
  | 'abandoned';

export type MockQuestion = {
  id: string;
  revision: number;
  technology: string;
  competency: string;
  prompt: string;
  code?: string;
  codeLanguage?: string;
  options: Array<{ id: string; label: string }>;
  selectedOptionId: string | null;
};

export type CanonicalPublicQuestion = {
  id: string;
  revision: number;
  technology: string;
  level: InterviewLevel;
  difficultyBand: 'foundation' | 'core' | 'stretch';
  competency: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
};

export type MockSession = {
  id: string;
  format: InterviewFormat;
  status: SessionStatus;
  level: InterviewLevel;
  track: InterviewTrack;
  version: number;
  bankVersion: string;
  serverNow: string;
  mcqDeadlineAt: string | null;
  codingReadyDeadlineAt: string | null;
  questions: MockQuestion[];
  currentQuestionIndex: number;
  coding: null | {
    readyDeadlineAt: string | null;
    deadlineAt: string | null;
    task: null | Record<string, unknown>;
    draft: null | Record<string, unknown>;
    checkRuns: Array<{
      draftHash: string;
      checks: Array<{ id: string; name: string; passed: boolean }>;
      passedCount: number;
      totalCount: number;
      ranAt: string;
      authoritative: false;
      evidenceSource: 'client-self-report';
    }>;
    runCount: number;
  };
  systemDesign: null | Record<string, any>;
};

export type CapturedRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type InterviewApiOptions = {
  enabled?: boolean;
  accessMode?: InterviewAccessMode;
  quota?: {
    remaining: number | null;
    limit: number | null;
    resetAt: string | null;
    unlimited: boolean;
  };
  systemDesignEnabled?: boolean;
  systemDesignQuota?: {
    remaining: number | null;
    limit: number | null;
    resetAt: string | null;
    unlimited: boolean;
  };
  initialSession?: MockSession | null;
  initialResult?: Record<string, unknown> | null;
  /** Visual fixtures pair this with page.clock.setFixedTime; behavioral tests use real deadlines. */
  freezeTimers?: boolean;
};

export const LEVELS: Array<{ value: InterviewLevel; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

export const TRACKS: Array<{ value: InterviewTrack; label: string }> = [
  { value: 'core-web', label: 'Core Web' },
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue' },
];

export const ACTIVE_STATUSES = new Set<SessionStatus>([
  'mcq_active',
  'coding_ready',
  'coding_active',
  'system_design_active',
]);
export const SERIOUS_AXE_IMPACTS = new Set(['serious', 'critical']);


export function nowIso(): string {
  return new Date().toISOString();
}

export function futureIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function expectNoSeriousInterviewViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include('[data-testid="interview-session"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const violations = results.violations.filter((violation) =>
    SERIOUS_AXE_IMPACTS.has(String(violation.impact || '')),
  );
  expect(
    violations,
    `${label}: ${violations.map((violation) => violation.id).join(', ')}`,
  ).toEqual([]);
}

export function jsonBody(request: Request): Record<string, unknown> {
  try {
    return JSON.parse(request.postData() || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function questionTechnologies(track: InterviewTrack): string[] {
  return track === 'core-web'
    ? ['javascript', 'javascript', 'javascript', 'html', 'css']
    : ['javascript', 'html', 'css', track, track];
}

export function buildQuestions(track: InterviewTrack): MockQuestion[] {
  return questionTechnologies(track).map((technology, index) => ({
    id: `mock-${track}-question-${index + 1}`,
    revision: 1,
    technology,
    competency: index === 0 ? 'Runtime reasoning' : `Competency ${index + 1}`,
    prompt: index === 0
      ? 'Which change best preserves behavior while fixing the production issue described?'
      : `Choose the best answer for ${technology} scenario ${index + 1}.`,
    ...(index === 0
      ? {
        code: `const longRuntimeIdentifier = "${'runtime-boundary-'.repeat(24)}";`,
        codeLanguage: 'javascript',
      }
      : {}),
    options: [
      { id: `q${index + 1}-a`, label: 'Apply the smallest change at the owning boundary.' },
      { id: `q${index + 1}-b`, label: 'Move the same work into every consuming component.' },
      { id: `q${index + 1}-c`, label: 'Delay the work without changing its ownership.' },
    ],
    selectedOptionId: null,
  }));
}

export function buildSession(
  level: InterviewLevel,
  track: InterviewTrack,
  id = `mock-${track}-${level}`,
): MockSession {
  return {
    id,
    format: 'coding',
    status: 'mcq_active',
    level,
    track,
    version: 1,
    bankVersion: 'frontend-interview-bank-v1',
    serverNow: nowIso(),
    mcqDeadlineAt: futureIso(600),
    codingReadyDeadlineAt: null,
    questions: buildQuestions(track),
    currentQuestionIndex: 0,
    coding: null,
    systemDesign: null,
  };
}

export function buildSystemDesignSession(
  level: InterviewLevel,
  track: InterviewTrack,
  id = `mock-system-design-${track}-${level}`,
): MockSession {
  const minutes = level === 'junior' ? 10 : level === 'senior' ? 20 : 15;
  return {
    id,
    format: 'system-design',
    status: 'system_design_active',
    level,
    track,
    version: 1,
    bankVersion: 'interview-system-design-registry-v1',
    serverNow: nowIso(),
    mcqDeadlineAt: null,
    codingReadyDeadlineAt: null,
    questions: [],
    currentQuestionIndex: 0,
    coding: null,
    systemDesign: {
      scenario: {
        id: 'int-sd-autocomplete-race-mid-v1',
        revision: 1,
        contentHash: 'mock-design-content-hash',
        level,
        title: 'Reliable autocomplete',
        prompt: 'Design an autocomplete that stays correct on slow networks.',
        timeLimitSeconds: minutes * 60,
        steps: [
          { id: 'clarifications', title: 'Clarify' },
          { id: 'requirements', title: 'Prioritize' },
          { id: 'architecture', title: 'Architecture' },
          { id: 'decisions', title: 'Decisions' },
          { id: 'twist', title: 'Production twist' },
        ],
        selectionLimits: {
          clarifications: 3,
          priorities: 3,
          connections: 6,
          rationalesPerDecision: 2,
          twistActions: 2,
          scratchpadChars: 200,
        },
        lanes: [
          { id: 'ui', title: 'UI' },
          { id: 'data', title: 'Data' },
        ],
        clarifications: [
          { id: 'keyboard', prompt: 'Is keyboard navigation required?' },
          { id: 'stale-results', prompt: 'Can stale results remain visible?' },
          { id: 'cache-scope', prompt: 'Can cached results be shared across users?' },
          { id: 'result-volume', prompt: 'How many results can a query return?' },
        ],
        requirements: [
          { id: 'ordering', title: 'Preserve request ordering' },
          { id: 'focus', title: 'Keep keyboard focus stable' },
          { id: 'cache', title: 'Bound duplicate network requests' },
        ],
        cards: [
          {
            id: 'input',
            title: 'Search input',
            description: 'Owns the user query and keyboard events.',
          },
          {
            id: 'controller',
            title: 'Request controller',
            description: 'Owns request identity and cancellation.',
          },
        ],
        connectionTypes: [
          { id: 'event-flow', title: 'Event flow' },
          { id: 'data-flow', title: 'Data flow' },
        ],
        decisions: [{
          id: 'ownership',
          title: 'Request ownership',
          prompt: 'How should obsolete requests be handled?',
          options: [
            { id: 'abort', label: 'Abort obsolete requests' },
            { id: 'allow-all', label: 'Allow every request to commit' },
          ],
          rationales: [{ id: 'ordering', label: 'Prevent stale results' }],
        }],
      },
      clarificationAnswers: [],
      revealedClarificationIds: [],
      twist: null,
      twistRevealed: false,
      baselineCaptured: false,
      draft: null,
      outcome: 'pending',
    },
  };
}

export function buildJavascriptTask() {
  return {
    id: 'int-code-core-web-junior-validate-username-v1',
    title: 'Validate Username',
    prompt: 'Implement a username validator for a production sign-up form.',
    runner: 'javascript',
    sourceQuestionId: 'js-validate-username',
    sourceContentVersion: '2026-07-27',
    starterAsset: null,
    publicRequirements: [
      {
        id: 'base-correctness',
        title: 'Base correctness',
        prompt: 'Accept supported usernames and reject unsupported input.',
        constraints: [
          'Accept lowercase usernames that begin with a letter.',
          'Reject values outside the allowed length.',
        ],
      },
    ],
    files: [
      {
        path: 'validateUsername.js',
        language: 'javascript',
        content: [
          'export default function validateUsername(value) {',
          "  return typeof value === 'string'",
          "    && /^[a-z][a-z0-9_]{2,15}$/.test(value);",
          '}',
          '',
        ].join('\n'),
        readOnly: false,
      },
    ],
  };
}

export function buildReactTask() {
  return {
    id: 'int-code-react-junior-counter-v1',
    title: 'React Counter (Guarded Decrement)',
    prompt: 'Build a state-driven counter with a zero floor.',
    runner: 'framework-preview',
    sourceQuestionId: 'react-counter',
    sourceContentVersion: '2026-01-30',
    starterAsset: 'assets/sb/react/question/react-counter.v1.json',
    publicRequirements: [
      {
        id: 'base-correctness',
        title: 'Base correctness',
        prompt: 'Keep the counter state and controls in sync.',
        constraints: ['Start at zero.', 'Disable decrement at zero.'],
      },
      {
        id: 'configurable-step',
        title: 'Configurable step',
        prompt: 'Support larger state transitions.',
        constraints: ['Offer steps 1, 5, and 10.'],
      },
    ],
    files: [],
  };
}

export function buildResult(
  session: MockSession,
  options: { submitted?: boolean; attempted?: boolean } = {},
): Record<string, unknown> {
  const submitted = options.submitted ?? true;
  const attempted = options.attempted ?? submitted;
  const checkRun = submitted && session.coding?.draft?.['hash']
    ? [...session.coding.checkRuns].reverse().find((run) => run.draftHash === session.coding?.draft?.['hash'])
    : null;
  const questionRows = session.questions.map((question, index) => {
    const selectedOptionId = question.selectedOptionId;
    const correctOptionId = `q${index + 1}-a`;
    return {
      questionId: question.id,
      technology: question.technology,
      competency: question.competency,
      prompt: question.prompt,
      ...(question.code
        ? { code: question.code, codeLanguage: question.codeLanguage }
        : {}),
      options: question.options,
      selectedOptionId,
      correctOptionId,
      correct: selectedOptionId === correctOptionId,
      explanation: 'The owning boundary keeps behavior explicit and avoids duplicating responsibility.',
      remediationTopics: selectedOptionId === correctOptionId ? [] : ['State ownership'],
    };
  });
  const correct = questionRows.filter((question) => question.correct).length;
  const unanswered = questionRows.filter((question) => !question.selectedOptionId).length;
  const incorrect = questionRows.length - correct - unanswered;
  const coreRows = questionRows.filter((question) =>
    ['javascript', 'html', 'css'].includes(question.technology),
  );
  const frameworkRows = questionRows.filter((question) =>
    !['javascript', 'html', 'css'].includes(question.technology),
  );
  const summarize = (rows: typeof questionRows) => ({
    correct: rows.filter((row) => row.correct).length,
    incorrect: rows.filter((row) => !!row.selectedOptionId && !row.correct).length,
    unanswered: rows.filter((row) => !row.selectedOptionId).length,
    total: rows.length,
  });

  return {
    sessionId: session.id,
    interviewFormat: 'coding',
    level: session.level,
    track: session.track,
    completedAt: nowIso(),
    score: { correct, incorrect, unanswered, total: questionRows.length },
    sections: [
      { id: 'core-web', label: 'Core Web', ...summarize(coreRows) },
      ...(frameworkRows.length
        ? [{ id: 'framework', label: 'Framework', ...summarize(frameworkRows) }]
        : []),
    ],
    questions: questionRows,
    remediationTopics: ['State ownership', 'Async lifecycle', 'Accessible controls'],
    coding: {
      sourceQuestionId: session.track === 'core-web' ? 'js-validate-username' : 'react-counter',
      attempted,
      submitted,
      locallyVerified: !!checkRun,
      checkRun: checkRun ?? null,
      rubric: [
        {
          id: 'base-correctness',
          label: 'Base correctness',
          criteria: ['Handles the primary behavior.'],
          status: 'not_evaluated',
        },
      ],
      timing: { usedSeconds: attempted ? 93 : 0, allowedSeconds: 1500 },
    },
    systemDesign: null,
    disclaimer: 'Practice feedback, not an employment prediction.',
    mcqTiming: { usedSeconds: 124, allowedSeconds: 600 },
    xpAwarded: 0,
  };
}

export function buildSystemDesignResult(session: MockSession): Record<string, unknown> {
  return {
    sessionId: session.id,
    interviewFormat: 'system-design',
    level: session.level,
    track: session.track,
    completedAt: nowIso(),
    xpAwarded: 0,
    mcq: null,
    coding: null,
    systemDesign: {
      scenarioId: 'int-sd-autocomplete-race-mid-v1',
      scenarioTitle: 'Reliable autocomplete',
      sourceContentId: 'realtime-search-debounce-cache',
      outcome: 'submitted',
      practiceSignal: 'not-enough-evidence',
      partialEvidence: true,
      timing: { usedSeconds: 180, allowedSeconds: 900 },
      frameworkLens: {
        title: 'React request ownership',
        prompt: 'Identify the component or hook that owns request identity.',
      },
      axes: [{
        id: 'requirements',
        title: 'Requirement discovery',
        status: 'developing',
        evidence: ['Keyboard navigation was clarified before architecture decisions.'],
      }],
      contradictions: [],
      remediation: [{ topic: 'Request identity', evidenceCount: 1 }],
      design: clone(session.systemDesign?.['draft'] || {}),
      summary: {
        priorities: [],
        lanes: [],
        connections: [],
        decisions: [],
        twistActions: [{
          id: 'include-locale',
          label: 'Include locale in request and cache identity',
        }],
      },
    },
    reviewNext: [{ topic: 'Request identity', evidenceCount: 1 }],
    employmentPrediction: null,
    evidenceNotice: 'Practice evidence only, not an employment prediction.',
  };
}

export class InterviewApiMock {
  enabled: boolean;
  accessMode: InterviewAccessMode;
  quota: NonNullable<InterviewApiOptions['quota']>;
  systemDesignEnabled: boolean;
  systemDesignQuota: NonNullable<InterviewApiOptions['systemDesignQuota']>;
  currentSession: MockSession | null;
  result: Record<string, unknown> | null;
  createRequests: CapturedRequest[] = [];
  answerRequests: CapturedRequest[] = [];
  draftRequests: CapturedRequest[] = [];
  systemDesignDraftRequests: CapturedRequest[] = [];
  systemDesignTwistRequests: CapturedRequest[] = [];
  systemDesignSubmitRequests: CapturedRequest[] = [];
  checkRequests: CapturedRequest[] = [];
  endRequests: CapturedRequest[] = [];
  javascriptRunnerConfig: null | { kind: string; language: string; tests: string; checks: Array<{ id: string; name: string }> } = null;
  getSessionCount = 0;
  createCount = 0;
  private readonly freezeTimers: boolean;

  constructor(options: InterviewApiOptions = {}) {
    this.freezeTimers = options.freezeTimers ?? false;
    this.enabled = options.enabled ?? true;
    this.accessMode = options.accessMode ?? (this.enabled ? 'public' : 'off');
    this.quota = options.quota ?? {
      remaining: 1,
      limit: 1,
      resetAt: '2026-08-01T00:00:00.000+03:00',
      unlimited: false,
    };
    this.systemDesignEnabled = options.systemDesignEnabled ?? false;
    this.systemDesignQuota = options.systemDesignQuota ?? {
      remaining: 1,
      limit: 1,
      resetAt: '2026-08-01T00:00:00.000+03:00',
      unlimited: false,
    };
    this.currentSession = options.initialSession ? clone(options.initialSession) : null;
    this.result = options.initialResult ? clone(options.initialResult) : null;
  }

  async install(page: Page): Promise<void> {
    await page.route('**/api/interviews**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204 });
        return;
      }

      if (method === 'GET' && path.endsWith('/api/interviews/availability')) {
        await this.reply(route, {
          availability: {
            enabled: this.enabled,
            accessMode: this.accessMode,
            unavailableReason: this.enabled ? null : 'Interview Mode is disabled for this environment.',
            quota: this.quota,
            quotas: {
              coding: this.quota,
              systemDesign: this.systemDesignQuota,
            },
            formats: [
              { id: 'coding', available: true },
              {
                id: 'system-design',
                available: this.systemDesignEnabled,
                ...(this.systemDesignEnabled
                  ? {}
                  : { unavailableReason: 'System Design Mock is not currently available' }),
              },
            ],
            activeSession: this.activeLink(),
            lastResults: this.result
              ? [{
                sessionId: String(this.result['sessionId']),
                format: this.result['interviewFormat'],
                level: this.result['level'],
                track: this.result['track'],
                completedAt: this.result['completedAt'],
                score: this.result['score'],
              }]
              : [],
            availability: LEVELS.flatMap((level) =>
              TRACKS.map((track) => ({
                level: level.value,
                track: track.value,
                format: 'coding',
                available: true,
                reason: null,
              })),
            ),
            systemDesignAvailability: LEVELS.flatMap((level) =>
              TRACKS.map((track) => ({
                level: level.value,
                track: track.value,
                format: 'system-design',
                available: this.systemDesignEnabled,
              })),
            ),
            levels: LEVELS,
            tracks: TRACKS,
            minViewportWidth: 768,
            timing: {
              mcqSeconds: 600,
              codingReadySeconds: 300,
              systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
            },
          },
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/api/interviews')) {
        const body = jsonBody(request);
        this.createRequests.push(this.capture(request, path, body));
        const level = body['level'] as InterviewLevel;
        const track = body['track'] as InterviewTrack;
        const format = body['format'] === 'system-design' ? 'system-design' : 'coding';
        this.createCount += 1;
        this.currentSession = format === 'system-design'
          ? buildSystemDesignSession(
            level,
            track,
            `mock-system-design-${this.createCount}-${level}-${track}`,
          )
          : buildSession(
            level,
            track,
            `mock-session-${this.createCount}-${level}-${track}`,
          );
        const quota = format === 'system-design' ? this.systemDesignQuota : this.quota;
        if (!quota.unlimited && typeof quota.remaining === 'number') {
          const updated = { ...quota, remaining: Math.max(0, quota.remaining - 1) };
          if (format === 'system-design') this.systemDesignQuota = updated;
          else this.quota = updated;
        }
        await this.reply(route, { session: this.snapshotSession() }, 201);
        return;
      }

      if (method === 'GET' && path.endsWith('/api/interviews/active')) {
        await this.reply(route, { session: this.activeLink() ? this.snapshotSession() : null });
        return;
      }

      if (method === 'GET' && path.endsWith('/control')) {
        const session = this.currentSession;
        const requestedSessionId = decodeURIComponent(path.split('/').at(-2) || '');
        if (!session || session.id !== requestedSessionId) {
          await this.reply(route, { error: 'Session not found.' }, 404);
          return;
        }
        await this.reply(route, {
          control: {
            id: session.id,
            status: session.status,
            version: session.version,
            active: ACTIVE_STATUSES.has(session.status),
            policy: 'continue',
            notice: null,
          },
        });
        return;
      }

      if (method === 'GET' && path.endsWith('/results')) {
        if (!this.result) {
          await this.reply(route, { error: 'Result not found.' }, 404);
          return;
        }
        await this.reply(route, { results: clone(this.result) });
        return;
      }

      if (method === 'PUT' && /\/mcq\/[^/]+$/.test(path)) {
        const body = jsonBody(request);
        this.answerRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        const questionId = decodeURIComponent(path.split('/').at(-1) || '');
        const question = session.questions.find((candidate) => candidate.id === questionId);
        if (question) question.selectedOptionId = String(body['optionId'] || '');
        session.version += 1;
        await this.reply(route, { version: session.version });
        return;
      }

      if (method === 'POST' && path.endsWith('/mcq/submit')) {
        const session = this.requireSession();
        session.status = 'coding_ready';
        session.version += 1;
        session.mcqDeadlineAt = null;
        session.codingReadyDeadlineAt = futureIso(300);
        session.coding = {
          readyDeadlineAt: session.codingReadyDeadlineAt,
          deadlineAt: null,
          task: null,
          draft: null,
          checkRuns: [],
          runCount: 0,
        };
        await this.reply(route, { session: this.snapshotSession() });
        return;
      }

      if (method === 'POST' && path.endsWith('/coding/start')) {
        const session = this.requireSession();
        session.status = 'coding_active';
        session.version += 1;
        session.codingReadyDeadlineAt = null;
        session.coding = {
          readyDeadlineAt: null,
          deadlineAt: futureIso(
            session.level === 'junior' ? 1500 : session.level === 'senior' ? 2700 : 2100,
          ),
          task: session.track === 'core-web' ? buildJavascriptTask() : buildReactTask(),
          draft: null,
          checkRuns: [],
          runCount: 0,
        };
        await this.reply(route, { session: this.snapshotSession() });
        return;
      }

      if (method === 'PUT' && path.endsWith('/system-design/draft')) {
        const body = jsonBody(request);
        this.systemDesignDraftRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        const design = session.systemDesign;
        if (!design) {
          await this.reply(route, { error: 'System design session missing.' }, 409);
          return;
        }
        const clarificationIds = Array.isArray(body['clarificationIds'])
          ? body['clarificationIds'].map(String)
          : [];
        const revealed = new Set<string>(
          Array.isArray(design['revealedClarificationIds'])
            ? design['revealedClarificationIds'].map(String)
            : [],
        );
        clarificationIds.forEach((id) => revealed.add(id));
        design['revealedClarificationIds'] = [...revealed];
        design['clarificationAnswers'] = clarificationIds.map((clarificationId) => ({
          clarificationId,
          answer: clarificationId === 'keyboard'
            ? 'Yes, full keyboard navigation is required.'
            : 'Stale results may remain visible only with an explicit status.',
        }));
        session.version += 1;
        design['draft'] = {
          currentStep: body['currentStep'],
          clarificationIds,
          priorityRequirementIds: body['priorityRequirementIds'] || [],
          placements: body['placements'] || [],
          connections: body['connections'] || [],
          decisions: body['decisions'] || [],
          twistResponseActionIds: body['twistResponseActionIds'] || [],
          scratchpad: body['scratchpad'] || '',
          hash: `design-draft-hash-${this.systemDesignDraftRequests.length}`,
          updatedAt: nowIso(),
        };
        await this.reply(route, { session: this.snapshotSession(), replayed: false });
        return;
      }

      if (method === 'POST' && path.endsWith('/system-design/twist/reveal')) {
        const body = jsonBody(request);
        this.systemDesignTwistRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        const design = session.systemDesign;
        if (!design || body['draftHash'] !== design['draft']?.['hash']) {
          await this.reply(route, { error: 'Draft hash mismatch.' }, 409);
          return;
        }
        session.version += 1;
        design['twistRevealed'] = true;
        design['baselineCaptured'] = true;
        design['twist'] = {
          id: 'locale-change',
          title: 'Locale changes during an in-flight request',
          prompt: 'The user changes locale while an older request is still in flight.',
          responseActions: [
            {
              id: 'include-locale',
              label: 'Include locale in request and cache identity',
            },
            {
              id: 'abort-obsolete',
              label: 'Abort the obsolete request',
            },
          ],
        };
        await this.reply(route, { session: this.snapshotSession(), replayed: false });
        return;
      }

      if (method === 'POST' && path.endsWith('/system-design/submit')) {
        const body = jsonBody(request);
        this.systemDesignSubmitRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        const design = session.systemDesign;
        if (!design || body['draftHash'] !== design['draft']?.['hash']) {
          await this.reply(route, { error: 'Draft hash mismatch.' }, 409);
          return;
        }
        session.status = 'completed';
        session.version += 1;
        design['outcome'] = 'submitted';
        this.result = buildSystemDesignResult(session);
        await this.reply(route, { session: this.snapshotSession(), replayed: false });
        return;
      }

      if (method === 'PUT' && path.endsWith('/coding/draft')) {
        const body = jsonBody(request);
        this.draftRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        const files = Array.isArray(body['files']) ? body['files'] : [];
        session.version += 1;
        const draft = {
          files,
          hash: `draft-hash-${this.draftRequests.length}`,
          revision: this.draftRequests.length,
          updatedAt: nowIso(),
        };
        if (session.coding) session.coding.draft = draft;
        await this.reply(route, { version: session.version, draft });
        return;
      }

      if (method === 'POST' && path.endsWith('/coding/check-runs')) {
        const body = jsonBody(request);
        this.checkRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        if (body['action'] === 'prepare') {
          await this.reply(route, {
            prepared: {
              runToken: 'mock-check-run-token',
              expiresAt: futureIso(60),
              draftHash: body['draftHash'],
              expectedCheckIds: this.javascriptRunnerConfig?.checks.map((check) => check.id) ?? ['valid-username'],
              evidenceMode: 'client-self-report',
              authoritative: false,
              runnerConfig: this.javascriptRunnerConfig ?? {
                kind: 'javascript',
                language: 'javascript',
                tests: [
                  "import validateUsername from './validateUsername';",
                  "describe('validateUsername', () => {",
                  "  test('accepts a valid username', () => {",
                  "    expect(validateUsername('alice_1')).toBe(true);",
                  '  });',
                  '});',
                ].join('\n'),
                checks: [{ id: 'valid-username', name: 'accepts a valid username' }],
              },
            },
          });
          return;
        }

        session.version += 1;
        const submittedChecks = body['checks'] as Array<{ id: string; passed: boolean }>;
        const checks = submittedChecks.map((check) => ({
          id: check.id, name: this.javascriptRunnerConfig?.checks.find((entry) => entry.id === check.id)?.name ?? 'accepts a valid username', passed: check.passed,
        }));
        if (session.coding) {
          session.coding.checkRuns.push({
            draftHash: String(body['draftHash']), checks,
            passedCount: checks.filter((check) => check.passed).length,
            totalCount: checks.length, ranAt: nowIso(),
            authoritative: false, evidenceSource: 'client-self-report',
          });
          session.coding.runCount += 1;
        }
        await this.reply(route, { session: this.snapshotSession() });
        return;
      }

      if (method === 'POST' && path.endsWith('/coding/submit')) {
        const session = this.requireSession();
        session.status = 'completed';
        session.version += 1;
        this.result = buildResult(session);
        await this.reply(route, { results: clone(this.result) });
        return;
      }

      if (method === 'POST' && path.endsWith('/end')) {
        const body = jsonBody(request);
        this.endRequests.push(this.capture(request, path, body));
        const session = this.requireSession();
        session.status = 'abandoned';
        session.version += 1;
        this.result = null;
        await this.reply(route, {
          session: this.snapshotSession(),
          resultAvailable: false,
        });
        return;
      }

      if (method === 'GET' && /\/api\/interviews\/[^/]+$/.test(path)) {
        this.getSessionCount += 1;
        if (!this.currentSession) {
          await this.reply(route, { error: 'Session not found.' }, 404);
          return;
        }
        await this.reply(route, { session: this.snapshotSession() });
        return;
      }

      await this.reply(route, { error: `Interview API route is not mocked: ${method} ${path}` }, 404);
    });
  }

  private activeLink(): Record<string, unknown> | null {
    const session = this.currentSession;
    if (!session || !ACTIVE_STATUSES.has(session.status)) return null;
    return {
      id: session.id,
      format: session.format,
      status: session.status,
      level: session.level,
      track: session.track,
      updatedAt: nowIso(),
    };
  }

  private requireSession(): MockSession {
    if (!this.currentSession) throw new Error('Mock interview session was not initialized.');
    return this.currentSession;
  }

  private snapshotSession(): MockSession | null {
    if (!this.currentSession) return null;
    this.currentSession.serverNow = nowIso();
    const snapshot = clone(this.currentSession);
    if (this.freezeTimers) {
      const deadline = snapshot.status === 'mcq_active' ? snapshot.mcqDeadlineAt
        : snapshot.status === 'coding_ready' ? snapshot.codingReadyDeadlineAt
        : snapshot.coding?.deadlineAt;
      if (deadline) {
        const end = Date.parse(deadline);
        const wholeMinutes = Math.ceil((end - Date.now()) / 60_000);
        snapshot.serverNow = new Date(end - wholeMinutes * 60_000).toISOString();
      }
    }
    return snapshot;
  }

  private capture(
    request: Request,
    path: string,
    body: Record<string, unknown>,
  ): CapturedRequest {
    return {
      method: request.method(),
      path,
      headers: request.headers(),
      body,
    };
  }

  private async reply(route: Route, body: unknown, status = 200): Promise<void> {
    await route.fulfill({
      status,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(body),
    });
  }
}

export function baseUrl(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) return process.env.PLAYWRIGHT_BASE_URL;
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

export async function seedAuthenticatedInterview(
  page: Page,
  api: InterviewApiMock,
  accessTier: 'free' | 'premium' = 'free',
): Promise<void> {
  const token = `e2e-interview-${accessTier}-${Date.now()}-${Math.random()}`;
  const user = buildMockUser({
    _id: `e2e-interview-${accessTier}`,
    username: `interview_${accessTier}`,
    email: `interview-${accessTier}@example.com`,
    accessTier,
  });
  await installAuthMock(page, { token, user });
  await api.install(page);
  await page.context().addCookies([{
    name: 'access_token',
    value: encodeURIComponent(token),
    url: baseUrl(),
  }]);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('fa:auth:session', '1');
    } catch {
      // Sandboxed preview frames intentionally have no storage origin.
    }
  });
}

export async function selectSetupChoice(
  page: Page,
  fieldLabel: 'Level' | 'Track',
  optionLabel: string,
): Promise<void> {
  const accessibleName = `Interview ${fieldLabel.toLowerCase()}`;
  const combobox = page
    .getByTestId('interview-setup')
    .getByRole('combobox', { name: accessibleName, exact: true });
  await combobox.click();
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
  await expect(combobox).toHaveText(optionLabel);
}

export async function selectDropdownWithKeyboard(
  combobox: Locator,
  optionLabel: string,
  arrowDownCount: number,
): Promise<void> {
  await combobox.focus();
  await expect(combobox).toBeFocused();
  await combobox.press('Home');
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  for (let index = 0; index < arrowDownCount; index += 1) {
    await combobox.press('ArrowDown');
  }
  await combobox.press('Enter');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  await expect(combobox).toHaveText(optionLabel);
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return root.scrollWidth <= root.clientWidth + 1
      && body.scrollWidth <= body.clientWidth + 1;
  })).toBe(true);
}
