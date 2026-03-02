import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type GtagFn = (...args: unknown[]) => void;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly measurementId = String(environment.gaMeasurementId || '').trim();
  private readonly scriptId = 'ga4-gtag-script';
  private lastTrackedPath: string | null = null;

  constructor() {
    this.init();
  }

  track(name: string, params?: Record<string, unknown>) {
    if (!this.isBrowser) return;
    const gtag = this.getGtag();
    if (!gtag) return;
    gtag('event', name, params || {});
  }

  trackPageView(path?: string) {
    if (!this.isBrowser) return;
    const gtag = this.getGtag();
    if (!gtag) return;

    const pagePath = this.normalizePath(path);
    if (this.lastTrackedPath === pagePath) return;
    this.lastTrackedPath = pagePath;

    gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: this.document.title || undefined,
    });
  }

  private init() {
    if (!this.isBrowser || !this.measurementId) return;
    const gtag = this.getGtag();
    if (!gtag) return;

    this.injectScriptTag();
    gtag('js', new Date());
    gtag('config', this.measurementId, { send_page_view: false });
  }

  private getGtag(): GtagFn | null {
    if (!this.isBrowser) return null;
    const globalScope = window as Window & {
      dataLayer?: unknown[];
      gtag?: GtagFn;
    };
    if (typeof globalScope.gtag === 'function') {
      return globalScope.gtag;
    }
    if (!this.measurementId) return null;

    globalScope.dataLayer = globalScope.dataLayer || [];
    globalScope.gtag = (...args: unknown[]) => {
      globalScope.dataLayer!.push(args);
    };
    return globalScope.gtag;
  }

  private injectScriptTag() {
    if (!this.measurementId) return;
    if (this.document.getElementById(this.scriptId)) return;

    const script = this.document.createElement('script');
    script.id = this.scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    this.document.head.appendChild(script);
  }

  private normalizePath(path?: string): string {
    if (!path) return `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (/^https?:\/\//i.test(path)) {
      try {
        const url = new URL(path);
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return path;
      }
    }
    return path.startsWith('/') ? path : `/${path}`;
  }
}
