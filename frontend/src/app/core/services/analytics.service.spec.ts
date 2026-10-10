import { DOCUMENT } from '@angular/core';
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
  const originalUrl = window.location.href;
  let doc: Document;
  let win: TestWindow;
  let chromeRuntimeShimAdded = false;

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
    delete navigatorOverride.languages;
    delete (view as any).outerWidth;
    delete (view as any).outerHeight;
    if (chromeRuntimeShimAdded) {
      delete (view as any).chrome;
      chromeRuntimeShimAdded = false;
    }
    sessionStorage.removeItem('fa:analytics:decision_session:v1');
    sessionStorage.removeItem('fa:analytics:traffic_class:v1');
    window.history.replaceState({}, '', originalUrl);
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
    // Pin a plausible human desktop browser so the suspect heuristics stay quiet
    // in headless Karma, which reports a zero-sized window.
    Object.defineProperty(win.navigator, 'languages', {
      configurable: true,
      get: () => ['en-US', 'en'],
    });
    Object.defineProperty(win, 'outerWidth', { configurable: true, get: () => 1280 });
    Object.defineProperty(win, 'outerHeight', { configurable: true, get: () => 720 });
    if (typeof (win as any).chrome === 'undefined') {
      (win as any).chrome = { runtime: {} };
      chromeRuntimeShimAdded = true;
    }
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
      campaign_id: 'client_spoofed_campaign',
      campaign_source: 'dashboard',
      offer_campaign_id: 'interview_august',
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
      offer_campaign_id: 'interview_august',
      items: [{ item_id: 'monthly' }],
      send_to: 'G-TEST123',
    }));
    expect(eventCall[2]).not.toEqual(jasmine.objectContaining({
      source: jasmine.anything(),
      campaign_id: jasmine.anything(),
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

  it('provides a stable PII-free decision session id for checkout attribution', () => {
    const service = TestBed.inject(AnalyticsService);

    const first = service.getDecisionSessionId();
    const second = service.getDecisionSessionId();

    expect(first).toMatch(/^ds_[a-f0-9]{32}$/);
    expect(second).toBe(first);
    expect(sessionStorage.getItem('fa:analytics:decision_session:v1')).toBe(first);
    expect(first).not.toContain('@');
  });

  it('marks an opted-in internal session without leaking the query string into page views', () => {
    window.history.replaceState({}, '', '/pricing?fa_traffic=internal');
    expect(window.location.search).toBe('?fa_traffic=internal');
    const service = TestBed.inject(AnalyticsService);

    service.trackPageView('/pricing?fa_traffic=internal');
    service.track('pricing_viewed', { surface: 'pricing_page' });
    service.ensureInitialized();

    const eventCalls = (win.dataLayer || [])
      .map((entry) => Array.from(entry as IArguments))
      .filter((entry) => entry[0] === 'event');
    expect(eventCalls.map((entry) => entry[1])).toEqual(['page_view', 'pricing_viewed']);
    expect(eventCalls[0][2]).toEqual(jasmine.objectContaining({
      page_path: '/pricing',
      page_location: `${window.location.origin}/pricing`,
      traffic_type: 'internal',
    }));
    expect(eventCalls[1][2]).toEqual(jasmine.objectContaining({
      surface: 'pricing_page',
      traffic_type: 'internal',
    }));
    expect(sessionStorage.getItem('fa:analytics:traffic_class:v1')).toBe('internal');
  });

  it('clears a tab traffic marker when fa_traffic=external is requested', () => {
    sessionStorage.setItem('fa:analytics:traffic_class:v1', 'test');
    window.history.replaceState({}, '', '/pricing?fa_traffic=external');
    expect(window.location.search).toBe('?fa_traffic=external');
    const service = TestBed.inject(AnalyticsService);

    service.track('pricing_viewed');
    service.ensureInitialized();

    const eventCall = Array.from(win.dataLayer?.[2] as IArguments);
    expect(eventCall[2]).not.toEqual(jasmine.objectContaining({ traffic_type: jasmine.anything() }));
    expect(sessionStorage.getItem('fa:analytics:traffic_class:v1')).toBeNull();
  });

  it('skips analytics bootstrap in Playwright-like automation contexts', () => {
    win.__playwright__binding__ = {};

    const service = TestBed.inject(AnalyticsService);
    service.ensureInitialized();
    service.trackPageView('/pricing');

    expect(service.getVisitorClass()).toBe('automation');
    expect(doc.getElementById('ga4-gtag-script')).toBeNull();
    expect(win.dataLayer).toBeUndefined();
    expect(win.gtag).toBeUndefined();
  });

  it('skips analytics bootstrap for self-declared crawlers and HTTP clients', () => {
    const crawlers = [
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)',
      'python-requests/2.32.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36',
    ];

    for (const userAgent of crawlers) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [BrowserTestingModule], providers: [AnalyticsService] });
      Object.defineProperty(win.navigator, 'userAgent', { configurable: true, get: () => userAgent });

      const service = TestBed.inject(AnalyticsService);
      service.ensureInitialized();
      service.trackPageView('/pricing');

      expect(service.getVisitorClass()).withContext(userAgent).toBe('automation');
      expect(doc.getElementById('ga4-gtag-script')).withContext(userAgent).toBeNull();
      expect(win.dataLayer).withContext(userAgent).toBeUndefined();
    }
  });

  it('treats a normal desktop browser as human and sends no traffic marker', () => {
    const service = TestBed.inject(AnalyticsService);
    expect(service.getVisitorClass()).toBe('human');

    service.track('pricing_viewed');
    service.ensureInitialized();

    const eventCall = Array.from(win.dataLayer?.[2] as IArguments);
    expect(eventCall[2]).not.toEqual(jasmine.objectContaining({ traffic_type: jasmine.anything() }));
  });

  it('keeps suspect browsers but tags every hit with traffic_type=bot_suspect', () => {
    Object.defineProperty(win.navigator, 'languages', { configurable: true, get: () => [] });

    const service = TestBed.inject(AnalyticsService);
    expect(service.getVisitorClass()).toBe('suspect');

    service.trackPageView('/pricing');
    service.track('pricing_viewed', { surface: 'pricing_page' });
    service.ensureInitialized();

    expect(doc.getElementById('ga4-gtag-script')).not.toBeNull();
    const eventCalls = (win.dataLayer || [])
      .map((entry) => Array.from(entry as IArguments))
      .filter((entry) => entry[0] === 'event');
    expect(eventCalls.map((entry) => entry[1])).toEqual(['page_view', 'pricing_viewed']);
    expect(eventCalls[0][2]).toEqual(jasmine.objectContaining({ page_path: '/pricing', traffic_type: 'bot_suspect' }));
    expect(eventCalls[1][2]).toEqual(jasmine.objectContaining({ surface: 'pricing_page', traffic_type: 'bot_suspect' }));
  });

  it('flags a zero-sized window and a desktop Chrome without the chrome runtime as suspect', () => {
    Object.defineProperty(win, 'outerWidth', { configurable: true, get: () => 0 });
    expect(TestBed.inject(AnalyticsService).getVisitorClass()).toBe('suspect');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BrowserTestingModule], providers: [AnalyticsService] });
    Object.defineProperty(win, 'outerWidth', { configurable: true, get: () => 1280 });
    delete (win as any).chrome;
    chromeRuntimeShimAdded = false;
    expect(TestBed.inject(AnalyticsService).getVisitorClass()).toBe('suspect');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BrowserTestingModule], providers: [AnalyticsService] });
    Object.defineProperty(win.navigator, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    });
    expect(TestBed.inject(AnalyticsService).getVisitorClass()).withContext('mobile Chrome has no chrome runtime check').toBe('human');
  });

  it('lets an explicit team traffic marker win over the bot_suspect tag', () => {
    Object.defineProperty(win.navigator, 'languages', { configurable: true, get: () => [] });
    window.history.replaceState({}, '', '/pricing?fa_traffic=internal');

    const service = TestBed.inject(AnalyticsService);
    expect(service.getVisitorClass()).toBe('suspect');
    service.track('pricing_viewed');
    service.ensureInitialized();

    const eventCall = Array.from(win.dataLayer?.[2] as IArguments);
    expect(eventCall[2]).toEqual(jasmine.objectContaining({ traffic_type: 'internal' }));
  });
});
