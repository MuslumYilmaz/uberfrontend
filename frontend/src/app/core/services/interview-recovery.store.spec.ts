import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InterviewRecoveryStore } from './interview-recovery.store';

describe('InterviewRecoveryStore', () => {
  let store: InterviewRecoveryStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [InterviewRecoveryStore] });
    store = TestBed.inject(InterviewRecoveryStore);
  });

  it('binds convenience reads and writes to the active user and clears on a user switch', () => {
    const store = TestBed.inject(InterviewRecoveryStore);
    store.setUserScope('user-a');

    expect(store.saveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-a',
      payload: { code: 'const owner = "a";' },
    })).toBeTrue();
    expect(store.readForCurrentUser<{ code: string }>('coding', 'session-a')?.payload.code)
      .toContain('owner');

    store.setUserScope('user-b');

    expect(store.read<{ code: string }>('coding', 'user-a', 'session-a')).toBeNull();
    expect(store.currentUserScope()).toBe('user-b');
  });

  it('fails closed when no authenticated user scope is available', () => {
    const store = TestBed.inject(InterviewRecoveryStore);

    expect(store.saveForCurrentUser({
      kind: 'mcq',
      sessionId: 'session-a',
      payload: { pending: true },
    })).toBeFalse();
    expect(store.readForCurrentUser('mcq', 'session-a')).toBeNull();
  });

  afterEach(() => localStorage.clear());

  it('stores user/session scoped recovery with version/hash metadata', () => {
    expect(store.save({
      kind: 'coding',
      userId: 'user-1',
      sessionId: 'session-1',
      serverVersion: 7,
      baseHash: 'base-hash',
      payload: { files: [{ path: 'app.ts', content: 'const value = 1;' }] },
    })).toBeTrue();

    const recovered = store.read<{ files: unknown[] }>('coding', 'user-1', 'session-1');
    expect(recovered).toEqual(jasmine.objectContaining({
      schemaVersion: 2,
      kind: 'coding',
      userId: 'user-1',
      sessionId: 'session-1',
      serverVersion: 7,
      baseHash: 'base-hash',
    }));
    expect(recovered?.payload.files).toHaveSize(1);
    expect(store.read('coding', 'user-2', 'session-1')).toBeNull();
  });

  it('expires MCQ recovery at its two-hour boundary', fakeAsync(() => {
    store.save({ kind: 'mcq', userId: 'user-1', sessionId: 'session-1', payload: { answer: 'a' } });
    tick((2 * 60 * 60 * 1_000) - 1);
    expect(store.read('mcq', 'user-1', 'session-1')).not.toBeNull();
    tick(1);
    expect(store.read('mcq', 'user-1', 'session-1')).toBeNull();
  }));

  it('expires coding and system-design recovery at the 24-hour boundary', fakeAsync(() => {
    store.save({ kind: 'coding', userId: 'user-1', sessionId: 'coding-1', payload: 'code' });
    store.save({
      kind: 'system-design',
      userId: 'user-1',
      sessionId: 'design-1',
      payload: 'design',
    });
    tick((24 * 60 * 60 * 1_000) - 1);
    expect(store.read('coding', 'user-1', 'coding-1')).not.toBeNull();
    expect(store.read('system-design', 'user-1', 'design-1')).not.toBeNull();
    tick(1);
    expect(store.read('coding', 'user-1', 'coding-1')).toBeNull();
    expect(store.read('system-design', 'user-1', 'design-1')).toBeNull();
  }));

  it('migrates a validated owned-session legacy record once and removes the unscoped key', () => {
    store.setUserScope('user-1');
    const legacyKey = 'fa:interview:coding-draft:v1:session-1';
    localStorage.setItem(legacyKey, JSON.stringify({
      sessionId: 'session-1',
      code: 'const recovered = true;',
    }));

    const migrated = store.readOrMigrateLegacyForCurrentUser<{
      sessionId: string;
      code: string;
    }>({
      kind: 'coding',
      sessionId: 'session-1',
      ownershipConfirmed: true,
      serverVersion: 9,
      baseHash: 'server-hash',
      normalize: (value) => {
        const row = value as { sessionId?: unknown; code?: unknown };
        return row?.sessionId === 'session-1' && typeof row.code === 'string'
          ? { sessionId: row.sessionId, code: row.code }
          : null;
      },
    });

    expect(migrated?.envelope).toEqual(jasmine.objectContaining({
      userId: 'user-1',
      sessionId: 'session-1',
      serverVersion: 9,
      baseHash: 'server-hash',
    }));
    expect(migrated?.envelope.payload.code).toContain('recovered');
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it('does not migrate or delete a legacy record without an authenticated user scope', () => {
    const legacyKey = 'fa:interview:mcq-timing:v1:session-1';
    localStorage.setItem(legacyKey, JSON.stringify({ sessionId: 'session-1' }));

    expect(store.readOrMigrateLegacyForCurrentUser({
      kind: 'mcq',
      sessionId: 'session-1',
      ownershipConfirmed: true,
      normalize: () => ({ sessionId: 'session-1' }),
    })).toBeNull();
    expect(localStorage.getItem(legacyKey)).not.toBeNull();
  });

  it('rejects a stale compare-and-swap write after another tab changes the revision', () => {
    store.setUserScope('user-1');
    const first = store.compareAndSaveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-1',
      payload: { code: 'first' },
    }, null);
    expect(first.saved).toBeTrue();

    expect(store.saveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-1',
      payload: { code: 'other-tab' },
    })).toBeTrue();
    const stale = store.compareAndSaveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-1',
      payload: { code: 'stale-tab' },
    }, first.revision);

    expect(stale).toEqual(jasmine.objectContaining({ saved: false, conflict: true }));
    expect(store.readForCurrentUser<{ code: string }>('coding', 'session-1')?.payload.code)
      .toBe('other-tab');
  });

  it('purges malformed and expired records without touching unrelated storage', () => {
    localStorage.setItem('fa:interview:recovery:v2:broken', '{');
    localStorage.setItem('fa:unrelated', 'keep');
    store.purgeExpired();
    expect(localStorage.getItem('fa:interview:recovery:v2:broken')).toBeNull();
    expect(localStorage.getItem('fa:unrelated')).toBe('keep');
  });

  it('clears V2 and legacy records on session terminal or logout cleanup', () => {
    store.save({ kind: 'coding', userId: 'user-1', sessionId: 'session-1', payload: 'code' });
    store.save({ kind: 'system-design', userId: 'user-1', sessionId: 'session-2', payload: 'design' });
    localStorage.setItem('fa:interview:mcq-timing:v1:session-1', '{}');
    store.clearSession('session-1');
    expect(store.read('coding', 'user-1', 'session-1')).toBeNull();
    expect(store.read('system-design', 'user-1', 'session-2')).not.toBeNull();
    expect(localStorage.getItem('fa:interview:mcq-timing:v1:session-1')).toBeNull();

    store.clearAll();
    expect(store.read('system-design', 'user-1', 'session-2')).toBeNull();
  });

  it('does not claim persistence when localStorage rejects writes', () => {
    spyOn(localStorage, 'setItem').and.throwError('blocked');
    expect(store.save({
      kind: 'coding',
      userId: 'user-1',
      sessionId: 'session-1',
      payload: 'code',
    })).toBeFalse();
  });
});
