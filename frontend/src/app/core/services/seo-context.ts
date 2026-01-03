import { InjectionToken } from '@angular/core';

export const SEO_SUPPRESS_TOKEN = new InjectionToken<boolean>('SEO_SUPPRESS_TOKEN', {
  providedIn: 'root',
  factory: () => false,
});
