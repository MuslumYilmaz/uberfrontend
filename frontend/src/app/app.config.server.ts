import { ApplicationConfig } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideServerRendering } from '@angular/platform-server';

export const appConfigServer: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations(),
  ],
};
