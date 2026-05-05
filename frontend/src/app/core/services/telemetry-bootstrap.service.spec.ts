import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { environment } from '../../../environments/environment';
import { AuthService, User } from './auth.service';
import { AnalyticsService } from './analytics.service';
import { SENTRY_BROWSER_LOADER, TelemetryBootstrapService } from './telemetry-bootstrap.service';

const ANONYMOUS_ID_KEY = 'fa:sentry:anonymous-id';

describe('TelemetryBootstrapService', () => {
  const originalEnvironment = {
    production: environment.production,
    sentryDsn: environment.sentryDsn,
    sentryRelease: environment.sentryRelease,
    sentryTracesSampleRate: environment.sentryTracesSampleRate,
  };

  const sampleUser: User = {
    _id: 'user-1',
    username: 'test-user',
    email: 'test@example.com',
    role: 'user',
    accessTier: 'free',
    prefs: {
      tz: 'Europe/Istanbul',
      theme: 'dark',
      defaultTech: 'javascript',
      keyboard: 'default',
      marketingEmails: false,
    },
    solvedQuestionIds: [],
    createdAt: new Date().toISOString(),
  };

  let authUser: ReturnType<typeof signal<User | null>>;
  let sentry: {
    browserTracingIntegration: jasmine.Spy;
    init: jasmine.Spy;
    setUser: jasmine.Spy;
  };
  let originalRequestIdleCallback: unknown;

  beforeEach(() => {
    environment.production = true;
    environment.sentryDsn = 'https://public@example.com/1';
    environment.sentryRelease = 'test-release';
    environment.sentryTracesSampleRate = 1;
    localStorage.clear();

    authUser = signal<User | null>(null);
    sentry = {
      browserTracingIntegration: jasmine.createSpy('browserTracingIntegration').and.returnValue({ name: 'browserTracing' }),
      init: jasmine.createSpy('init'),
      setUser: jasmine.createSpy('setUser'),
    };

    originalRequestIdleCallback = (window as any).requestIdleCallback;
    (window as any).requestIdleCallback = (callback: () => void) => {
      callback();
      return 1;
    };

    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        TelemetryBootstrapService,
        {
          provide: AnalyticsService,
          useValue: {
            ensureInitialized: jasmine.createSpy('ensureInitialized'),
            isInitialized: jasmine.createSpy('isInitialized').and.returnValue(true),
          } satisfies Partial<AnalyticsService>,
        },
        {
          provide: AuthService,
          useValue: {
            user: authUser,
          } satisfies Partial<AuthService>,
        },
        {
          provide: SENTRY_BROWSER_LOADER,
          useValue: () => Promise.resolve(sentry),
        },
      ],
    });
  });

  afterEach(() => {
    environment.production = originalEnvironment.production;
    environment.sentryDsn = originalEnvironment.sentryDsn;
    environment.sentryRelease = originalEnvironment.sentryRelease;
    environment.sentryTracesSampleRate = originalEnvironment.sentryTracesSampleRate;
    (window as any).requestIdleCallback = originalRequestIdleCallback;
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('sets a persistent anonymous user for logged-out visitors', async () => {
    await initializeSentry();

    const payload = lastSentryUserPayload();
    expectOnlyUserId(payload);
    expect(payload.id).toMatch(/^anon:[0-9a-f-]{36}$/);
    expect(localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(payload.id);
  });

  it('reuses the stored anonymous user id', async () => {
    localStorage.setItem(ANONYMOUS_ID_KEY, 'anon:existing-id');

    await initializeSentry();

    expectOnlyUserId(lastSentryUserPayload(), 'anon:existing-id');
  });

  it('uses the authenticated user id when auth is already hydrated before init', async () => {
    authUser.set(sampleUser);

    await initializeSentry();

    expectOnlyUserId(lastSentryUserPayload(), 'user-1');
  });

  it('switches from anonymous id to authenticated id after login', async () => {
    await initializeSentry();
    const anonymousPayload = lastSentryUserPayload();
    expect(anonymousPayload.id).toMatch(/^anon:/);

    authUser.set(sampleUser);
    TestBed.flushEffects();

    expectOnlyUserId(lastSentryUserPayload(), 'user-1');
  });

  it('returns to anonymous id after logout', async () => {
    authUser.set(sampleUser);
    await initializeSentry();

    authUser.set(null);
    TestBed.flushEffects();

    const payload = lastSentryUserPayload();
    expectOnlyUserId(payload);
    expect(payload.id).toMatch(/^anon:/);
  });

  function initializeSentry(): Promise<void> {
    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/dashboard');
    return Promise.resolve().then(() => Promise.resolve()).then(() => {
      TestBed.flushEffects();
    });
  }

  function lastSentryUserPayload(): { id: string } {
    expect(sentry.setUser).toHaveBeenCalled();
    return sentry.setUser.calls.mostRecent().args[0] as { id: string };
  }

  function expectOnlyUserId(payload: { id: string }, expectedId?: string): void {
    expect(Object.keys(payload)).toEqual(['id']);
    if (expectedId) {
      expect(payload.id).toBe(expectedId);
    }
    expect((payload as any).email).toBeUndefined();
    expect((payload as any).username).toBeUndefined();
  }
});
