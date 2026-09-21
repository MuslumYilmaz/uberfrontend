import { DOCUMENT } from '@angular/common';
import { NgZone, signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { environment } from '../../../environments/environment';
import { AuthService, User } from './auth.service';
import { AnalyticsService } from './analytics.service';
import { createTrackedMonacoWorker } from '../utils/monaco-worker-tracker';
import {
  SENTRY_BROWSER_LOADER,
  TelemetryBootstrapService,
  filterAndSanitizeSentryEvent,
  filterExpectedMonacoWorkerError,
  sanitizeInterviewSentryEvent,
  sanitizeInterviewSentryTransaction,
} from './telemetry-bootstrap.service';
import type { ErrorEvent as SentryErrorEvent, Event as SentryEvent } from '@sentry/browser';

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
  let originalApiBaseOverride: unknown;
  let originalDeploymentConfig: unknown;

  beforeEach(() => {
    environment.production = true;
    environment.sentryDsn = 'https://public@example.com/1';
    environment.sentryRelease = 'test-release';
    environment.sentryTracesSampleRate = 1;
    localStorage.clear();
    originalApiBaseOverride = (window as any).__FA_API_BASE__;
    originalDeploymentConfig = (window as any).__FA_DEPLOYMENT_CONFIG__;
    delete (window as any).__FA_API_BASE__;
    delete (window as any).__FA_DEPLOYMENT_CONFIG__;

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
    if (originalApiBaseOverride === undefined) {
      delete (window as any).__FA_API_BASE__;
    } else {
      (window as any).__FA_API_BASE__ = originalApiBaseOverride;
    }
    if (originalDeploymentConfig === undefined) {
      delete (window as any).__FA_DEPLOYMENT_CONFIG__;
    } else {
      (window as any).__FA_DEPLOYMENT_CONFIG__ = originalDeploymentConfig;
    }
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

  it('wires privacy-safe Interview filters without enabling replay or default PII', async () => {
    (window as any).__FA_API_BASE__ = 'https://preview-api.example.test';
    (window as any).__FA_DEPLOYMENT_CONFIG__ = { environment: 'preview' };
    await initializeSentry();

    const options = sentry.init.calls.mostRecent().args[0];
    expect(options.beforeSend).toEqual(jasmine.any(Function));
    expect(options.beforeSendTransaction).toEqual(jasmine.any(Function));
    expect(options.sendDefaultPii).toBeFalse();
    expect(options.integrations).toEqual([{ name: 'browserTracing' }]);
    expect(options.tracePropagationTargets[0]).toBe('https://preview-api.example.test');
    expect(options.environment).toBe('preview');
  });

  it('sanitizes generic errors in the active Interview route and drops unknown root fields', async () => {
    const service = await initializeSentry('/interview/session-secret');
    const options = sentry.init.calls.mostRecent().args[0];
    const event = {
      type: undefined,
      event_id: 'safe-event-id',
      message: 'private-answer without a route reference',
      user: { id: 'user-secret' },
      extra: { code: 'const privateCode = true;' },
      contexts: { custom: { questionId: 'question-secret' } },
      breadcrumbs: [{ message: 'secret-token' }],
      private_root_field: {
        sessionId: 'session-secret',
        answer: 'private-answer',
      },
    } as SentryErrorEvent & { private_root_field: unknown };

    const sanitized = options.beforeSend(event, {}) as SentryErrorEvent;

    expect(sanitized.event_id).toBe('safe-event-id');
    expect(sanitized.message).toBe('Interview operation failed');
    expect(sanitized.tags).toEqual({ feature: 'interview' });
    expect((sanitized as unknown as Record<string, unknown>)['private_root_field'])
      .toBeUndefined();
    expectNoPrivateInterviewData(sanitized);

    service.armForUrl('/dashboard');
    const ordinaryEvent: SentryErrorEvent = {
      type: undefined,
      message: 'Ordinary browser failure',
    };
    expect(options.beforeSend(ordinaryEvent, {})).toBe(ordinaryEvent);
    service.ngOnDestroy();
  });

  it('redacts Interview page identifiers, payloads, user data, and error source context', () => {
    const event: SentryErrorEvent = {
      type: undefined,
      message: 'Failed to save secret-answer at /interview/session-secret/results?token=secret-token',
      logentry: {
        message: 'Question question-secret contained private-answer',
        params: ['private-answer'],
      },
      request: {
        url: 'https://frontendatlas.com/interview/session-secret/results?token=secret-token',
        method: 'PUT',
        data: { code: 'const privateCode = "private-answer";' },
        query_string: 'token=secret-token',
        cookies: { auth: 'private-cookie' },
        headers: { authorization: 'Bearer private-token' },
        env: { REMOTE_USER: 'user-secret' },
      },
      transaction: '/interview/session-secret/results?token=secret-token',
      user: { id: 'user-secret', email: 'private@example.com' },
      extra: { answer: 'private-answer', code: 'const privateCode = true;' },
      tags: { sessionId: 'session-secret' },
      fingerprint: ['question-secret'],
      breadcrumbs: [{
        message: 'Selected answer private-answer',
        data: { questionId: 'question-secret' },
      }],
      contexts: { interview: { draft: 'const privateCode = true;' } },
      exception: {
        values: [{
          type: 'PrivateAnswerError',
          value: 'private-answer from question-secret',
          mechanism: {
            type: 'onerror',
            handled: false,
            data: { target: 'session-secret' },
          },
          stacktrace: {
            frames: [{
              filename: 'https://frontendatlas.com/interview/session-secret/main.js?token=secret-token',
              abs_path: '/interview/session-secret/main.js?token=secret-token',
              function: 'privateSolution',
              context_line: 'const privateCode = "private-answer";',
              pre_context: ['// question-secret'],
              post_context: ['return privateCode;'],
              vars: { answer: 'private-answer' },
              lineno: 42,
              colno: 7,
              in_app: true,
            }],
          },
        }],
      },
    };

    const sanitized = sanitizeInterviewSentryEvent(event);

    expect(sanitized).not.toBe(event);
    expect(sanitized.request).toEqual({
      url: 'https://frontendatlas.com/interview/:sessionId/results',
      method: 'PUT',
    });
    expect(sanitized.transaction).toBe('/interview/:sessionId/results');
    expect(sanitized.message).toBe('Interview operation failed');
    expect(sanitized.logentry).toEqual({ message: 'Interview operation failed' });
    expect(sanitized.exception?.values?.[0].type).toBe('InterviewError');
    expect(sanitized.exception?.values?.[0].value).toBe('Interview operation failed');
    expect(sanitized.exception?.values?.[0].mechanism?.data).toBeUndefined();

    const frame = sanitized.exception?.values?.[0].stacktrace?.frames?.[0];
    expect(frame?.filename).toBe('https://frontendatlas.com/interview/:sessionId/main.js');
    expect(frame?.abs_path).toBe('/interview/:sessionId/main.js');
    expect(frame?.lineno).toBe(42);
    expect(frame?.function).toBeUndefined();
    expect(frame?.context_line).toBeUndefined();
    expect(frame?.pre_context).toBeUndefined();
    expect(frame?.post_context).toBeUndefined();
    expect(frame?.vars).toBeUndefined();
    expectNoPrivateInterviewData(sanitized);
  });

  it('normalizes API session and question identifiers and removes request secrets', () => {
    const event: SentryErrorEvent = {
      type: undefined,
      request: {
        url: 'https://api.frontendatlas.com/api/interviews/session-secret/mcq/question-secret?answer=private-answer#draft',
        method: 'PUT',
        data: { answer: 'private-answer' },
        query_string: { answer: 'private-answer' },
        headers: { authorization: 'Bearer private-token' },
      },
      exception: {
        values: [{
          type: 'Error',
          value: 'PUT /api/interviews/session-secret/mcq/question-secret failed',
        }],
      },
    };

    const sanitized = sanitizeInterviewSentryEvent(event);

    expect(sanitized.request).toEqual({
      url: 'https://api.frontendatlas.com/api/interviews/:sessionId/mcq/:questionId',
      method: 'PUT',
    });
    expectNoPrivateInterviewData(sanitized);
  });

  it('redacts Interview transactions, spans, and custom contexts while retaining trace linkage', () => {
    const transaction = {
      type: 'transaction' as const,
      transaction: 'PUT /api/interviews/session-secret/coding/draft?token=secret-token',
      request: {
        url: 'https://api.frontendatlas.com/api/interviews/session-secret/coding/draft?token=secret-token',
        method: 'PUT',
        data: { code: 'const privateCode = true;' },
      },
      user: { id: 'user-secret' },
      extra: { draft: 'const privateCode = true;' },
      breadcrumbs: [{ message: 'Saved question-secret with private-answer' }],
      contexts: {
        trace: {
          trace_id: 'trace-id',
          span_id: 'span-id',
          parent_span_id: 'parent-span-id',
          status: 'ok',
          op: 'navigation',
          data: { sessionId: 'session-secret' },
          tags: { questionId: 'question-secret' },
        },
        interview: { answer: 'private-answer' },
      },
      spans: [{
        data: {
          url: '/api/interviews/session-secret/coding/draft?token=secret-token',
          request_body: 'const privateCode = true;',
        },
        description: 'PUT /api/interviews/session-secret/coding/draft?token=secret-token',
        op: 'http.client',
        tags: { sessionId: 'session-secret' },
        private_custom_field: { questionId: 'question-secret' },
        profile_id: 'private-profile-id',
        links: [{
          trace_id: 'linked-trace-id',
          span_id: 'linked-span-id',
          attributes: { answer: 'private-answer' },
        }],
        measurements: { privateCode: { value: 1 } },
        span_id: 'child-span-id',
        start_timestamp: 1,
        trace_id: 'trace-id',
      }, {
        data: { questionId: 'question-secret' },
        description: 'compile const privateCode = true;',
        op: 'task',
        span_id: 'code-span-id',
        start_timestamp: 2,
        trace_id: 'trace-id',
      }],
    } as SentryEvent & { type: 'transaction' };

    const sanitized = sanitizeInterviewSentryTransaction(transaction);

    expect(sanitized.transaction)
      .toBe('PUT /api/interviews/:sessionId/coding/draft');
    expect(sanitized.request).toEqual({
      url: 'https://api.frontendatlas.com/api/interviews/:sessionId/coding/draft',
      method: 'PUT',
    });
    expect(sanitized.spans?.[0].description)
      .toBe('PUT /api/interviews/:sessionId/coding/draft');
    expect(sanitized.spans?.[0].data).toEqual({});
    const sanitizedSpanFields = sanitized.spans?.[0] as unknown as Record<string, unknown>;
    expect(sanitizedSpanFields['tags']).toBeUndefined();
    expect(sanitizedSpanFields['private_custom_field']).toBeUndefined();
    expect(sanitized.spans?.[0].profile_id).toBeUndefined();
    expect(sanitized.spans?.[0].links).toBeUndefined();
    expect(sanitized.spans?.[0].measurements).toBeUndefined();
    expect(sanitized.spans?.[1].description).toBeUndefined();
    expect(sanitized.spans?.[1].data).toEqual({});
    expect(sanitized.contexts?.trace).toEqual(jasmine.objectContaining({
      trace_id: 'trace-id',
      span_id: 'span-id',
      parent_span_id: 'parent-span-id',
      status: 'ok',
    }));
    expect(sanitized.contexts?.trace?.data).toBeUndefined();
    expect(sanitized.contexts?.trace?.tags).toBeUndefined();
    expect(sanitized.contexts?.['interview']).toBeUndefined();
    expectNoPrivateInterviewData(sanitized);
  });

  it('leaves non-Interview events unchanged', () => {
    const event: SentryErrorEvent = {
      type: undefined,
      message: 'Incident failed',
      request: {
        url: 'https://frontendatlas.com/incidents/render-loop?tab=timeline',
        method: 'GET',
      },
      user: { id: 'user-1' },
      extra: { incidentId: 'render-loop' },
    };

    expect(sanitizeInterviewSentryEvent(event)).toBe(event);
  });

  it('still drops an opaque tracked Monaco worker error through the composed filter', () => {
    const sentryEvent = browserApiErrorEvent();
    const originalException = workerErrorEvent(trackedMonacoWorker());

    expect(filterAndSanitizeSentryEvent(sentryEvent, { originalException })).toBeNull();
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

  it('registers qualification and first-interaction listeners outside Angular', () => {
    const service = TestBed.inject(TelemetryBootstrapService);
    const ngZone = TestBed.inject(NgZone);
    const originalAddEventListener = doc.addEventListener.bind(doc);
    const registrationZones: Array<{
      eventName: string;
      once: boolean;
      inAngularZone: boolean;
    }> = [];
    const trackedEvents = new Set(['pointerdown', 'keydown', 'touchstart', 'visibilitychange']);

    spyOn(doc, 'addEventListener').and.callFake((
      eventName: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (trackedEvents.has(eventName)) {
        registrationZones.push({
          eventName,
          once: typeof options === 'object' && options.once === true,
          inAngularZone: NgZone.isInAngularZone(),
        });
      }
      originalAddEventListener(eventName, listener, options);
    });

    ngZone.run(() => service.armForUrl('/'));

    expect(registrationZones).toEqual([
      { eventName: 'pointerdown', once: false, inAngularZone: false },
      { eventName: 'keydown', once: false, inAngularZone: false },
      { eventName: 'touchstart', once: false, inAngularZone: false },
      { eventName: 'visibilitychange', once: false, inAngularZone: false },
      { eventName: 'pointerdown', once: true, inAngularZone: false },
      { eventName: 'keydown', once: true, inAngularZone: false },
      { eventName: 'touchstart', once: true, inAngularZone: false },
    ]);
    service.ngOnDestroy();
  });

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

  function initializeSentry(url = '/dashboard'): Promise<TelemetryBootstrapService> {
    const service = TestBed.inject(TelemetryBootstrapService);
    service.armForUrl(url);
    return Promise.resolve().then(() => Promise.resolve()).then(() => {
      TestBed.flushEffects();
      return service;
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

  function expectNoPrivateInterviewData(event: SentryEvent): void {
    const serialized = JSON.stringify(event);
    [
      'session-secret',
      'question-secret',
      'private-answer',
      'privateCode',
      'secret-token',
      'private@example.com',
      'private-token',
      'private-cookie',
      'user-secret',
    ].forEach((privateValue) => {
      expect(serialized).withContext(privateValue).not.toContain(privateValue);
    });
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
