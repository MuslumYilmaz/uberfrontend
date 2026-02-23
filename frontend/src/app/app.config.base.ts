import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, TitleStrategy, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { apiCredentialsInterceptor } from './core/interceptors/api-credentials.interceptor';
import { SeoTitleStrategy } from './core/services/seo-title.strategy';
import { StorageVersionService } from './core/services/storage-version.service';

function initStorage(versioner: StorageVersionService) {
  return () => versioner.ensureFreshStorage().catch(() => void 0);
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
    provideHttpClient(withInterceptors([apiCredentialsInterceptor])),
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
