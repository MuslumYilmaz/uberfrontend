import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap, throwError } from 'rxjs';
import {
  DailyChallengeCompleteResponse,
  DashboardGamificationResponse,
  WeeklyGoalUpdateResponse,
} from '../models/gamification.model';
import { apiUrl } from '../utils/api-base';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private dashboardCache$: Observable<DashboardGamificationResponse | null> | null = null;
  private cacheTs = 0;
  private readonly cacheTtlMs = 30_000;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getDashboard(options?: { force?: boolean }): Observable<DashboardGamificationResponse | null> {
    if (!this.auth.isLoggedIn()) return of(null);

    const isFresh = this.dashboardCache$ && Date.now() - this.cacheTs < this.cacheTtlMs;
    if (!options?.force && isFresh) return this.dashboardCache$ as Observable<DashboardGamificationResponse | null>;

    const req$ = this.http
      .get<DashboardGamificationResponse>(apiUrl('/dashboard'), {
        headers: this.auth.headers(),
        withCredentials: true,
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 401) return of(null);
          return throwError(() => err);
        }),
        shareReplay(1)
      );

    this.dashboardCache$ = req$;
    this.cacheTs = Date.now();
    return req$;
  }

  completeDailyChallenge(questionId: string): Observable<DailyChallengeCompleteResponse> {
    return this.http
      .post<DailyChallengeCompleteResponse>(
        apiUrl('/daily/complete'),
        { questionId },
        { headers: this.auth.headers(), withCredentials: true }
      )
      .pipe(
        tap(() => this.invalidateDashboardCache())
      );
  }

  updateWeeklyGoal(payload: {
    enabled?: boolean;
    target?: number;
    showStreakWidget?: boolean;
    dailyChallengeTech?: 'auto' | 'javascript' | 'react' | 'angular' | 'vue' | 'html' | 'css';
  }): Observable<WeeklyGoalUpdateResponse> {
    return this.http
      .post<WeeklyGoalUpdateResponse>(apiUrl('/weekly-goal'), payload, {
        headers: this.auth.headers(),
        withCredentials: true,
      })
      .pipe(
        tap(() => this.invalidateDashboardCache())
      );
  }

  invalidateDashboardCache() {
    this.dashboardCache$ = null;
    this.cacheTs = 0;
  }
}
