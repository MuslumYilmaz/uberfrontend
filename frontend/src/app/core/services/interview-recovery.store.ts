import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export type InterviewRecoveryKind = 'mcq' | 'coding' | 'system-design';

export interface InterviewRecoveryEnvelope<T = unknown> {
  schemaVersion: 2;
  kind: InterviewRecoveryKind;
  userId: string;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  serverVersion: number | null;
  baseHash: string | null;
  payload: T;
}

export interface SaveInterviewRecovery<T> {
  kind: InterviewRecoveryKind;
  userId: string;
  sessionId: string;
  payload: T;
  serverVersion?: number | null;
  baseHash?: string | null;
  ttlMs?: number;
}

export interface InterviewRecoveryRecord<T = unknown> {
  envelope: InterviewRecoveryEnvelope<T>;
  /** Opaque compare-and-swap token. Callers must not inspect its contents. */
  revision: string;
}

export interface InterviewRecoveryWriteResult {
  saved: boolean;
  conflict: boolean;
  revision: string | null;
}

export interface MigrateLegacyInterviewRecovery<T> {
  kind: InterviewRecoveryKind;
  sessionId: string;
  /** Caller obtained this session through an authenticated ownership-checked API response. */
  ownershipConfirmed: true;
  normalize: (legacyValue: unknown) => T | null;
  serverVersion?: number | null;
  baseHash?: string | null | ((payload: T) => string | null);
}

const PREFIX = 'fa:interview:recovery:v2:';
const LEGACY_PREFIXES = [
  'fa:interview:mcq-timing:v1:',
  'fa:interview:coding-draft:v1:',
  'fa:interview:system-design-draft:v1:',
] as const;
const TTL_BY_KIND: Record<InterviewRecoveryKind, number> = {
  mcq: 2 * 60 * 60 * 1_000,
  coding: 24 * 60 * 60 * 1_000,
  'system-design': 24 * 60 * 60 * 1_000,
};

@Injectable({ providedIn: 'root' })
export class InterviewRecoveryStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private activeUserId = '';

  constructor() {
    this.purgeExpired();
  }

  setUserScope(userIdRaw: string | null | undefined): void {
    const nextUserId = this.safeIdentity(String(userIdRaw || ''));
    if (nextUserId === this.activeUserId) return;
    if (this.activeUserId) this.clearAll();
    else if (nextUserId) this.clearOtherUserRecords(nextUserId);
    this.activeUserId = nextUserId;
  }

  currentUserScope(): string | null {
    return this.activeUserId || null;
  }

  saveForCurrentUser<T>(input: Omit<SaveInterviewRecovery<T>, 'userId'>): boolean {
    if (!this.activeUserId) return false;
    return this.save({ ...input, userId: this.activeUserId });
  }

  readForCurrentUser<T>(
    kind: InterviewRecoveryKind,
    sessionId: string,
  ): InterviewRecoveryEnvelope<T> | null {
    if (!this.activeUserId) return null;
    return this.read<T>(kind, this.activeUserId, sessionId);
  }

  readForCurrentUserWithRevision<T>(
    kind: InterviewRecoveryKind,
    sessionId: string,
  ): InterviewRecoveryRecord<T> | null {
    if (!this.activeUserId) return null;
    return this.readWithRevision<T>(kind, this.activeUserId, sessionId);
  }

  readOrMigrateLegacyForCurrentUser<T>(
    input: MigrateLegacyInterviewRecovery<T>,
  ): InterviewRecoveryRecord<T> | null {
    if (!this.isBrowser || !this.activeUserId || input.ownershipConfirmed !== true) return null;
    const current = this.readForCurrentUserWithRevision<T>(input.kind, input.sessionId);
    if (current) return current;

    const sessionId = this.safeIdentity(input.sessionId);
    if (!sessionId) return null;
    const legacyKey = this.legacyKey(input.kind, sessionId);
    let legacyRaw: string | null;
    try {
      legacyRaw = localStorage.getItem(legacyKey);
    } catch {
      return null;
    }
    if (!legacyRaw) return null;

    let normalized: T | null = null;
    try {
      normalized = input.normalize(JSON.parse(legacyRaw));
    } catch {
      normalized = null;
    }
    if (normalized === null) {
      this.removeKey(legacyKey);
      return null;
    }

    const migrated = this.compareAndSaveForCurrentUser({
      kind: input.kind,
      sessionId,
      payload: normalized,
      serverVersion: input.serverVersion,
      baseHash: typeof input.baseHash === 'function'
        ? input.baseHash(normalized)
        : input.baseHash,
    }, null);
    const resolved = migrated.saved
      ? this.readForCurrentUserWithRevision<T>(input.kind, sessionId)
      : migrated.conflict
        ? this.readForCurrentUserWithRevision<T>(input.kind, sessionId)
        : null;
    if (resolved) this.removeKey(legacyKey);
    return resolved;
  }

  compareAndSaveForCurrentUser<T>(
    input: Omit<SaveInterviewRecovery<T>, 'userId'>,
    expectedRevision: string | null,
  ): InterviewRecoveryWriteResult {
    if (!this.activeUserId) return { saved: false, conflict: false, revision: null };
    return this.compareAndSave(
      { ...input, userId: this.activeUserId },
      expectedRevision,
    );
  }

  removeForCurrentUser(kind: InterviewRecoveryKind, sessionId: string): void {
    if (!this.activeUserId) return;
    this.remove(kind, this.activeUserId, sessionId);
  }

  removeForCurrentUserIfRevision(
    kind: InterviewRecoveryKind,
    sessionIdRaw: string,
    expectedRevision: string,
  ): boolean {
    if (!this.isBrowser || !this.activeUserId || !expectedRevision) return false;
    const sessionId = this.safeIdentity(sessionIdRaw);
    if (!sessionId) return false;
    const key = this.key(kind, this.activeUserId, sessionId);
    try {
      if (localStorage.getItem(key) !== expectedRevision) return false;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  save<T>(input: SaveInterviewRecovery<T>): boolean {
    if (!this.isBrowser) return false;
    const userId = this.safeIdentity(input.userId);
    const sessionId = this.safeIdentity(input.sessionId);
    if (!userId || !sessionId) return false;
    const now = Date.now();
    const key = this.key(input.kind, userId, sessionId);
    const existing = this.readEnvelope<unknown>(key, now);
    const requestedTtl = Number(input.ttlMs ?? TTL_BY_KIND[input.kind]);
    const ttlMs = Math.max(60_000, Math.min(24 * 60 * 60 * 1_000, requestedTtl));
    const envelope: InterviewRecoveryEnvelope<T> = {
      schemaVersion: 2,
      kind: input.kind,
      userId,
      sessionId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: now + ttlMs,
      serverVersion: Number.isInteger(input.serverVersion) ? input.serverVersion! : null,
      baseHash: String(input.baseHash || '').trim() || null,
      payload: input.payload,
    };
    try {
      localStorage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  compareAndSave<T>(
    input: SaveInterviewRecovery<T>,
    expectedRevision: string | null,
  ): InterviewRecoveryWriteResult {
    if (!this.isBrowser) return { saved: false, conflict: false, revision: null };
    const userId = this.safeIdentity(input.userId);
    const sessionId = this.safeIdentity(input.sessionId);
    if (!userId || !sessionId) return { saved: false, conflict: false, revision: null };
    const key = this.key(input.kind, userId, sessionId);
    let currentRaw: string | null;
    try {
      currentRaw = localStorage.getItem(key);
    } catch {
      return { saved: false, conflict: false, revision: null };
    }
    if (currentRaw !== expectedRevision) {
      return { saved: false, conflict: true, revision: currentRaw };
    }

    const now = Date.now();
    const existing = currentRaw ? this.parseEnvelope<unknown>(currentRaw, now) : null;
    const requestedTtl = Number(input.ttlMs ?? TTL_BY_KIND[input.kind]);
    const ttlMs = Math.max(60_000, Math.min(24 * 60 * 60 * 1_000, requestedTtl));
    const envelope: InterviewRecoveryEnvelope<T> = {
      schemaVersion: 2,
      kind: input.kind,
      userId,
      sessionId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: now + ttlMs,
      serverVersion: Number.isInteger(input.serverVersion) ? input.serverVersion! : null,
      baseHash: String(input.baseHash || '').trim() || null,
      payload: input.payload,
    };
    const revision = JSON.stringify(envelope);
    try {
      // JavaScript cannot make localStorage CAS atomic across processes. The second read
      // preserves the existing observed-revision guard for normal browser-tab ordering.
      if (localStorage.getItem(key) !== expectedRevision) {
        return { saved: false, conflict: true, revision: localStorage.getItem(key) };
      }
      localStorage.setItem(key, revision);
      return { saved: true, conflict: false, revision };
    } catch {
      return { saved: false, conflict: false, revision: null };
    }
  }

  read<T>(kind: InterviewRecoveryKind, userIdRaw: string, sessionIdRaw: string): InterviewRecoveryEnvelope<T> | null {
    if (!this.isBrowser) return null;
    const userId = this.safeIdentity(userIdRaw);
    const sessionId = this.safeIdentity(sessionIdRaw);
    if (!userId || !sessionId) return null;
    const key = this.key(kind, userId, sessionId);
    const envelope = this.readEnvelope<T>(key, Date.now());
    if (
      !envelope
      || envelope.kind !== kind
      || envelope.userId !== userId
      || envelope.sessionId !== sessionId
    ) {
      this.removeKey(key);
      return null;
    }
    return envelope;
  }

  readWithRevision<T>(
    kind: InterviewRecoveryKind,
    userIdRaw: string,
    sessionIdRaw: string,
  ): InterviewRecoveryRecord<T> | null {
    if (!this.isBrowser) return null;
    const userId = this.safeIdentity(userIdRaw);
    const sessionId = this.safeIdentity(sessionIdRaw);
    if (!userId || !sessionId) return null;
    const key = this.key(kind, userId, sessionId);
    try {
      const revision = localStorage.getItem(key);
      if (!revision) return null;
      const envelope = this.parseEnvelope<T>(revision, Date.now());
      if (
        !envelope
        || envelope.kind !== kind
        || envelope.userId !== userId
        || envelope.sessionId !== sessionId
      ) {
        this.removeKey(key);
        return null;
      }
      return { envelope, revision };
    } catch {
      return null;
    }
  }

  remove(kind: InterviewRecoveryKind, userId: string, sessionId: string): void {
    if (!this.isBrowser) return;
    this.removeKey(this.key(kind, this.safeIdentity(userId), this.safeIdentity(sessionId)));
  }

  clearSession(sessionIdRaw: string): void {
    if (!this.isBrowser) return;
    const sessionId = this.safeIdentity(sessionIdRaw);
    if (!sessionId) return;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX) && key.endsWith(`:${sessionId}`)) this.removeKey(key);
      if (LEGACY_PREFIXES.some((prefix) => key === `${prefix}${sessionId}`)) this.removeKey(key);
    }
  }

  clearAll(): void {
    if (!this.isBrowser) return;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX) || LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        this.removeKey(key);
      }
    }
  }

  purgeExpired(now = Date.now()): void {
    if (!this.isBrowser) return;
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(PREFIX)) continue;
      this.readEnvelope(key, now);
    }
  }

  private key(kind: InterviewRecoveryKind, userId: string, sessionId: string): string {
    return `${PREFIX}${userId}:${kind}:${sessionId}`;
  }

  private readEnvelope<T>(key: string, now: number): InterviewRecoveryEnvelope<T> | null {
    try {
      const parsed = this.parseEnvelope<T>(localStorage.getItem(key) || '', now);
      if (!parsed) {
        this.removeKey(key);
        return null;
      }
      return parsed;
    } catch {
      this.removeKey(key);
      return null;
    }
  }

  private parseEnvelope<T>(raw: string, now: number): InterviewRecoveryEnvelope<T> | null {
    try {
      const parsed = JSON.parse(raw || 'null') as InterviewRecoveryEnvelope<T> | null;
      return parsed
        && parsed.schemaVersion === 2
        && ['mcq', 'coding', 'system-design'].includes(parsed.kind)
        && typeof parsed.userId === 'string'
        && typeof parsed.sessionId === 'string'
        && Number.isFinite(parsed.createdAt)
        && Number.isFinite(parsed.updatedAt)
        && Number.isFinite(parsed.expiresAt)
        && parsed.expiresAt > now
        && Object.prototype.hasOwnProperty.call(parsed, 'payload')
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  private clearOtherUserRecords(activeUserId: string): void {
    if (!this.isBrowser) return;
    const activePrefix = `${PREFIX}${activeUserId}:`;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX) && !key.startsWith(activePrefix)) this.removeKey(key);
    }
  }

  private legacyKey(kind: InterviewRecoveryKind, sessionId: string): string {
    const index = kind === 'mcq' ? 0 : kind === 'coding' ? 1 : 2;
    return `${LEGACY_PREFIXES[index]}${sessionId}`;
  }

  private removeKey(key: string): void {
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable; recovery must never block auth/session UI.
    }
  }

  private safeIdentity(value: string): string {
    return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  }
}
