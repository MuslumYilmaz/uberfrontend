import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { environment } from '../../../environments/environment';
import { AuthService, User } from './auth.service';
import { AnalyticsService } from './analytics.service';
import { createTrackedMonacoWorker } from '../utils/monaco-worker-tracker';
import {
  SENTRY_BROWSER_LOADER,
  TelemetryBootstrapService,
  filterExpectedMonacoWorkerError,
} from './telemetry-bootstrap.service';
import type { ErrorEvent as SentryErrorEvent } from '@sentry/browser';

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
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let doc: Document;
  let originalRequestIdleCallback: unknown;
  let originalVisibilityStateDescriptor: PropertyDescriptor | undefined;
  let originalHiddenDescriptor: PropertyDescriptor | undefined;
  let originalUserActivationDescriptor: PropertyDescriptor | undefined;

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
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'ensureInitialized',
      'isInitialized',
      'trackDecisionSessionQualified',
    ]);
    analytics.isInitialized.and.returnValue(true);
    analytics.trackDecisionSessionQualified.and.returnValue(true);

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
          useValue: analytics,
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

    doc = TestBed.inject(DOCUMENT);
    originalVisibilityStateDescriptor = Object.getOwnPropertyDescriptor(doc, 'visibilityState');
    originalHiddenDescriptor = Object.getOwnPropertyDescriptor(doc, 'hidden');
    originalUserActivationDescriptor = Object.getOwnPropertyDescriptor(
      window.navigator,
      'userActivation',
    );
  });

  afterEach(() => {
    environment.production = originalEnvironment.production;
    environment.sentryDsn = originalEnvironment.sentryDsn;
    environment.sentryRelease = originalEnvironment.sentryRelease;
    environment.sentryTracesSampleRate = originalEnvironment.sentryTracesSampleRate;
    (window as any).requestIdleCallback = originalRequestIdleCallback;
    restoreOwnProperty(doc, 'visibilityState', originalVisibilityStateDescriptor);
    restoreOwnProperty(doc, 'hidden', originalHiddenDescriptor);
    restoreOwnProperty(window.navigator, 'userActivation', originalUserActivationDescriptor);
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

  it('wires the targeted Monaco worker filter into Sentry initialization', async () => {
    await initializeSentry();

    const options = sentry.init.calls.mostRecent().args[0];
    expect(options.beforeSend).toBe(filterExpectedMonacoWorkerError);
  });

  it('drops only opaque errors from a tracked Monaco worker captured by BrowserApiErrors', () => {
    const sentryEvent = browserApiErrorEvent();
    const originalException = workerErrorEvent(trackedMonacoWorker());

    expect(filterExpectedMonacoWorkerError(sentryEvent, { originalException })).toBeNull();
  });

  it('keeps opaque errors from untracked workers and other event targets', () => {
    const sentryEvent = browserApiErrorEvent();
    const untrackedWorker = new EventTarget();
    const domTarget = document.createElement('div');

    expect(filterExpectedMonacoWorkerError(
      sentryEvent,
      { originalException: workerErrorEvent(untrackedWorker) },
    )).toBe(sentryEvent);
    expect(filterExpectedMonacoWorkerError(
      sentryEvent,
      { originalException: workerErrorEvent(domTarget) },
    )).toBe(sentryEvent);
  });

  it('keeps meaningful ErrorEvent details from a tracked Monaco worker', () => {
    const sentryEvent = browserApiErrorEvent();
    const worker = trackedMonacoWorker();
    const meaningfulEvents = [
      new ErrorEvent('error', { message: 'Worker failed to load.' }),
      new ErrorEvent('error', { filename: '/assets/monaco/workerMain.js' }),
      new ErrorEvent('error', { error: new Error('Worker failed to load.') }),
    ];

    meaningfulEvents.forEach((originalException) => {
      setEventTarget(originalException, worker);
      expect(filterExpectedMonacoWorkerError(sentryEvent, { originalException })).toBe(sentryEvent);
    });
  });

  it('keeps tracked Monaco worker events not captured by BrowserApiErrors', () => {
    const sentryEvent = browserApiErrorEvent('onerror');
    const originalException = workerErrorEvent(trackedMonacoWorker());

    expect(filterExpectedMonacoWorkerError(sentryEvent, { originalException })).toBe(sentryEvent);
  });

  it('keeps ordinary errors and non-error events', () => {
    const sentryEvent = browserApiErrorEvent();
    const worker = trackedMonacoWorker();
    const messageEvent = new Event('message');
    setEventTarget(messageEvent, worker);

    expect(filterExpectedMonacoWorkerError(
      sentryEvent,
      { originalException: new Error('Application failure') },
    )).toBe(sentryEvent);
    expect(filterExpectedMonacoWorkerError(
      sentryEvent,
      { originalException: messageEvent },
    )).toBe(sentryEvent);
  });

  it('keeps events when the DOM Event constructor is unavailable', () => {
    const sentryEvent = browserApiErrorEvent();
    const eventDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Event');
    Object.defineProperty(globalThis, 'Event', { configurable: true, value: undefined });

    try {
      expect(filterExpectedMonacoWorkerError(
        sentryEvent,
        { originalException: { type: 'error' } },
      )).toBe(sentryEvent);
    } finally {
      if (eventDescriptor) Object.defineProperty(globalThis, 'Event', eventDescriptor);
      else delete (globalThis as { Event?: typeof Event }).Event;
    }
  });

  it('defers analytics initialization on app routes until the post-load delay', fakeAsync(() => {
    environment.production = false;
    analytics.isInitialized.and.returnValue(false);

    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/javascript/trivia/js-escape-vs-sanitize');

    expect(analytics.ensureInitialized).not.toHaveBeenCalled();
    tick(1199);
    expect(analytics.ensureInitialized).not.toHaveBeenCalled();
    tick(1);
    expect(analytics.ensureInitialized).toHaveBeenCalledTimes(1);
    service.ngOnDestroy();
  }));

  it('initializes analytics on marketing routes after the post-load delay', fakeAsync(() => {
    environment.production = false;
    analytics.isInitialized.and.returnValue(false);

    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/');

    expect(analytics.ensureInitialized).not.toHaveBeenCalled();
    tick(1199);
    expect(analytics.ensureInitialized).not.toHaveBeenCalled();
    tick(1);
    expect(analytics.ensureInitialized).toHaveBeenCalledTimes(1);
    service.ngOnDestroy();
  }));

  it('qualifies synchronously once from a trusted visible interaction with sticky activation', () => {
    environment.production = false;
    setDocumentVisibility('visible', false);
    setUserActivation(false);
    const callOrder: string[] = [];
    analytics.ensureInitialized.and.callFake(() => {
      callOrder.push('initialize');
    });
    analytics.trackDecisionSessionQualified.and.callFake(() => {
      callOrder.push('qualify');
      return true;
    });

    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/');

    doc.dispatchEvent(new Event('pointerdown'));
    invokeDecisionSessionInteraction(service, true);
    expect(analytics.trackDecisionSessionQualified).not.toHaveBeenCalled();

    setUserActivation(true);
    invokeDecisionSessionInteraction(service, true);
    invokeDecisionSessionInteraction(service, true);
    service.armForUrl('/pricing');

    expect(callOrder).toEqual(['initialize', 'qualify']);
    expect(analytics.trackDecisionSessionQualified)
      .toHaveBeenCalledOnceWith('trusted_interaction');
    service.ngOnDestroy();
  });

  it('accepts a trusted interaction when the User Activation API is unavailable', () => {
    environment.production = false;
    setDocumentVisibility('visible', false);
    setUserActivation(undefined);

    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/dashboard');
    invokeDecisionSessionInteraction(service, true);

    expect(analytics.trackDecisionSessionQualified)
      .toHaveBeenCalledOnceWith('trusted_interaction');
    service.ngOnDestroy();
  });

  it('counts 15 cumulative visible seconds and pauses while the document is hidden', fakeAsync(() => {
    environment.production = false;
    setDocumentVisibility('visible', false);
    setUserActivation(true);

    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl('/dashboard');

    tick(5_000);
    service.armForUrl('/pricing');
    tick(4_000);
    setDocumentVisibility('hidden');
    invokeDecisionSessionInteraction(service, true);
    tick(30_000);
    expect(analytics.trackDecisionSessionQualified).not.toHaveBeenCalled();

    setDocumentVisibility('visible');
    tick(5_999);
    expect(analytics.trackDecisionSessionQualified).not.toHaveBeenCalled();
    tick(1);

    expect(analytics.ensureInitialized).toHaveBeenCalledTimes(1);
    expect(analytics.trackDecisionSessionQualified)
      .toHaveBeenCalledOnceWith('foreground_15s');
    service.ngOnDestroy();
  }));

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

  function invokeDecisionSessionInteraction(
    service: TelemetryBootstrapService,
    isTrusted: boolean,
  ): void {
    const harness = service as unknown as {
      onDecisionSessionInteraction: (event: Event) => void;
    };
    harness.onDecisionSessionInteraction({ isTrusted } as Event);
  }

  function setDocumentVisibility(
    state: DocumentVisibilityState,
    emitChange = true,
  ): void {
    Object.defineProperty(doc, 'visibilityState', {
      configurable: true,
      get: () => state,
    });
    Object.defineProperty(doc, 'hidden', {
      configurable: true,
      get: () => state !== 'visible',
    });
    if (emitChange) doc.dispatchEvent(new Event('visibilitychange'));
  }

  function setUserActivation(hasBeenActive: boolean | undefined): void {
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      get: () => hasBeenActive === undefined ? undefined : { hasBeenActive },
    });
  }

  function restoreOwnProperty(
    target: object,
    key: PropertyKey,
    descriptor: PropertyDescriptor | undefined,
  ): void {
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    } else {
      delete (target as Record<PropertyKey, unknown>)[key];
    }
  }

  function browserApiErrorEvent(
    mechanismType = 'auto.browser.browserapierrors.<anonymous>',
  ): SentryErrorEvent {
    return {
      type: undefined,
      exception: {
        values: [{
          mechanism: {
            type: mechanismType,
            handled: false,
          },
        }],
      },
    };
  }

  function trackedMonacoWorker(): EventTarget {
    return createTrackedMonacoWorker(
      '/assets/monaco/min/vs/base/worker/workerMain.js',
      'css',
      () => new EventTarget() as Worker,
    ) as unknown as EventTarget;
  }

  function workerErrorEvent(target: EventTarget): Event {
    const event = new Event('error');
    setEventTarget(event, target);
    return event;
  }

  function setEventTarget(event: Event, target: EventTarget): void {
    Object.defineProperties(event, {
      target: { configurable: true, value: target },
      currentTarget: { configurable: true, value: target },
    });
  }
});
