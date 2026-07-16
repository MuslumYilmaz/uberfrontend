import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FeDsaArticle } from './fe-dsa-article.component';

describe('FeDsaArticle', () => {
  let fixture: ComponentFixture<FeDsaArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/dsa-for-fe');

    await TestBed.configureTestingModule({
      imports: [FeDsaArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeDsaArticle);
    fixture.componentInstance.readerPromise = 'Custom DSA guide promise.';
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

  it('renders the DSA practice map shell, freshness, and proof CTA band', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const h1 = host.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = host.querySelector('[data-testid="dsa-guide-freshness"]');
    const proof = host.querySelector('[data-testid="dsa-guide-practice-proof"]') as HTMLElement | null;
    const links = Array.from(proof?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    const proofText = proof?.textContent || '';

    expect(h1?.textContent?.trim()).toBe('DSA for Frontend Interviews: Data Structures, Algorithms, and Practice Map (2026)');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Editorial');
    expect(hostText).toContain('Custom DSA guide promise.');
    expect(hostText).toContain('frontend algorithm interview questions');
    expect(proofText).toContain('500+');
    expect(proofText).toContain('practice questions');
    expect(proofText).toContain('JavaScript');
    expect(proofText).toContain('DSA drills');
    expect(proofText).toContain('Live');
    expect(proofText).toContain('editor + checks');
    expect(proofText).toContain('Frontend');
    expect(proofText).toContain('data patterns');
    expect(links[0]?.getAttribute('href') || '').toContain('/coding?view=formats&category=js-fn');
    expect(links[1]?.getAttribute('href') || '').toBe('/guides/interview-blueprint/javascript-interviews');
  });

  it('renders 12 frontend DSA pattern cards with direct JavaScript drill links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const cards = host.querySelectorAll('[data-testid="dsa-pattern-cards"] .pattern-card');
    const linkTargets = hrefs();

    expect(cards.length).toBe(12);
    expect(hostText).toContain('Most asked frontend DSA and algorithm interview patterns');
    expect(hostText).toContain('Array/reduce');
    expect(hostText).toContain('Hash Map/Set');
    expect(hostText).toContain('GroupBy');
    expect(hostText).toContain('Flatten/recursion');
    expect(hostText).toContain('Stack/Queue');
    expect(hostText).toContain('Tree DFS/BFS');
    expect(hostText).toContain('Two pointers/sliding window');
    expect(hostText).toContain('LRU cache');
    expect(hostText).toContain('Async queue/concurrency');
    expect(linkTargets).toContain('/javascript/coding/js-array-prototype-reduce');
    expect(linkTargets).toContain('/javascript/coding/js-group-by');
    expect(linkTargets).toContain('/javascript/coding/js-flatten-depth');
    expect(linkTargets).toContain('/javascript/coding/js-stack-queue-implementation');
    expect(linkTargets).toContain('/javascript/coding/js-create-lru-cache');
    expect(linkTargets).toContain('/javascript/coding/js-deep-clone');
    expect(linkTargets).toContain('/javascript/coding/js-deep-equal');
    expect(linkTargets).toContain('/javascript/coding/js-concurrency-map-limit');
    expect(linkTargets).toContain('/javascript/coding/js-take-latest');
  });

  it('renders the 20-item frontend DSA question map with direct practice routes', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const questionItems = host.querySelectorAll('[data-testid="dsa-question-map"] li');
    const linkTargets = hrefs();

    expect(hostText).toContain('Frontend DSA question map');
    expect(questionItems.length).toBe(20);
    expect(hostText).toContain('Implement Array.prototype.reduce.');
    expect(hostText).toContain('Remove duplicates with Set.');
    expect(hostText).toContain('Group records by status or category.');
    expect(hostText).toContain('Build an LRU cache with bounded memory.');
    expect(hostText).toContain('Explain the Big-O trade-off for a large filtered list.');
    expect(linkTargets).toContain('/javascript/coding/js-array-prototype-reduce');
    expect(linkTargets).toContain('/javascript/coding/js-group-by');
    expect(linkTargets).toContain('/javascript/coding/js-flatten-depth');
    expect(linkTargets).toContain('/javascript/coding/js-stack-queue-implementation');
    expect(linkTargets).toContain('/javascript/coding/js-create-lru-cache');
    expect(linkTargets).toContain('/javascript/coding/js-concurrency-map-limit');
    expect(linkTargets).toContain('/javascript/coding/js-take-latest');
    expect(linkTargets).toContain('/javascript/trivia/js-queue-vs-stack');
  });

  it('renders interview-grade worked examples for groupBy, flatten, stack/queue, and LRU', () => {
    const hostText = text();

    expect(hostText).toContain('Worked examples to rehearse');
    expect(hostText).toContain('Input contract');
    expect(hostText).toContain('Key policy');
    expect(hostText).toContain('empty input');
    expect(hostText).toContain('Object vs Map');
    expect(hostText).toContain('Depth boundary');
    expect(hostText).toContain('mixed primitives');
    expect(hostText).toContain('Recursion vs iterative');
    expect(hostText).toContain('Stack overflow note');
    expect(hostText).toContain('Array.shift() O(n) trap');
    expect(hostText).toContain('Head-index queue');
    expect(hostText).toContain('Undo/redo state model');
    expect(hostText).toContain('Map ordering');
    expect(hostText).toContain('get/put complexity');
    expect(hostText).toContain('Bounded memory');
    expect(hostText).toContain('Big-O');
  });

  it('renders the 45-minute flow, scoring rubric, skip/prioritize guidance, and FAQ', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('45-minute frontend DSA round flow');
    expect(hostText).toContain('Clarify input, output, size, duplicates, empty cases, and mutation policy.');
    expect(hostText).toContain('State a brute force approach and its Big-O.');
    expect(hostText).toContain('Dry run, test edge cases, and explain complexity.');
    expect(hostText).toContain('Scoring rubric');
    expect(hostText).toContain('Correctness');
    expect(hostText).toContain('Data structure fit');
    expect(hostText).toContain('Testing discipline');
    expect(hostText).toContain('What to skip, know lightly, and prioritize');
    expect(hostText).toContain('Prioritize');
    expect(hostText).toContain('Know lightly');
    expect(hostText).toContain('Skip unless required');
    expect(hostText).toContain('Is DSA required for frontend interviews?');
    expect(hostText).toContain('Do frontend interviews ask algorithm questions?');
    expect(hostText).toContain('What DSA should frontend engineers prioritize?');
    expect(hostText).toContain('How should I practice JavaScript DSA for frontend interviews?');
    expect(hostText).toContain('How much LeetCode should I do for frontend interviews?');
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=js-fn'))).toBeTrue();
    expect(linkTargets).toContain('/guides/interview-blueprint/javascript-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
  });
});
