
import { DestroyRef, Injectable, InjectionToken, NgZone, afterNextRender, inject, signal, DOCUMENT } from '@angular/core';
import {
  ANNOUNCEMENT_DURATION_MS,
  FEATURE_ANNOUNCEMENTS,
  FeatureAnnouncement,
  announcementIsActive,
  announcementReleaseTime,
} from '../content/feature-announcements';

export const FEATURE_ANNOUNCEMENT_CONFIG = new InjectionToken<readonly FeatureAnnouncement[]>(
  'FEATURE_ANNOUNCEMENT_CONFIG', { providedIn: 'root', factory: () => FEATURE_ANNOUNCEMENTS },
);

@Injectable({ providedIn: 'root' })
export class FeatureAnnouncementsService {
  private readonly entries = inject(FEATURE_ANNOUNCEMENT_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly now = signal<number | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // No transient badges in SSR/prerender or during hydration.
    const renderRef = afterNextRender(() => {
      this.refresh();
      this.document.addEventListener('visibilitychange', this.onVisibility);
    });
    inject(DestroyRef).onDestroy(() => {
      renderRef.destroy();
      clearTimeout(this.timer);
      this.document.removeEventListener('visibilitychange', this.onVisibility);
    });
  }

  badgeFor(featureKey: string): string | null {
    const now = this.now();
    return now !== null && this.entries.some((entry) =>
      entry.featureKey === featureKey && announcementIsActive(entry.releasedAt, now),
    ) ? 'New' : null;
  }

  private readonly onVisibility = () => {
    if (!this.document.hidden) this.refresh();
  };

  private refresh(): void {
    clearTimeout(this.timer);
    const now = Date.now();
    this.zone.run(() => this.now.set(now));
    const boundaries = this.entries.flatMap((entry) => {
      const start = announcementReleaseTime(entry.releasedAt);
      return start === null ? [] : [start, start + ANNOUNCEMENT_DURATION_MS];
    }).filter((time) => time > now);
    if (!boundaries.length) return;
    // Long-lived tabs and future releases work without keeping Angular unstable.
    const delay = Math.min(Math.min(...boundaries) - now, 2_147_483_647);
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.refresh(), delay);
    });
  }
}
