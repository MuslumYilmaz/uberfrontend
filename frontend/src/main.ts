import { bootstrapApplication } from '@angular/platform-browser';
import * as SentryDebug from '@sentry/angular'; // SENTRY_DEBUG
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { SENTRY_DSN, SENTRY_RELEASE, SENTRY_TRACES_SAMPLE_RATE } from './environments/sentry.env'; // SENTRY_DEBUG

function shouldRunSentryDebug(): boolean {
  if (typeof window === 'undefined') return false;
  let fromQuery = false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    fromQuery = params.get('sentry_debug') === '1';
  } catch {
    fromQuery = false;
  }

  let fromStorage = false;
  try {
    fromStorage = window.localStorage.getItem('sentry_debug') === '1';
  } catch {
    fromStorage = false;
  }

  return fromQuery || fromStorage;
}

function shouldRunSentrySmoke(): boolean {
  if (typeof window === 'undefined') return false;
  let fromQuery = false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    fromQuery = params.get('sentry_smoke') === '1';
    if (fromQuery) {
      params.delete('sentry_smoke');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
  } catch {
    fromQuery = false;
  }

  let fromStorage = false;
  try {
    fromStorage = window.localStorage.getItem('sentry_smoke') === '1';
  } catch {
    fromStorage = false;
  }

  return fromQuery || fromStorage;
}

const runSentryDebug = shouldRunSentryDebug();

if (runSentryDebug) {
  console.info('SENTRY_DEBUG_IMPORT_OK', !!SentryDebug);
  console.info('SENTRY_DEBUG_ENV', {
    hasDsn: !!SENTRY_DSN,
    release: SENTRY_RELEASE || 'missing',
    rate: SENTRY_TRACES_SAMPLE_RATE,
  });
  console.info('SENTRY_DEBUG_INIT_CONDITION', {
    hasDsn: !!environment.sentryDsn,
    production: environment.production,
  });
}

if (environment.sentryDsn) {
  const runSmoke = shouldRunSentrySmoke();
  import('@sentry/angular').then(({ browserTracingIntegration, init, captureException, captureMessage, flush }) => {
    init({
      dsn: environment.sentryDsn,
      release: environment.sentryRelease || undefined,
      environment: environment.production ? 'production' : 'development',
      integrations: [browserTracingIntegration()],
      tracePropagationTargets: [environment.apiBase, /^\//],
      tracesSampleRate: environment.sentryTracesSampleRate,
    });

    if (runSentryDebug) {
      const debugMessage = `SENTRY_DEBUG_MESSAGE ${new Date().toISOString()} release=${environment.sentryRelease || 'unknown'}`;
      console.info('SENTRY_DEBUG_MESSAGE_SENT', debugMessage);
      captureMessage(debugMessage);
      if (typeof flush === 'function') {
        flush(1000).catch(() => void 0);
      }
    }

    if (runSmoke) {
      const release = environment.sentryRelease || 'unknown';
      const message = `[sentry] smoke test ${new Date().toISOString()} release=${release}`;
      const err = new Error(message);
      console.info('[sentry] smoke test fired', { message });
      captureException(err);
      setTimeout(() => {
        throw err;
      }, 350);
    }
  });
} else if (runSentryDebug) {
  console.warn('SENTRY_DEBUG_INIT_SKIP: missing DSN');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Smoke test (optional): Uncomment to verify Sentry captures an error.
// setTimeout(() => { throw new Error('Sentry smoke test'); }, 2000);
