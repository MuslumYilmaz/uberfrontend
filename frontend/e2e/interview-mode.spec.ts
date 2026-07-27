import type { Page, Request, Route } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

type InterviewLevel = 'junior' | 'mid' | 'senior';
type InterviewTrack = 'core-web' | 'react' | 'angular' | 'vue';
type InterviewAccessMode = 'off' | 'internal' | 'public';
type SessionStatus =
  | 'mcq_active'
  | 'coding_ready'
  | 'coding_active'
  | 'completed'
  | 'abandoned';

type MockQuestion = {
  id: string;
  revision: number;
  technology: string;
  competency: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  selectedOptionId: string | null;
};

type MockSession = {
  id: string;
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
]);

function nowIso(): string {
  return new Date().toISOString();
}

function futureIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
    disclaimer: 'Practice feedback, not an employment prediction.',
    mcqTiming: { usedSeconds: 124, allowedSeconds: 600 },
    xpAwarded: 0,
  };
}

class InterviewApiMock {
  enabled: boolean;
  accessMode: InterviewAccessMode;
  quota: NonNullable<InterviewApiOptions['quota']>;
  currentSession: MockSession | null;
  result: Record<string, unknown> | null;
  createRequests: CapturedRequest[] = [];
  answerRequests: CapturedRequest[] = [];
  draftRequests: CapturedRequest[] = [];
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
            activeSession: this.activeLink(),
            lastResults: this.result
              ? [{
                sessionId: String(this.result['sessionId']),
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
                available: true,
                reason: null,
              })),
            ),
            levels: LEVELS,
            tracks: TRACKS,
            minViewportWidth: 768,
          },
        });
        return;
      }

      if (method === 'POST' && path.endsWith('/api/interviews')) {
        const body = jsonBody(request);
        this.createRequests.push(this.capture(request, path, body));
        const level = body['level'] as InterviewLevel;
        const track = body['track'] as InterviewTrack;
        this.createCount += 1;
        this.currentSession = buildSession(
          level,
          track,
          `mock-session-${this.createCount}-${level}-${track}`,
        );
        if (!this.quota.unlimited && typeof this.quota.remaining === 'number') {
          this.quota = { ...this.quota, remaining: Math.max(0, this.quota.remaining - 1) };
        }
        await this.reply(route, { session: this.snapshotSession() }, 201);
        return;
      }

      if (method === 'GET' && path.endsWith('/api/interviews/active')) {
        await this.reply(route, { session: this.activeLink() ? this.snapshotSession() : null });
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
        this.result = buildResult(session, { submitted: false, attempted: false });
        await this.reply(route, { results: clone(this.result) });
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
  const comboboxIndex = fieldLabel === 'Level' ? 0 : 1;
  const combobox = page.getByTestId('interview-setup').getByRole('combobox').nth(comboboxIndex);
  await combobox.click();
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
  await expect(combobox).toHaveAccessibleName(optionLabel);
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
  await expect(page.locator('app-coding-framework-panel')).toBeVisible();
  await expect(page.getByTestId('framework-code-editor')).toBeVisible();
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

test('resume and hard refresh preserve the pinned question order, answer, and timer', async ({ page }) => {
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

  await page.reload();
  await expect(page.getByText(session.questions[0].prompt)).toBeVisible();
  await expect(page.locator('input[type="radio"][value="q1-b"]')).toBeChecked();
  expect(await page.locator('.question-nav button').allTextContents()).toEqual(orderBefore);
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
  await expect(page.getByRole('heading', { name: 'No attempts remaining' })).toBeVisible();
  await expect(page.getByTestId('interview-start')).toBeDisabled();
  expect(api.createRequests).toEqual([]);
});

test('an off deployment keeps direct interview URLs out of the public app', async ({ page }) => {
  const api = new InterviewApiMock({ enabled: false, accessMode: 'off' });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');

  await expect(page).toHaveURL(/\/404$/);
  await expect(page.getByTestId('interview-setup')).toHaveCount(0);
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
  await expect(page.getByTestId('interview-results')).toBeVisible();
  expect(api.endRequests).toHaveLength(1);

  await page.getByRole('link', { name: 'Interview home', exact: true }).click();
  await expect(page.getByText('Unlimited attempts')).toBeVisible();
  await page.getByTestId('interview-start').click();
  await expect(page).toHaveURL(/mock-session-2-mid-core-web$/);
  await expect(page.getByTestId('interview-session')).toBeVisible();
  expect(api.createRequests).toHaveLength(2);
  expect(api.quota.unlimited).toBe(true);
  expect(api.quota.remaining).toBeNull();
});

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
    await expectNoHorizontalOverflow(page);
  });
}
