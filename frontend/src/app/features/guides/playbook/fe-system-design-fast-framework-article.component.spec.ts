import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FeSystemDesignFastFrameworkArticle } from './fe-system-design-fast-framework-article.component';

describe('FeSystemDesignFastFrameworkArticle', () => {
  let fixture: ComponentFixture<FeSystemDesignFastFrameworkArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/system-design');

    await TestBed.configureTestingModule({
      imports: [FeSystemDesignFastFrameworkArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeSystemDesignFastFrameworkArticle);
    fixture.componentInstance.readerPromise = 'Custom system design framework promise.';
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    window.history.pushState({}, '', originalPath || '/');
  });

  function text(): string {
    return (fixture.nativeElement.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hrefs(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .map((anchor) => anchor.getAttribute('href') || '');
  }

  it('renders the system design SEO landing shell and freshness signal', () => {
    const hostText = text();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = fixture.nativeElement.querySelector('[data-testid="system-design-guide-freshness"]');

    expect(h1?.textContent?.trim()).toBe('Frontend System Design Interview Framework: 45-Minute Answer Template');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(freshness?.textContent || '').toContain('Reviewed by FrontendAtlas');
    expect(hostText).toContain('Custom system design framework promise.');
  });

  it('renders the major intent sections for the upgraded landing page', () => {
    const hostText = text();

    expect(hostText).toContain('What frontend system design interviews test');
    expect(hostText).toContain('Frontend vs backend system design interview scope');
    expect(hostText).toContain('45-minute frontend system design interview answer template');
    expect(hostText).toContain('Worked example: design autocomplete in a frontend system design interview');
    expect(hostText).toContain('Frontend system design interview rubric');
    expect(hostText).toContain('Common mistakes');
    expect(hostText).toContain('Practice map');
    expect(hostText).toContain('FAQ');
    expect(hostText).toContain('What to practice next');
  });

  it('renders long-tail keyword phrases without changing the route shell', () => {
    const hostText = text();

    expect(hostText).toContain('client-side system design interview');
    expect(hostText).toContain('senior frontend system design interview');
    expect(hostText).toContain('45-minute frontend system design interview answer template');
    expect(hostText).toContain('design autocomplete in a frontend system design interview');
    expect(hostText).toContain('Frontend system design interview rubric');
    expect(hostText).toContain('frontend vs backend system design interview');
    expect(hostText).toContain('Senior frontend engineers should mention trade-offs');
  });

  it('renders the 45-minute template and autocomplete worked example details', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const templateSteps = host.querySelectorAll('[data-testid="system-design-answer-template"] li');

    expect(templateSteps.length).toBe(6);
    expect(hostText).toContain('0-5 min');
    expect(hostText).toContain('40-45 min');
    expect(hostText).toContain('Search input, debounced async suggestions');
    expect(hostText).toContain('View shell');
    expect(hostText).toContain('Combobox component');
    expect(hostText).toContain('Query/cache layer');
    expect(hostText).toContain('Telemetry hook');
    expect(hostText).toContain('latestRequestId');
    expect(hostText).toContain('AbortController');
    expect(hostText).toContain('GET /suggestions?q=');
    expect(hostText).toContain('cache key = normalized query + limit');
    expect(hostText).toContain('Only the newest request can update the rendered list.');
  });

  it('renders rubric, mistakes, practice map, and FAQ content', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const practiceCards = host.querySelectorAll('[data-testid="system-design-practice-map"] .practice-card');

    expect(host.querySelector('[data-testid="system-design-rubric-table"]')).not.toBeNull();
    expect(hostText).toContain('Weak');
    expect(hostText).toContain('Hire');
    expect(hostText).toContain('Strong hire');
    expect(hostText).toContain('Backend-heavy answer');
    expect(hostText).toContain('No concrete contract');
    expect(hostText).toContain('Happy-path only');
    expect(hostText).toContain('Premature optimization');
    expect(practiceCards.length).toBe(8);
    expect(hostText).toContain('Realtime Search');
    expect(hostText).toContain('Dashboard Widgets');
    expect(hostText).toContain('What is a frontend system design interview framework?');
    expect(hostText).toContain('How do I answer a frontend system design interview in 45 minutes?');
    expect(hostText).toContain('How do I design autocomplete in a frontend system design interview?');
    expect(hostText).toContain('What should I practice for a frontend architecture interview?');
  });

  it('renders proof actions and critical internal links', () => {
    const linkTargets = hrefs();

    expect(linkTargets).toContain('/system-design/realtime-search-debounce-cache');
    expect(linkTargets).toContain('/system-design');
    expect(linkTargets).toContain('/guides/system-design-blueprint/radio-framework');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/system-design/infinite-scroll-list');
    expect(linkTargets).toContain('/system-design/news-feed-timeline');
    expect(linkTargets).toContain('/system-design/notification-toast-system');
    expect(linkTargets).toContain('/system-design/ai-chat-textarea-design');
    expect(linkTargets).toContain('/system-design/component-design-system-architecture');
    expect(linkTargets).toContain('/system-design/live-comments-global-stream');
    expect(linkTargets).toContain('/system-design/dashboard-widgets-draggable-resizable');
    expect(linkTargets).toContain('/guides/system-design-blueprint/checklist');
  });
});
