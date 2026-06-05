import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { JsProblemsArticle } from './js-problems-article.component';

describe('JsProblemsArticle', () => {
  let fixture: ComponentFixture<JsProblemsArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/javascript-interviews');

    await TestBed.configureTestingModule({
      imports: [JsProblemsArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JsProblemsArticle);
    fixture.componentInstance.readerPromise = 'Custom JavaScript guide promise.';
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

  it('renders the JavaScript interview map shell and freshness signal', () => {
    const hostText = text();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = fixture.nativeElement.querySelector('[data-testid="js-guide-freshness"]');

    expect(h1?.textContent?.trim()).toBe('JavaScript Coding Interview Questions and Patterns for Frontend Engineers (2026)');
    expect(h1?.textContent || '').toContain('JavaScript Coding Interview Questions');
    expect(hostText).toContain('frontend JavaScript coding interview questions');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(hostText).toContain('Custom JavaScript guide promise.');
  });

  it('renders the practice proof band with JavaScript conversion links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const proof = host.querySelector('[data-testid="js-guide-practice-proof"]') as HTMLElement | null;
    const links = Array.from(proof?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    const proofText = proof?.textContent || '';

    expect(proof).not.toBeNull();
    expect(proofText).toContain('500+');
    expect(proofText).toContain('practice questions');
    expect(proofText).toContain('JavaScript');
    expect(proofText).toContain('function drills');
    expect(proofText).toContain('Live');
    expect(proofText).toContain('editor + checks');
    expect(proofText).toContain('Async + DOM');
    expect(links[0]?.getAttribute('href') || '').toContain('/coding?view=formats&category=js-fn');
    expect(links[1]?.getAttribute('href') || '').toBe('/javascript/interview-questions');
  });

  it('renders 12 most-asked JavaScript coding interview pattern cards with direct drill links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const cards = host.querySelectorAll('[data-testid="js-guide-pattern-cards"] .pattern-card');
    const debounce = host.querySelector('[data-testid="js-pattern-debounce"]') as HTMLAnchorElement | null;
    const throttle = host.querySelector('[data-testid="js-pattern-throttle"]') as HTMLAnchorElement | null;
    const promiseAll = host.querySelector('[data-testid="js-pattern-promise-all"]') as HTMLAnchorElement | null;
    const emitter = host.querySelector('[data-testid="js-pattern-event-emitter"]') as HTMLAnchorElement | null;
    const delegated = host.querySelector('[data-testid="js-pattern-dom-delegation"]') as HTMLAnchorElement | null;

    expect(cards.length).toBe(12);
    expect(hostText).toContain('Most asked JavaScript coding interview patterns');
    expect(hostText).toContain('Debounce');
    expect(hostText).toContain('Promise combinators');
    expect(hostText).toContain('Event loop tracing');
    expect(hostText).toContain('this, bind, new, instanceof');
    expect(hostText).toContain('Deep clone and deep equal');
    expect(hostText).toContain('DOM event delegation');
    expect(debounce?.getAttribute('href') || '').toContain('/javascript/coding/js-debounce');
    expect(throttle?.getAttribute('href') || '').toContain('/javascript/coding/js-throttle');
    expect(promiseAll?.getAttribute('href') || '').toContain('/javascript/coding/js-promise-all');
    expect(emitter?.getAttribute('href') || '').toContain('/javascript/coding/js-event-emitter-mini');
    expect(delegated?.getAttribute('href') || '').toContain('/javascript/coding/js-delegated-events-2');
  });

  it('renders the 25-question JavaScript interview map', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const questionItems = host.querySelectorAll('.question-map li');
    const linkTargets = hrefs();

    expect(hostText).toContain('25 JavaScript coding interview questions to practice');
    expect(questionItems.length).toBe(25);
    expect(hostText).toContain('Implement debounce with trailing, leading, and cancel behavior.');
    expect(hostText).toContain('Trace event loop output with promises and timers.');
    expect(hostText).toContain('Build a mini EventEmitter.');
    expect(hostText).toContain('Build an LRU cache with bounded memory.');
    expect(linkTargets).toContain('/javascript/coding/js-concurrency-map-limit');
    expect(linkTargets).toContain('/javascript/coding/js-take-latest');
    expect(linkTargets).toContain('/javascript/coding/js-create-lru-cache');
  });

  it('renders practical debounce, Promise.all, and event loop worked examples', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Debounce worked example');
    expect(hostText).toContain('Clarify checklist');
    expect(hostText).toContain('Timer and closure state model');
    expect(hostText).toContain('Leading/trailing/cancel policy');
    expect(hostText).toContain('Promise.all worked example');
    expect(hostText).toContain('Fail-fast policy');
    expect(hostText).toContain('Empty input resolves to []');
    expect(hostText).toContain('Non-promise values are wrapped');
    expect(hostText).toContain('Event loop worked example');
    expect(hostText).toContain('Sync stack');
    expect(hostText).toContain('Microtasks');
    expect(hostText).toContain('Macrotasks');
    expect(hostText).toContain('await continuation');
    expect(linkTargets).toContain('/javascript/coding/js-debounce');
    expect(linkTargets).toContain('/javascript/coding/js-promise-all');
    expect(linkTargets).toContain('/javascript/trivia/js-event-loop');
    expect(linkTargets).toContain('/javascript/trivia/js-microtasks-vs-macrotasks');
  });

  it('renders format links and visible FAQ content', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Choose your practice format');
    expect(hostText).toContain('JavaScript functions');
    expect(hostText).toContain('Concepts and Q&A');
    expect(hostText).toContain('React UI coding');
    expect(hostText).toContain('Frontend coding guide');
    expect(hostText).toContain('JavaScript prep path');
    expect(hostText).toContain('What are the most asked JavaScript coding interview questions?');
    expect(hostText).toContain('How should I practice JavaScript utility function interview questions?');
    expect(hostText).toContain('Which JavaScript promise interview questions should I practice?');
    expect(hostText).toContain('How do I prepare for JavaScript event loop output questions?');
    expect(hostText).toContain('Is this different from JavaScript interview questions and answers?');
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=js-fn'))).toBeTrue();
    expect(linkTargets).toContain('/javascript/interview-questions');
    expect(linkTargets).toContain('/react/interview-questions');
    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
    expect(linkTargets).toContain('/guides/framework-prep/javascript-prep-path');
  });
});
