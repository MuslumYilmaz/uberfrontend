import { InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AssetReader {
  readJson(path: string): Observable<any | null>;
}

export const ASSET_READER = new InjectionToken<AssetReader>('ASSET_READER', {
  providedIn: 'root',
  factory: () => ({
    readJson: () => of(null),
  }),
});
