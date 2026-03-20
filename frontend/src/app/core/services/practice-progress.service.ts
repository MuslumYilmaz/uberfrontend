import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  PracticeFamily,
  PracticeProgressCoreRecord,
  createEmptyPracticeProgressRecord,
} from '../models/practice.model';

const PRACTICE_PROGRESS_KEY = 'fa:practice:progress:v2';
const PRACTICE_SESSION_PREFIX = 'fa:practice:session:v2:';
const LEGACY_INCIDENT_PROGRESS_KEY = 'fa:incidents:progress:v1';
const LEGACY_INCIDENT_SESSION_PREFIX = 'fa:incidents:session:v1:';

type StoredPracticeRecord = PracticeProgressCoreRecord;

@Injectable({ providedIn: 'root' })
export class PracticeProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly recordsState = signal<Record<string, StoredPracticeRecord>>(this.readAll());

  readonly records = computed(() => this.recordsState());

  constructor() {
    this.migrateLegacyIncidentProgress();
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
    this.writeAll(updated);
    return updated[this.key(family, id)];
  }

  saveSession<T>(family: PracticeFamily, id: string, session: T): void {
    if (!this.isBrowser) return;
    this.safeSet(`${PRACTICE_SESSION_PREFIX}${this.key(family, id)}`, JSON.stringify(session));
  }

  loadSession<T>(family: PracticeFamily, id: string): T | null {
    if (!this.isBrowser) return null;
    const raw = this.safeGet(`${PRACTICE_SESSION_PREFIX}${this.key(family, id)}`);
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
      localStorage.removeItem(`${PRACTICE_SESSION_PREFIX}${this.key(family, id)}`);
    } catch {
      // ignore
    }
  }

  private key(family: PracticeFamily, id: string): string {
    return `${family}:${id}`;
  }

  private readAll(): Record<string, StoredPracticeRecord> {
    if (!this.isBrowser) return {};
    const raw = this.safeGet(PRACTICE_PROGRESS_KEY);
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

  private writeAll(records: Record<string, StoredPracticeRecord>): void {
    if (!this.isBrowser) return;
    this.safeSet(PRACTICE_PROGRESS_KEY, JSON.stringify(records));
  }

  private migrateLegacyIncidentProgress(): void {
    if (!this.isBrowser) return;

    const nextRecords = { ...this.recordsState() };
    let changed = false;

    const legacyProgress = this.safeGet(LEGACY_INCIDENT_PROGRESS_KEY);
    if (legacyProgress) {
      try {
        const parsed = JSON.parse(legacyProgress) as Record<string, Record<string, unknown>>;
        Object.entries(parsed).forEach(([id, value]) => {
          const key = this.key('incident', id);
          if (nextRecords[key]) return;
          nextRecords[key] = {
            ...createEmptyPracticeProgressRecord('incident', id),
            started: value?.['started'] === true,
            completed: value?.['completed'] === true,
            passed: value?.['passed'] === true,
            bestScore: typeof value?.['bestScore'] === 'number' ? Number(value['bestScore']) : 0,
            lastPlayedAt: typeof value?.['lastPlayedAt'] === 'string' ? String(value['lastPlayedAt']) : null,
            extension: {
              reflectionNote: typeof value?.['reflectionNote'] === 'string' ? String(value['reflectionNote']) : '',
            },
          };
          changed = true;
        });
        localStorage.removeItem(LEGACY_INCIDENT_PROGRESS_KEY);
      } catch {
        // ignore invalid legacy payloads
      }
    }

    try {
      Object.keys(localStorage).forEach((storageKey) => {
        if (!storageKey.startsWith(LEGACY_INCIDENT_SESSION_PREFIX)) return;
        const id = storageKey.slice(LEGACY_INCIDENT_SESSION_PREFIX.length);
        const value = localStorage.getItem(storageKey);
        if (value) {
          this.safeSet(`${PRACTICE_SESSION_PREFIX}${this.key('incident', id)}`, value);
        }
        localStorage.removeItem(storageKey);
      });
    } catch {
      // ignore storage failures
    }

    if (!changed) return;
    this.recordsState.set(nextRecords);
    this.writeAll(nextRecords);
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
}
