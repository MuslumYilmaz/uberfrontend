import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FundamentalsCheckArticle } from './fundamentals-check-article.component';

describe('FundamentalsCheckArticle', () => {
  let fixture: ComponentFixture<FundamentalsCheckArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/quiz');

    await TestBed.configureTestingModule({
      imports: [FundamentalsCheckArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FundamentalsCheckArticle);
    fixture.componentInstance.readerPromise = 'Custom fundamentals diagnostic promise.';
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

  it('renders the fundamentals diagnostic shell and freshness signal', () => {
    const hostText = text();
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = fixture.nativeElement.querySelector('[data-testid="fundamentals-guide-freshness"]');

    expect(h1?.textContent?.trim()).toBe('Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(freshness?.textContent || '').toContain('Reviewed by FrontendAtlas');
    expect(hostText).toContain('Custom fundamentals diagnostic promise.');
  });

  it('renders the major diagnostic landing sections', () => {
    const hostText = text();

    expect(hostText).toContain('What frontend fundamentals interviews test');
    expect(hostText).toContain('15-minute frontend fundamentals diagnostic');
    expect(hostText).toContain('Browser rendering interview questions');
    expect(hostText).toContain('CSS layout interview questions');
    expect(hostText).toContain('JavaScript async interview quiz');
    expect(hostText).toContain('HTTP caching frontend interview questions');
    expect(hostText).toContain('Score bands');
    expect(hostText).toContain('Answer rubric');
    expect(hostText).toContain('Practice map');
    expect(hostText).toContain('Common mistakes');
    expect(hostText).toContain('FAQ');
    expect(hostText).toContain('What to practice next');
  });

  it('renders the 12 self-check questions and score bands', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const questions = host.querySelectorAll('.question-card');
    const scoreBands = host.querySelectorAll('[data-testid="fundamentals-score-bands"] .score-card');

    expect(questions.length).toBe(12);
    expect(scoreBands.length).toBe(3);
    expect(hostText).toContain('0-5: fundamentals gaps');
    expect(hostText).toContain('6-9: usable but interview-risky');
    expect(hostText).toContain('10-12: interview-ready fundamentals');
    expect(hostText).toContain('What happens when the browser parses HTML and CSS?');
    expect(hostText).toContain('How do Cache-Control and ETag affect frontend freshness?');
  });

  it('renders long-tail intent phrases and answer quality guidance', () => {
    const hostText = text();

    expect(hostText).toContain('frontend interview fundamentals quiz');
    expect(hostText).toContain('15-minute frontend fundamentals diagnostic');
    expect(hostText).toContain('frontend interview readiness quiz');
    expect(hostText).toContain('Browser rendering interview questions');
    expect(hostText).toContain('CSS layout interview questions');
    expect(hostText).toContain('JavaScript async interview quiz');
    expect(hostText).toContain('HTTP caching frontend interview questions');
    expect(hostText).toContain('frontend interview score bands');
    expect(hostText).toContain('frontend technical interview');
    expect(hostText).toContain('Interview-ready');
  });

  it('renders the practice map and critical internal links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const linkTargets = hrefs();
    const practiceCards = host.querySelectorAll('[data-testid="fundamentals-practice-map"] .practice-card');

    expect(practiceCards.length).toBe(12);
    expect(linkTargets).toContain('/javascript/trivia/js-event-loop');
    expect(linkTargets).toContain('/javascript/trivia/js-closures');
    expect(linkTargets).toContain('/javascript/trivia/js-this-keyword');
    expect(linkTargets).toContain('/javascript/trivia/js-promises-async-await');
    expect(linkTargets).toContain('/javascript/trivia/js-microtasks-vs-macrotasks');
    expect(linkTargets).toContain('/javascript/trivia/http-caching-basics');
    expect(linkTargets).toContain('/css/trivia/css-box-model');
    expect(linkTargets).toContain('/css/trivia/css-specificity-hierarchy');
    expect(linkTargets).toContain('/css/trivia/css-grid-vs-flexbox');
    expect(linkTargets).toContain('/html/trivia/html-dom');
    expect(linkTargets).toContain('/html/trivia/html-parsing-rendering');
    expect(linkTargets).toContain('/coding');
  });

  it('renders rubric, mistakes, and FAQ content', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();

    expect(host.querySelector('[data-testid="fundamentals-answer-rubric"]')).not.toBeNull();
    expect(hostText).toContain('Memorized definitions only');
    expect(hostText).toContain('Mixing browser queues');
    expect(hostText).toContain('What is a frontend interview fundamentals quiz?');
    expect(hostText).toContain('How do I use this as a 15-minute frontend fundamentals diagnostic?');
    expect(hostText).toContain('Which browser rendering interview questions should I know?');
    expect(hostText).toContain('Which CSS layout interview questions matter most?');
    expect(hostText).toContain('What JavaScript async topics appear in frontend interview quizzes?');
    expect(hostText).toContain('What HTTP caching topics should frontend engineers know?');
  });
});
