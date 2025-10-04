// src/app/app.config.ts
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { StorageVersionService } from './core/services/storage-version.service';

function initStorage(versioner: StorageVersionService) {
  return () => versioner.ensureFreshStorage().catch(() => void 0);
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
    provideHttpClient(),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initStorage,
      deps: [StorageVersionService],
      multi: true,
    },
  ],
};
