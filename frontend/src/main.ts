import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { SENTRY_DSN, SENTRY_RELEASE, SENTRY_TRACES_SAMPLE_RATE } from './environments/sentry.env';

function enforceCanonicalOrigin(): void {
  if (typeof window === 'undefined') return;
  if (!environment.production) return;

  const { protocol, hostname, pathname, search, hash } = window.location;
  const normalizedHost = String(hostname || '').toLowerCase();
  const forceHost = normalizedHost === 'www.frontendatlas.com';
  const forceHttps = protocol === 'http:';
  if (!forceHost && !forceHttps) return;

  const target = `https://frontendatlas.com${pathname}${search}${hash}`;
  window.location.replace(target);
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

if (environment.sentryDsn) {
  const runSmoke = shouldRunSentrySmoke();
  import('@sentry/angular').then(({ browserTracingIntegration, init, captureException }) => {
    init({
      dsn: environment.sentryDsn,
      release: environment.sentryRelease || undefined,
      environment: environment.production ? 'production' : 'development',
      integrations: [browserTracingIntegration()],
      tracePropagationTargets: [environment.apiBase, /^\//],
      tracesSampleRate: environment.sentryTracesSampleRate,
    });

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
}

enforceCanonicalOrigin();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Smoke test (optional): Uncomment to verify Sentry captures an error.
// setTimeout(() => { throw new Error('Sentry smoke test'); }, 2000);
