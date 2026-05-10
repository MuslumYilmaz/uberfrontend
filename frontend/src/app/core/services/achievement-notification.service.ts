import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { AchievementAward, DashboardGamificationResponse } from '../models/gamification.model';
import { apiUrl } from '../utils/api-base';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AchievementNotificationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly queue: AchievementAward[] = [];
  private readonly shownIds = new Set<string>();
  private timer: number | null = null;

  readonly current = signal<AchievementAward | null>(null);

  enqueueFromDashboard(payload: DashboardGamificationResponse | null | undefined): void {
    this.enqueueAwards(payload?.achievements?.unseen ?? []);
  }

  enqueueAwards(awards: AchievementAward[] | null | undefined): void {
    if (!this.auth.isLoggedIn()) return;

    for (const award of Array.isArray(awards) ? awards : []) {
      const normalized = this.normalizeAward(award);
      if (!normalized) continue;
      if (this.shownIds.has(normalized.id)) continue;
      if (this.current()?.id === normalized.id) continue;
      if (this.queue.some((queued) => queued.id === normalized.id)) continue;
      this.queue.push(normalized);
    }

    this.presentNext();
  }

  dismissCurrent(): void {
    this.clearTimer();
    this.current.set(null);
    this.scheduleNext();
  }

  private normalizeAward(value: AchievementAward | null | undefined): AchievementAward | null {
    const id = String(value?.id || '').trim();
    if (!id || !value?.title || !value?.reason) return null;
    return {
      id,
      title: String(value.title),
      reason: String(value.reason),
      icon: String(value.icon || 'target'),
      theme: String(value.theme || 'gold'),
      current: Math.max(0, Number(value.current) || 0),
      target: Math.max(1, Number(value.target) || 1),
      progress: Math.max(0, Math.min(1, Number(value.progress) || 0)),
      earnedAt: String(value.earnedAt || new Date().toISOString()),
    };
  }

  private presentNext(): void {
    if (this.current() || !this.queue.length) return;

    const award = this.queue.shift() || null;
    if (!award) return;

    this.shownIds.add(award.id);
    this.current.set(award);
    this.markSeen([award.id]);

    if (!this.isBrowser) return;
    this.clearTimer();
    this.timer = window.setTimeout(() => this.dismissCurrent(), 6000);
  }

  private scheduleNext(): void {
    if (!this.queue.length) return;
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => this.presentNext());
      return;
    }
    setTimeout(() => this.presentNext(), 0);
  }

  private clearTimer(): void {
    if (!this.isBrowser || this.timer === null) return;
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  private markSeen(ids: string[]): void {
    if (!ids.length || !this.auth.isLoggedIn()) return;
    this.http
      .post(
        apiUrl('/achievements/seen'),
        { ids },
        { headers: this.auth.headers(), withCredentials: true },
      )
      .subscribe({ error: () => undefined });
  }
}
