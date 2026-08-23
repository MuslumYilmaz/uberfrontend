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
export type AnalyticsTrafficClass = 'internal' | 'test';

const TRAFFIC_CLASS_QUERY_PARAM = 'fa_traffic';
const TRAFFIC_CLASS_STORAGE_KEY = 'fa:analytics:traffic_class:v1';

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
  private readonly trafficClass = this.resolveTrafficClass();
  private readonly scriptId = 'ga4-gtag-script';
  private readonly decisionSessionStorageKey = 'fa:analytics:decision_session:v1';
  private lastTrackedPath: string | null = null;
  private initialized = false;
  private decisionSessionQualified = false;
  private pendingDispatches: PendingAnalyticsDispatch[] = [];
  private decisionSessionId: string | null | undefined;

  /**
   * PII-free, tab-scoped identifier for joining qualified pricing activity to
   * a server-created checkout attempt. This is intentionally not a GA client
   * ID and is never derived from account data.
   */
  getDecisionSessionId(): string | null {
    if (!this.isBrowser) return null;
    if (this.decisionSessionId !== undefined) return this.decisionSessionId;

    try {
      const existing = sessionStorage.getItem(this.decisionSessionStorageKey);
      if (existing && /^ds_[a-f0-9]{32}$/.test(existing)) {
        this.decisionSessionId = existing;
        return existing;
      }

      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const created = `ds_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
      sessionStorage.setItem(this.decisionSessionStorageKey, created);
      this.decisionSessionId = created;
      return created;
    } catch {
      this.decisionSessionId = null;
      return null;
    }
  }

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
      ...(this.trafficClass ? { traffic_type: this.trafficClass } : {}),
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
      ...(this.trafficClass ? { traffic_type: this.trafficClass } : {}),
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

  /**
   * Lets staff/test sessions opt into GA's `traffic_type` contract without
   * putting account data or IP addresses in application analytics. The marker
   * lasts only for the current browser tab. `external` clears an old marker.
   */
  private resolveTrafficClass(): AnalyticsTrafficClass | null {
    if (!this.isBrowser) return null;

    try {
      const requested = new URLSearchParams(window.location.search)
        .get(TRAFFIC_CLASS_QUERY_PARAM)
        ?.trim()
        .toLowerCase();

      if (requested === 'external') {
        sessionStorage.removeItem(TRAFFIC_CLASS_STORAGE_KEY);
        return null;
      }
      if (requested === 'internal' || requested === 'test') {
        sessionStorage.setItem(TRAFFIC_CLASS_STORAGE_KEY, requested);
        return requested;
      }

      const stored = sessionStorage.getItem(TRAFFIC_CLASS_STORAGE_KEY);
      return stored === 'internal' || stored === 'test' ? stored : null;
    } catch {
      return null;
    }
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
