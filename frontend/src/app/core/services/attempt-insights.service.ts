import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AssistSyncResponse,
  AttemptRunRecord,
  FailureCategory,
  InterviewModeSession,
  RubberDuckState,
  WeaknessSummary,
} from '../models/editor-assist.model';
import { apiUrl } from '../utils/api-base';
import { classifyFailureCategory } from '../utils/error-taxonomy.util';

type PersistedState = {
  version: 1;
  runs: AttemptRunRecord[];
  dismissedByQuestion: Record<string, number>;
  duckByQuestion: Record<string, RubberDuckState>;
  openRunToPassByQuestion: Record<string, number>;
  lastCursorTs: number;
  lastSyncAt: number;
  syncBackoffMs: number;
};

const STORAGE_KEY = 'fa:editor-assist:v1';
const SESSION_INTERVIEW_PREFIX = 'fa:editor-assist:interview:v1:';
const AUTH_SESSION_HINT_KEY = 'fa:auth:session';
const RUN_CAP = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SYNC_MAX_BATCH = 200;
const SYNC_LIMIT = 500;
const SYNC_MIN_COOLDOWN_MS = 10_000;
const SYNC_BACKOFF_STEPS = [10_000, 30_000, 60_000] as const;
const SYNC_DEBOUNCE_MS = 1200;

const DEFAULT_STATE: PersistedState = {
  version: 1,
  runs: [],
  dismissedByQuestion: {},
  duckByQuestion: {},
  openRunToPassByQuestion: {},
  lastCursorTs: 0,
  lastSyncAt: 0,
  syncBackoffMs: SYNC_BACKOFF_STEPS[0],
};

const DRILL_QUERY_BY_CATEGORY: Record<FailureCategory, string> = {
  'missing-return': 'return statement function flow',
  'undefined-access': 'optional chaining null guard',
  'wrong-function-call': 'function invocation binding',
  'type-mismatch': 'type conversion parsing',
  'off-by-one': 'array index boundaries',
  'async-promise-mismatch': 'async await promise handling',
  'reference-error': 'scope variable declarations',
  'assertion-mismatch': 'debug expected actual',
  'syntax-error': 'javascript syntax fundamentals',
  'timeout': 'loop termination optimization',
  'mutability-side-effect': 'immutability array object updates',
  'edge-case': 'edge cases empty null input',
  unknown: 'javascript debugging basics',
};

@Injectable({ providedIn: 'root' })
export class AttemptInsightsService {
  private readonly syncEnabled = !!((environment as any)?.assist?.syncTelemetry);
  private readonly syncUrl = apiUrl('/editor-assist/sync');
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private syncInFlight = false;
  private pendingSyncAfterCurrent = false;

  constructor(@Optional() private http: HttpClient | null = null) {
    if (this.hasWindow()) {
      window.addEventListener('online', this.onOnline);
    }
  }

  recordRun(record: AttemptRunRecord): { runsForQuestion: AttemptRunRecord[]; runToPassMs?: number } {
    const state = this.readState();
    const safeRecord = this.normalizeRecord(record);
    state.runs.push(safeRecord);
    state.runs = this.pruneRuns(state.runs);

    let runToPassMs: number | undefined;
    const isPass = safeRecord.totalCount > 0 && safeRecord.passCount >= safeRecord.totalCount;
    const questionId = safeRecord.questionId;
    const openTs = state.openRunToPassByQuestion[questionId];

    if (isPass) {
      if (Number.isFinite(openTs) && openTs > 0) {
        runToPassMs = Math.max(0, safeRecord.ts - openTs);
      }
      delete state.openRunToPassByQuestion[questionId];
    } else if (!openTs) {
      state.openRunToPassByQuestion[questionId] = safeRecord.ts;
    }

    this.writeState(state);
    this.scheduleSync(SYNC_DEBOUNCE_MS, 'record_run');

    return {
      runsForQuestion: state.runs.filter((run) => run.questionId === questionId),
      runToPassMs,
    };
  }

  notifyAuthSessionStarted(): void {
    if (!this.syncEnabled) return;
    this.scheduleSync(100, 'auth_session_started', true);
  }

  async triggerSync(options?: { force?: boolean; reason?: string }): Promise<boolean> {
    if (!this.syncEnabled || !this.http) return false;
    if (!this.hasSessionHint()) return false;
    if (this.hasWindow() && typeof navigator !== 'undefined' && navigator.onLine === false) return false;

    const now = Date.now();
    const state = this.readState();
    const cooldownMs = Math.max(SYNC_MIN_COOLDOWN_MS, state.syncBackoffMs || SYNC_BACKOFF_STEPS[0]);

    if (!options?.force && state.lastSyncAt > 0) {
      const elapsed = now - state.lastSyncAt;
      if (elapsed < cooldownMs) {
        this.scheduleSync(cooldownMs - elapsed, 'cooldown_window');
        return false;
      }
    }

    if (this.syncInFlight) {
      this.pendingSyncAfterCurrent = true;
      return false;
    }

    this.syncInFlight = true;
    try {
      const synced = await this.syncOnce(options?.reason || 'manual');
      return synced;
    } finally {
      this.syncInFlight = false;
      if (this.pendingSyncAfterCurrent) {
        this.pendingSyncAfterCurrent = false;
        this.scheduleSync(SYNC_DEBOUNCE_MS, 'pending_after_inflight', true);
      }
    }
  }

  getRunsForQuestion(questionId: string): AttemptRunRecord[] {
    const safeId = String(questionId || '').trim();
    if (!safeId) return [];
    return this.readState()
      .runs
      .filter((run) => run.questionId === safeId)
      .sort((a, b) => a.ts - b.ts);
  }

  dismissStuckNudge(questionId: string, minutes = 30): number {
    const safeId = String(questionId || '').trim();
    if (!safeId) return 0;
    const state = this.readState();
    const until = Date.now() + (Math.max(1, minutes) * 60_000);
    state.dismissedByQuestion[safeId] = until;
    this.writeState(state);
    return until;
  }

  getStuckDismissedUntil(questionId: string): number | undefined {
    const safeId = String(questionId || '').trim();
    if (!safeId) return undefined;
    const state = this.readState();
    const value = state.dismissedByQuestion[safeId];
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return value;
  }

  getWeaknessSummaries(limit = 3): WeaknessSummary[] {
    const runs = this.readState().runs
      .slice()
      .sort((a, b) => a.ts - b.ts);
    if (!runs.length) return [];

    const byQuestion = new Map<string, AttemptRunRecord[]>();
    for (const run of runs) {
      if (!byQuestion.has(run.questionId)) byQuestion.set(run.questionId, []);
      byQuestion.get(run.questionId)!.push(run);
    }

    const buckets = new Map<string, WeaknessSummary>();
    for (const questionRuns of byQuestion.values()) {
      for (let i = 0; i < questionRuns.length; i += 1) {
        const run = questionRuns[i];
        const isPass = run.totalCount > 0 && run.passCount >= run.totalCount;
        if (isPass) continue;
        if (run.totalCount <= 0) continue;

        // Ignore quick recoveries solved on the immediate next run.
        const next = questionRuns[i + 1];
        if (next && next.totalCount > 0 && next.passCount >= next.totalCount) continue;

        const category = run.errorCategory || classifyFailureCategory(run.errorLine);
        const topicOrTag = this.pickTopicOrTag(run.tags);
        const key = `${category}|${topicOrTag}`;
        const existing = buckets.get(key);
        if (!existing) {
          buckets.set(key, {
            category,
            topicOrTag,
            failCount: 1,
            lastSeenTs: run.ts,
            drillUrl: this.buildDrillUrl(category, topicOrTag),
          });
        } else {
          existing.failCount += 1;
          existing.lastSeenTs = Math.max(existing.lastSeenTs, run.ts);
        }
      }
    }

    return [...buckets.values()]
      .sort((a, b) => b.failCount - a.failCount || b.lastSeenTs - a.lastSeenTs)
      .slice(0, Math.max(1, limit));
  }

  getRubberDuckState(questionId: string): RubberDuckState | null {
    const safeId = String(questionId || '').trim();
    if (!safeId) return null;
    const state = this.readState();
    const item = state.duckByQuestion[safeId];
    if (!item) return null;
    return { ...item };
  }

  saveRubberDuckState(questionId: string, input: { note: string; doneStepIndexes: number[]; signature?: string }): void {
    const safeId = String(questionId || '').trim();
    if (!safeId) return;
    const state = this.readState();
    state.duckByQuestion[safeId] = {
      questionId: safeId,
      note: String(input.note || '').slice(0, 2000),
      doneStepIndexes: [...new Set((input.doneStepIndexes || []).filter((x) => Number.isInteger(x) && x >= 0))],
      signature: input.signature ? String(input.signature) : undefined,
      updatedAt: Date.now(),
    };
    this.writeState(state);
  }

  getInterviewSession(questionId: string): InterviewModeSession | null {
    const safeId = String(questionId || '').trim();
    if (!safeId || !this.hasSessionStorage()) return null;
    try {
      const raw = sessionStorage.getItem(`${SESSION_INTERVIEW_PREFIX}${safeId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as InterviewModeSession;
      if (!parsed || parsed.questionId !== safeId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  saveInterviewSession(session: InterviewModeSession): void {
    const safeId = String(session?.questionId || '').trim();
    if (!safeId || !this.hasSessionStorage()) return;
    try {
      const payload: InterviewModeSession = {
        ...session,
        questionId: safeId,
        updatedAt: Date.now(),
      };
      sessionStorage.setItem(`${SESSION_INTERVIEW_PREFIX}${safeId}`, JSON.stringify(payload));
    } catch { }
  }

  clearInterviewSession(questionId: string): void {
    const safeId = String(questionId || '').trim();
    if (!safeId || !this.hasSessionStorage()) return;
    try {
      sessionStorage.removeItem(`${SESSION_INTERVIEW_PREFIX}${safeId}`);
    } catch { }
  }

  private async syncOnce(reason: string): Promise<boolean> {
    const stateBefore = this.readState();
    const payloadRuns = this.buildSyncPayload(stateBefore.runs);
    const cursorTs = Math.max(0, Number(stateBefore.lastCursorTs || 0));

    const now = Date.now();
    this.debug('sync:start', {
      reason,
      payloadRuns: payloadRuns.length,
      cursorTs,
      backoffMs: stateBefore.syncBackoffMs,
    });

    const requestBody = {
      runs: payloadRuns.map((run) => ({
        questionId: run.questionId,
        lang: run.lang,
        ts: run.ts,
        passCount: run.passCount,
        totalCount: run.totalCount,
        firstFailName: run.firstFailName,
        errorLine: run.errorLine,
        signature: run.signature,
        codeHash: run.codeHash,
        codeChanged: run.codeChanged,
        interviewMode: run.interviewMode,
        errorCategory: run.errorCategory,
        tags: run.tags,
      })),
      cursorTs,
      limit: SYNC_LIMIT,
    };

    try {
      const response = await firstValueFrom(
        this.http!.post<AssistSyncResponse>(this.syncUrl, requestBody, { withCredentials: true })
      );

      const serverRuns = Array.isArray(response?.runs)
        ? response.runs.map((item) => this.normalizeRecord(item, { trustedServer: true }))
        : [];

      const merged = this.mergeRuns(stateBefore.runs, serverRuns);
      const payloadKeys = new Set(payloadRuns.map((run) => `${run.recordKey}|${run.ts}`));
      const syncedAt = Date.now();
      const nextRuns = merged.map((run) => {
        const key = `${run.recordKey || this.buildRecordKey(run.questionId, run.signature, run.ts)}|${run.ts}`;
        if (payloadKeys.has(key)) {
          return { ...run, syncedAt };
        }
        return run;
      });

      const state = this.readState();
      state.runs = this.pruneRuns(nextRuns);
      state.lastCursorTs = Number.isFinite(Number(response?.cursorTs)) ? Number(response.cursorTs) : now;
      state.lastSyncAt = syncedAt;
      state.syncBackoffMs = SYNC_BACKOFF_STEPS[0];
      this.writeState(state);

      this.debug('sync:success', {
        reason,
        received: response?.stats?.received ?? payloadRuns.length,
        upserted: response?.stats?.upserted,
        returned: response?.stats?.returned ?? serverRuns.length,
        mergedRuns: state.runs.length,
      });

      return true;
    } catch (error: any) {
      const status = Number(error?.status || 0);
      const state = this.readState();
      state.lastSyncAt = now;

      if (status === 401 || status === 403) {
        state.syncBackoffMs = SYNC_BACKOFF_STEPS[0];
        this.writeState(state);
        this.debug('sync:auth-skip', { reason, status });
        return false;
      }

      state.syncBackoffMs = this.nextBackoff(state.syncBackoffMs);
      this.writeState(state);
      this.scheduleSync(state.syncBackoffMs, 'retry_backoff');
      this.debug('sync:failed', { reason, status, backoffMs: state.syncBackoffMs, error: error?.message || String(error) });
      return false;
    }
  }

  private scheduleSync(delayMs = SYNC_DEBOUNCE_MS, reason = 'debounced', force = false): void {
    if (!this.syncEnabled || !this.http) return;
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    const wait = Math.max(0, Math.floor(delayMs));
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      void this.triggerSync({ force, reason });
    }, wait);
  }

  private buildSyncPayload(runs: AttemptRunRecord[]): AttemptRunRecord[] {
    const threshold = Date.now() - TTL_MS;
    const candidates = runs
      .filter((run) => run.ts >= threshold)
      .filter((run) => !Number.isFinite(Number(run.syncedAt)) || Number(run.syncedAt || 0) < run.ts)
      .sort((a, b) => a.ts - b.ts);

    if (candidates.length <= SYNC_MAX_BATCH) return candidates;
    return candidates.slice(candidates.length - SYNC_MAX_BATCH);
  }

  private mergeRuns(localRuns: AttemptRunRecord[], serverRuns: AttemptRunRecord[]): AttemptRunRecord[] {
    const map = new Map<string, AttemptRunRecord>();

    const write = (run: AttemptRunRecord) => {
      const normalized = this.normalizeRecord(run);
      const key = normalized.recordKey || this.buildRecordKey(normalized.questionId, normalized.signature, normalized.ts);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...normalized, recordKey: key });
        return;
      }
      map.set(key, this.pickPreferredRun(existing, { ...normalized, recordKey: key }));
    };

    localRuns.forEach(write);
    serverRuns.forEach(write);

    return [...map.values()].sort((a, b) => a.ts - b.ts);
  }

  private pickPreferredRun(a: AttemptRunRecord, b: AttemptRunRecord): AttemptRunRecord {
    const aTs = Number(a.ts || 0);
    const bTs = Number(b.ts || 0);

    if (bTs > aTs) return this.mergeMissingFields(b, a);
    if (bTs < aTs) return this.mergeMissingFields(a, b);

    const aPass = Number(a.passCount || 0);
    const bPass = Number(b.passCount || 0);
    if (bPass > aPass) return this.mergeMissingFields(b, a);
    if (bPass < aPass) return this.mergeMissingFields(a, b);

    const aSyncedAt = Number(a.syncedAt || 0);
    const bSyncedAt = Number(b.syncedAt || 0);
    if (bSyncedAt > aSyncedAt) return this.mergeMissingFields(b, a);
    return this.mergeMissingFields(a, b);
  }

  private mergeMissingFields(primary: AttemptRunRecord, secondary: AttemptRunRecord): AttemptRunRecord {
    return {
      ...primary,
      firstFailName: primary.firstFailName || secondary.firstFailName,
      errorLine: primary.errorLine || secondary.errorLine,
      codeHash: primary.codeHash || secondary.codeHash,
      errorCategory: primary.errorCategory || secondary.errorCategory,
      tags: (Array.isArray(primary.tags) && primary.tags.length > 0) ? primary.tags : (secondary.tags || []),
      syncedAt: Math.max(Number(primary.syncedAt || 0), Number(secondary.syncedAt || 0)) || undefined,
      recordKey: primary.recordKey || secondary.recordKey,
    };
  }

  private buildDrillUrl(category: FailureCategory, topicOrTag: string): string {
    const q = DRILL_QUERY_BY_CATEGORY[category] || DRILL_QUERY_BY_CATEGORY.unknown;
    const phrase = topicOrTag && topicOrTag !== 'general'
      ? `${topicOrTag} ${q}`
      : q;
    const encoded = encodeURIComponent(phrase);
    return `/coding?q=${encoded}&reset=1`;
  }

  private pickTopicOrTag(tags: string[] | undefined): string {
    const first = Array.isArray(tags) ? tags.find((tag) => typeof tag === 'string' && tag.trim().length > 0) : '';
    return first ? String(first).trim().toLowerCase() : 'general';
  }

  private normalizeRecord(record: AttemptRunRecord, options?: { trustedServer?: boolean }): AttemptRunRecord {
    const questionId = String(record.questionId || '').trim();
    const ts = Number.isFinite(record.ts) ? Number(record.ts) : Date.now();
    const signature = String(record.signature || '');
    const recordKeyRaw = String(record.recordKey || '').trim();
    const recordKey = recordKeyRaw || this.buildRecordKey(questionId, signature, ts);
    const syncedAtRaw = Number(record.syncedAt || 0);
    const syncedAt = Number.isFinite(syncedAtRaw) && syncedAtRaw > 0
      ? syncedAtRaw
      : (options?.trustedServer ? Date.now() : undefined);

    return {
      ...record,
      questionId,
      ts,
      passCount: Number.isFinite(record.passCount) ? Math.max(0, Number(record.passCount)) : 0,
      totalCount: Number.isFinite(record.totalCount) ? Math.max(0, Number(record.totalCount)) : 0,
      firstFailName: String(record.firstFailName || ''),
      errorLine: String(record.errorLine || ''),
      signature,
      codeHash: String(record.codeHash || ''),
      codeChanged: Boolean(record.codeChanged),
      interviewMode: Boolean(record.interviewMode),
      errorCategory: record.errorCategory || classifyFailureCategory(record.errorLine),
      tags: Array.isArray(record.tags)
        ? record.tags
            .map((tag) => String(tag || '').trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
        : [],
      recordKey,
      syncedAt,
    };
  }

  private buildRecordKey(questionId: string, signature: string, ts: number): string {
    const minuteBucket = Math.floor(Math.max(0, Number(ts || 0)) / 60_000);
    return `${questionId}|${signature}|${minuteBucket}`;
  }

  private nextBackoff(current: number): number {
    const safeCurrent = Number.isFinite(current) ? Number(current) : SYNC_BACKOFF_STEPS[0];
    const idx = SYNC_BACKOFF_STEPS.findIndex((value) => value >= safeCurrent);
    if (idx < 0) return SYNC_BACKOFF_STEPS[SYNC_BACKOFF_STEPS.length - 1];
    if (idx >= SYNC_BACKOFF_STEPS.length - 1) return SYNC_BACKOFF_STEPS[idx];
    return SYNC_BACKOFF_STEPS[idx + 1];
  }

  private pruneRuns(runs: AttemptRunRecord[]): AttemptRunRecord[] {
    const threshold = Date.now() - TTL_MS;
    const fresh = runs.filter((run) => run.ts >= threshold);
    if (fresh.length <= RUN_CAP) return fresh;
    return fresh.slice(-RUN_CAP);
  }

  private readState(): PersistedState {
    if (!this.hasLocalStorage()) return this.createEmptyState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.createEmptyState();
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const state: PersistedState = {
        version: 1,
        runs: Array.isArray(parsed.runs) ? parsed.runs : [],
        dismissedByQuestion: parsed.dismissedByQuestion && typeof parsed.dismissedByQuestion === 'object'
          ? parsed.dismissedByQuestion as Record<string, number>
          : {},
        duckByQuestion: parsed.duckByQuestion && typeof parsed.duckByQuestion === 'object'
          ? parsed.duckByQuestion as Record<string, RubberDuckState>
          : {},
        openRunToPassByQuestion: parsed.openRunToPassByQuestion && typeof parsed.openRunToPassByQuestion === 'object'
          ? parsed.openRunToPassByQuestion as Record<string, number>
          : {},
        lastCursorTs: Number.isFinite(Number(parsed.lastCursorTs)) ? Number(parsed.lastCursorTs) : 0,
        lastSyncAt: Number.isFinite(Number(parsed.lastSyncAt)) ? Number(parsed.lastSyncAt) : 0,
        syncBackoffMs: Number.isFinite(Number(parsed.syncBackoffMs))
          ? Math.max(SYNC_BACKOFF_STEPS[0], Math.min(SYNC_BACKOFF_STEPS[SYNC_BACKOFF_STEPS.length - 1], Number(parsed.syncBackoffMs)))
          : SYNC_BACKOFF_STEPS[0],
      };
      state.runs = this.pruneRuns(
        state.runs
          .map((run) => this.normalizeRecord(run))
          .filter((run) => run.questionId.length > 0),
      );
      return state;
    } catch {
      return this.createEmptyState();
    }
  }

  private writeState(state: PersistedState): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { }
  }

  private hasLocalStorage(): boolean {
    try {
      const key = '__fa_assist_probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private hasSessionStorage(): boolean {
    try {
      const key = '__fa_assist_session_probe__';
      sessionStorage.setItem(key, '1');
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private hasSessionHint(): boolean {
    if (!this.hasLocalStorage()) return false;
    try {
      return localStorage.getItem(AUTH_SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  private hasWindow(): boolean {
    return typeof window !== 'undefined';
  }

  private onOnline = () => {
    this.scheduleSync(400, 'online_event', true);
  };

  private debugEnabled(): boolean {
    if (environment.production) return false;
    if (!this.hasLocalStorage()) return false;
    try {
      return localStorage.getItem('fa:debug:assist-sync') === '1';
    } catch {
      return false;
    }
  }

  private debug(message: string, payload?: Record<string, unknown>): void {
    if (!this.debugEnabled()) return;
    try {
      // eslint-disable-next-line no-console
      console.debug('[assist-sync]', message, payload || {});
    } catch { }
  }

  private createEmptyState(): PersistedState {
    return {
      version: DEFAULT_STATE.version,
      runs: [],
      dismissedByQuestion: {},
      duckByQuestion: {},
      openRunToPassByQuestion: {},
      lastCursorTs: 0,
      lastSyncAt: 0,
      syncBackoffMs: SYNC_BACKOFF_STEPS[0],
    };
  }
}
