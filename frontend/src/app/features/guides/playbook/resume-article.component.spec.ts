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
    expect(hostText).toContain('shipped UI, measurable product impact');
    expect(hostText).toContain('match the role without keyword stuffing');
  });

  it('renders the major resume upgrade sections', () => {
    const hostText = text();

    expect(hostText).toContain('Quick answer: how to write a frontend resume that gets interviews');
    expect(hostText).toContain('What frontend resume screens test');
    expect(hostText).toContain('30-second recruiter skim test');
    expect(hostText).toContain('Frontend resume sections that get interviews');
    expect(hostText).toContain('Practice note from FrontendAtlas resume reviews');
    expect(hostText).toContain('How this guide was reviewed');
    expect(hostText).toContain('Complete frontend resume example');
    expect(hostText).toContain('Frontend resume summary examples');
    expect(hostText).toContain('Frontend developer resume ATS keywords');
    expect(hostText).toContain('JD-to-ATS keyword matching examples');
    expect(hostText).toContain('Before/after frontend resume bullet rewrites');
    expect(hostText).toContain('Junior, mid-level, and senior frontend resume examples');
    expect(hostText).toContain('Use sample metrics responsibly');
    expect(hostText).toContain('Frontend impact metrics library');
    expect(hostText).toContain('Common rejection triggers');
    expect(hostText).toContain('Resume to interview loop map');
    expect(hostText).toContain('What to practice after your resume gets callbacks');
    expect(hostText).toContain('Frontend resume FAQ');
  });

  it('renders quick answer and mobile-first section summary', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const quickItems = host.querySelectorAll('[data-testid="resume-quick-answer"] li');
    const summaryItems = host.querySelectorAll('[data-testid="resume-mobile-section-summary"] li');

    expect(quickItems.length).toBe(5);
    expect(summaryItems.length).toBe(5);
    expect(hostText).toContain('Clarify the top third');
    expect(hostText).toContain('Rewrite the first role bullet');
    expect(hostText).toContain('Prove ATS keywords');
    expect(hostText).toContain('Create three interview hooks');
    expect(hostText).toContain('Cut rejection triggers');
    expect(hostText).toContain('On mobile, scan these fixes before the wider section table');
    expect(hostText).toContain('Header: make contact links');
    expect(hostText).toContain('Skills: group keywords by proof');
  });

  it('renders EEAT practice notes and review methodology', () => {
    const host = fixture.nativeElement as HTMLElement;
    const practiceNote = host.querySelector('[data-testid="resume-practice-note"]');
    const reviewMethodology = host.querySelector('[data-testid="resume-review-methodology"]');
    const metricsNote = host.querySelector('[data-testid="resume-sample-metrics-note"]');
    const hostText = text();

    expect(practiceNote).not.toBeNull();
    expect(reviewMethodology).not.toBeNull();
    expect(metricsNote).not.toBeNull();
    expect(hostText).toContain('Weak frontend resumes usually list tools first');
    expect(hostText).toContain('shipped UI surface, measurable result, and interview story');
    expect(hostText).toContain('FrontendAtlas interview blueprint');
    expect(hostText).toContain('frontend coding prep, UI component practice, system design prep paths');
    expect(hostText).toContain('Replace every percentage, user count, and incident reduction');
    expect(hostText).toContain('numbers from your own work that you can defend');
  });

  it('renders a complete frontend resume example with annotated proof points', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const example = host.querySelector('[data-testid="resume-complete-example"]');
    const notes = host.querySelector('[data-testid="resume-complete-example-notes"]');

    expect(example).not.toBeNull();
    expect(notes).not.toBeNull();
    expect(example?.textContent || '').toContain('Header and links');
    expect(example?.textContent || '').toContain('Summary');
    expect(example?.textContent || '').toContain('Skills');
    expect(example?.textContent || '').toContain('Experience');
    expect(example?.textContent || '').toContain('Projects');
    expect(example?.textContent || '').toContain('Education');
    expect(hostText).toContain('mayachen.dev');
    expect(hostText).toContain('Top third clarity');
    expect(hostText).toContain('Proof-backed keywords');
    expect(hostText).toContain('Measurable impact');
    expect(hostText).toContain('Interview hooks');
  });

  it('renders frontend resume summary examples and weak-vs-strong summary rewrite', () => {
    const host = fixture.nativeElement as HTMLElement;
    const summaryExamples = host.querySelectorAll('[data-testid="resume-summary-examples"] .role-card');
    const summaryRewrite = host.querySelector('[data-testid="resume-summary-rewrite"]');
    const hostText = text();

    expect(summaryExamples.length).toBe(5);
    expect(summaryRewrite).not.toBeNull();
    expect(hostText).toContain('Junior');
    expect(hostText).toContain('Mid-level');
    expect(hostText).toContain('Senior');
    expect(hostText).toContain('React-focused');
    expect(hostText).toContain('Career-switcher');
    expect(hostText).toContain('Passionate front-end developer looking for a challenging role');
    expect(hostText).toContain('Frontend engineer with 3 years building React and TypeScript SaaS workflows');
  });

  it('renders JD-to-ATS keyword mapping examples', () => {
    const host = fixture.nativeElement as HTMLElement;
    const mappingRows = host.querySelectorAll('[data-testid="resume-jd-ats-mapping"] tbody tr');
    const hostText = text();

    expect(mappingRows.length).toBe(3);
    expect(hostText).toContain('React and TypeScript features');
    expect(hostText).toContain('accessibility and frontend performance');
    expect(hostText).toContain('design and backend teams');
    expect(hostText).toContain('Keywords to include');
    expect(hostText).toContain('Proof bullet to support it');
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
    expect(hostText).toContain('frontend developer resume summary');
    expect(hostText).toContain('JD-to-ATS keyword matching examples');
    expect(hostText).toContain('frontend resume bullet rewrites');
    expect(hostText).toContain('junior frontend developer resume');
    expect(hostText).toContain('senior frontend developer resume');
    expect(hostText).toContain('frontend resume that gets interviews');
    expect(hostText).toContain('skills as evidence labels');
    expect(hostText).toContain('React-focused angle');
    expect(hostText).toContain('job description and your strongest proof');
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
    expect(hostText).toContain('What should a complete frontend resume example include?');
    expect(hostText).toContain('How do I write a frontend developer resume summary?');
    expect(hostText).toContain('Which frontend developer resume ATS keywords should I include?');
    expect(hostText).toContain('How do I match frontend resume keywords to a job description?');
    expect(hostText).toContain('How is this frontend resume guide reviewed?');
  });

  it('places practice links before the FAQ section', () => {
    const hostText = text();
    const practiceIndex = hostText.indexOf('What to practice after your resume gets callbacks');
    const faqIndex = hostText.indexOf('Frontend resume FAQ');

    expect(practiceIndex).toBeGreaterThan(-1);
    expect(faqIndex).toBeGreaterThan(-1);
    expect(practiceIndex).toBeLessThan(faqIndex);
  });

  it('renders critical internal links', () => {
    const linkTargets = hrefs();

    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/system-design');
    expect(linkTargets).toContain('/guides/interview-blueprint/quiz');
    expect(linkTargets).toContain('/guides/behavioral/intro');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/system-design/component-design-system-architecture');
    expect(linkTargets).toContain('/system-design/realtime-search-debounce-cache');
  });
});
