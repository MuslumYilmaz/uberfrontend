import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Page, Request, Route } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

type InterviewLevel = 'junior' | 'mid' | 'senior';
type InterviewTrack = 'core-web' | 'react' | 'angular' | 'vue';
type InterviewFormat = 'coding' | 'system-design';
type InterviewAccessMode = 'off' | 'internal' | 'public';
type SessionStatus =
  | 'mcq_active'
  | 'coding_ready'
  | 'coding_active'
  | 'system_design_active'
  | 'completed'
  | 'abandoned';

type MockQuestion = {
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

type CanonicalPublicQuestion = {
  id: string;
  revision: number;
  technology: string;
  level: InterviewLevel;
  difficultyBand: 'foundation' | 'core' | 'stretch';
  competency: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
};

type MockSession = {
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
    checkResults: Array<Record<string, unknown>>;
    runCount: number;
  };
  systemDesign: null | Record<string, any>;
};

type CapturedRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

type InterviewApiOptions = {
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
};

const LEVELS: Array<{ value: InterviewLevel; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

const TRACKS: Array<{ value: InterviewTrack; label: string }> = [
  { value: 'core-web', label: 'Core Web' },
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue' },
];

const ACTIVE_STATUSES = new Set<SessionStatus>([
  'mcq_active',
  'coding_ready',
  'coding_active',
  'system_design_active',
]);
const SERIOUS_AXE_IMPACTS = new Set(['serious', 'critical']);

test.use({
  // Firefox 144 rejects PrimeNG's bundled Inter variable font before app code
  // executes. Keep the cross-engine Interview assertions visible while the
  // repository-wide font asset issue is tracked independently.
  consoleErrorAllowlist: [
    'downloadable font: rejected by sanitizer .*Inter-roman\\.var\\.woff2',
  ],
});

function nowIso(): string {
  return new Date().toISOString();
}

function futureIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function expectNoSeriousInterviewViolations(page: Page, label: string): Promise<void> {
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

function jsonBody(request: Request): Record<string, unknown> {
  try {
    return JSON.parse(request.postData() || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

function questionTechnologies(track: InterviewTrack): string[] {
  return track === 'core-web'
    ? ['javascript', 'javascript', 'javascript', 'html', 'css']
    : ['javascript', 'html', 'css', track, track];
}

function buildQuestions(track: InterviewTrack): MockQuestion[] {
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

function buildSession(
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

function buildSystemDesignSession(
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

function buildJavascriptTask() {
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

function buildReactTask() {
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

function buildResult(
  session: MockSession,
  options: { submitted?: boolean; attempted?: boolean } = {},
): Record<string, unknown> {
  const submitted = options.submitted ?? true;
  const attempted = options.attempted ?? submitted;
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
      locallyVerified: submitted,
      passedChecks: submitted ? 1 : 0,
      totalChecks: submitted ? 1 : 0,
      checks: submitted
        ? [{ id: 'valid-username', name: 'accepts a valid username', passed: true }]
        : [],
      rubric: [
        {
          id: 'base-correctness',
          label: 'Base correctness',
          criteria: ['Handles the primary behavior.'],
          status: submitted ? 'passed' : 'not_evaluated',
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

function buildSystemDesignResult(session: MockSession): Record<string, unknown> {
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

class InterviewApiMock {
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
  getSessionCount = 0;
  createCount = 0;

  constructor(options: InterviewApiOptions = {}) {
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
          checkResults: [],
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
          checkResults: [],
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
              expectedCheckIds: ['valid-username'],
              evidenceMode: 'client-self-report',
              authoritative: false,
              runnerConfig: {
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
        const checks = [{ id: 'valid-username', name: 'accepts a valid username', passed: true }];
        if (session.coding) {
          session.coding.checkResults = checks;
          session.coding.runCount += 1;
        }
        await this.reply(route, { version: session.version, checkResults: checks });
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
    return clone(this.currentSession);
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

function baseUrl(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) return process.env.PLAYWRIGHT_BASE_URL;
  const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
  const port = process.env.PLAYWRIGHT_PORT || '4200';
  return `http://${host}:${port}`;
}

async function seedAuthenticatedInterview(
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

async function selectSetupChoice(
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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return root.scrollWidth <= root.clientWidth + 1
      && body.scrollWidth <= body.clientWidth + 1;
  })).toBe(true);
}

test.describe('Interview Mode setup selection matrix', () => {
  for (const level of LEVELS) {
    for (const track of TRACKS) {
      test(`${level.label} × ${track.label} sends the pinned start contract`, async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 900 });
        const api = new InterviewApiMock();
        await seedAuthenticatedInterview(page, api);

        await page.goto('/interview');
        await expect(page.getByTestId('interview-setup')).toBeVisible();
        await selectSetupChoice(page, 'Level', level.label);
        await selectSetupChoice(page, 'Track', track.label);
        await page.getByTestId('interview-start').click();

        await expect(page).toHaveURL(new RegExp(`/interview/mock-session-1-${level.value}-${track.value}$`));
        await expect(page.getByTestId('interview-session')).toBeVisible();
        await expect.poll(() => api.createRequests.length).toBe(1);

        const created = api.createRequests[0];
        expect(created.body).toEqual({
          level: level.value,
          track: track.value,
          viewportWidth: 1366,
        });
        expect(created.headers['idempotency-key']).toBeTruthy();
        expect(api.currentSession?.questions.map((question) => question.technology))
          .toEqual(questionTechnologies(track.value));
      });
    }
  }
});

test('loads the approved canonical 185-question contract into the MCQ UI', async ({ page }) => {
  const canonicalRoot = path.resolve(
    process.cwd(),
    '../content-drafts/interview-mcq/generated',
  );
  const publicArtifact = JSON.parse(fs.readFileSync(
    path.join(canonicalRoot, 'frontend-interview-bank-v1.public.json'),
    'utf8',
  )) as {
    bankVersion: string;
    status: string;
    items: CanonicalPublicQuestion[];
  };
  const releaseArtifact = JSON.parse(fs.readFileSync(
    path.join(canonicalRoot, 'frontend-interview-bank-v1.release.json'),
    'utf8',
  )) as { itemCount: number; contentHash: string; status: string };

  expect(publicArtifact.bankVersion).toBe('1.3.0');
  expect(publicArtifact.status).toBe('editorial-gold');
  expect(publicArtifact.items).toHaveLength(185);
  expect(releaseArtifact).toEqual(expect.objectContaining({
    itemCount: 185,
    status: 'editorial-gold',
    contentHash: '9e2aed2606cf0fbaa54cad46c890d48e518be0266a3a91cb95cfb4777038a4e8',
  }));

  const selectedIds = [
    'int-js-number-finite-input-validation-jr-v1',
    'int-js-urlsearchparams-repeated-value-contract-jr-v1',
    'int-js-optional-chain-side-effect-short-circuit-jr-v1',
    'int-html-details-summary-disclosure-jr-v1',
    'int-css-custom-property-fallback-resolution-jr-v1',
  ];
  const byId = new Map(publicArtifact.items.map((item) => [item.id, item]));
  const selected = selectedIds.map((id) => {
    const item = byId.get(id);
    expect(item, `${id} must exist in the canonical artifact`).toBeTruthy();
    return item as CanonicalPublicQuestion;
  });
  expect(selected.map((item) => item.technology)).toEqual([
    'javascript',
    'javascript',
    'javascript',
    'html',
    'css',
  ]);
  expect(selected.map((item) => item.difficultyBand).sort()).toEqual([
    'core',
    'core',
    'core',
    'foundation',
    'stretch',
  ]);

  const session = buildSession('junior', 'core-web', 'canonical-1-3-ui-session');
  session.bankVersion = publicArtifact.bankVersion;
  session.questions = selected.map((item) => ({
    id: item.id,
    revision: item.revision,
    technology: item.technology,
    competency: item.competency,
    prompt: item.prompt,
    options: item.options,
    selectedOptionId: null,
  }));
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByTestId('interview-session')).toBeVisible();
  for (let index = 0; index < selected.length; index += 1) {
    await page.locator('.question-nav button').nth(index).click();
    await expect(page.getByText(selected[index].prompt, { exact: true })).toBeVisible();
    await expect(page.locator('fieldset input[type="radio"]')).toHaveCount(3);
    for (const option of selected[index].options) {
      await expect(page.getByText(option.label, { exact: true })).toBeVisible();
    }
  }
});

test('mocked MCQ shell has named groups, deterministic focus, bounded timer semantics, and no serious axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const session = buildSession('mid', 'react', 'a11y-mcq-session');
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  const firstPrompt = page.getByTestId('interview-question-prompt');
  await expect(firstPrompt).toBeFocused();
  await expect(page.getByRole('group', { name: session.questions[0].prompt })).toBeVisible();
  await expect(page.getByRole('timer', { name: /MCQ time:/ })).toHaveAttribute('aria-live', 'off');
  await expect(page.locator('.question-nav button').first()).toHaveAccessibleName(
    'Question 1, unanswered',
  );

  await page.locator('.question-nav button').nth(1).click();
  await expect(page.getByTestId('interview-question-prompt')).toBeFocused();
  await expect(page.getByTestId('interview-question-prompt')).toContainText(
    session.questions[1].prompt,
  );
  await page.getByRole('button', { name: 'Review answers', exact: true }).first().click();
  await expect(page.getByTestId('interview-review-heading')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousInterviewViolations(page, 'mocked MCQ shell');
});

test('mocked coding file tabs expose labelled panels and support arrow-key roving focus', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const session = buildSession('junior', 'core-web', 'a11y-coding-session');
  const task = buildJavascriptTask();
  task.files.push({
    path: 'README.md',
    language: 'markdown',
    content: 'Use the public requirements as the source of truth.',
    readOnly: true,
  });
  session.status = 'coding_active';
  session.mcqDeadlineAt = null;
  session.coding = {
    readyDeadlineAt: null,
    deadlineAt: futureIso(1500),
    task,
    draft: null,
    checkResults: [],
    runCount: 0,
  };
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  const labelledBy = await page.getByRole('tabpanel').getAttribute('aria-labelledby');
  await expect(tabs.nth(1)).toHaveAttribute('id', labelledBy || '__missing__');
  await expectNoSeriousInterviewViolations(page, 'mocked coding workspace');
});

test('completes MCQ → local JS checks → coding submit → raw results without progress writes', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock();
  await seedAuthenticatedInterview(page, api);
  const progressWrites: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())
      && (
        path.includes('/api/activity/')
        || path.includes('/api/practice-progress')
        || path.includes('/api/daily/')
        || path.includes('/api/weekly-goal')
        || path.includes('/api/users/me/solved')
        || path.includes('/api/achievements')
        || /\/api\/xp(?:\/|$)/.test(path)
      )
    ) {
      progressWrites.push(`${request.method()} ${path}`);
    }
  });

  await page.goto('/interview');
  await selectSetupChoice(page, 'Level', 'Junior');
  await page.getByTestId('interview-start').click();
  await expect(page.getByTestId('interview-timer')).toContainText('MCQ time');
  await expect(page.getByText(/Correct|Incorrect/, { exact: true })).toHaveCount(0);

  for (let index = 0; index < 5; index += 1) {
    await page.locator('fieldset input[type="radio"]').first().check();
    await expect.poll(() => api.answerRequests.length).toBe(index + 1);
    if (index < 4) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Review answers', exact: true }).last().click();
    }
  }

  await expect(page.getByText('5/5 answered')).toBeVisible();
  await page.getByTestId('submit-mcq').click();
  await expect(page.getByRole('heading', { name: 'Your coding task is next' })).toBeVisible();
  await page.getByTestId('start-coding').click();

  await expect(page.getByRole('heading', { name: 'Validate Username' })).toBeVisible();
  await expect(page.getByText('Interview coding awards 0 XP.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeVisible();
  await expect(page.getByTestId('submit-coding')).toBeVisible();
  await expect(page.getByText('Draft saved')).toBeVisible();

  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.getByText('1/1 checks passed')).toBeVisible();
  expect(api.checkRequests.map((request) => request.body['action'])).toEqual(['prepare', 'complete']);
  expect(api.checkRequests[1].body['checks']).toEqual([
    { id: 'valid-username', passed: true },
  ]);

  await page.getByTestId('submit-coding').click();
  await expect(page).toHaveURL(/\/interview\/[^/]+\/results$/);
  await expect(page.getByTestId('interview-results')).toBeVisible();
  await expect(page.getByText('Preparation feedback only')).toBeVisible();
  await expect(page.getByText('This session awarded 0 XP and did not change solved progress.')).toBeVisible();
  await expect(page.getByText('1 browser checks passed for the submitted draft.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Answer review' })).toBeVisible();
  await expect(page.getByText(/Hire|Strong Hire|readiness/i)).toHaveCount(0);
  expect(progressWrites).toEqual([]);
});

test('completes guided system design setup → autosave → refresh → twist → evidence report', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock({ systemDesignEnabled: true });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await page.getByRole('radio', { name: /System design mock/ }).check();
  await selectSetupChoice(page, 'Track', 'React');
  await expect(page.getByText('15 minutes guided system design')).toBeVisible();
  await page.getByTestId('interview-start').click();

  await expect(page).toHaveURL(/\/interview\/mock-system-design-1-mid-react$/);
  await expect(page.getByTestId('system-design-round')).toBeVisible();
  await expect(page.getByTestId('interview-timer')).toContainText('System design time');
  expect(api.createRequests[0].body).toEqual({
    format: 'system-design',
    level: 'mid',
    track: 'react',
    viewportWidth: 1366,
  });

  await page.setViewportSize({ width: 834, height: 900 });
  await expectNoHorizontalOverflow(page);
  const sidebarBox = await page.locator('.design-sidebar').boundingBox();
  const workspaceBox = await page.locator('.design-workspace').boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(workspaceBox).not.toBeNull();
  expect(workspaceBox!.y).toBeGreaterThan(sidebarBox!.y);
  await page.setViewportSize({ width: 1366, height: 900 });

  const keyboardClarification = page.getByLabel('Is keyboard navigation required?');
  await keyboardClarification.focus();
  await keyboardClarification.press('Space');
  await expect(keyboardClarification).toBeChecked();
  await expect(page.getByText(/Interviewer: Yes, full keyboard navigation is required/))
    .toBeVisible();
  await expect.poll(() => api.systemDesignDraftRequests.length).toBeGreaterThanOrEqual(1);

  const staleClarification = page.getByLabel('Can stale results remain visible?');
  const cacheClarification = page.getByLabel('Can cached results be shared across users?');
  const unseenClarification = page.getByLabel('How many results can a query return?');
  await staleClarification.check();
  await cacheClarification.check();
  const beforeThreeAnswersSave = api.systemDesignDraftRequests.length;
  await expect.poll(() => api.systemDesignDraftRequests.length)
    .toBeGreaterThan(beforeThreeAnswersSave);

  await cacheClarification.uncheck();
  const beforeReleasedSelectionSave = api.systemDesignDraftRequests.length;
  await expect.poll(() => api.systemDesignDraftRequests.length)
    .toBeGreaterThan(beforeReleasedSelectionSave);
  await expect(unseenClarification).toBeDisabled();
  await expect(cacheClarification).toBeEnabled();
  const beforeReuseSave = api.systemDesignDraftRequests.length;
  await cacheClarification.check();
  await expect(page.getByText('3/3 selected')).toBeVisible();
  await expect.poll(() => api.systemDesignDraftRequests.length).toBeGreaterThan(beforeReuseSave);

  await page.reload();
  await expect(page.getByLabel('Is keyboard navigation required?')).toBeChecked();
  await expect(page.getByLabel('Can stale results remain visible?')).toBeChecked();
  await expect(page.getByLabel('Can cached results be shared across users?')).toBeChecked();
  await expect(page.getByLabel('How many results can a query return?')).toBeDisabled();
  await expect(page.getByText(/Interviewer: Yes, full keyboard navigation is required/))
    .toBeVisible();

  await page.getByRole('button', { name: 'Next stage' }).click();
  await page.getByLabel('Preserve request ordering').check();
  await page.getByLabel('Keep keyboard focus stable').check();
  await page.getByLabel('Bound duplicate network requests').check();
  await page.getByRole('button', { name: 'Next stage' }).click();

  const inputCard = page.locator('.palette-card').filter({ hasText: 'Search input' });
  const inputLaneSelect = inputCard.getByRole('combobox');
  await inputLaneSelect.click();
  const inputLaneListboxId = await inputLaneSelect.getAttribute('aria-controls');
  expect(inputLaneListboxId).toBeTruthy();
  await page.locator(`#${inputLaneListboxId!}`)
    .getByRole('option', { name: 'UI', exact: true })
    .click();
  const controllerCard = page.locator('.palette-card').filter({ hasText: 'Request controller' });
  const controllerLaneSelect = controllerCard.getByRole('combobox');
  await controllerLaneSelect.click();
  const controllerLaneListboxId = await controllerLaneSelect.getAttribute('aria-controls');
  expect(controllerLaneListboxId).toBeTruthy();
  await page.locator(`#${controllerLaneListboxId!}`)
    .getByRole('option', { name: 'Data', exact: true })
    .click();
  await page.getByRole('button', { name: 'Next stage' }).click();

  const connectionBuilder = page.locator('.connection-builder');
  await connectionBuilder.getByRole('combobox').nth(0).click();
  await page.getByRole('option', { name: 'Search input', exact: true }).last().click();
  await connectionBuilder.getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: 'Request controller', exact: true }).last().click();
  await page.getByRole('button', { name: 'Add connection' }).click();
  await page.getByLabel('Abort obsolete requests').check();
  await page.getByLabel('Prevent stale results').check();
  await page.getByRole('button', { name: 'Continue to production twist' }).click();
  await page.getByTestId('reveal-system-design-twist').click();

  await expect(page.getByText('The user changes locale while an older request is still in flight.'))
    .toBeVisible();
  await page.getByLabel('Include locale in request and cache identity').check();
  await expect(page.getByText('Design saved')).toBeVisible();
  await page.getByTestId('submit-system-design').click();

  await expect(page).toHaveURL(/\/interview\/mock-system-design-1-mid-react\/results$/);
  await expect(page.getByRole('heading', { name: 'Your design' })).toBeVisible();
  await expect(page.getByText('Not enough evidence')).toBeVisible();
  await expect(page.getByText('Request identity', { exact: true })).toBeVisible();
  await expect(page.getByText('This session awarded 0 XP and did not change solved progress.'))
    .toBeVisible();
  await expect(page.getByText(/Correct|Incorrect/, { exact: true })).toHaveCount(0);
  expect(api.systemDesignTwistRequests[0].body['draftHash']).toBeTruthy();
  expect(api.systemDesignSubmitRequests[0].body['draftHash']).toBeTruthy();
});

test('renders the bounded framework interview shell without normal solution/progress controls', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const session = buildSession('junior', 'react', 'framework-shell-session');
  session.status = 'coding_active';
  session.mcqDeadlineAt = null;
  session.coding = {
    readyDeadlineAt: null,
    deadlineAt: futureIso(1500),
    task: buildReactTask(),
    draft: null,
    checkResults: [],
    runCount: 0,
  };
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByRole('heading', { name: 'React Counter (Guarded Decrement)' })).toBeVisible();
  const frameworkPanel = page.locator('app-coding-framework-panel');
  await expect(frameworkPanel).toBeVisible();
  // Monaco's input textarea is intentionally visually hidden in Firefox. The
  // rendered editor surface is the cross-engine contract; the textarea remains
  // present and labelled for Monaco's own keyboard/input handling.
  await expect(frameworkPanel.locator('.monaco-editor')).toBeVisible();
  await expect(frameworkPanel.getByRole('textbox')).toHaveAttribute('aria-label', 'Editor content');
  await expect(page.getByRole('button', { name: 'Run checks', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rebuild preview', exact: true })).toBeVisible();
  await expect(page.getByText('Interview coding awards 0 XP.')).toBeVisible();
  await expect(page.getByText(/Solution loaded|Showing solution preview/)).toHaveCount(0);
  await expect.poll(() => api.draftRequests.length).toBeGreaterThanOrEqual(1);
});

test('an expired MCQ deadline is reconciled through the backend transition', async ({ page }) => {
  const session = buildSession('mid', 'core-web', 'expired-mcq-session');
  session.serverNow = nowIso();
  session.mcqDeadlineAt = new Date(Date.now() - 1000).toISOString();
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);
  let timeoutSubmitCount = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/mcq/submit')) {
      timeoutSubmitCount += 1;
    }
  });

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByRole('heading', { name: 'Your coding task is next' })).toBeVisible();
  expect(timeoutSubmitCount).toBe(1);
  expect(api.currentSession?.status).toBe('coding_ready');
  await expect(page.getByTestId('interview-timer')).toContainText('Start coding within');
});

test('leaving, resuming, and refreshing preserve question position, review state, answers, and timer', async ({ page }) => {
  const session = buildSession('senior', 'vue', 'resume-session');
  session.questions[0].selectedOptionId = 'q1-b';
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'Continue your vue interview' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume interview' }).click();
  await expect(page).toHaveURL(`/interview/${session.id}`);
  await expect(page.getByText(session.questions[0].prompt)).toBeVisible();
  await expect(page.locator('input[type="radio"][value="q1-b"]')).toBeChecked();
  const orderBefore = await page.locator('.question-nav button').allTextContents();

  await page.locator('.question-nav button').nth(3).click();
  await expect(page.getByText(session.questions[3].prompt)).toBeVisible();
  await page.goto('/interview');
  await page.getByRole('button', { name: 'Resume interview' }).click();
  await expect(page.getByText(session.questions[3].prompt)).toBeVisible();

  await page.getByRole('button', { name: 'Review answers' }).click();
  await expect(page.getByRole('heading', { name: 'Check for unanswered questions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Check for unanswered questions' })).toBeVisible();
  expect(await page.locator('.question-nav button').allTextContents()).toEqual(orderBefore);
  await page.locator('.question-nav button').first().click();
  await expect(page.locator('input[type="radio"][value="q1-b"]')).toBeChecked();
  await expect(page.getByTestId('interview-timer')).toContainText('MCQ time');
  expect(api.getSessionCount).toBeGreaterThanOrEqual(2);
});

test('free quota gate prevents a start request', async ({ page }) => {
  const api = new InterviewApiMock({
    quota: {
      remaining: 0,
      limit: 1,
      resetAt: '2026-08-01T00:00:00.000+03:00',
      unlimited: false,
    },
  });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'No coding attempts remaining' })).toBeVisible();
  await expect(page.getByTestId('interview-start')).toBeDisabled();
  expect(api.createRequests).toEqual([]);
});

test('an off deployment keeps a direct URL in the authenticated safe shell', async ({ page }) => {
  const api = new InterviewApiMock({ enabled: false, accessMode: 'off' });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');

  await expect(page).toHaveURL(/\/interview$/);
  await expect(page.getByTestId('interview-setup')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Interview Mode is currently unavailable' }))
    .toBeVisible();
  expect(api.createRequests).toEqual([]);
});

test('premium users can abandon and immediately start a second unlimited session', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock({
    quota: { remaining: null, limit: null, resetAt: null, unlimited: true },
  });
  await seedAuthenticatedInterview(page, api, 'premium');

  await page.goto('/interview');
  await expect(page.getByText('Unlimited attempts')).toBeVisible();
  await page.getByTestId('interview-start').click();
  await expect(page.getByTestId('interview-session')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'End interview' }).click();
  await expect(page).toHaveURL(/\/interview\?ended=abandoned$/);
  await expect(page.getByTestId('interview-setup')).toBeVisible();
  await expect(page.getByText('Interview ended', { exact: true })).toBeVisible();
  await expect(page.getByText(/Answer review is withheld/)).toBeVisible();
  await expect(page.getByTestId('interview-results')).toHaveCount(0);
  expect(api.endRequests).toHaveLength(1);

  await expect(page.getByText('Unlimited attempts')).toBeVisible();
  await page.getByTestId('interview-start').click();
  await expect(page).toHaveURL(/mock-session-2-mid-core-web$/);
  await expect(page.getByTestId('interview-session')).toBeVisible();
  expect(api.createRequests).toHaveLength(2);
  expect(api.quota.unlimited).toBe(true);
  expect(api.quota.remaining).toBeNull();
});

for (const width of [360, 390, 834, 1366, 1440]) {
  test(`active MCQ snippets stay inside the session layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const active = buildSession('mid', 'react', `snippet-session-${width}`);
    const api = new InterviewApiMock({ initialSession: active });
    await seedAuthenticatedInterview(page, api);

    await page.goto(`/interview/${active.id}`);
    await expect(page.getByTestId('interview-session')).toBeVisible();
    await expect(page.locator('.question-code')).toContainText('longRuntimeIdentifier');
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of [360, 390, 834, 1366, 1440]) {
  test(`setup and results reflow at ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    const completed = buildSession('mid', 'react', `responsive-${width}`);
    completed.status = 'completed';
    const api = new InterviewApiMock({
      initialResult: buildResult(completed, { submitted: true, attempted: true }),
    });
    await seedAuthenticatedInterview(page, api);

    await page.goto('/interview');
    await expect(page.getByTestId('interview-setup')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (width < 768) {
      await expect(page.getByTestId('interview-mobile-block')).toBeVisible();
      await expect(page.getByTestId('interview-start')).toBeDisabled();
      expect(api.createRequests).toEqual([]);
    } else {
      await expect(page.getByTestId('interview-mobile-block')).toBeHidden();
      await expect(page.getByTestId('interview-start')).toBeEnabled();
    }

    await page.goto(`/interview/${completed.id}/results`);
    await expect(page.getByTestId('interview-results')).toBeVisible();
    await expect(page.getByText('Preparation feedback only')).toBeVisible();
    await page.locator('.answer-list details summary').first().click();
    await expect(page.locator('.question-code').first()).toContainText('longRuntimeIdentifier');
    await expectNoHorizontalOverflow(page);
  });
}
