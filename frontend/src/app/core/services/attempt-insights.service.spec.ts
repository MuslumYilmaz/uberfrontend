import { of, throwError } from 'rxjs';
import type { AttemptRunRecord } from '../models/editor-assist.model';
import { AttemptInsightsService } from './attempt-insights.service';

const STORAGE_KEY = 'fa:editor-assist:v1';
const SESSION_PREFIX = 'fa:editor-assist:interview:v1:';
const AUTH_SESSION_HINT_KEY = 'fa:auth:session';

function makeRun(input: Partial<AttemptRunRecord> = {}): AttemptRunRecord {
  return {
    questionId: 'q1',
    lang: 'js',
    ts: 1000,
    passCount: 0,
    totalCount: 2,
    firstFailName: 't1',
    errorLine: 'Expected undefined to be 1',
    signature: 'sig|line|2',
    codeHash: 'h1',
    codeChanged: true,
    interviewMode: false,
    tags: ['arrays'],
    ...input,
  };
}

function baseState(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    runs: [],
    dismissedByQuestion: {},
    duckByQuestion: {},
    openRunToPassByQuestion: {},
    lastCursorTs: 0,
    lastSyncAt: 0,
    syncBackoffMs: 10000,
    ...overrides,
  };
}

function writeState(state: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readState(): any {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

describe('AttemptInsightsService', () => {
  let service: AttemptInsightsService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_SESSION_HINT_KEY);
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(SESSION_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
    service = new AttemptInsightsService();
  });

  it('records runs and emits run-to-pass duration', () => {
    const fail = service.recordRun({
      questionId: 'q1',
      lang: 'js',
      ts: 1000,
      passCount: 0,
      totalCount: 2,
      firstFailName: 't1',
      errorLine: 'Expected undefined to be 1',
      signature: 's1',
      codeHash: 'h1',
      codeChanged: true,
      interviewMode: false,
    });
    expect(fail.runToPassMs).toBeUndefined();

    const pass = service.recordRun({
      questionId: 'q1',
      lang: 'js',
      ts: 2500,
      passCount: 2,
      totalCount: 2,
      firstFailName: '',
      errorLine: '',
      signature: 'ok',
      codeHash: 'h2',
      codeChanged: true,
      interviewMode: false,
    });
    expect(pass.runToPassMs).toBe(1500);
  });

  it('aggregates weakness summaries and ignores immediate one-run recoveries', () => {
    const now = Date.now();
    service.recordRun({
      questionId: 'q2',
      lang: 'js',
      ts: now - 4000,
      passCount: 0,
      totalCount: 2,
      firstFailName: 'a',
      errorLine: 'Expected undefined to be 1',
      signature: 's2',
      codeHash: 'h1',
      codeChanged: true,
      interviewMode: false,
      tags: ['arrays'],
    });
    service.recordRun({
      questionId: 'q2',
      lang: 'js',
      ts: now - 3000,
      passCount: 2,
      totalCount: 2,
      firstFailName: '',
      errorLine: '',
      signature: 'ok',
      codeHash: 'h2',
      codeChanged: true,
      interviewMode: false,
      tags: ['arrays'],
    });

    service.recordRun({
      questionId: 'q3',
      lang: 'js',
      ts: now - 2000,
      passCount: 0,
      totalCount: 2,
      firstFailName: 'b',
      errorLine: 'Cannot read properties of undefined',
      signature: 's3',
      codeHash: 'h3',
      codeChanged: true,
      interviewMode: false,
      tags: ['objects'],
    });
    service.recordRun({
      questionId: 'q3',
      lang: 'js',
      ts: now - 1000,
      passCount: 0,
      totalCount: 2,
      firstFailName: 'b',
      errorLine: 'Cannot read properties of undefined',
      signature: 's3',
      codeHash: 'h4',
      codeChanged: true,
      interviewMode: false,
      tags: ['objects'],
    });

    const summaries = service.getWeaknessSummaries(3);
    expect(summaries.length).toBe(1);
    expect(summaries[0].category).toBe('undefined-access');
    expect(summaries[0].topicOrTag).toBe('objects');
    expect(summaries[0].failCount).toBe(2);
  });

  it('persists interview sessions in session storage', () => {
    service.saveInterviewSession({
      questionId: 'q4',
      startedAt: 100,
      durationMin: 30,
      runs: 2,
      bestPassPct: 0.5,
      updatedAt: 100,
    });

    const loaded = service.getInterviewSession('q4');
    expect(loaded).toBeTruthy();
    expect(loaded?.durationMin).toBe(30);

    service.clearInterviewSession('q4');
    expect(service.getInterviewSession('q4')).toBeNull();
  });

  it('merges server/local runs using newest-ts policy', async () => {
    const baseTs = Math.floor(Date.now() / 60_000) * 60_000 + 1000;
    localStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    writeState(baseState({
      runs: [
        makeRun({
          questionId: 'q-sync',
          signature: 'sig-sync',
          ts: baseTs,
          passCount: 0,
          syncedAt: 0,
        }),
      ],
    }));

    const http = {
      post: jasmine.createSpy('post').and.returnValue(of({
        runs: [
          makeRun({
            questionId: 'q-sync',
            signature: 'sig-sync',
            ts: baseTs + 20,
            passCount: 1,
            totalCount: 2,
          }),
        ],
        cursorTs: 222,
        stats: { received: 1, upserted: 1, deduped: 0, returned: 1 },
      })),
    };
    const syncService = new AttemptInsightsService(http as any);

    const ok = await syncService.triggerSync({ force: true, reason: 'spec_merge' });
    expect(ok).toBeTrue();

    const runs = syncService.getRunsForQuestion('q-sync');
    expect(runs.length).toBe(1);
    expect(runs[0].ts).toBe(baseTs + 20);
    expect(runs[0].passCount).toBe(1);

    const state = readState();
    expect(state.lastCursorTs).toBe(222);
    expect(state.runs[0].syncedAt).toBeGreaterThan(0);
  });

  it('dedupes by questionId+signature+minuteBucket across sync merges', async () => {
    const baseTs = Math.floor(Date.now() / 60_000) * 60_000 + 1000;
    localStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    writeState(baseState());

    const http = {
      post: jasmine.createSpy('post').and.returnValue(of({
        runs: [
          makeRun({ questionId: 'q-dedupe', signature: 'sig', ts: baseTs, passCount: 0 }),
          makeRun({ questionId: 'q-dedupe', signature: 'sig', ts: baseTs + 61_000, passCount: 1 }),
        ],
        cursorTs: 333,
        stats: { received: 0, upserted: 2, deduped: 0, returned: 2 },
      })),
    };
    const syncService = new AttemptInsightsService(http as any);

    const ok = await syncService.triggerSync({ force: true, reason: 'spec_dedupe' });
    expect(ok).toBeTrue();

    const runs = syncService.getRunsForQuestion('q-dedupe');
    expect(runs.length).toBe(2);
    expect(runs[0].recordKey).not.toBe(runs[1].recordKey);
  });

  it('preserves local state and escalates backoff on sync failure', async () => {
    const baseTs = Math.floor(Date.now() / 60_000) * 60_000 + 1000;
    localStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    writeState(baseState({
      runs: [
        makeRun({
          questionId: 'q-fail',
          signature: 'sig-fail',
          ts: baseTs,
          syncedAt: 0,
        }),
      ],
      syncBackoffMs: 10_000,
    }));

    const http = {
      post: jasmine.createSpy('post').and.returnValue(throwError(() => ({ status: 500, message: 'fail' }))),
    };
    const syncService = new AttemptInsightsService(http as any);

    const ok = await syncService.triggerSync({ force: true, reason: 'spec_failure' });
    expect(ok).toBeFalse();

    const state = readState();
    expect(state.runs.length).toBe(1);
    expect(state.runs[0].questionId).toBe('q-fail');
    expect(state.syncBackoffMs).toBe(30_000);
  });

  it('marks outgoing records synced and updates cursor on successful sync', async () => {
    const baseTs = Math.floor(Date.now() / 60_000) * 60_000 + 1000;
    localStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    writeState(baseState({
      runs: [
        makeRun({
          questionId: 'q-cursor',
          signature: 'sig-cursor',
          ts: baseTs,
          syncedAt: 0,
        }),
      ],
    }));

    const http = {
      post: jasmine.createSpy('post').and.returnValue(of({
        runs: [],
        cursorTs: 999,
        stats: { received: 1, upserted: 1, deduped: 0, returned: 0 },
      })),
    };
    const syncService = new AttemptInsightsService(http as any);

    const ok = await syncService.triggerSync({ force: true, reason: 'spec_cursor' });
    expect(ok).toBeTrue();

    const state = readState();
    expect(state.lastCursorTs).toBe(999);
    expect(state.lastSyncAt).toBeGreaterThan(0);
    expect(state.runs[0].syncedAt).toBeGreaterThan(0);
    expect(state.syncBackoffMs).toBe(10_000);
  });
});
