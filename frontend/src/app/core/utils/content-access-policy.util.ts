import type { AccessLevel } from '../models/question.model';

export function normalizeContentAccess(value?: AccessLevel | string | null): AccessLevel {
  return String(value || 'free').trim() === 'premium' ? 'premium' : 'free';
}

export function robotsForContentAccess(value?: AccessLevel | string | null): string | undefined {
  return normalizeContentAccess(value) === 'premium' ? 'noindex,follow' : undefined;
}

export function isContentAccessibleForFree(value?: AccessLevel | string | null): boolean {
  return normalizeContentAccess(value) !== 'premium';
}
