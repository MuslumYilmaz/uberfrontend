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
    fixture.componentInstance.readerPromise = 'Custom preparation guide promise.';
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

  it('owns preparation intent with an exact H1 and freshness signal', () => {
    const hostText = text();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = fixture.nativeElement.querySelector('[data-testid="system-design-guide-freshness"]');

    expect(h1?.textContent?.trim()).toBe('Frontend System Design Interview Preparation Guide');
    expect(freshness?.textContent || '').toContain('Last updated: August 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Editorial');
    expect(hostText).toContain('Custom preparation guide promise.');
  });

  it('renders the preparation journey in the intended order', () => {
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLHeadingElement>,
    ).map((heading) => heading.textContent?.trim() || '');

    expect(headings).toEqual([
      'What frontend system design interviews test',
      'Frontend vs backend system design interview scope',
      'The two frontend system design question formats',
      'A practical frontend system design interview preparation sequence',
      'Frontend system design interview readiness checklist',
      'Frontend system design interview rubric',
      'Common mistakes in frontend system design preparation',
      'Practice map',
      'A repeatable mock interview loop',
      'Frontend system design interview preparation FAQ',
    ]);
  });

  it('covers question formats, readiness, rubric, mistakes, practice, and mock feedback', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();

    expect(host.querySelector('#frontend-vs-backend-scope')).not.toBeNull();
    expect(host.querySelector('#frontend-system-design-interview-format')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="system-design-question-formats"] .format-card').length).toBe(2);
    expect(host.querySelectorAll('[data-testid="system-design-preparation-sequence"] li').length).toBe(5);
    expect(host.querySelectorAll('[data-testid="system-design-readiness-checklist"] li').length).toBe(8);
    expect(host.querySelector('[data-testid="system-design-rubric-table"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="system-design-practice-map"] .practice-card').length).toBe(8);
    expect(host.querySelectorAll('[data-testid="system-design-mock-loop"] li').length).toBe(5);
    expect(hostText).toContain('Application architecture');
    expect(hostText).toContain('UI component and system design');
    expect(hostText).toContain('Collecting prompts without feedback');
    expect(hostText).toContain('Score observable behavior');
  });

  it('keeps visible FAQ ownership aligned with preparation metadata', () => {
    const hostText = text();

    expect(hostText).toContain('What is a frontend system design interview?');
    expect(hostText).toContain('How do I prepare for a frontend system design interview?');
    expect(hostText).toContain('What format does a frontend system design interview use?');
    expect(hostText).toContain('How are application architecture and UI component questions different?');
    expect(hostText).toContain('How should I practice frontend system design questions?');
    expect(hostText).toContain('How do I know I am ready for a frontend system design interview?');
  });

  it('links early to the question hub and delegates full answer-method depth to RADIO', () => {
    const linkTargets = hrefs();
    const hubIndex = linkTargets.indexOf('/system-design');
    const radioIndex = linkTargets.indexOf('/guides/system-design-blueprint/radio-framework');

    expect(hubIndex).toBeGreaterThan(-1);
    expect(radioIndex).toBeGreaterThan(hubIndex);
    expect(linkTargets).toContain('/system-design/notification-toast-system');
    expect(linkTargets).toContain('/system-design/realtime-search-debounce-cache');
    expect(linkTargets).toContain('/system-design/infinite-scroll-list');
    expect(linkTargets).toContain('/system-design/news-feed-timeline');
    expect(linkTargets).toContain('/system-design/ai-chat-textarea-design');
    expect(linkTargets).toContain('/system-design/component-design-system-architecture');
    expect(linkTargets).toContain('/system-design/live-comments-global-stream');
    expect(linkTargets).toContain('/system-design/dashboard-widgets-draggable-resizable');
    expect(fixture.nativeElement.querySelector('[data-testid="system-design-radio-teaser"]')).not.toBeNull();
    expect(text()).toContain('Use the RADIO framework for the 45-minute answer');
  });

  it('does not duplicate the full 45-minute script or autocomplete walkthrough', () => {
    const hostText = text();

    expect(hostText).not.toContain('45-minute frontend system design interview answer template');
    expect(hostText).not.toContain('0-5 min');
    expect(hostText).not.toContain('40-45 min');
    expect(hostText).not.toContain('Worked example: design autocomplete');
    expect(hostText).not.toContain('GET /suggestions?q=');
    expect(hostText).not.toContain('latestRequestId');
    expect(hostText).not.toContain('AbortController');
  });
});
