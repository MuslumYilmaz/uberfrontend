import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  track(name: string, params?: Record<string, unknown>) {
    if (!this.isBrowser) return;
    const globalScope = window as Window & {
      gtag?: (...args: unknown[]) => void;
    };
    if (typeof globalScope.gtag === 'function') {
      globalScope.gtag('event', name, params || {});
    }
  }
}

