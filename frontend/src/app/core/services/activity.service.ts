import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, firstValueFrom, of, shareReplay, tap, throwError } from 'rxjs';
import { Tech } from '../models/user.model';
import { AuthService } from './auth.service';
import { apiUrl } from '../utils/api-base';
import { AnalyticsService } from './analytics.service';
import { GamificationService } from './gamification.service';
import { OfflineService } from './offline';
import { UserProgressService } from './user-progress.service';

export interface ActivityEvent {
  _id: string;
  userId: string;
  kind: 'coding' | 'trivia' | 'debug' | 'incident';
  tech: Tech | 'system-design';
  itemId?: string;
  source: 'tech' | 'company' | 'course' | 'system';
  durationMin: number;
  xp: number;
  completedAt: string;
  dayUTC: string;
}

export interface ActivitySummary {
  totalXp: number;
  level: number;
  nextLevelXp: number;
  levelProgress: { current: number; needed: number; pct: number };
  streak: { current: number; best?: number };
  freezeTokens: number;
  weekly: { completed: number; target: number; progress: number };
  today: { completed: number; total: number; progress: number };
}

export interface ActivityCompleteResponse {
  stats: any;
  solvedQuestionIds?: string[];
  event?: ActivityEvent | null;
  recent?: ActivityEvent[];
  xpAwarded?: number;
  levelUp?: boolean;
  weeklyGoal?: {
    completed?: number;
    target?: number;
    reached?: boolean;
    bonusGranted?: boolean;
  };
  logicalCompletionCreated?: boolean;
  pending?: boolean;
  queued?: boolean;
  credited?: boolean;
  requestId?: string;
}

export interface ActivityUncompleteResponse {
  stats: any;
  solvedQuestionIds?: string[];
  xpRemoved?: number;
  levelDown?: boolean;
  rollbackApplied?: boolean;
  weeklyGoal?: {
    completed?: number;
    target?: number;
    reached?: boolean;
    bonusGranted?: boolean;
    bonusRevoked?: boolean;
  };
  dailyChallenge?: {
    revoked?: boolean;
  };
}

export type ActivityCompletedEvent = {
  stats?: any;
  kind?: 'coding' | 'trivia' | 'debug' | 'incident';
  tech?: Tech | 'system-design';
  itemId?: string;
  xpAwarded?: number;
  weeklyGoalCompleted?: boolean;
};

type CachedObs<T> = { ts: number; obs: Observable<T> };

type PendingActivityCompletion = {
  key: string;
  userId: string;
  requestId: string;
  kind: 'coding' | 'trivia' | 'debug' | 'incident';
  tech: Tech | 'system-design';
  itemId: string;
  source: 'tech' | 'company' | 'course' | 'system';
  durationMin: number;
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
};

const LS_PENDING_COMPLETIONS = 'fa:activity:pending:v1';
const QUESTION_ACTIVITY_KINDS = new Set(['coding', 'trivia', 'debug']);
const ACTIVITY_KINDS = new Set(['coding', 'trivia', 'debug', 'incident']);

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly base = apiUrl('/activity');
  private readonly DEFAULT_TTL = 60_000;

  activityCompleted$ = new Subject<ActivityCompletedEvent>();
  summarySig = signal<ActivitySummary | null>(null);

  private summaryCache: CachedObs<ActivitySummary> | null = null;
  private recentCache = new Map<string, CachedObs<ActivityEvent[]>>();
  private heatmapCache = new Map<string, CachedObs<any>>();
  private readonly pendingCompletions = signal<Record<string, PendingActivityCompletion>>(this.readPendingCompletions());
  private readonly flushInFlight = new Set<string>();
  private flushScheduled = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private analytics: AnalyticsService,
    private gamification: GamificationService,
    private offline: OfflineService,
    private progress: UserProgressService,
  ) {
    this.activityCompleted$.subscribe(() => {
      this.invalidateAll();
      this.gamification.invalidateDashboardCache();
    });

    if (this.isBrowser) {
      window.addEventListener('focus', () => {
        this.scheduleFlushPendingCompletions();
      });
    }

    // React to auth/online state without requiring component orchestration.
    effect(() => {
      const user = this.auth.user();
      const online = this.offline.isOnline();
      if (!user || !online) return;
      this.scheduleFlushPendingCompletions();
    }, { allowSignalWrites: true });
  }

  private isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  private headers(): HttpHeaders {
    return this.auth.headers();
  }

  invalidateAll() {
    this.summaryCache = null;
    this.recentCache.clear();
    this.heatmapCache.clear();
  }
  invalidateSummary() { this.summaryCache = null; }
  invalidateRecent() { this.recentCache.clear(); }
  invalidateHeatmap() { this.heatmapCache.clear(); }

  getSummary(options?: { force?: boolean; ttlMs?: number }): Observable<ActivitySummary> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;

    if (!this.isLoggedIn()) {
      this.summarySig.set(null);
      const obs = of(null as unknown as ActivitySummary).pipe(shareReplay(1));
      this.summaryCache = { ts: Date.now(), obs };
      return obs;
    }

    if (options?.force) this.invalidateSummary();

    const fresh = this.summaryCache && (Date.now() - this.summaryCache.ts) < ttl;
    if (fresh && this.summaryCache) return this.summaryCache.obs;

    const url = `${this.base}/summary${options?.force ? `?_=${Date.now()}` : ''}`;
    const obs = this.http.get<ActivitySummary>(url, { headers: this.headers() }).pipe(
      tap((s) => this.summarySig.set(s)),
      catchError(err => {
        if (err?.status === 401) {
          this.summarySig.set(null);
          return of(null as unknown as ActivitySummary);
        }
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    this.summaryCache = { ts: Date.now(), obs };
    return obs;
  }

  getRecent(
    params?: { limit?: number; since?: string; all?: boolean },
    options?: { force?: boolean; ttlMs?: number }
  ): Observable<ActivityEvent[]> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;
    const key = `limit=${params?.limit ?? ''}|since=${params?.since ?? ''}|all=${params?.all ?? ''}`;

    if (!this.isLoggedIn()) {
      const obs = of([] as ActivityEvent[]).pipe(shareReplay(1));
      this.recentCache.set(key, { ts: Date.now(), obs });
      return obs;
    }

    if (options?.force) this.recentCache.delete(key);

    const hit = this.recentCache.get(key);
    if (hit && (Date.now() - hit.ts) < ttl) return hit.obs;

    const q: string[] = [];
    if (params?.all) q.push('all=1');
    else if (params?.limit !== undefined) q.push(`limit=${params.limit}`);
    if (params?.since) q.push(`since=${encodeURIComponent(params.since)}`);
    if (options?.force) q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';

    const obs = this.http
      .get<ActivityEvent[]>(`${this.base}/recent${qs}`, { headers: this.headers() })
      .pipe(
        catchError(err => err?.status === 401
          ? of([] as ActivityEvent[])
          : throwError(() => err)),
        shareReplay(1)
      );

    this.recentCache.set(key, { ts: Date.now(), obs });
    return obs;
  }

  getHeatmap(
    params?: { days?: number },
    options?: { force?: boolean; ttlMs?: number }
  ): Observable<any> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;
    const key = `days=${params?.days ?? ''}`;

    if (!this.isLoggedIn()) {
      const obs = of(null).pipe(shareReplay(1));
      this.heatmapCache.set(key, { ts: Date.now(), obs } as any);
      return obs as any;
    }

    if (options?.force) this.heatmapCache.delete(key);

    const hit = this.heatmapCache.get(key);
    if (hit && (Date.now() - hit.ts) < ttl) return hit.obs;

    const q: string[] = [];
    if (params?.days) q.push(`days=${params.days}`);
    if (options?.force) q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';

    const obs = this.http
      .get<any>(`${this.base}/heatmap${qs}`, { headers: this.headers() })
      .pipe(
        catchError(err => err?.status === 401 ? of(null) : throwError(() => err)),
        shareReplay(1)
      );

    this.heatmapCache.set(key, { ts: Date.now(), obs });
    return obs;
  }

  complete(payload: {
    kind: 'coding' | 'trivia' | 'debug' | 'incident';
    tech: Tech | 'system-design';
    itemId?: string;
    source?: 'tech' | 'company' | 'course' | 'system';
    durationMin?: number;
    xp?: number;
    solved?: boolean;
    difficulty?: string;
  }): Observable<ActivityCompleteResponse> {
    if (!this.isLoggedIn()) {
      return of({ credited: false, stats: null } as ActivityCompleteResponse);
    }

    const user = this.auth.user();
    const itemId = String(payload.itemId || '').trim();
    if (!user || !itemId) {
      return throwError(() => new Error('itemId is required to complete activity'));
    }

    const pending = this.upsertPendingCompletion({
      userId: user._id,
      kind: payload.kind,
      tech: payload.tech,
      itemId,
      source: payload.source || 'tech',
      durationMin: Math.max(0, Number(payload.durationMin) || 0),
      difficulty: payload.difficulty,
    });

    if (!this.offline.isOnline()) {
      return of(this.pendingResult(pending));
    }

    return this.dispatchPendingCompletion(pending);
  }

  isCompletionPending(
    kind: 'coding' | 'trivia' | 'debug' | 'incident',
    itemId?: string | null,
    userId: string | null = this.auth.user()?._id ?? null,
  ): boolean {
    const itemIdText = String(itemId || '').trim();
    if (!itemIdText || !userId) return false;
    return Boolean(this.pendingCompletions()[this.pendingKey(userId, kind, itemIdText)]);
  }

  recent(params?: { limit?: number; since?: string; all?: boolean }) { return this.getRecent(params); }
  summary() { return this.getSummary(); }
  heatmap(params?: { days?: number }) { return this.getHeatmap(params); }
  refreshSummary() { this.getSummary({ force: true }).subscribe({ next: () => { }, error: () => { } }); }

  uncomplete(payload: {
    kind: 'coding' | 'trivia' | 'debug';
    tech: Tech | 'system-design';
    itemId?: string;
  }): Observable<ActivityUncompleteResponse> {
    if (!this.isLoggedIn()) {
      return of({ rollbackApplied: false, stats: null } as ActivityUncompleteResponse);
    }

    const itemId = String(payload.itemId || '').trim();
    if (!itemId) {
      return throwError(() => new Error('itemId is required to roll back activity'));
    }

    return this.http.post<ActivityUncompleteResponse>(
      `${this.base}/uncomplete`,
      {
        kind: payload.kind,
        tech: payload.tech,
        itemId,
      },
      { headers: this.headers() }
    ).pipe(
      tap((res) => this.handleRollbackSuccess(payload, res)),
      tap(() => this.refreshSummary())
    );
  }

  private pendingKey(userId: string, kind: 'coding' | 'trivia' | 'debug' | 'incident', itemId: string): string {
    return `${userId}:${kind}:${itemId}`;
  }

  private generateRequestId(): string {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch { }
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private readPendingCompletions(): Record<string, PendingActivityCompletion> {
    if (!this.isBrowser) return {};
    try {
      const raw = localStorage.getItem(LS_PENDING_COMPLETIONS);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return {};
      const entries = parsed
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => this.normalizePendingCompletion(entry))
        .filter((entry): entry is PendingActivityCompletion => !!entry);
      return Object.fromEntries(entries.map((entry) => [entry.key, entry]));
    } catch {
      return {};
    }
  }

  private normalizePendingCompletion(value: any): PendingActivityCompletion | null {
    const userId = String(value?.userId || '').trim();
    const itemId = String(value?.itemId || '').trim();
    const requestId = String(value?.requestId || '').trim();
    const kind = value?.kind;
    const tech = value?.tech;
    const source = value?.source;
    if (!userId || !itemId || !requestId) return null;
    if (!ACTIVITY_KINDS.has(kind)) return null;
    if (!['tech', 'company', 'course', 'system'].includes(source)) return null;
    return {
      key: this.pendingKey(userId, kind, itemId),
      userId,
      requestId,
      kind,
      tech,
      itemId,
      source,
      durationMin: Math.max(0, Number(value?.durationMin) || 0),
      difficulty: typeof value?.difficulty === 'string' ? value.difficulty : undefined,
      createdAt: String(value?.createdAt || new Date().toISOString()),
      updatedAt: String(value?.updatedAt || new Date().toISOString()),
    };
  }

  private writePendingCompletions(next: Record<string, PendingActivityCompletion>) {
    this.pendingCompletions.set(next);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(LS_PENDING_COMPLETIONS, JSON.stringify(
        Object.values(next).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      ));
    } catch { }
  }

  private upsertPendingCompletion(payload: {
    userId: string;
    kind: 'coding' | 'trivia' | 'debug' | 'incident';
    tech: Tech | 'system-design';
    itemId: string;
    source: 'tech' | 'company' | 'course' | 'system';
    durationMin: number;
    difficulty?: string;
  }): PendingActivityCompletion {
    const key = this.pendingKey(payload.userId, payload.kind, payload.itemId);
    const existing = this.pendingCompletions()[key];
    if (existing) {
      const updated: PendingActivityCompletion = {
        ...existing,
        tech: payload.tech,
        source: payload.source,
        durationMin: payload.durationMin,
        difficulty: payload.difficulty,
        updatedAt: new Date().toISOString(),
      };
      this.writePendingCompletions({
        ...this.pendingCompletions(),
        [key]: updated,
      });
      return updated;
    }

    const created: PendingActivityCompletion = {
      key,
      userId: payload.userId,
      requestId: this.generateRequestId(),
      kind: payload.kind,
      tech: payload.tech,
      itemId: payload.itemId,
      source: payload.source,
      durationMin: payload.durationMin,
      difficulty: payload.difficulty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.writePendingCompletions({
      ...this.pendingCompletions(),
      [key]: created,
    });
    return created;
  }

  private removePendingCompletion(key: string) {
    const next = { ...this.pendingCompletions() };
    delete next[key];
    this.writePendingCompletions(next);
  }

  private pendingResult(entry: PendingActivityCompletion): ActivityCompleteResponse {
    return {
      credited: false,
      pending: true,
      queued: true,
      requestId: entry.requestId,
      stats: null,
    };
  }

  private shouldRetry(err: any): boolean {
    const status = Number(err?.status || 0);
    if (!status) return true;
    if (status === 401 || status === 408 || status === 429) return true;
    return status >= 500;
  }

  private scheduleFlushPendingCompletions() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      void this.flushPendingCompletions();
    });
  }

  private async flushPendingCompletions(): Promise<void> {
    const user = this.auth.user();
    if (!user || !this.offline.isOnline()) return;

    const entries = Object.values(this.pendingCompletions())
      .filter((entry) => entry.userId === user._id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const entry of entries) {
      if (!this.offline.isOnline()) break;
      try {
        await firstValueFrom(this.dispatchPendingCompletion(entry));
      } catch {
        break;
      }
    }
  }

  private dispatchPendingCompletion(entry: PendingActivityCompletion): Observable<ActivityCompleteResponse> {
    if (this.flushInFlight.has(entry.key)) {
      return of(this.pendingResult(entry));
    }

    const currentUserId = this.auth.user()?._id ?? null;
    if (!currentUserId || currentUserId !== entry.userId || !this.offline.isOnline()) {
      return of(this.pendingResult(entry));
    }

    this.flushInFlight.add(entry.key);

    return this.http.post<ActivityCompleteResponse>(
      `${this.base}/complete`,
      {
        kind: entry.kind,
        tech: entry.tech,
        itemId: entry.itemId,
        source: entry.source,
        durationMin: entry.durationMin,
        difficulty: entry.difficulty,
        requestId: entry.requestId,
      },
      { headers: this.headers() }
    ).pipe(
      tap((res) => this.handleCompletionSuccess(entry, res)),
      tap(() => {
        if (this.pendingCompletions()[entry.key]) {
          this.removePendingCompletion(entry.key);
        }
      }),
      tap((res) => {
        if (!res?.pending) {
          this.refreshSummary();
        }
      }),
      catchError((err) => {
        if (this.shouldRetry(err)) {
          return of(this.pendingResult(entry));
        }

        this.removePendingCompletion(entry.key);
        return throwError(() => err);
      }),
      finalize(() => {
        this.flushInFlight.delete(entry.key);
      })
    );
  }

  private handleCompletionSuccess(entry: PendingActivityCompletion, res: ActivityCompleteResponse) {
    this.invalidateAll();
    this.syncAuthUserState(res?.stats, res?.solvedQuestionIds);

    if (Array.isArray(res?.solvedQuestionIds)) {
      this.progress.setSolvedIds(res.solvedQuestionIds);
    } else if (QUESTION_ACTIVITY_KINDS.has(entry.kind)) {
      this.progress.markSolvedLocal(entry.itemId);
    }

    const xpAwarded = Number(res?.xpAwarded || 0);
    const weeklyGoalCompleted = !!res?.weeklyGoal?.reached;
    this.activityCompleted$.next({
      stats: res?.stats,
      kind: entry.kind,
      tech: entry.tech,
      itemId: entry.itemId,
      xpAwarded,
      weeklyGoalCompleted,
    });

    if (xpAwarded > 0) {
      this.analytics.track('xp_awarded', {
        source: entry.kind === 'incident' ? 'incident_complete' : 'question_complete',
        kind: entry.kind,
        tech: entry.tech,
        item_id: entry.itemId,
        xp: xpAwarded,
      });
    }

    this.analytics.track('weekly_goal_progressed', {
      completed: Number(res?.weeklyGoal?.completed || 0),
      target: Number(res?.weeklyGoal?.target || 0),
    });

    if (weeklyGoalCompleted) {
      this.analytics.track('weekly_goal_completed', {
        completed: Number(res?.weeklyGoal?.completed || 0),
        target: Number(res?.weeklyGoal?.target || 0),
      });
    }

    if (res?.levelUp) {
      this.analytics.track('level_up', { source: entry.kind === 'incident' ? 'incident_complete' : 'question_complete' });
    }
  }

  private handleRollbackSuccess(
    payload: { kind: 'coding' | 'trivia' | 'debug'; tech: Tech | 'system-design'; itemId?: string },
    res: ActivityUncompleteResponse
  ) {
    this.invalidateAll();
    this.gamification.invalidateDashboardCache();
    this.syncAuthUserState(res?.stats, res?.solvedQuestionIds);

    if (Array.isArray(res?.solvedQuestionIds)) {
      this.progress.setSolvedIds(res.solvedQuestionIds);
    }

    this.activityCompleted$.next({
      stats: res?.stats,
      kind: payload.kind,
      tech: payload.tech,
      itemId: payload.itemId,
      xpAwarded: -Math.max(0, Number(res?.xpRemoved || 0)),
      weeklyGoalCompleted: !!res?.weeklyGoal?.reached,
    });

    this.analytics.track('weekly_goal_progressed', {
      completed: Number(res?.weeklyGoal?.completed || 0),
      target: Number(res?.weeklyGoal?.target || 0),
    });
  }

  private syncAuthUserState(nextStats: any, nextSolvedIds: string[] | undefined) {
    const safeSolvedIds = Array.isArray(nextSolvedIds) ? nextSolvedIds : null;
    if (!nextStats && !nextSolvedIds) return;

    this.auth.user.update((current) => {
      if (!current) return current;
      return {
        ...current,
        stats: nextStats ?? current.stats,
        solvedQuestionIds: safeSolvedIds ?? current.solvedQuestionIds,
      };
    });
  }
}
