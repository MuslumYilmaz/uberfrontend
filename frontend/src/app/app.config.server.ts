import { provideServerRendering } from '@angular/ssr';
import { ApplicationConfig } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ASSET_READER } from './core/services/asset-reader';
import { ServerAssetReader } from './core/services/asset-reader.server';

export const appConfigServer: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations(),
    { provide: ASSET_READER, useClass: ServerAssetReader },
  ],
};
