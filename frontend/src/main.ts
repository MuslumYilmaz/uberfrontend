import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const CHUNK_RELOAD_SESSION_KEY = 'c';

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

function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined' || !environment.production) return;

  const maybeRecover = (reason: unknown) => {
    const msg = String((reason as any)?.message ?? reason ?? '').toLowerCase();
    if (
      !msg.includes('dynamically imported module') &&
      !msg.includes('chunkloaderror') &&
      !msg.includes('loading chunk') &&
      !msg.includes('module script failed')
    ) {
      return;
    }
    try {
      if (window.sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return;
      window.sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
    } catch {
      // ignore session storage failures
    }
    window.location.reload();
  };

  window.addEventListener('unhandledrejection', (event) => {
    maybeRecover((event as PromiseRejectionEvent).reason);
  });

  window.addEventListener('error', (event) => {
    const err = event as ErrorEvent;
    maybeRecover(err.error ?? err.message);
  }, true);
}

if (environment.sentryDsn) {
  import('@sentry/angular').then(({ browserTracingIntegration, init }) => {
    init({
      dsn: environment.sentryDsn,
      release: environment.sentryRelease || undefined,
      environment: environment.production ? 'production' : 'development',
      integrations: [browserTracingIntegration()],
      tracePropagationTargets: [environment.apiBase, /^\//],
      tracesSampleRate: environment.sentryTracesSampleRate,
    });
  });
}

enforceCanonicalOrigin();
installChunkLoadRecovery();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
