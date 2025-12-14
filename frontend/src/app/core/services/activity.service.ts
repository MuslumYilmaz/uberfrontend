import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject, catchError, of, shareReplay, tap, throwError } from 'rxjs';
import { Tech } from '../models/user.model';
import { AuthService } from './auth.service';

export interface ActivityEvent {
  _id: string;
  userId: string;
  kind: 'coding' | 'trivia' | 'debug';
  tech: Tech | 'system-design';
  itemId?: string;
  source: 'tech' | 'company' | 'course' | 'system';
  durationMin: number;
  xp: number;
  completedAt: string;  // ISO
  dayUTC: string;       // YYYY-MM-DD
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

export type ActivityCompletedEvent = {
  stats?: any;
  kind?: 'coding' | 'trivia' | 'debug';
  tech?: Tech | 'system-design';
  itemId?: string;
};

type CachedObs<T> = { ts: number; obs: Observable<T> };

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private base = 'http://localhost:3001/api/activity';
  private readonly DEFAULT_TTL = 60_000; // 60s

  // Emits when any activity is completed
  activityCompleted$ = new Subject<ActivityCompletedEvent>();

  // Live summary cache for quick read in components
  summarySig = signal<ActivitySummary | null>(null);

  // ---- request caches (dedupe + TTL) ----
  private summaryCache: CachedObs<ActivitySummary> | null = null;
  private recentCache = new Map<string, CachedObs<ActivityEvent[]>>();
  private heatmapCache = new Map<string, CachedObs<any>>();

  constructor(private http: HttpClient, private auth: AuthService) {
    // Invalidate on completion (so widgets refresh immediately)
    this.activityCompleted$.subscribe(() => {
      this.invalidateAll();
    });
  }

  private isLoggedIn(): boolean {
    return !!this.auth.token; // or this.auth.isLoggedIn() if you have it
  }

  // ---------- headers ----------
  private headers(): HttpHeaders {
    return new HttpHeaders(
      this.auth.token ? { Authorization: `Bearer ${this.auth.token}` } : {}
    );
  }

  // ---------- invalidation ----------
  invalidateAll() {
    this.summaryCache = null;
    this.recentCache.clear();
    this.heatmapCache.clear();
  }
  invalidateSummary() { this.summaryCache = null; }
  invalidateRecent() { this.recentCache.clear(); }
  invalidateHeatmap() { this.heatmapCache.clear(); }

  // ---------- cached endpoints ----------
  getSummary(options?: { force?: boolean; ttlMs?: number }): Observable<ActivitySummary> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;

    // 🛑 Do nothing when logged out (no console errors)
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
      // 🔇 Swallow 401s (e.g., token expired race)
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

    // 🛑 Skip when logged out
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

    // 🛑 Skip when logged out
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

  // ---------- mutation ----------
  complete(payload: {
    kind: 'coding' | 'trivia' | 'debug';
    tech: Tech | 'system-design';
    itemId?: string;
    source?: 'tech' | 'company' | 'course' | 'system';
    durationMin?: number;
    xp?: number;
    solved?: boolean;
  }) {
    // 🛑 If logged out, act like a no-op (no error, no network)
    if (!this.isLoggedIn()) {
      return of({ credited: false, stats: null } as { credited: boolean; stats: any });
    }

    return this.http.post<{ credited: boolean; stats: any }>(
      `${this.base}/complete`,
      payload,
      { headers: this.headers() }
    ).pipe(
      tap(() => {
        this.invalidateAll();
        this.activityCompleted$.next({ kind: payload.kind, tech: payload.tech, itemId: payload.itemId });
        this.getSummary({ force: true }).subscribe();
      }),
      catchError(err => {
        if (err?.status === 401) return of({ credited: false, stats: null });
        return throwError(() => err);
      })
    );
  }

  // ---------- legacy API (kept for compatibility; prefer get* above) ----------
  recent(params?: { limit?: number; since?: string; all?: boolean }) { return this.getRecent(params); }
  summary() { return this.getSummary(); }
  heatmap(params?: { days?: number }) { return this.getHeatmap(params); }
  refreshSummary() { this.getSummary({ force: true }).subscribe({ next: () => { }, error: () => { } }); }
}
