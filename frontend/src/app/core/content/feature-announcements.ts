export interface FeatureAnnouncement {
  featureKey: string;
  /** Verified public release date, YYYY-MM-DD (UTC). Never use a commit date. */
  releasedAt: string;
}

export const FEATURE_ANNOUNCEMENTS: readonly FeatureAnnouncement[] = [];

export const ANNOUNCEMENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function announcementReleaseTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

export function announcementIsActive(releasedAt: string, now: number): boolean {
  const start = announcementReleaseTime(releasedAt);
  return start !== null && now >= start && now < start + ANNOUNCEMENT_DURATION_MS;
}
