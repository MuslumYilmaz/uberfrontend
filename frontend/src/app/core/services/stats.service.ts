import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ActivityService } from './activity.service';
import { AuthService } from './auth.service';
import { apiUrl } from '../utils/api-base';

export interface HeatmapDay {
  day: string;   // YYYY-MM-DD
  count: number; // number of completed items that day
  xp: number;
}

type CachedObs<T> = { ts: number; obs: Observable<T> };

@Injectable({ providedIn: 'root' })
export class StatsService {
  private base = apiUrl('/stats');
  private readonly DEFAULT_TTL = 5 * 60_000; // 5 minutes

  heatmap = signal<HeatmapDay[]>([]);

  private cached = new Map<string, CachedObs<HeatmapDay[]>>();

  constructor(private http: HttpClient, private auth: AuthService, activity: ActivityService) {
    // invalidate on activity completion
    activity.activityCompleted$.subscribe(() => this.invalidate());
  }

  private headers(): HttpHeaders {
    return this.auth.headers();
  }

  invalidate() { this.cached.clear(); }

  /** Cached, shared heatmap stream; also updates the signal. */
  heatmap$(params?: { days?: number }, options?: { force?: boolean; ttlMs?: number }): Observable<HeatmapDay[]> {
    const ttl = options?.ttlMs ?? this.DEFAULT_TTL;
    const key = `days=${params?.days ?? ''}`;

    if (options?.force) this.cached.delete(key);

    const hit = this.cached.get(key);
    if (hit && (Date.now() - hit.ts) < ttl) return hit.obs;

    const q: string[] = [];
    if (params?.days) q.push(`days=${params.days}`);
    if (options?.force) q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';

    const obs = this.http.get<HeatmapDay[]>(`${this.base}/heatmap${qs}`, { headers: this.headers() })
      .pipe(shareReplay(1));

    // Keep a signal mirror for simple components
    obs.subscribe({
      next: (rows) => this.heatmap.set(rows || []),
      error: () => this.heatmap.set([]),
    });

    this.cached.set(key, { ts: Date.now(), obs });
    return obs;
  }
}
