import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  InjectionToken,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
} from '@angular/core';
import type {
  ErrorEvent as SentryErrorEvent,
  Event as SentryEvent,
  EventHint as SentryEventHint,
  Stacktrace as SentryStacktrace,
} from '@sentry/browser';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';
import type { DecisionSessionQualificationMethod } from './analytics.service';
import { AuthService } from './auth.service';
import { getApiBase, getDeploymentEnvironment } from '../utils/api-base';
import { isMarketingPath } from '../utils/marketing-route.util';
import { isTrackedMonacoWorker } from '../utils/monaco-worker-tracker';

type SentryModule = typeof import('@sentry/browser');
type SentryBrowserClient = Pick<SentryModule, 'browserTracingIntegration' | 'init' | 'setUser'>;

export const SENTRY_BROWSER_LOADER = new InjectionToken<() => Promise<SentryBrowserClient>>(
  'SENTRY_BROWSER_LOADER',
  {
    providedIn: 'root',
    factory: () => () => import('@sentry/browser'),
  },
);

const SENTRY_ANONYMOUS_ID_KEY = 'fa:sentry:anonymous-id';
const BROWSER_API_ERRORS_MECHANISM_PREFIX = 'auto.browser.browserapierrors';
const INTERVIEW_ERROR_MESSAGE = 'Interview operation failed';
const INTERVIEW_SENTRY_SCOPE_TAG = 'interview';
const INTERVIEW_PAGE_ROUTE_PATTERN = /^\/interview(?:\/|[?#]|$)/i;
const INTERVIEW_REFERENCE_PATTERN = /\/(?:api\/interviews|interview)(?=\/|[?#\s"'`)]|$)/i;
const INTERVIEW_API_SESSION_PATTERN = /(\/api\/interviews\/)(?!(?:config|availability|active)(?=\/|[?#\s"'`)]|$))([^/?#\s"'`]+)/gi;
const INTERVIEW_MCQ_QUESTION_PATTERN = /(\/api\/interviews\/:sessionId\/mcq\/)([^/?#\s"'`]+)/gi;
const INTERVIEW_PAGE_SESSION_PATTERN = /(\/interview\/)([^/?#\s"'`]+)/gi;
const INTERVIEW_URL_QUERY_PATTERN = /((?:\/api\/interviews|\/interview)(?:\/[^?#\s"'`]*)?)[?#][^\s"'`]*/gi;
const DECISION_SESSION_FOREGROUND_MS = 15_000;
const DECISION_SESSION_INTERACTION_EVENTS: Array<keyof DocumentEventMap> = [
  'pointerdown',
  'keydown',
  'touchstart',
];

export function filterExpectedMonacoWorkerError(
  event: SentryErrorEvent,
  hint: SentryEventHint,
): SentryErrorEvent | null {
  // Monaco rethrows this opaque Event after its recoverable main-thread fallback.
  const originalException = hint.originalException;
  if (typeof Event === 'undefined' || !(originalException instanceof Event)) return event;
  if (originalException.type !== 'error') return event;

  const errorEvent = originalException as Event & {
    message?: unknown;
    filename?: unknown;
    error?: unknown;
  };
  if (
    isNonEmptyString(errorEvent.message)
    || isNonEmptyString(errorEvent.filename)
    || errorEvent.error != null
  ) {
    return event;
  }

  if (
    !isTrackedMonacoWorker(originalException.target)
    && !isTrackedMonacoWorker(originalException.currentTarget)
  ) {
    return event;
  }

  const isBrowserApiError = event.exception?.values?.some((exception) =>
    exception.mechanism?.type?.startsWith(BROWSER_API_ERRORS_MECHANISM_PREFIX),
  ) ?? false;

  return isBrowserApiError ? null : event;
}

/**
 * Applies the existing Monaco suppression first, then removes Interview data
 * which must never leave the browser. Non-Interview events are returned by
 * reference so their established Sentry behaviour remains unchanged.
 */
export function filterAndSanitizeSentryEvent(
  event: SentryErrorEvent,
  hint: SentryEventHint,
  interviewRouteActive = false,
): SentryErrorEvent | null {
  const filteredEvent = filterExpectedMonacoWorkerError(event, hint);
  return filteredEvent
    ? sanitizeInterviewSentryEvent(filteredEvent, interviewRouteActive)
    : null;
}

export function sanitizeInterviewSentryEvent(
  event: SentryErrorEvent,
  interviewRouteActive = false,
): SentryErrorEvent {
  return sanitizeInterviewEvent(event, interviewRouteActive);
}

type SentryTransactionEvent = SentryEvent & { type: 'transaction' };

export function sanitizeInterviewSentryTransaction(
  event: SentryTransactionEvent,
  interviewRouteActive = false,
): SentryTransactionEvent {
  return sanitizeInterviewEvent(event, interviewRouteActive);
}

function sanitizeInterviewEvent<T extends SentryEvent>(
  event: T,
  interviewRouteActive: boolean,
): T {
  if (!interviewRouteActive && !isInterviewEvent(event)) return event;

  return {
    event_id: event.event_id,
    type: event.type,
    timestamp: event.timestamp,
    start_timestamp: event.start_timestamp,
    level: event.level,
    platform: event.platform,
    release: event.release,
    dist: event.dist,
    environment: event.environment,
    message: event.message ? INTERVIEW_ERROR_MESSAGE : undefined,
    logentry: event.logentry ? { message: INTERVIEW_ERROR_MESSAGE } : undefined,
    request: sanitizeInterviewRequest(event.request),
    transaction: normalizeInterviewReferences(event.transaction),
    exception: sanitizeInterviewExceptions(event.exception),
    threads: sanitizeInterviewThreads(event.threads),
    spans: sanitizeInterviewSpans(event.spans),
    contexts: sanitizeInterviewTraceContext(event.contexts),
    tags: { feature: INTERVIEW_SENTRY_SCOPE_TAG },
    transaction_info: event.transaction_info
      ? { source: event.transaction_info.source }
      : undefined,
  } as unknown as T;
}

function isInterviewEvent(event: SentryEvent): boolean {
  const candidates: unknown[] = [
    event.message,
    event.logentry?.message,
    event.request?.url,
    event.transaction,
    ...((event.spans ?? []).flatMap((span) => [
      span.description,
      ...Object.values(span.data ?? {}),
    ])),
    ...((event.breadcrumbs ?? []).flatMap((breadcrumb) => [
      breadcrumb.message,
      ...Object.values(breadcrumb.data ?? {}),
    ])),
  ];

  event.exception?.values?.forEach((exception) => {
    candidates.push(exception.value);
    exception.stacktrace?.frames?.forEach((frame) => {
      candidates.push(
        frame.filename,
        frame.abs_path,
        frame.context_line,
        ...(frame.pre_context ?? []),
        ...(frame.post_context ?? []),
      );
    });
  });

  return candidates.some((candidate) =>
    typeof candidate === 'string' && INTERVIEW_REFERENCE_PATTERN.test(candidate),
  );
}

function sanitizeInterviewRequest(request: SentryEvent['request']): SentryEvent['request'] {
  if (!request) return undefined;

  return {
    url: normalizeInterviewReferences(request.url),
    method: request.method,
  };
}

function sanitizeInterviewExceptions(
  exception: SentryEvent['exception'],
): SentryEvent['exception'] {
  if (!exception) return undefined;

  return {
    values: exception.values?.map((value) => ({
      type: value.type ? 'InterviewError' : undefined,
      value: value.value ? INTERVIEW_ERROR_MESSAGE : undefined,
      thread_id: value.thread_id,
      mechanism: value.mechanism ? {
        type: value.mechanism.type,
        handled: value.mechanism.handled,
        synthetic: value.mechanism.synthetic,
        is_exception_group: value.mechanism.is_exception_group,
        exception_id: value.mechanism.exception_id,
        parent_id: value.mechanism.parent_id,
      } : undefined,
      stacktrace: sanitizeInterviewStacktrace(value.stacktrace),
    })),
  };
}

function sanitizeInterviewThreads(threads: SentryEvent['threads']): SentryEvent['threads'] {
  if (!threads) return undefined;

  return {
    values: threads.values?.map((thread) => ({
      id: thread.id,
      main: thread.main,
      crashed: thread.crashed,
      current: thread.current,
      stacktrace: sanitizeInterviewStacktrace(thread.stacktrace),
    })),
  };
}

function sanitizeInterviewStacktrace(
  stacktrace: SentryStacktrace | undefined,
): SentryStacktrace | undefined {
  if (!stacktrace) return undefined;

  return {
    frames_omitted: stacktrace.frames_omitted,
    frames: stacktrace.frames?.map((frame) => ({
      filename: sanitizeStackFrameUrl(frame.filename),
      abs_path: sanitizeStackFrameUrl(frame.abs_path),
      platform: frame.platform,
      lineno: frame.lineno,
      colno: frame.colno,
      in_app: frame.in_app,
      instruction_addr: frame.instruction_addr,
      addr_mode: frame.addr_mode,
      debug_id: frame.debug_id,
    })),
  };
}

function sanitizeInterviewSpans(spans: SentryEvent['spans']): SentryEvent['spans'] {
  return spans?.map((span) => ({
    data: {},
    description: hasInterviewReference(span.description)
      ? normalizeInterviewReferences(span.description)
      : undefined,
    op: span.op,
    parent_span_id: span.parent_span_id,
    span_id: span.span_id,
    start_timestamp: span.start_timestamp,
    status: span.status,
    timestamp: span.timestamp,
    trace_id: span.trace_id,
  }));
}

function sanitizeInterviewTraceContext(
  contexts: SentryEvent['contexts'],
): SentryEvent['contexts'] {
  const trace = contexts?.trace;
  if (!trace) return undefined;

  return {
    trace: {
      trace_id: trace.trace_id,
      span_id: trace.span_id,
      parent_span_id: trace.parent_span_id,
      status: trace.status,
      origin: trace.origin,
    },
  };
}

function hasInterviewReference(value: unknown): value is string {
  return typeof value === 'string' && INTERVIEW_REFERENCE_PATTERN.test(value);
}

function normalizeInterviewReferences(value: string | undefined): string | undefined {
  if (!value) return value;

  return value
    .replace(INTERVIEW_API_SESSION_PATTERN, '$1:sessionId')
    .replace(INTERVIEW_MCQ_QUESTION_PATTERN, '$1:questionId')
    .replace(INTERVIEW_PAGE_SESSION_PATTERN, '$1:sessionId')
    .replace(INTERVIEW_URL_QUERY_PATTERN, '$1');
}

function sanitizeStackFrameUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  return normalizeInterviewReferences(value)?.replace(/[?#].*$/, '');
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

@Injectable({ providedIn: 'root' })
export class TelemetryBootstrapService implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly sentryLoader = inject(SENTRY_BROWSER_LOADER);
  private interactionCleanup: (() => void) | null = null;
  private inMemoryAnonymousId: string | null = null;
  private sentry: SentryBrowserClient | null = null;
  private sentryInitPromise: Promise<void> | null = null;
  private analyticsInitScheduled = false;
  private interviewRouteActive = false;
  private qualificationCleanup: (() => void) | null = null;
  private qualificationTimer: number | null = null;
  private qualificationVisibleStartedAt: number | null = null;
  private qualificationForegroundElapsedMs = 0;
  private qualificationCompleted = false;

  constructor() {
    effect(() => {
      this.applySentryUser(this.auth.user()?._id ?? null);
    });
  }

  armForUrl(url: string): void {
    if (!this.isBrowser) return;

    this.interviewRouteActive = INTERVIEW_PAGE_ROUTE_PATTERN.test(url);
    this.armDecisionSessionQualification();

    if (isMarketingPath(url)) {
      this.scheduleAnalyticsInitialization();
      this.armOnFirstInteraction();
      return;
    }

    this.disarmOnFirstInteraction();
    this.scheduleAnalyticsInitialization();
    void this.ensureSentryInitialized();
  }

  ngOnDestroy(): void {
    this.disarmOnFirstInteraction();
    this.disarmDecisionSessionQualification();
  }

  private readonly onDecisionSessionInteraction = (event: Event): void => {
    if (this.qualificationCompleted || !this.isDocumentVisible()) return;
    if (!event.isTrusted || !this.hasStickyUserActivation()) return;

    this.qualifyDecisionSession('trusted_interaction');
  };

  private readonly onDecisionSessionVisibilityChange = (): void => {
    if (this.qualificationCompleted) return;

    if (this.isDocumentVisible()) {
      this.startQualificationForegroundTimer();
    } else {
      this.pauseQualificationForegroundTimer();
    }
  };

  private armDecisionSessionQualification(): void {
    if (this.qualificationCompleted || this.qualificationCleanup) return;

    this.zone.runOutsideAngular(() => {
      DECISION_SESSION_INTERACTION_EVENTS.forEach((eventName) => {
        this.document.addEventListener(eventName, this.onDecisionSessionInteraction, {
          passive: true,
          capture: true,
        });
      });
      this.document.addEventListener(
        'visibilitychange',
        this.onDecisionSessionVisibilityChange,
        true,
      );

      this.qualificationCleanup = () => {
        DECISION_SESSION_INTERACTION_EVENTS.forEach((eventName) => {
          this.document.removeEventListener(eventName, this.onDecisionSessionInteraction, true);
        });
        this.document.removeEventListener(
          'visibilitychange',
          this.onDecisionSessionVisibilityChange,
          true,
        );
        if (this.qualificationTimer !== null) {
          window.clearTimeout(this.qualificationTimer);
          this.qualificationTimer = null;
        }
        this.qualificationVisibleStartedAt = null;
        this.qualificationCleanup = null;
      };

      this.startQualificationForegroundTimer();
    });
  }

  private startQualificationForegroundTimer(): void {
    if (
      this.qualificationCompleted
      || !this.qualificationCleanup
      || !this.isDocumentVisible()
      || this.qualificationVisibleStartedAt !== null
    ) {
      return;
    }

    const remainingMs = DECISION_SESSION_FOREGROUND_MS - this.qualificationForegroundElapsedMs;
    if (remainingMs <= 0) {
      this.qualifyDecisionSession('foreground_15s');
      return;
    }

    this.qualificationVisibleStartedAt = Date.now();
    this.qualificationTimer = window.setTimeout(() => {
      this.qualificationTimer = null;
      if (this.qualificationCompleted) return;

      if (!this.isDocumentVisible()) {
        // visibilitychange normally pauses the timer. If it was missed, do not
        // count an unknown hidden interval toward qualification.
        this.qualificationVisibleStartedAt = null;
        return;
      }

      this.recordVisibleForegroundTime();
      if (this.qualificationForegroundElapsedMs >= DECISION_SESSION_FOREGROUND_MS) {
        this.qualifyDecisionSession('foreground_15s');
      } else {
        this.startQualificationForegroundTimer();
      }
    }, remainingMs);
  }

  private pauseQualificationForegroundTimer(): void {
    this.recordVisibleForegroundTime();
    if (this.qualificationTimer !== null) {
      window.clearTimeout(this.qualificationTimer);
      this.qualificationTimer = null;
    }
  }

  private recordVisibleForegroundTime(): void {
    if (this.qualificationVisibleStartedAt === null) return;

    this.qualificationForegroundElapsedMs = Math.min(
      DECISION_SESSION_FOREGROUND_MS,
      this.qualificationForegroundElapsedMs
        + Math.max(0, Date.now() - this.qualificationVisibleStartedAt),
    );
    this.qualificationVisibleStartedAt = null;
  }

  private qualifyDecisionSession(method: DecisionSessionQualificationMethod): void {
    if (this.qualificationCompleted || !this.isDocumentVisible()) return;
    this.qualificationCompleted = true;

    try {
      // Capture-phase interaction handling queues the event before a click can
      // navigate away, while analytics failures remain best-effort only.
      this.analytics.ensureInitialized();
      this.analytics.trackDecisionSessionQualified(method);
    } catch {
      // Telemetry must never prevent the user's interaction or navigation.
    } finally {
      this.disarmDecisionSessionQualification();
    }
  }

  private disarmDecisionSessionQualification(): void {
    this.qualificationCleanup?.();
  }

  private isDocumentVisible(): boolean {
    return this.document.visibilityState === 'visible';
  }

  private hasStickyUserActivation(): boolean {
    const navigatorRef = this.document.defaultView?.navigator as Navigator & {
      userActivation?: { hasBeenActive?: boolean };
    };
    const hasBeenActive = navigatorRef?.userActivation?.hasBeenActive;
    return typeof hasBeenActive !== 'boolean' || hasBeenActive;
  }

  private armOnFirstInteraction(): void {
    if (this.interactionCleanup) return;
    if (this.analytics.isInitialized() && this.sentryInitPromise) return;

    this.zone.runOutsideAngular(() => {
      const activate = () => {
        this.disarmOnFirstInteraction();
        this.scheduleAnalyticsInitialization();
        void this.ensureSentryInitialized();
      };

      const listeners: Array<keyof DocumentEventMap> = ['pointerdown', 'keydown', 'touchstart'];
      listeners.forEach((eventName) => {
        this.document.addEventListener(eventName, activate, {
          once: true,
          passive: true,
          capture: true,
        });
      });

      this.interactionCleanup = () => {
        listeners.forEach((eventName) => {
          this.document.removeEventListener(eventName, activate, true);
        });
        this.interactionCleanup = null;
      };
    });
  }

  private disarmOnFirstInteraction(): void {
    this.interactionCleanup?.();
  }

  private scheduleAnalyticsInitialization(): void {
    if (!this.isBrowser || this.analytics.isInitialized() || this.analyticsInitScheduled) return;

    this.analyticsInitScheduled = true;
    this.schedulePostLoad(() => {
      window.setTimeout(() => {
        this.analyticsInitScheduled = false;
        this.analytics.ensureInitialized();
      }, 1200);
    });
  }

  private ensureSentryInitialized(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (!environment.production || !environment.sentryDsn) return Promise.resolve();
    if (this.sentryInitPromise) return this.sentryInitPromise;

    this.sentryInitPromise = new Promise<void>((resolve) => {
      this.schedulePostLoad(() => {
        this.sentryLoader()
          .then((sentry) => {
            sentry.init({
              dsn: environment.sentryDsn,
              release: environment.sentryRelease || undefined,
              environment: getDeploymentEnvironment(),
              sendDefaultPii: false,
              integrations: [sentry.browserTracingIntegration()],
              tracePropagationTargets: [getApiBase(), /^\//],
              tracesSampleRate: environment.sentryTracesSampleRate,
              beforeSend: (event, hint) => filterAndSanitizeSentryEvent(
                event,
                hint,
                this.interviewRouteActive,
              ),
              beforeSendTransaction: (event) => sanitizeInterviewSentryTransaction(
                event,
                this.interviewRouteActive,
              ),
            });
            this.sentry = sentry;
            this.applySentryUser(this.auth.user()?._id ?? null);
          })
          .catch(() => {
            // Monitoring should never block app startup.
          })
          .finally(() => resolve());
      });
    });

    return this.sentryInitPromise;
  }

  private schedulePostLoad(task: () => void): void {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(task, { timeout: 6500 });
      return;
    }

    window.setTimeout(task, 2600);
  }

  private applySentryUser(authenticatedUserId: string | null): void {
    if (!this.isBrowser || !this.sentry) return;

    try {
      this.sentry.setUser({ id: authenticatedUserId || this.getAnonymousId() });
    } catch {
      // Monitoring should never affect the app experience.
    }
  }

  private getAnonymousId(): string {
    if (this.inMemoryAnonymousId) return this.inMemoryAnonymousId;

    const stored = this.readStoredAnonymousId();
    if (stored) {
      this.inMemoryAnonymousId = stored;
      return stored;
    }

    const next = `anon:${this.createAnonymousUuid()}`;
    this.inMemoryAnonymousId = next;
    this.writeStoredAnonymousId(next);
    return next;
  }

  private readStoredAnonymousId(): string | null {
    try {
      const stored = window.localStorage.getItem(SENTRY_ANONYMOUS_ID_KEY);
      return stored?.startsWith('anon:') ? stored : null;
    } catch {
      return null;
    }
  }

  private writeStoredAnonymousId(value: string): void {
    try {
      window.localStorage.setItem(SENTRY_ANONYMOUS_ID_KEY, value);
    } catch {
      // The in-memory fallback still identifies this page session.
    }
  }

  private createAnonymousUuid(): string {
    const cryptoRef = typeof crypto !== 'undefined' ? crypto : null;
    if (typeof cryptoRef?.randomUUID === 'function') {
      return cryptoRef.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (typeof cryptoRef?.getRandomValues === 'function') {
      cryptoRef.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }
}
