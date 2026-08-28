import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiUrl } from '../utils/api-base';
import { InterviewService } from './interview.service';

describe('InterviewService', () => {
  let service: InterviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InterviewService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InterviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('normalizes availability and keeps defaults bounded', () => {
    let result: ReturnType<InterviewService['normalizeAvailability']> | undefined;
    service.getAvailability().subscribe((value) => { result = value; });

    const request = http.expectOne(apiUrl('/interviews/availability'));
    expect(request.request.withCredentials).toBeTrue();
    request.flush({
      availability: {
        enabled: true,
        accessMode: 'internal',
        quota: { remaining: 2, limit: 3, resetAt: '2026-08-01T00:00:00.000Z' },
        active: { sessionId: 'session-active', phase: 'coding_active' },
        levels: ['junior', { value: 'senior', label: 'Senior' }, 'unsupported'],
        tracks: ['core-web', 'react'],
        availability: [
          { level: 'junior', track: 'core-web', available: true },
          { level: 'senior', track: 'react', available: false },
          { level: 'unsupported', track: 'react', available: true },
        ],
        minViewportWidth: 720,
      },
    });

    expect(result?.enabled).toBeTrue();
    expect(result?.accessMode).toBe('internal');
    expect(result?.activeSession).toEqual(jasmine.objectContaining({
      id: 'session-active',
      status: 'coding_active',
    }));
    expect(result?.quota?.unlimited).toBeFalse();
    expect(result?.levels.map((level) => level.value)).toEqual(['junior', 'senior']);
    expect(result?.tracks.map((track) => track.value)).toEqual(['core-web', 'react']);
    expect(result?.targets).toEqual([
      { level: 'junior', track: 'core-web', format: 'coding', available: true },
      { level: 'senior', track: 'react', format: 'coding', available: false },
    ]);
    expect(result?.minViewportWidth).toBe(720);
    expect(result?.timing).toEqual({
      mcqSeconds: 600,
      mcqSecondsByLevel: { junior: 600, mid: 600, senior: 600 },
      codingReadySeconds: 300,
      systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
    });
  });

  it('preserves an unlimited premium quota instead of coercing it to exhausted', () => {
    let result: ReturnType<InterviewService['normalizeAvailability']> | undefined;
    service.getAvailability().subscribe((value) => { result = value; });

    const request = http.expectOne(apiUrl('/interviews/availability'));
    request.flush({
      availability: {
        enabled: true,
        accessMode: 'public',
        quota: { unlimited: true, remaining: null, limit: null },
      },
    });

    expect(result?.quota).toEqual({
      unlimited: true,
      remaining: null,
      limit: null,
      resetAt: null,
    });
    expect(result?.accessMode).toBe('public');
  });

  it('fails closed when an enabled response omits the access mode', () => {
    const result = service.normalizeAvailability({ enabled: true });

    expect(result.enabled).toBeFalse();
    expect(result.accessMode).toBe('off');
  });

  it('fails closed for an unknown access mode even when enabled is advertised', () => {
    const result = service.normalizeAvailability({
      enabled: true,
      accessMode: 'preview-only',
    });

    expect(result.enabled).toBeFalse();
    expect(result.accessMode).toBe('off');
  });

  it('retains a known rollout label without granting access when the backend marks access disabled', () => {
    const result = service.normalizeAvailability({
      enabled: false,
      accessMode: 'internal',
    });

    expect(result.enabled).toBeFalse();
    expect(result.accessMode).toBe('internal');
  });

  it('normalizes cohort, drain and halt control metadata without treating it as authority', () => {
    const draining = service.normalizeAvailability({
      enabled: false,
      accessMode: 'cohort',
      canCreate: false,
      operationalState: 'drain',
      activeSessionPolicy: 'continue',
      shutdownNotice: {
        code: 'INTERVIEW_DRAINING',
        message: 'New sessions are paused.',
      },
    });

    expect(draining).toEqual(jasmine.objectContaining({
      enabled: false,
      accessMode: 'cohort',
      canCreate: false,
      operationalState: 'drain',
      activeSessionPolicy: 'continue',
      shutdownNotice: {
        code: 'INTERVIEW_DRAINING',
        message: 'New sessions are paused.',
      },
    }));

    expect(service.normalizeControl({
      id: 'session-1',
      status: 'mcq_active',
      version: 4,
      active: true,
      policy: 'halted',
      notice: { code: 'INTERVIEW_HALTED', message: 'Stop working.' },
    })).toEqual({
      id: 'session-1',
      status: 'mcq_active',
      version: 4,
      active: true,
      policy: 'halted',
      notice: { code: 'INTERVIEW_HALTED', message: 'Stop working.' },
    });
  });

  it('projects a session without retaining answer keys or solution fields', () => {
    const session = service.normalizeSession({
      session: {
        id: 'session-1',
        phase: 'mcq_active',
        level: 'mid',
        framework: 'react',
        bankVersion: 'v1',
        serverNow: '2026-07-27T12:00:00.000Z',
        deadlines: { mcq: '2026-07-27T12:10:00.000Z' },
        answers: { question_1: 'option_b' },
        questions: [{
          id: 'question_1',
          revision: 2,
          technology: 'react',
          competency: 'effects',
          prompt: 'Which cleanup is scoped to this Effect run?',
          correctOptionId: 'option_a',
          explanation: 'Private explanation',
          provenance: [{ url: 'private' }],
          options: [
            { id: 'option_a', label: 'Return cleanup from the Effect.' },
            { id: 'option_b', label: 'Store cleanup in component state.' },
            { id: 'option_c', label: 'Run cleanup from render.' },
          ],
        }],
      },
    });

    expect(session.status).toBe('mcq_active');
    expect(session.protocolVersion).toBe(1);
    expect(session.questions[0].selectedOptionId).toBe('option_b');
    expect(Object.keys(session.questions[0])).not.toContain('correctOptionId');
    expect(Object.keys(session.questions[0])).not.toContain('explanation');
    expect(Object.keys(session.questions[0])).not.toContain('provenance');
  });

  it('normalizes abandon responses as terminal sessions without answer fields', () => {
    let result: ReturnType<InterviewService['normalizeSession']> | undefined;
    service.endSession('session-1', 3).subscribe((value) => { result = value; });

    const request = http.expectOne(apiUrl('/interviews/session-1/end'));
    expect(request.request.body).toEqual({ expectedVersion: 3 });
    request.flush({
      session: {
        id: 'session-1',
        status: 'abandoned',
        level: 'mid',
        track: 'react',
        version: 4,
        serverNow: '2026-07-27T12:00:00.000Z',
        resultAvailable: false,
        deadlines: {},
        questions: [{
          id: 'question-1',
          revision: 1,
          technology: 'react',
          competency: 'effects',
          prompt: 'Which cleanup belongs to this Effect?',
          correctOptionId: 'option-a',
          explanation: 'Private explanation',
          options: [
            { id: 'option-a', label: 'Return cleanup.' },
            { id: 'option-b', label: 'Keep it in render.' },
          ],
        }],
      },
    });

    expect(result?.status).toBe('abandoned');
    expect(Object.keys(result?.questions[0] || {})).not.toContain('correctOptionId');
    expect(Object.keys(result?.questions[0] || {})).not.toContain('explanation');
  });

  it('normalizes structured, legacy-string, and missing MCQ snippets', () => {
    const makeQuestion = (id: string, code?: unknown, language?: string) => ({
      id,
      revision: 1,
      technology: 'javascript',
      competency: 'runtime-contracts',
      prompt: `How should ${id} be handled in this production flow?`,
      ...(code === undefined ? {} : { code }),
      ...(language ? { codeLanguage: language } : {}),
      options: [
        { id: `${id}-one`, label: 'Use the first runtime-safe approach.' },
        { id: `${id}-two`, label: 'Use the second runtime-safe approach.' },
        { id: `${id}-three`, label: 'Use the third runtime-safe approach.' },
      ],
    });
    const session = service.normalizeSession({
      session: {
        id: 'snippet-session',
        status: 'mcq_active',
        level: 'mid',
        track: 'core-web',
        version: 1,
        serverNow: '2026-07-29T12:00:00.000Z',
        deadlines: { mcq: '2026-07-29T12:10:00.000Z' },
        questions: [
          makeQuestion('structured', {
            language: 'javascript',
            runtime: 'browser',
            source: 'const structured = true;',
          }),
          makeQuestion('legacy', 'const legacy = true;', 'javascript'),
          makeQuestion('missing'),
        ],
      },
    });

    expect(session.questions[0]).toEqual(jasmine.objectContaining({
      code: 'const structured = true;',
      codeLanguage: 'javascript',
    }));
    expect(session.questions[1]).toEqual(jasmine.objectContaining({
      code: 'const legacy = true;',
      codeLanguage: 'javascript',
    }));
    expect(session.questions[2].code).toBeUndefined();
    expect(session.questions[2].codeLanguage).toBeUndefined();
  });

  it('keeps an asset-only framework task public without exposing runner tests', () => {
    const session = service.normalizeSession({
      session: {
        id: 'session-framework',
        status: 'coding_active',
        level: 'mid',
        track: 'react',
        version: 2,
        serverNow: '2026-07-27T12:00:00.000Z',
        bank: { version: '1.0.0' },
        questions: [],
        deadlines: { coding: '2026-07-27T12:35:00.000Z' },
        coding: {
          variant: {
            id: 'react-counter-interview',
            title: 'Counter',
            prompt: 'Build a counter.',
            runner: 'framework-preview',
            sourceQuestionId: 'react-counter',
            sourceContentVersion: 'v2',
            starterAsset: 'assets/sb/react/question/react-counter.v2.json',
            starterFiles: [],
            publicRequirements: [{
              id: 'base',
              title: 'Base behavior',
              prompt: 'Implement the core flow.',
              constraints: ['Increment the count.'],
            }],
            runnerConfig: { privateTests: ['must not survive projection'] },
          },
          draft: null,
          checkRuns: [],
        },
      },
    });

    expect(session.coding?.task).toEqual(jasmine.objectContaining({
      runner: 'framework-preview',
      starterAsset: 'assets/sb/react/question/react-counter.v2.json',
      files: [],
    }));
    expect(Object.keys(session.coding?.task || {})).not.toContain('runnerConfig');
  });

  it('sends answer option ids and no position-based answer', () => {
    service.saveAnswer(
      'session /1',
      {
        protocolVersion: 2,
        questionId: 'question 1',
        optionId: 'option_c',
        responseDurationMs: 12_345,
        mutationId: 'mcq-answer-request-1',
        expectedVersion: 4,
      },
    ).subscribe();

    const request = http.expectOne(
      `${apiUrl('/interviews')}/session%20%2F1/mcq/question%201`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      optionId: 'option_c',
      responseDurationMs: 12_345,
      protocolVersion: 2,
      mutationId: 'mcq-answer-request-1',
      expectedVersion: 4,
    });
    request.flush({ ok: true });
  });

  it('submits a V2 idempotent snapshot of every current MCQ response', () => {
    service.submitMcq('session-1', {
      protocolVersion: 2,
      mutationId: 'mcq-submit-request-1',
      expectedVersion: 9,
      responses: [
        { questionId: 'question-1', optionId: 'option-b', responseDurationMs: 1_234.4 },
        { questionId: 'question-2', optionId: null },
      ],
    }).subscribe();

    const request = http.expectOne(
      `${apiUrl('/interviews')}/session-1/mcq/submit`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      protocolVersion: 2,
      mutationId: 'mcq-submit-request-1',
      expectedVersion: 9,
      responses: [
        { questionId: 'question-1', optionId: 'option-b', responseDurationMs: 1_234 },
        { questionId: 'question-2', optionId: null },
      ],
    });
    request.flush({
      session: {
        id: 'session-1',
        status: 'coding_ready',
        format: 'coding',
        level: 'mid',
        track: 'react',
        version: 10,
        questions: [],
      },
    });
  });

  it('creates a fixed-timing session with the idempotency header and no duration input', () => {
    let createdProtocolVersion: 1 | 2 | undefined;
    service.createSession(
      { level: 'senior', track: 'vue', viewportWidth: 1366 },
      'interview-request-123',
    ).subscribe((session) => { createdProtocolVersion = session.protocolVersion; });

    const request = http.expectOne(apiUrl('/interviews'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('interview-request-123');
    expect(request.request.body).toEqual({
      level: 'senior',
      track: 'vue',
      viewportWidth: 1366,
    });
    expect(request.request.body['durationMinutes']).toBeUndefined();
    request.flush({
      session: {
        id: 'session-created',
        protocolVersion: 2,
        status: 'mcq_active',
        level: 'senior',
        track: 'vue',
        version: 0,
        questions: [],
      },
    });
    expect(createdProtocolVersion).toBe(2);
  });

  it('prepares browser checks for a synced draft without asking the server to execute code', () => {
    let runToken = '';
    service.prepareCodingCheckRun('session-1', 'draft-hash', 7)
      .subscribe((value) => { runToken = value.runToken; });

    const request = http.expectOne(
      `${apiUrl('/interviews')}/session-1/coding/check-runs`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      action: 'prepare',
      draftHash: 'draft-hash',
      expectedVersion: 7,
    });
    request.flush({
      prepared: {
        runToken: 'signed-run-token',
        expiresAt: '2026-07-27T12:05:00.000Z',
        draftHash: 'draft-hash',
        expectedCheckIds: ['render'],
        evidenceMode: 'client-self-report',
        authoritative: false,
        runnerConfig: {
          kind: 'javascript',
          language: 'javascript',
          tests: "test('renders', () => expect(true).toBe(true));",
          checks: [{ id: 'render', name: 'Renders the required state' }],
        },
      },
    });

    expect(runToken).toBe('signed-run-token');
    expect(request.request.body['files']).toBeUndefined();
  });

  it('records only bounded browser check results in the complete phase', () => {
    let results: Array<{ name: string; passed: boolean }> = [];
    service.completeCodingCheckRun(
      'session-1',
      { runToken: 'signed-run-token', draftHash: 'draft-hash' },
      [
        { id: 'render', passed: true },
        { id: 'private', passed: false },
      ],
      7,
    ).subscribe((value) => { results = value.results; });

    const request = http.expectOne(
      `${apiUrl('/interviews')}/session-1/coding/check-runs`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      action: 'complete',
      runToken: 'signed-run-token',
      draftHash: 'draft-hash',
      checks: [
        { id: 'render', passed: true },
        { id: 'private', passed: false },
      ],
      expectedVersion: 7,
    });
    request.flush({
      checks: [
        { id: 'render', name: 'Renders the required state', passed: true },
        {
          id: 'private',
          name: 'Handles an edge case',
          passed: false,
          error: 'The edge case did not pass.',
          privateSource: 'must not be retained',
        },
      ],
    });

    expect(results).toEqual([
      jasmine.objectContaining({ name: 'Renders the required state', passed: true }),
      jasmine.objectContaining({ name: 'Handles an edge case', passed: false }),
    ]);
    expect(Object.keys(results[1])).not.toContain('privateSource');
  });

  it('forces interview result XP to zero regardless of the response', () => {
    const result = service.normalizeResult({
      result: {
        sessionId: 'session-1',
        level: 'junior',
        track: 'vue',
        xpAwarded: 900,
        score: { correct: 4, incorrect: 1, unanswered: 0, total: 5 },
      },
    });

    expect(result.xpAwarded).toBe(0);
    expect(result.score).toEqual({
      correct: 4,
      incorrect: 1,
      unanswered: 0,
      total: 5,
    });
    expect(result.disclaimer).toContain('not an employment decision');
  });

  it('normalizes the exact result snapshot with core breakdown and no pre-coding attempt', () => {
    const result = service.normalizeResult({
      results: {
        sessionId: 'session-2',
        finalizedAt: '2026-07-27T12:00:00.000Z',
        level: 'mid',
        track: 'core-web',
        mcq: {
          total: 5,
          correct: 2,
          incorrect: 2,
          unanswered: 1,
          timing: { usedSeconds: 500, allowedSeconds: 600 },
          breakdown: {
            core: { total: 5, correct: 2, incorrect: 2, unanswered: 1 },
            framework: { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
          },
          questions: [{
            id: 'js-output-1',
            technology: 'javascript',
            competency: 'Event loop',
            prompt: 'What is logged?',
            code: 'console.log("sync");',
            codeLanguage: 'javascript',
            options: [
              { id: 'option-a', label: 'sync' },
              { id: 'option-b', label: 'async' },
              { id: 'option-c', label: 'nothing' },
            ],
            selectedOptionId: 'option-a',
            correctOptionId: 'option-a',
            correct: true,
          }],
        },
        coding: {
          sourceQuestionId: 'js-safe-json-parse',
          outcome: 'abandoned',
          submitted: false,
          draftHash: null,
          locallyVerified: false,
          authoritativeEvaluation: false,
          timing: { usedSeconds: 0, allowedSeconds: 2100 },
          checkRun: null,
          rubric: [{
            id: 'contract',
            title: 'Implementation contract',
            criteria: ['Return the parsed value.'],
            status: 'not_evaluated',
          }],
        },
        reviewNext: [
          { topic: 'Promises', evidenceCount: 2 },
          { topic: 'Abort signals', evidenceCount: 1 },
          { topic: 'Error paths', evidenceCount: 1 },
          { topic: 'Ignored fourth topic', evidenceCount: 1 },
        ],
        evidenceNotice: 'Mock preparation evidence; not an employment prediction.',
      },
    });

    expect(result.sections).toEqual([{
      id: 'core-web',
      label: 'Core Web',
      total: 5,
      correct: 2,
      incorrect: 2,
      unanswered: 1,
    }]);
    expect(result.coding?.attempted).toBeFalse();
    expect(result.coding?.rubric[0].status).toBe('not_evaluated');
    expect(result.questions[0]).toEqual(jasmine.objectContaining({
      code: 'console.log("sync");',
      codeLanguage: 'javascript',
    }));
    expect(result.remediationTopics).toEqual(['Promises', 'Abort signals', 'Error paths']);
    expect(result.mcqTiming).toEqual({ usedSeconds: 500, allowedSeconds: 600 });
  });

  it('normalizes split system-design availability without changing the legacy coding quota', () => {
    const result = service.normalizeAvailability({
      enabled: true,
      accessMode: 'public',
      quota: { remaining: 1, limit: 1 },
      quotas: {
        coding: { remaining: 1, limit: 1 },
        systemDesign: { remaining: 0, limit: 1, resetAt: '2026-08-01T00:00:00.000Z' },
      },
      formats: [
        { id: 'coding', available: true },
        { id: 'system-design', available: true },
      ],
      availability: [
        { format: 'coding', level: 'mid', track: 'react', available: true },
      ],
      systemDesignAvailability: [
        { format: 'system-design', level: 'mid', track: 'react', available: true },
      ],
      timing: {
        systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
      },
    });

    expect(result.quota?.remaining).toBe(1);
    expect(result.quotas['system-design']?.remaining).toBe(0);
    expect(result.targets).toContain(jasmine.objectContaining({
      format: 'system-design',
      level: 'mid',
      track: 'react',
      available: true,
    }));
    expect(result.formatAvailability.find((entry) => entry.format === 'system-design')?.enabled)
      .toBeTrue();
  });

  it('projects a guided design session and reveals only selected clarification answers', () => {
    const session = service.normalizeSession({
      session: {
        id: 'design-session',
        format: 'system-design',
        status: 'system_design_active',
        level: 'mid',
        track: 'react',
        version: 2,
        serverNow: '2026-07-29T10:00:00.000Z',
        deadlines: { systemDesign: '2026-07-29T10:15:00.000Z' },
        systemDesign: {
          scenario: {
            id: 'int-sd-autocomplete-race-mid-v1',
            revision: 1,
            title: 'Reliable autocomplete',
            prompt: 'Design a production autocomplete.',
            timeLimitSeconds: 900,
            steps: [
              { id: 'clarifications', title: 'Clarify' },
              { id: 'requirements', title: 'Prioritize' },
              { id: 'architecture', title: 'Architecture' },
              { id: 'decisions', title: 'Decisions' },
              { id: 'twist', title: 'Twist' },
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
              { id: 'a11y', prompt: 'Is keyboard navigation required?' },
              { id: 'seo', prompt: 'Is SEO required?' },
            ],
            requirements: [{ id: 'stale', title: 'Prevent stale results' }],
            cards: [{
              id: 'controller',
              title: 'Request controller',
            }],
            connectionTypes: [{ id: 'data-flow', title: 'Data flow' }],
            decisions: [{
              id: 'cancellation',
              title: 'Cancellation',
              prompt: 'How will requests be owned?',
              options: [{ id: 'abort', label: 'Abort obsolete requests' }],
              rationales: [{ id: 'ordering', label: 'Preserve ordering' }],
            }],
            frameworkLens: { title: 'React ownership', prompt: 'Name the owner.' },
            privateRubric: 'must not survive',
          },
          clarificationAnswers: [{
            clarificationId: 'a11y',
            answer: 'Yes, full keyboard navigation is required.',
          }],
          twist: null,
          twistRevealed: false,
          draft: {
            currentStep: 'clarifications',
            clarificationIds: ['a11y'],
            priorityRequirementIds: [],
            placements: [],
            connections: [],
            decisions: [],
            twistResponseActionIds: [],
            scratchpad: '',
            hash: 'draft-hash',
            updatedAt: '2026-07-29T10:01:00.000Z',
          },
        },
      },
    });

    expect(session.format).toBe('system-design');
    expect(session.status).toBe('system_design_active');
    expect(session.systemDesign?.deadlineAt).toBe('2026-07-29T10:15:00.000Z');
    expect(session.systemDesign?.scenario?.clarifications[0].answer)
      .toBe('Yes, full keyboard navigation is required.');
    expect(session.systemDesign?.scenario?.clarifications[1].answer).toBeNull();
    expect(session.systemDesign?.scenario?.connectionTypes[0].value).toBe('data-flow');
    expect(Object.keys(session.systemDesign?.scenario || {})).not.toContain('privateRubric');
    expect(Object.keys(session.systemDesign?.scenario || {})).not.toContain('frameworkLens');
  });

  it('serializes the UI design draft to the pinned backend wire contract', () => {
    service.saveSystemDesignDraft(
      'design/session',
      {
        mutationId: 'mutation-1',
        draft: {
          currentStep: 'requirements',
          selectedClarificationIds: ['a11y'],
          prioritizedRequirementIds: ['stale'],
          placements: [{ cardId: 'input', laneId: 'ui', order: 0 }],
          connections: [{
            id: 'local-only-id',
            fromCardId: 'input',
            toCardId: 'controller',
            type: 'event-flow',
          }],
          decisions: [{
            decisionId: 'cancellation',
            optionId: 'abort',
            rationaleIds: ['ordering'],
          }],
          selectedTwistActionIds: [],
          scratchpad: 'Check focus restoration.',
        },
      },
      4,
    ).subscribe();

    const request = http.expectOne(
      `${apiUrl('/interviews')}/design%2Fsession/system-design/draft`,
    );
    expect(request.request.body).toEqual({
      currentStep: 'requirements',
      clarificationIds: ['a11y'],
      priorityRequirementIds: ['stale'],
      placements: [{ cardId: 'input', laneId: 'ui', order: 0 }],
      connections: [{
        fromCardId: 'input',
        toCardId: 'controller',
        typeId: 'event-flow',
      }],
      decisions: [{
        decisionId: 'cancellation',
        optionId: 'abort',
        rationaleIds: ['ordering'],
      }],
      twistResponseActionIds: [],
      scratchpad: 'Check focus restoration.',
      mutationId: 'mutation-1',
      expectedVersion: 4,
    });
    request.flush({
      session: {
        id: 'design-session',
        format: 'system-design',
        status: 'system_design_active',
        version: 5,
      },
    });
  });

  it('normalizes system-design evidence without inventing a score or hiring prediction', () => {
    const result = service.normalizeResult({
      results: {
        sessionId: 'design-session',
        interviewFormat: 'system-design',
        level: 'senior',
        track: 'vue',
        xpAwarded: 500,
        systemDesign: {
          scenarioId: 'int-sd-ranked-feed-sr-v1',
          scenarioTitle: 'Ranked feed',
          sourceContentId: 'news-feed-timeline',
          practiceSignal: 'on-track',
          timing: { usedSeconds: 1100, allowedSeconds: 1200 },
          axes: [{
            id: 'architecture',
            title: 'Architecture and ownership',
            status: 'developing',
            evidence: ['A single feed owner was identified.'],
          }],
          contradictions: [{
            id: 'unbounded-dom',
            severity: 'major',
            axisIds: ['performance'],
            summary: 'The rendering plan leaves the DOM unbounded.',
          }],
          remediation: [{ topic: 'Windowed rendering', evidenceCount: 1 }],
          design: {
            currentStep: 'twist',
            clarificationIds: ['scale'],
            priorityRequirementIds: ['bounded-rendering'],
            placements: [],
            connections: [],
            decisions: [],
            twistResponseActionIds: ['reconcile'],
            scratchpad: '',
            hash: 'design-hash',
            updatedAt: '2026-07-29T10:20:00.000Z',
          },
        },
        evidenceNotice: 'Practice evidence only.',
      },
    });

    expect(result.interviewFormat).toBe('system-design');
    expect(result.systemDesign?.practiceSignal).toBe('on-track');
    expect(result.systemDesign?.contradictions[0].label).toContain('unbounded');
    expect(result.systemDesign?.remediationTopics).toEqual(['Windowed rendering']);
    expect(result.score.total).toBe(0);
    expect(result.xpAwarded).toBe(0);
  });
});
