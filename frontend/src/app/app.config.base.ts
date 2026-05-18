import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, TitleStrategy, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { apiCredentialsInterceptor } from './core/interceptors/api-credentials.interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh.interceptor';
import { SeoTitleStrategy } from './core/services/seo-title.strategy';
import { StorageVersionService } from './core/services/storage-version.service';

function initStorage(versioner: StorageVersionService) {
  return () => versioner.ensureFreshStorage().catch(() => void 0);
}

function shouldTransferCacheRequest(req: HttpRequest<unknown>): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  try {
    const url = new URL(req.url, 'https://frontendatlas.com');
    return url.pathname.startsWith('/assets/');
  } catch {
    return req.url.startsWith('assets/') || req.url.startsWith('/assets/');
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      // Avoid global same-URL reload churn; opt in per-flow when required.
      withRouterConfig({
        onSameUrlNavigation: 'ignore',
        paramsInheritanceStrategy: 'always',
      }),
      // Smooth scrolling and position restoration
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([apiCredentialsInterceptor, authRefreshInterceptor])),
    provideClientHydration(
      withHttpTransferCacheOptions({
        filter: shouldTransferCacheRequest,
      }),
    ),
    provideAnimations(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initStorage,
      deps: [StorageVersionService],
      multi: true,
    },
  ],
};
