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

  it('queues page views until analytics is explicitly initialized', () => {
    const service = TestBed.inject(AnalyticsService);
    service.trackPageView('/pricing');

    expect(doc.getElementById('ga4-gtag-script')).toBeNull();
    expect(win.dataLayer).toBeUndefined();

    service.ensureInitialized();

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

  it('keeps queued event order and canonicalizes page paths without query or hash fragments', () => {
    const service = TestBed.inject(AnalyticsService);
    doc.title = 'Pricing snapshot';

    service.track('before_navigation', { src: 'header' });
    service.trackPageView('/pricing?src=marketing_header#pricing-plans');
    service.track('after_navigation', { surface: 'pricing_page' });
    service.ensureInitialized();

    const dispatches = (win.dataLayer || [])
      .map((entry) => Array.from(entry as IArguments))
      .filter((entry) => entry[0] === 'event');
    expect(dispatches.map((entry) => entry[1])).toEqual([
      'before_navigation',
      'page_view',
      'after_navigation',
    ]);
    expect(dispatches[1][2]).toEqual(jasmine.objectContaining({
      page_path: '/pricing',
      page_location: `${window.location.origin}/pricing`,
      page_title: 'Pricing snapshot',
    }));

    service.trackPageView('/pricing?src=another_source');
    expect((win.dataLayer || []).length).toBe(5);
  });

  it('drops acquisition overrides and PII before events enter the queue', () => {
    const service = TestBed.inject(AnalyticsService);

    expect(service.track('xp_awarded', {
      source: 'question_complete',
      campaign_source: 'dashboard',
      customer_email: 'person@example.com',
      access_token: 'secret',
      refreshToken: 'also-secret',
      reward_source: 'question_complete',
      gap_source: 'catalog',
      items: [{ item_id: 'monthly', customerEmail: 'person@example.com' }],
    })).toBeTrue();

    service.ensureInitialized();

    const eventCall = Array.from(win.dataLayer?.[2] as IArguments);
    expect(eventCall[0]).toBe('event');
    expect(eventCall[1]).toBe('xp_awarded');
    expect(eventCall[2]).toEqual(jasmine.objectContaining({
      reward_source: 'question_complete',
      gap_source: 'catalog',
      items: [{ item_id: 'monthly' }],
      send_to: 'G-TEST123',
    }));
    expect(eventCall[2]).not.toEqual(jasmine.objectContaining({
      source: jasmine.anything(),
      campaign_source: jasmine.anything(),
      customer_email: jasmine.anything(),
      access_token: jasmine.anything(),
      refreshToken: jasmine.anything(),
    }));
  });

  it('emits the PII-free decision-session qualification contract only once per runtime', () => {
    const service = TestBed.inject(AnalyticsService);

    expect(service.trackDecisionSessionQualified('trusted_interaction')).toBeTrue();
    expect(service.trackDecisionSessionQualified('foreground_15s')).toBeFalse();

    service.ensureInitialized();

    const eventCalls = (win.dataLayer || [])
      .map((entry) => Array.from(entry as IArguments))
      .filter((entry) => entry[0] === 'event' && entry[1] === 'decision_session_qualified');
    expect(eventCalls.length).toBe(1);
    expect(eventCalls[0][2]).toEqual({
      qualification_method: 'trusted_interaction',
      qualification_version: 'v1',
      send_to: 'G-TEST123',
    });
    expect(eventCalls[0][2]).not.toEqual(jasmine.objectContaining({
      page_path: jasmine.anything(),
      page_location: jasmine.anything(),
      email: jasmine.anything(),
      username: jasmine.anything(),
    }));
  });

  it('skips analytics bootstrap in Playwright-like automation contexts', () => {
    win.__playwright__binding__ = {};

    const service = TestBed.inject(AnalyticsService);
    service.ensureInitialized();
    service.trackPageView('/pricing');

    expect(doc.getElementById('ga4-gtag-script')).toBeNull();
    expect(win.dataLayer).toBeUndefined();
    expect(win.gtag).toBeUndefined();
  });
});
