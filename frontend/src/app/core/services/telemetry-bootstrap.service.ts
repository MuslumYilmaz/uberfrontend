import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, PLATFORM_ID, effect, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';
import { AuthService } from './auth.service';
import { isMarketingPath } from '../utils/marketing-route.util';

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

@Injectable({ providedIn: 'root' })
export class TelemetryBootstrapService {
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sentryLoader = inject(SENTRY_BROWSER_LOADER);
  private interactionCleanup: (() => void) | null = null;
  private inMemoryAnonymousId: string | null = null;
  private sentry: SentryBrowserClient | null = null;
  private sentryInitPromise: Promise<void> | null = null;

  constructor() {
    effect(() => {
      this.applySentryUser(this.auth.user()?._id ?? null);
    });
  }

  armForUrl(url: string): void {
    if (!this.isBrowser) return;

    if (isMarketingPath(url)) {
      if (!this.analytics.isInitialized()) {
        this.armOnFirstInteraction();
      }
      return;
    }

    this.disarmOnFirstInteraction();
    this.analytics.ensureInitialized();
    void this.ensureSentryInitialized();
  }

  private armOnFirstInteraction(): void {
    if (this.interactionCleanup) return;
    if (this.analytics.isInitialized() && this.sentryInitPromise) return;

    const activate = () => {
      this.disarmOnFirstInteraction();
      this.analytics.ensureInitialized();
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
  }

  private disarmOnFirstInteraction(): void {
    this.interactionCleanup?.();
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
              environment: environment.production ? 'production' : 'development',
              integrations: [sentry.browserTracingIntegration()],
              tracePropagationTargets: [environment.apiBase, /^\//],
              tracesSampleRate: environment.sentryTracesSampleRate,
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
