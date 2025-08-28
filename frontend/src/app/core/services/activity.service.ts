import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private base = 'http://localhost:3001/api/activity';

  // Emits when any activity is completed
  activityCompleted$ = new Subject<ActivityCompletedEvent>();

  // Header/widgets read this live cache
  summarySig = signal<ActivitySummary | null>(null);

  constructor(private http: HttpClient, private auth: AuthService) { }

  private headers(): HttpHeaders {
    return new HttpHeaders(
      this.auth.token ? { Authorization: `Bearer ${this.auth.token}` } : {}
    );
  }

  private noCacheHeaders(): HttpHeaders {
    return this.headers()
      .set('Cache-Control', 'no-cache, no-store, must-revalidate')
      .set('Pragma', 'no-cache')
      .set('Expires', '0');
  }

  /** Recent activity. Optional since=YYYY-MM-DD to bound by day. Always uncacheable. */
  recent(params?: { limit?: number; since?: string }): Observable<ActivityEvent[]> {
    const q: string[] = [];
    if (params?.limit) q.push(`limit=${params.limit}`);
    if (params?.since) q.push(`since=${encodeURIComponent(params.since)}`);
    q.push(`_=${Date.now()}`);

    const qs = q.length ? `?${q.join('&')}` : '';
    return this.http.get<ActivityEvent[]>(
      `${this.base}/recent${qs}`,
      { headers: this.noCacheHeaders() }
    );
  }

  summary(): Observable<ActivitySummary> {
    const qs = `?_=${Date.now()}`;
    return this.http.get<ActivitySummary>(`${this.base}/summary${qs}`, {
      headers: this.noCacheHeaders(),
    });
  }

  heatmap(params?: { days?: number }) {
    const q: string[] = [];
    if (params?.days) q.push(`days=${params.days}`);
    q.push(`_=${Date.now()}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return this.http.get<any>(`${this.base}/heatmap${qs}`, { headers: this.noCacheHeaders() });
  }

  complete(payload: {
    kind: 'coding' | 'trivia' | 'debug';
    tech: 'javascript' | 'angular';
    itemId?: string;
    source?: 'tech' | 'company' | 'course' | 'system';
    durationMin?: number;
    xp?: number;
  }) {
    return this.http.post<{ credited: boolean; stats: any }>(`${this.base}/complete`, payload, {
      headers: this.headers()
    });
  }

  refreshSummary() {
    this.summary().subscribe({
      next: (s) => this.summarySig.set(s),
      error: () => this.summarySig.set(this.summarySig()),
    });
  }
}
