import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ResumeArticle } from './resume-article.component';

describe('ResumeArticle', () => {
  let fixture: ComponentFixture<ResumeArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/resume');

    await TestBed.configureTestingModule({
      imports: [ResumeArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeArticle);
    fixture.componentInstance.readerPromise = 'Custom resume callback promise.';
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

  it('renders the resume landing shell, freshness signal, proof band, and reader promise', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const h1 = host.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = host.querySelector('[data-testid="resume-guide-freshness"]');
    const proof = host.querySelector('[data-testid="resume-guide-proof"]');

    expect(h1?.textContent?.trim()).toBe('Frontend Resume for Interviews: What Gets Calls and What Gets Rejected');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(freshness?.textContent || '').toContain('Reviewed by FrontendAtlas');
    expect(proof?.textContent || '').toContain('30 sec');
    expect(proof?.textContent || '').toContain('ATS');
    expect(proof?.textContent || '').toContain('12');
    expect(proof?.textContent || '').toContain('role-level examples');
    expect(hostText).toContain('Custom resume callback promise.');
  });

  it('renders the major resume upgrade sections', () => {
    const hostText = text();

    expect(hostText).toContain('What frontend resume screens test');
    expect(hostText).toContain('30-second recruiter skim test');
    expect(hostText).toContain('Frontend resume sections that get interviews');
    expect(hostText).toContain('Frontend developer resume ATS keywords');
    expect(hostText).toContain('Before/after frontend resume bullet rewrites');
    expect(hostText).toContain('Junior, mid-level, and senior frontend resume examples');
    expect(hostText).toContain('Frontend impact metrics library');
    expect(hostText).toContain('Common rejection triggers');
    expect(hostText).toContain('Resume to interview loop map');
    expect(hostText).toContain('FAQ');
    expect(hostText).toContain('What to practice after your resume gets callbacks');
  });

  it('renders 12 frontend resume bullet rewrite cards', () => {
    const host = fixture.nativeElement as HTMLElement;
    const rewriteCards = host.querySelectorAll('[data-testid="resume-bullet-rewrites"] .rewrite-card');
    const hostText = text();

    expect(rewriteCards.length).toBe(12);
    expect(hostText).toContain('Performance');
    expect(hostText).toContain('Accessibility');
    expect(hostText).toContain('Design system');
    expect(hostText).toContain('Testing');
    expect(hostText).toContain('Migration');
    expect(hostText).toContain('API integration');
    expect(hostText).toContain('Checkout');
    expect(hostText).toContain('Dashboard');
    expect(hostText).toContain('Search/autocomplete');
    expect(hostText).toContain('Analytics');
    expect(hostText).toContain('Incident reduction');
    expect(hostText).toContain('Team enablement');
  });

  it('renders long-tail resume intent phrases', () => {
    const hostText = text();

    expect(hostText).toContain('frontend resume for interviews');
    expect(hostText).toContain('30-second recruiter skim test');
    expect(hostText).toContain('frontend developer resume ATS keywords');
    expect(hostText).toContain('frontend resume bullet rewrites');
    expect(hostText).toContain('junior frontend developer resume');
    expect(hostText).toContain('senior frontend developer resume');
    expect(hostText).toContain('front end developer resume examples');
    expect(hostText).toContain('front-end developer resume');
    expect(hostText).toContain('frontend resume that gets interviews');
    expect(hostText).toContain('frontend interview resume');
    expect(hostText).toContain('front end developer resume keywords');
    expect(hostText).toContain('frontend resume skills');
    expect(hostText).toContain('front end developer resume bullet examples');
    expect(hostText).toContain('entry level front end developer resume');
    expect(hostText).toContain('react developer resume');
  });

  it('renders role examples, ATS groups, metrics, rejection triggers, and FAQ content', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();

    expect(host.querySelector('[data-testid="resume-ats-keyword-map"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="resume-role-examples"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="resume-metrics-library"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="resume-rejection-triggers"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="resume-interview-loop-map"]')).not.toBeNull();
    expect(hostText).toContain('React, Angular, Vue, Next.js');
    expect(hostText).toContain('Core Web Vitals, LCP, bundle size, lazy loading');
    expect(hostText).toContain('How do I write a frontend developer resume that gets interviews?');
    expect(hostText).toContain('What front end developer resume examples should I study?');
    expect(hostText).toContain('Which frontend developer resume ATS keywords should I include?');
  });

  it('renders critical internal links', () => {
    const linkTargets = hrefs();

    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/system-design');
    expect(linkTargets).toContain('/guides/interview-blueprint/quiz');
    expect(linkTargets).toContain('/guides/system-design-blueprint/radio-framework');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/system-design/component-design-system-architecture');
    expect(linkTargets).toContain('/system-design/realtime-search-debounce-cache');
  });
});
