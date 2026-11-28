import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { environment } from '../../../environments/environment';
import { AnalyticsService, type AnalyticsVisitorClass } from './analytics.service';
import { CLARITY_SCRIPT_ID, ClarityService } from './clarity.service';

type ClarityTestWindow = Window & {
  clarity?: ((...args: unknown[]) => void) & { q?: IArguments[] };
};

describe('ClarityService', () => {
  const originalProjectId = environment.clarityProjectId;
  const win = window as ClarityTestWindow;
  // A detached document: scripts appended to it are never fetched, so the
  // suite stays off the network while still asserting the injected tag.
  let doc: Document;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  function configure(options: {
    projectId?: string;
    visitorClass?: AnalyticsVisitorClass;
    platform?: 'browser' | 'server';
  } = {}): ClarityService {
    environment.clarityProjectId = options.projectId ?? 'test1234ab';
    doc = document.implementation.createHTMLDocument('ClarityService spec');
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['getVisitorClass']);
    analytics.getVisitorClass.and.returnValue(options.visitorClass ?? 'human');

    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      providers: [
        ClarityService,
        { provide: AnalyticsService, useValue: analytics },
        { provide: DOCUMENT, useValue: doc },
        ...(options.platform === 'server' ? [{ provide: PLATFORM_ID, useValue: 'server' }] : []),
      ],
    });
    return TestBed.inject(ClarityService);
  }

  function injectedScripts(): HTMLScriptElement[] {
    return Array.from(doc.querySelectorAll<HTMLScriptElement>(`script#${CLARITY_SCRIPT_ID}`));
  }

  afterEach(() => {
    delete win.clarity;
    environment.clarityProjectId = originalProjectId;
    TestBed.resetTestingModule();
  });

  it('injects the async tag once with the configured project id and defines the queue', () => {
    const service = configure();
    expect(service.isEnabled()).toBeTrue();
    expect(service.isLoaded()).toBeFalse();
    expect(win.clarity).toBeUndefined();

    service.ensureLoaded();
    service.ensureLoaded();

    const scripts = injectedScripts();
    expect(scripts.length).toBe(1);
    expect(scripts[0].async).toBeTrue();
    expect(scripts[0].getAttribute('src')).toBe('https://www.clarity.ms/tag/test1234ab');
    expect(typeof win.clarity).toBe('function');
    expect(service.isLoaded()).toBeTrue();
  });

  it('keeps tags, upgrades and events requested before the tag in order and queues later ones directly', () => {
    const service = configure();
    service.set('page_group', 'pricing');
    service.upgrade('pricing');
    expect(win.clarity).toBeUndefined();

    service.ensureLoaded();
    service.event('pricing_plan_cta_clicked');

    const queued = (win.clarity?.q ?? []).map((args) => Array.from(args));
    expect(queued).toEqual([
      ['set', 'page_group', 'pricing'],
      ['upgrade', 'pricing'],
      ['event', 'pricing_plan_cta_clicked'],
    ]);
  });

  it('does nothing without a project id', () => {
    const service = configure({ projectId: '' });
    service.set('page_group', 'pricing');
    service.ensureLoaded();

    expect(service.isEnabled()).toBeFalse();
    expect(injectedScripts()).toEqual([]);
    expect(win.clarity).toBeUndefined();
  });

  it('refuses a project id that is not plain alphanumerics', () => {
    const service = configure({ projectId: 'abc/../evil' });
    service.ensureLoaded();

    expect(service.isEnabled()).toBeFalse();
    expect(injectedScripts()).toEqual([]);
  });

  it('never loads for automation visitors but still loads for suspect browsers', () => {
    const automation = configure({ visitorClass: 'automation' });
    automation.ensureLoaded();
    expect(automation.isEnabled()).toBeFalse();
    expect(injectedScripts()).toEqual([]);
    TestBed.resetTestingModule();

    const suspect = configure({ visitorClass: 'suspect' });
    suspect.ensureLoaded();
    expect(suspect.isEnabled()).toBeTrue();
    expect(injectedScripts().length).toBe(1);
  });

  it('does nothing on the server', () => {
    const service = configure({ platform: 'server' });
    service.ensureLoaded();
    service.event('pricing_plan_cta_clicked');

    expect(service.isEnabled()).toBeFalse();
    expect(injectedScripts()).toEqual([]);
    expect(win.clarity).toBeUndefined();
  });
});
