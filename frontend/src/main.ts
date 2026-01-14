import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

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

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Smoke test (optional): Uncomment to verify Sentry captures an error.
// setTimeout(() => { throw new Error('Sentry smoke test'); }, 2000);
