import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FeCodingArticle } from './fe-coding-article.component';

describe('FeCodingArticle', () => {
  let fixture: ComponentFixture<FeCodingArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/coding-interviews');

    await TestBed.configureTestingModule({
      imports: [FeCodingArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeCodingArticle);
    fixture.componentInstance.readerPromise = 'Custom coding guide promise.';
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

  it('renders the coding interview SEO landing page shell and freshness signal', () => {
    const hostText = text();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = fixture.nativeElement.querySelector('[data-testid="coding-guide-freshness"]');

    expect(h1?.textContent?.trim()).toBe('Frontend Coding Interview Questions and Prep Guide (2026)');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(hostText).toContain('Custom coding guide promise.');
  });

  it('renders the major search-intent sections and the 25-question checklist', () => {
    const hostText = text();
    const questions = fixture.nativeElement.querySelectorAll('[data-testid="coding-guide-question-list"] li');

    expect(hostText).toContain('What frontend coding interviews test');
    expect(hostText).toContain('Common prompt types');
    expect(hostText).toContain('Most asked frontend coding prompts');
    expect(hostText).toContain('25 frontend coding interview questions to practice');
    expect(hostText).toContain('Evaluation rubric');
    expect(hostText).toContain('45-minute and 60-minute interview strategy');
    expect(hostText).toContain('Worked example: autocomplete');
    expect(hostText).toContain('Choose your practice format');
    expect(hostText).toContain('What to practice next');
    expect(questions.length).toBe(10);
    expect(fixture.nativeElement.querySelectorAll('.question-list li').length).toBe(25);
    expect(hostText).toContain('Build accessible autocomplete with debounce and keyboard selection');
    expect(hostText).toContain('Design a shopping cart or transfer list with derived totals and selection');
  });

  it('renders the practice proof band with machine-coding conversion links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const proof = host.querySelector('[data-testid="coding-guide-practice-proof"]') as HTMLElement | null;
    const links = Array.from(proof?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    const proofText = proof?.textContent || '';

    expect(proof).not.toBeNull();
    expect(proofText).toContain('500+');
    expect(proofText).toContain('practice questions');
    expect(proofText).toContain('3');
    expect(proofText).toContain('guided plans');
    expect(proofText).toContain('Live');
    expect(proofText).toContain('editor + checks');
    expect(proofText).toContain('Most asked');
    expect(links[0]?.getAttribute('href') || '').toBe('/machine-coding');
    expect(links[1]?.getAttribute('href') || '').toContain('/coding?view=formats&category=ui');
  });

  it('renders 10 most-asked prompt cards with direct practice links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const cards = host.querySelectorAll('[data-testid="coding-guide-prompt-cards"] .prompt-card');
    const autocomplete = host.querySelector('[data-testid="coding-prompt-autocomplete"]') as HTMLAnchorElement | null;
    const nestedCheckbox = host.querySelector('[data-testid="coding-prompt-nested-checkbox"]') as HTMLAnchorElement | null;
    const dataTable = host.querySelector('[data-testid="coding-prompt-data-table"]') as HTMLAnchorElement | null;
    const tabs = host.querySelector('[data-testid="coding-prompt-tabs"]') as HTMLAnchorElement | null;
    const accordion = host.querySelector('[data-testid="coding-prompt-accordion"]') as HTMLAnchorElement | null;

    expect(cards.length).toBe(10);
    expect(hostText).toContain('Debounced Search');
    expect(hostText).toContain('Contact Form');
    expect(hostText).toContain('Multi-step Signup');
    expect(hostText).toContain('Nested Comments');
    expect(hostText).toContain('Test focus: slow response cannot overwrite newer results.');
    expect(hostText).toContain('Test focus: roving focus, disabled tabs, and active panel rendering.');
    expect(autocomplete?.getAttribute('href') || '').toContain('/react/coding/react-autocomplete-search-starter');
    expect(nestedCheckbox?.getAttribute('href') || '').toContain('/react/coding/react-nested-checkboxes');
    expect(dataTable?.getAttribute('href') || '').toContain('/react/coding/react-pagination-table');
    expect(tabs?.getAttribute('href') || '').toContain('/react/coding/react-tabs-switcher');
    expect(accordion?.getAttribute('href') || '').toContain('/react/coding/react-accordion-faq');
  });

  it('renders the practical autocomplete worked example and format links', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Clarify first');
    expect(hostText).toContain('State model');
    expect(hostText).toContain('Stale response policy');
    expect(hostText).toContain('Keyboard and a11y checks');
    expect(hostText).toContain('latestRequestId');
    expect(hostText).toContain('only the newest request is allowed to update visible results');
    expect(hostText).toContain('React machine coding');
    expect(hostText).toContain('Angular machine coding');
    expect(hostText).toContain('Vue machine coding');
    expect(hostText).toContain('HTML/CSS UI coding');
    expect(hostText).toContain('System design follow-up');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/react/interview-questions');
    expect(linkTargets).toContain('/angular/interview-questions');
    expect(linkTargets).toContain('/vue/interview-questions');
    expect(linkTargets).toContain('/system-design');
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=js-fn'))).toBeTrue();
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=html-css'))).toBeTrue();
  });

  it('renders FAQ content and key internal links', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('What questions are asked in frontend coding interviews?');
    expect(hostText).toContain('How do I prepare for a frontend coding interview?');
    expect(hostText).toContain('How are frontend UI coding interviews evaluated?');
    expect(linkTargets).toContain('/machine-coding');
    expect(linkTargets).toContain('/coding');
    expect(linkTargets).toContain('/guides/interview-blueprint/javascript-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/ui-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/dsa-for-fe');
    expect(linkTargets).toContain('/guides/interview-blueprint/intro');
    expect(linkTargets).toContain('/guides/framework-prep');
  });
});
