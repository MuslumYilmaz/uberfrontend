import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type GtagFn = (...args: unknown[]) => void;
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  __playwright__binding__?: unknown;
  __pwInitScripts?: unknown;
  Cypress?: unknown;
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly measurementId = String(environment.gaMeasurementId || '').trim();
  private readonly analyticsEnabled = this.isBrowser && !!this.measurementId && !this.detectAutomationContext();
  private readonly scriptId = 'ga4-gtag-script';
  private lastTrackedPath: string | null = null;
  private initialized = false;
  private pendingEvents: Array<{ name: string; params?: Record<string, unknown> }> = [];
  private pendingPageViews: string[] = [];

  track(name: string, params?: Record<string, unknown>) {
    if (!this.analyticsEnabled) return;
    if (!this.initialized) {
      this.pendingEvents.push({ name, params });
      return;
    }

    this.dispatchEvent(name, params);
  }

  trackPageView(path?: string) {
    if (!this.analyticsEnabled) return;

    const pagePath = this.normalizePath(path);
    if (this.lastTrackedPath === pagePath) return;
    this.lastTrackedPath = pagePath;

    if (!this.initialized) {
      this.pendingPageViews.push(pagePath);
      return;
    }

    this.dispatchPageView(pagePath);
  }

  ensureInitialized() {
    if (!this.analyticsEnabled || this.initialized) return;
    const gtag = this.getGtag();
    if (!gtag) return;

    this.injectScriptTag();
    gtag('js', new Date());
    gtag('config', this.measurementId, { send_page_view: false });
    this.initialized = true;
    this.flushPending();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private dispatchEvent(name: string, params?: Record<string, unknown>) {
    const gtag = this.getGtag();
    if (!gtag) return;

    gtag('event', name, {
      ...(params || {}),
      ...(this.measurementId ? { send_to: this.measurementId } : {}),
    });
  }

  private dispatchPageView(pagePath: string) {
    const gtag = this.getGtag();
    if (!gtag) return;

    gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: this.document.title || undefined,
      ...(this.measurementId ? { send_to: this.measurementId } : {}),
    });
  }

  private flushPending() {
    const pendingEvents = [...this.pendingEvents];
    const pendingPageViews = [...this.pendingPageViews];
    this.pendingEvents.length = 0;
    this.pendingPageViews.length = 0;

    pendingEvents.forEach((event) => this.dispatchEvent(event.name, event.params));
    pendingPageViews.forEach((pagePath) => this.dispatchPageView(pagePath));
  }

  private getGtag(): GtagFn | null {
    if (!this.analyticsEnabled) return null;
    const globalScope = window as AnalyticsWindow;
    if (typeof globalScope.gtag === 'function') {
      return globalScope.gtag;
    }

    globalScope.dataLayer = globalScope.dataLayer || [];
    globalScope.gtag = function gtagShim(...args: unknown[]) {
      // Match Google's recommended queue shape: dataLayer.push(arguments)
      globalScope.dataLayer!.push(args.length ? arguments : args);
    };
    return globalScope.gtag;
  }

  private injectScriptTag() {
    if (!this.analyticsEnabled) return;
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

  // Suppress analytics in browser automation so local/CI traffic does not pollute GA.
  private detectAutomationContext(): boolean {
    if (!this.isBrowser) return false;

    const globalScope = window as AnalyticsWindow;
    const navigatorObject = globalScope.navigator;
    const userAgent = String(navigatorObject?.userAgent || '');

    return Boolean(
      navigatorObject?.webdriver ||
      typeof globalScope.__playwright__binding__ !== 'undefined' ||
      typeof globalScope.__pwInitScripts !== 'undefined' ||
      typeof globalScope.Cypress !== 'undefined' ||
      /HeadlessChrome|Playwright|Puppeteer|Cypress/i.test(userAgent),
    );
  }
}
