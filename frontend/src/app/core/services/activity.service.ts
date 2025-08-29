import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject, shareReplay, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface ActivityEvent {
  _id: string;
  userId: string;
  kind: 'coding' | 'trivia' | 'debug';
  tech: 'javascript' | 'angular';
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
  tech?: 'javascript' | 'angular';
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

    if (options?.force) this.invalidateSummary();

    const fresh = this.summaryCache && (Date.now() - this.summaryCache.ts) < ttl;
    if (fresh && this.summaryCache) return this.summaryCache.obs;

    const url = `${this.base}/summary${options?.force ? `?_=${Date.now()}` : ''}`;
    const obs = this.http.get<ActivitySummary>(url, { headers: this.headers() }).pipe(
      tap((s) => this.summarySig.set(s)),
      shareReplay(1)
    );

    this.summaryCache = { ts: Date.now(), obs };
    return obs;
  }

  getRecent(
    params?: { limit?: number; since?: string },
    options?: { force?: boolean; ttlMs?: number }
  ): Observable<ActivityEvent[]> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;
    const key = `limit=${params?.limit ?? ''}|since=${params?.since ?? ''}`;

    if (options?.force) this.recentCache.delete(key);

    const hit = this.recentCache.get(key);
    if (hit && (Date.now() - hit.ts) < ttl) return hit.obs;

    const q: string[] = [];
    if (params?.limit) q.push(`limit=${params.limit}`);
    if (params?.since) q.push(`since=${encodeURIComponent(params.since)}`);
    if (options?.force) q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';

    const obs = this.http
      .get<ActivityEvent[]>(`${this.base}/recent${qs}`, { headers: this.headers() })
      .pipe(shareReplay(1));

    this.recentCache.set(key, { ts: Date.now(), obs });
    return obs;
  }

  getHeatmap(
    params?: { days?: number },
    options?: { force?: boolean; ttlMs?: number }
  ): Observable<any> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;
    const key = `days=${params?.days ?? ''}`;

    if (options?.force) this.heatmapCache.delete(key);

    const hit = this.heatmapCache.get(key);
    if (hit && (Date.now() - hit.ts) < ttl) return hit.obs;

    const q: string[] = [];
    if (params?.days) q.push(`days=${params.days}`);
    if (options?.force) q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';

    const obs = this.http
      .get<any>(`${this.base}/heatmap${qs}`, { headers: this.headers() })
      .pipe(shareReplay(1));

    this.heatmapCache.set(key, { ts: Date.now(), obs });
    return obs;
  }

  // ---------- mutation ----------
  complete(payload: {
    kind: 'coding' | 'trivia' | 'debug';
    tech: 'javascript' | 'angular';
    itemId?: string;
    source?: 'tech' | 'company' | 'course' | 'system';
    durationMin?: number;
    xp?: number;
    solved?: boolean; // NEW: let server know if all tests passed
  }) {
    return this.http.post<{ credited: boolean; stats: any }>(
      `${this.base}/complete`,
      payload,
      { headers: this.headers() }
    ).pipe(
      tap(() => {
        // Bust caches & push event
        this.invalidateAll();
        this.activityCompleted$.next({ kind: payload.kind, tech: payload.tech, itemId: payload.itemId });
        // Opportunistically refresh summary signal
        this.getSummary({ force: true }).subscribe();
      })
    );
  }

  // ---------- legacy API (kept for compatibility; prefer get* above) ----------
  recent(params?: { limit?: number; since?: string }) { return this.getRecent(params); }
  summary() { return this.getSummary(); }
  heatmap(params?: { days?: number }) { return this.getHeatmap(params); }
  refreshSummary() { this.getSummary({ force: true }).subscribe({ next: () => { }, error: () => { } }); }
}
