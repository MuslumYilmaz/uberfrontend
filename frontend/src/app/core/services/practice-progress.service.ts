import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import {
  PracticeFamily,
  PracticeProgressCoreRecord,
  createEmptyPracticeProgressRecord,
} from '../models/practice.model';
import { AuthService } from './auth.service';
import { apiUrl } from '../utils/api-base';

const PRACTICE_PROGRESS_PREFIX = 'fa:practice:progress:v3:';
const PRACTICE_SESSION_PREFIX = 'fa:practice:session:v3:';
const LEGACY_PRACTICE_PROGRESS_KEY = 'fa:practice:progress:v2';
const LEGACY_PRACTICE_SESSION_PREFIX = 'fa:practice:session:v2:';
const LEGACY_INCIDENT_PROGRESS_KEY = 'fa:incidents:progress:v1';
const LEGACY_INCIDENT_SESSION_PREFIX = 'fa:incidents:session:v1:';

type StoredPracticeRecord = PracticeProgressCoreRecord;
type PracticeProgressApiRecord = {
  family?: PracticeFamily;
  itemId?: string;
  started?: boolean;
  completed?: boolean;
  passed?: boolean;
  bestScore?: number;
  lastPlayedAt?: string | null;
  extension?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class PracticeProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private activeScope = 'guest';
  private readonly recordsState = signal<Record<string, StoredPracticeRecord>>(this.readAll('guest'));
  private lastHydratedScope: string | null = null;

  readonly records = computed(() => this.recordsState());

  constructor() {
    this.migrateLegacyIncidentProgress();
    effect(() => {
      const userId = this.auth.user()?._id ?? null;
      const scope = this.scopeForUserId(userId);
      if (scope === this.lastHydratedScope) return;
      this.lastHydratedScope = scope;
      this.activeScope = scope;
      const localRecords = this.readAll(scope);
      this.recordsState.set(localRecords);

      if (this.isBrowser && userId) {
        this.hydrateRemoteProgress(scope);
      }
    }, { allowSignalWrites: true });
  }

  getRecord(family: PracticeFamily, id: string): StoredPracticeRecord {
    return this.recordsState()[this.key(family, id)] ?? createEmptyPracticeProgressRecord(family, id);
  }

  updateRecord(
    family: PracticeFamily,
    id: string,
    mutate: (current: StoredPracticeRecord) => StoredPracticeRecord,
  ): StoredPracticeRecord {
    const next = mutate(this.getRecord(family, id));
    const scope = this.currentScope();
    const updated = {
      ...this.recordsState(),
      [this.key(family, id)]: {
        ...next,
        family,
        id,
        extension: next.extension ?? {},
      },
    };
    this.recordsState.set(updated);
    this.writeAll(updated, scope);
    const record = updated[this.key(family, id)];
    this.syncRecord(record, scope);
    return record;
  }

  saveSession<T>(family: PracticeFamily, id: string, session: T): void {
    if (!this.isBrowser) return;
    this.safeSet(this.sessionStorageKey(family, id), JSON.stringify(session));
  }

  loadSession<T>(family: PracticeFamily, id: string): T | null {
    if (!this.isBrowser) return null;
    const raw = this.safeGet(this.sessionStorageKey(family, id));
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  clearSession(family: PracticeFamily, id: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.sessionStorageKey(family, id));
    } catch {
      // ignore
    }
  }

  private key(family: PracticeFamily, id: string): string {
    return `${family}:${id}`;
  }

  private currentScope(): string {
    return this.activeScope;
  }

  private scopeForUserId(userId: string | null): string {
    return userId ? `user:${userId}` : 'guest';
  }

  private progressStorageKey(scope: string): string {
    return `${PRACTICE_PROGRESS_PREFIX}${scope}`;
  }

  private sessionStorageKey(family: PracticeFamily, id: string, scope = this.currentScope()): string {
    return `${PRACTICE_SESSION_PREFIX}${scope}:${this.key(family, id)}`;
  }

  private readAll(scope = this.currentScope()): Record<string, StoredPracticeRecord> {
    if (!this.isBrowser) return {};
    const raw = this.safeGet(this.progressStorageKey(scope));
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw) as Record<string, Partial<StoredPracticeRecord>>;
      return Object.entries(parsed).reduce<Record<string, StoredPracticeRecord>>((acc, [key, value]) => {
        const family = this.coerceFamily(value?.family, key);
        const id = this.coerceId(value?.id, key);
        if (!family || !id) return acc;

        acc[key] = {
          ...createEmptyPracticeProgressRecord(family, id),
          ...value,
          family,
          id,
          started: value?.started === true,
          completed: value?.completed === true,
          passed: value?.passed === true,
          bestScore: typeof value?.bestScore === 'number' ? value.bestScore : 0,
          lastPlayedAt: typeof value?.lastPlayedAt === 'string' ? value.lastPlayedAt : null,
          extension: value?.extension && typeof value.extension === 'object'
            ? value.extension as Record<string, unknown>
            : {},
        };
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  private writeAll(records: Record<string, StoredPracticeRecord>, scope = this.currentScope()): void {
    if (!this.isBrowser) return;
    this.safeSet(this.progressStorageKey(scope), JSON.stringify(records));
  }

  private migrateLegacyIncidentProgress(): void {
    if (!this.isBrowser) return;

    const guestScope = 'guest';
    const nextRecords = { ...this.readAll(guestScope) };
    let changed = false;

    const legacySharedProgress = this.safeGet(LEGACY_PRACTICE_PROGRESS_KEY);
    if (legacySharedProgress) {
      try {
        const parsed = JSON.parse(legacySharedProgress) as Record<string, Partial<StoredPracticeRecord>>;
        Object.entries(parsed).forEach(([key, value]) => {
          const family = this.coerceFamily(value?.family, key);
          const id = this.coerceId(value?.id, key);
          if (!family || !id) return;
          nextRecords[this.key(family, id)] = this.mergeRecords(
            nextRecords[this.key(family, id)] ?? createEmptyPracticeProgressRecord(family, id),
            {
              ...createEmptyPracticeProgressRecord(family, id),
              ...value,
              family,
              id,
              started: value?.started === true,
              completed: value?.completed === true,
              passed: value?.passed === true,
              bestScore: typeof value?.bestScore === 'number' ? value.bestScore : 0,
              lastPlayedAt: typeof value?.lastPlayedAt === 'string' ? value.lastPlayedAt : null,
              extension: value?.extension && typeof value.extension === 'object'
                ? value.extension as Record<string, unknown>
                : {},
            },
          );
          changed = true;
        });
        localStorage.removeItem(LEGACY_PRACTICE_PROGRESS_KEY);
      } catch {
        // ignore invalid legacy payloads
      }
    }

    const legacyProgress = this.safeGet(LEGACY_INCIDENT_PROGRESS_KEY);
    if (legacyProgress) {
      try {
        const parsed = JSON.parse(legacyProgress) as Record<string, Record<string, unknown>>;
        Object.entries(parsed).forEach(([id, value]) => {
          const key = this.key('incident', id);
          nextRecords[key] = this.mergeRecords(
            nextRecords[key] ?? createEmptyPracticeProgressRecord('incident', id),
            {
              ...createEmptyPracticeProgressRecord('incident', id),
              started: value?.['started'] === true,
              completed: value?.['completed'] === true,
              passed: value?.['passed'] === true,
              bestScore: typeof value?.['bestScore'] === 'number' ? Number(value['bestScore']) : 0,
              lastPlayedAt: typeof value?.['lastPlayedAt'] === 'string' ? String(value['lastPlayedAt']) : null,
              extension: {
                reflectionNote: typeof value?.['reflectionNote'] === 'string' ? String(value['reflectionNote']) : '',
              },
            },
          );
          changed = true;
        });
        localStorage.removeItem(LEGACY_INCIDENT_PROGRESS_KEY);
      } catch {
        // ignore invalid legacy payloads
      }
    }

    try {
      Object.keys(localStorage).forEach((storageKey) => {
        if (storageKey.startsWith(LEGACY_PRACTICE_SESSION_PREFIX)) {
          const suffix = storageKey.slice(LEGACY_PRACTICE_SESSION_PREFIX.length);
          const value = localStorage.getItem(storageKey);
          if (value) {
            this.safeSet(`${PRACTICE_SESSION_PREFIX}${guestScope}:${suffix}`, value);
          }
          localStorage.removeItem(storageKey);
          return;
        }

        if (!storageKey.startsWith(LEGACY_INCIDENT_SESSION_PREFIX)) return;
        const id = storageKey.slice(LEGACY_INCIDENT_SESSION_PREFIX.length);
        const value = localStorage.getItem(storageKey);
        if (value) {
          this.safeSet(this.sessionStorageKey('incident', id, guestScope), value);
        }
        localStorage.removeItem(storageKey);
      });
    } catch {
      // ignore storage failures
    }

    if (!changed) return;
    this.recordsState.set(nextRecords);
    this.writeAll(nextRecords, guestScope);
  }

  private coerceFamily(value: unknown, key: string): PracticeFamily | null {
    if (value === 'question' || value === 'incident' || value === 'code-review' || value === 'tradeoff-battle') {
      return value;
    }

    const familyFromKey = key.split(':')[0];
    if (familyFromKey === 'question' || familyFromKey === 'incident' || familyFromKey === 'code-review' || familyFromKey === 'tradeoff-battle') {
      return familyFromKey;
    }

    return null;
  }

  private coerceId(value: unknown, key: string): string | null {
    if (typeof value === 'string' && value.trim()) return value;
    const parts = key.split(':');
    return parts.length > 1 ? parts.slice(1).join(':') : null;
  }

  private safeGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage failures
    }
  }

  private hydrateRemoteProgress(scope: string): void {
    this.http
      .get<{ records?: PracticeProgressApiRecord[] }>(apiUrl('/practice-progress'), {
        headers: this.auth.headers(),
      })
      .subscribe({
        next: (response) => {
          if (this.currentScope() !== scope) return;
          const merged = { ...this.recordsState() };
          for (const incoming of response?.records ?? []) {
            const normalized = this.fromApiRecord(incoming);
            if (!normalized) continue;
            merged[this.key(normalized.family, normalized.id)] = this.mergeRecords(
              merged[this.key(normalized.family, normalized.id)] ?? createEmptyPracticeProgressRecord(normalized.family, normalized.id),
              normalized,
            );
          }
          this.recordsState.set(merged);
          this.writeAll(merged, scope);
        },
        error: () => {
          // keep local cache when sync is unavailable
        },
      });
  }

  private syncRecord(record: StoredPracticeRecord, scope: string): void {
    if (!this.isBrowser || scope === 'guest' || !this.auth.isLoggedIn()) return;

    this.http
      .put<{ record?: PracticeProgressApiRecord }>(
        apiUrl(`/practice-progress/${record.family}/${encodeURIComponent(record.id)}`),
        {
          started: record.started,
          completed: record.completed,
          passed: record.passed,
          bestScore: record.bestScore,
          lastPlayedAt: record.lastPlayedAt,
          extension: record.extension ?? {},
        },
        { headers: this.auth.headers() },
      )
      .subscribe({
        next: (response) => {
          if (this.currentScope() !== scope) return;
          const incoming = this.fromApiRecord(response?.record);
          if (!incoming) return;
          const next = {
            ...this.recordsState(),
            [this.key(incoming.family, incoming.id)]: this.mergeRecords(
              this.recordsState()[this.key(incoming.family, incoming.id)] ?? createEmptyPracticeProgressRecord(incoming.family, incoming.id),
              incoming,
            ),
          };
          this.recordsState.set(next);
          this.writeAll(next, scope);
        },
        error: () => {
          // keep optimistic local state
        },
      });
  }

  private mergeRecords(current: StoredPracticeRecord, incoming: StoredPracticeRecord): StoredPracticeRecord {
    const currentLast = this.parseIsoDate(current.lastPlayedAt);
    const incomingLast = this.parseIsoDate(incoming.lastPlayedAt);
    const useIncomingExtension = !currentLast || (incomingLast?.getTime() || 0) >= currentLast.getTime();

    return {
      ...createEmptyPracticeProgressRecord(current.family, current.id),
      ...current,
      family: current.family,
      id: current.id,
      started: current.started || incoming.started,
      completed: current.completed || incoming.completed,
      passed: current.passed || incoming.passed,
      bestScore: Math.max(Number(current.bestScore || 0), Number(incoming.bestScore || 0)),
      lastPlayedAt: this.latestIsoString(current.lastPlayedAt, incoming.lastPlayedAt),
      extension: useIncomingExtension
        ? { ...(current.extension ?? {}), ...(incoming.extension ?? {}) }
        : (current.extension ?? {}),
    };
  }

  private latestIsoString(current: string | null, incoming: string | null): string | null {
    const currentDate = this.parseIsoDate(current);
    const incomingDate = this.parseIsoDate(incoming);
    if (!currentDate && !incomingDate) return null;
    if (!currentDate) return incomingDate?.toISOString() ?? null;
    if (!incomingDate) return currentDate.toISOString();
    return incomingDate > currentDate ? incomingDate.toISOString() : currentDate.toISOString();
  }

  private parseIsoDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private fromApiRecord(value: PracticeProgressApiRecord | undefined): StoredPracticeRecord | null {
    if (!value) return null;
    const family = this.coerceFamily(value.family, `${value.family || ''}:${value.itemId || ''}`);
    const id = typeof value.itemId === 'string' ? value.itemId.trim() : '';
    if (!family || !id) return null;

    return {
      ...createEmptyPracticeProgressRecord(family, id),
      family,
      id,
      started: value.started === true,
      completed: value.completed === true,
      passed: value.passed === true,
      bestScore: typeof value.bestScore === 'number' ? value.bestScore : 0,
      lastPlayedAt: typeof value.lastPlayedAt === 'string' ? value.lastPlayedAt : null,
      extension: value.extension && typeof value.extension === 'object'
        ? value.extension
        : {},
    };
  }
}
