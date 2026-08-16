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

type AnalyticsPageView = {
  path: string;
  location: string;
  title?: string;
};

type PendingAnalyticsDispatch =
  | { type: 'event'; name: string; params?: Record<string, unknown> }
  | { type: 'page_view'; pageView: AnalyticsPageView };

export type DecisionSessionQualificationMethod = 'trusted_interaction' | 'foreground_15s';

const RESERVED_ACQUISITION_PARAMS = new Set([
  'source',
  'medium',
  'campaign',
  'campaign_id',
  'campaign_source',
  'campaign_medium',
  'campaign_name',
  'campaign_term',
  'campaign_content',
]);

const PII_PARAM_PATTERN = /(^|_)(email|username|password|token|authorization|credential|secret)($|_)/i;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly measurementId = String(environment.gaMeasurementId || '').trim();
  private readonly analyticsEnabled = this.isBrowser && !!this.measurementId && !this.detectAutomationContext();
  private readonly scriptId = 'ga4-gtag-script';
  private lastTrackedPath: string | null = null;
  private initialized = false;
  private decisionSessionQualified = false;
  private pendingDispatches: PendingAnalyticsDispatch[] = [];

  track(name: string, params?: Record<string, unknown>): boolean {
    if (!this.analyticsEnabled) return false;
    const safeParams = this.sanitizeEventParams(params);
    if (!this.initialized) {
      this.pendingDispatches.push({ type: 'event', name, params: safeParams });
      return true;
    }

    this.dispatchEvent(name, safeParams);
    return true;
  }

  trackPageView(path?: string) {
    if (!this.analyticsEnabled) return;

    const pagePath = this.normalizePath(path);
    if (this.lastTrackedPath === pagePath) return;
    this.lastTrackedPath = pagePath;
    const pageView = this.createPageView(pagePath);

    if (!this.initialized) {
      this.pendingDispatches.push({ type: 'page_view', pageView });
      return;
    }

    this.dispatchPageView(pageView);
  }

  trackDecisionSessionQualified(method: DecisionSessionQualificationMethod): boolean {
    if (this.decisionSessionQualified) return false;
    this.decisionSessionQualified = true;

    return this.track('decision_session_qualified', {
      qualification_method: method,
      qualification_version: 'v1',
    });
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

  private dispatchPageView(pageView: AnalyticsPageView) {
    const gtag = this.getGtag();
    if (!gtag) return;

    gtag('event', 'page_view', {
      page_path: pageView.path,
      page_location: pageView.location,
      page_title: pageView.title,
      ...(this.measurementId ? { send_to: this.measurementId } : {}),
    });
  }

  private sanitizeEventParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!params) return undefined;
    return this.sanitizeObject(params);
  }

  private sanitizeObject(value: Record<string, unknown>): Record<string, unknown> | undefined {
    const safeEntries: Array<[string, unknown]> = [];
    for (const [rawKey, rawValue] of Object.entries(value)) {
      const key = String(rawKey || '').trim();
      const normalizedKey = key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .toLowerCase();
      if (
        !key
        || RESERVED_ACQUISITION_PARAMS.has(normalizedKey)
        || PII_PARAM_PATTERN.test(normalizedKey)
      ) {
        continue;
      }

      const safeValue = this.sanitizeValue(rawValue);
      if (safeValue !== undefined) safeEntries.push([key, safeValue]);
    }
    return safeEntries.length ? Object.fromEntries(safeEntries) : undefined;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value
        .map((entry) => this.sanitizeValue(entry))
        .filter((entry) => entry !== undefined);
    }
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }
    return value;
  }

  private flushPending() {
    const pending = [...this.pendingDispatches];
    this.pendingDispatches.length = 0;

    pending.forEach((item) => {
      if (item.type === 'event') {
        this.dispatchEvent(item.name, item.params);
      } else {
        this.dispatchPageView(item.pageView);
      }
    });
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
    const rawPath = path || window.location.pathname || '/';
    try {
      const url = new URL(rawPath, window.location.origin);
      return url.pathname || '/';
    } catch {
      const canonicalPath = rawPath.split(/[?#]/, 1)[0] || '/';
      return canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    }
  }

  private createPageView(path: string): AnalyticsPageView {
    let location = path;
    try {
      location = new URL(path, window.location.origin).href;
    } catch { }
    return {
      path,
      location,
      title: this.document.title || undefined,
    };
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
