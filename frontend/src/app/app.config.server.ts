import { provideServerRendering } from '@angular/ssr';
import { ApplicationConfig } from '@angular/core';
import { ASSET_READER } from './core/services/asset-reader';
import { ServerAssetReader } from './core/services/asset-reader.server';

export const appConfigServer: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: ASSET_READER, useClass: ServerAssetReader },
  ],
};
