import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';
import { isMarketingPath } from '../utils/marketing-route.util';

type SentryModule = typeof import('@sentry/browser');

@Injectable({ providedIn: 'root' })
export class TelemetryBootstrapService {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private interactionCleanup: (() => void) | null = null;
  private sentryInitPromise: Promise<void> | null = null;

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
        import('@sentry/browser')
          .then((sentry: SentryModule) => {
            sentry.init({
              dsn: environment.sentryDsn,
              release: environment.sentryRelease || undefined,
              environment: environment.production ? 'production' : 'development',
              integrations: [sentry.browserTracingIntegration()],
              tracePropagationTargets: [environment.apiBase, /^\//],
              tracesSampleRate: environment.sentryTracesSampleRate,
            });
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
}
