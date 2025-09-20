import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { EsbuildInitService } from './core/services/esbuild-init.service';
import { StorageVersionService } from './core/services/storage-version.service';

function initStorage(versioner: StorageVersionService) {
  return () => versioner.ensureFreshStorage();
}

function initEsbuild(esbuildInit: EsbuildInitService) {
  // Return a function that returns a Promise
  return () => esbuildInit.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    { provide: APP_INITIALIZER, useFactory: initStorage, deps: [StorageVersionService], multi: true },
    { provide: APP_INITIALIZER, useFactory: initEsbuild, deps: [EsbuildInitService], multi: true },
  ]
};
