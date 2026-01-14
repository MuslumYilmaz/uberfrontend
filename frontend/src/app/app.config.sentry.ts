// src/app/app.config.sentry.ts
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, inject, PLATFORM_ID } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, TitleStrategy, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { TraceService, createErrorHandler } from '@sentry/angular';
import { routes } from './app.routes';
import { apiCredentialsInterceptor } from './core/interceptors/api-credentials.interceptor';
import { SeoTitleStrategy } from './core/services/seo-title.strategy';
import { StorageVersionService } from './core/services/storage-version.service';

function initStorage(versioner: StorageVersionService) {
  return () => versioner.ensureFreshStorage().catch(() => void 0);
}

function sentryErrorHandlerFactory() {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return new ErrorHandler();
  }
  return createErrorHandler({ showDialog: false });
}

function initSentryTracing() {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return () => void 0;
  }
  const traceService = inject(TraceService);
  return () => traceService;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      // Reload component when query params or same URL changes
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
      }),
      // Smooth scrolling and position restoration
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([apiCredentialsInterceptor])),
    provideAnimations(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: ErrorHandler, useFactory: sentryErrorHandlerFactory },
    {
      provide: APP_INITIALIZER,
      useFactory: initStorage,
      deps: [StorageVersionService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initSentryTracing,
      multi: true,
    },
  ],
};
