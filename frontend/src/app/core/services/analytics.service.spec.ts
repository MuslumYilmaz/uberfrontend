import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';

type TestWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __playwright__binding__?: unknown;
  __pwInitScripts?: unknown;
  Cypress?: unknown;
};

describe('AnalyticsService', () => {
  const originalMeasurementId = environment.gaMeasurementId;
  let doc: Document;
  let win: TestWindow;

  function cleanupGlobals() {
    if (!doc?.defaultView) return;
    const view = doc.defaultView as TestWindow;
    const navigatorOverride = view.navigator as any;
    doc.getElementById('ga4-gtag-script')?.remove();
    delete view.dataLayer;
    delete view.gtag;
    delete view.__playwright__binding__;
    delete view.__pwInitScripts;
    delete view.Cypress;
    delete navigatorOverride.userAgent;
    delete navigatorOverride.webdriver;
  }

  beforeEach(() => {
    environment.gaMeasurementId = 'G-TEST123';
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [AnalyticsService],
    });
    doc = TestBed.inject(DOCUMENT);
    win = doc.defaultView as TestWindow;
    cleanupGlobals();
    Object.defineProperty(win.navigator, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    });
    Object.defineProperty(win.navigator, 'webdriver', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    cleanupGlobals();
    environment.gaMeasurementId = originalMeasurementId;
    TestBed.resetTestingModule();
  });

  it('injects gtag and queues page views in normal browser contexts', () => {
    const service = TestBed.inject(AnalyticsService);
    service.trackPageView('/pricing');

    const script = doc.getElementById('ga4-gtag-script') as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
    expect(Array.isArray(win.dataLayer)).toBeTrue();
    expect(win.dataLayer?.length).toBe(3);

    const pageViewCall = Array.from(win.dataLayer?.[2] as IArguments);
    expect(pageViewCall[0]).toBe('event');
    expect(pageViewCall[1]).toBe('page_view');
    expect(pageViewCall[2]).toEqual(jasmine.objectContaining({
      page_path: '/pricing',
      send_to: 'G-TEST123',
    }));
  });

  it('skips analytics bootstrap in Playwright-like automation contexts', () => {
    win.__playwright__binding__ = {};

    const service = TestBed.inject(AnalyticsService);
    service.trackPageView('/pricing');

    expect(doc.getElementById('ga4-gtag-script')).toBeNull();
    expect(win.dataLayer).toBeUndefined();
    expect(win.gtag).toBeUndefined();
  });
});
