import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { PracticeProgressService } from './practice-progress.service';

const PRACTICE_PROGRESS_KEY = 'fa:practice:progress:v3:guest';
const PRACTICE_SESSION_PREFIX = 'fa:practice:session:v3:guest:';
const LEGACY_INCIDENT_PROGRESS_KEY = 'fa:incidents:progress:v1';
const LEGACY_INCIDENT_SESSION_KEY = 'fa:incidents:session:v1:incident-1';

describe('PracticeProgressService', () => {
  let authUser: ReturnType<typeof signal<any>>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    authUser = signal<any>(null);
  });

  afterEach(() => {
    localStorage.removeItem(PRACTICE_PROGRESS_KEY);
    localStorage.removeItem('fa:practice:progress:v3:user:user-1');
    localStorage.removeItem(`${PRACTICE_SESSION_PREFIX}incident:incident-1`);
    localStorage.removeItem(`${PRACTICE_SESSION_PREFIX}code-review:review-1`);
    localStorage.removeItem('fa:practice:session:v3:user:user-1:incident:incident-1');
    localStorage.removeItem('fa:practice:progress:v2');
    localStorage.removeItem('fa:practice:session:v2:incident:incident-1');
    localStorage.removeItem(LEGACY_INCIDENT_PROGRESS_KEY);
    localStorage.removeItem(LEGACY_INCIDENT_SESSION_KEY);
    httpMock?.verify();
    TestBed.resetTestingModule();
  });

  it('migrates legacy incident progress and session state into the shared core store', () => {
    localStorage.setItem(LEGACY_INCIDENT_PROGRESS_KEY, JSON.stringify({
      'incident-1': {
        started: true,
        completed: true,
        passed: true,
        bestScore: 84,
        lastPlayedAt: '2026-03-19T12:00:00.000Z',
        reflectionNote: 'Guard against stale responses.',
      },
    }));
    localStorage.setItem(LEGACY_INCIDENT_SESSION_KEY, JSON.stringify({
      activeStepIndex: 2,
      answers: { root: 'latest-response-race' },
      submittedStageIds: ['root'],
    }));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PracticeProgressService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    const service = TestBed.inject(PracticeProgressService);
    TestBed.flushEffects();
    const record = service.getRecord('incident', 'incident-1');
    const session = service.loadSession<{ activeStepIndex: number }>('incident', 'incident-1');

    expect(record.started).toBeTrue();
    expect(record.passed).toBeTrue();
    expect(record.bestScore).toBe(84);
    expect(record.extension?.['reflectionNote']).toBe('Guard against stale responses.');
    expect(session?.activeStepIndex).toBe(2);
    expect(localStorage.getItem(LEGACY_INCIDENT_PROGRESS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_INCIDENT_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(PRACTICE_PROGRESS_KEY)).toContain('incident:incident-1');
  });

  it('persists extension blobs for non-incident families', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PracticeProgressService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    const service = TestBed.inject(PracticeProgressService);
    TestBed.flushEffects();
    const updated = service.updateRecord('code-review', 'review-1', (current) => ({
      ...current,
      started: true,
      completed: true,
      bestScore: 91,
      extension: {
        draft: 'Flag render-side effects before approving.',
      },
    }));

    const restored = TestBed.runInInjectionContext(() => new PracticeProgressService());
    const record = restored.getRecord('code-review', 'review-1');

    expect(updated.bestScore).toBe(91);
    expect(record.started).toBeTrue();
    expect(record.extension?.['draft']).toBe('Flag render-side effects before approving.');
  });

  it('keeps guest progress scoped locally and migrates old shared keys into the guest bucket only', () => {
    localStorage.setItem('fa:practice:progress:v2', JSON.stringify({
      'incident:incident-1': {
        family: 'incident',
        id: 'incident-1',
        started: true,
        completed: true,
        passed: true,
        bestScore: 88,
        lastPlayedAt: '2026-03-20T10:00:00.000Z',
        extension: { reflectionNote: 'Watch the async boundary.' },
      },
    }));
    const existingUserScopedProgress = localStorage.getItem('fa:practice:progress:v3:user:user-1');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PracticeProgressService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    const service = TestBed.inject(PracticeProgressService);
    TestBed.flushEffects();
    const record = service.getRecord('incident', 'incident-1');

    expect(record.passed).toBeTrue();
    expect(record.bestScore).toBe(88);
    expect(localStorage.getItem(PRACTICE_PROGRESS_KEY)).toContain('incident:incident-1');
    expect(localStorage.getItem('fa:practice:progress:v3:user:user-1')).toBe(existingUserScopedProgress);
  });

  it('hydrates signed-in practice progress from the backend and syncs later updates back', () => {
    authUser.set({
      _id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      prefs: { tz: 'Europe/Istanbul', theme: 'dark', defaultTech: 'javascript', keyboard: 'default', marketingEmails: false },
      createdAt: new Date().toISOString(),
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PracticeProgressService,
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    const service = TestBed.inject(PracticeProgressService);
    TestBed.flushEffects();
    const loadReq = httpMock.expectOne('/api/practice-progress');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({
      records: [
        {
          family: 'incident',
          itemId: 'incident-1',
          started: true,
          completed: true,
          passed: true,
          bestScore: 77,
          lastPlayedAt: '2026-03-20T10:00:00.000Z',
          extension: { reflectionNote: 'Server-side note.' },
        },
        {
          family: 'tradeoff-battle',
          itemId: 'context-vs-zustand-vs-redux',
          started: true,
          completed: true,
          passed: false,
          bestScore: 0,
          lastPlayedAt: '2026-03-20T10:05:00.000Z',
          extension: { selectedOptionId: 'redux-toolkit' },
        },
      ],
    });

    expect(service.getRecord('incident', 'incident-1').bestScore).toBe(77);
    expect(service.getRecord('tradeoff-battle', 'context-vs-zustand-vs-redux').completed).toBeTrue();

    service.updateRecord('incident', 'incident-1', (current) => ({
      ...current,
      completed: true,
      passed: true,
      bestScore: 84,
      lastPlayedAt: '2026-03-20T11:00:00.000Z',
      extension: { reflectionNote: 'Merged note.' },
    }));

    const saveReq = httpMock.expectOne('/api/practice-progress/incident/incident-1');
    expect(saveReq.request.method).toBe('PUT');
    saveReq.flush({
      record: {
        family: 'incident',
        itemId: 'incident-1',
        started: true,
        completed: true,
        passed: true,
        bestScore: 84,
        lastPlayedAt: '2026-03-20T11:00:00.000Z',
        extension: { reflectionNote: 'Merged note.' },
      },
    });

    const stored = localStorage.getItem('fa:practice:progress:v3:user:user-1') || '';
    expect(stored).toContain('incident:incident-1');
    expect(service.getRecord('incident', 'incident-1').bestScore).toBe(84);
  });
});
