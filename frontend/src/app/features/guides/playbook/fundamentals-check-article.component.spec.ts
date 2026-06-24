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
    expect(hostText).toContain('answer 12 questions');
    expect(hostText).toContain('give yourself one point');
    expect(hostText).toContain('0-5, 6-9, or 10-12 score band');
  });

  it('renders the major diagnostic landing sections', () => {
    const hostText = text();

    expect(hostText).toContain('What frontend fundamentals interviews test');
    expect(hostText).toContain('Quick answer: 15-minute quiz flow');
    expect(hostText).toContain('Practice note from FrontendAtlas drills');
    expect(hostText).toContain('How this quiz was reviewed');
    expect(hostText).toContain('References used for this diagnostic');
    expect(hostText).toContain('15-minute frontend fundamentals diagnostic');
    expect(hostText).toContain('Browser rendering interview questions');
    expect(hostText).toContain('CSS layout interview questions');
    expect(hostText).toContain('JavaScript async interview quiz');
    expect(hostText).toContain('HTTP caching frontend interview questions');
    expect(hostText).toContain('Advanced frontend fundamentals add-on');
    expect(hostText).toContain('Score bands');
    expect(hostText).toContain('Answer rubric');
    expect(hostText).toContain('Spoken answer examples');
    expect(hostText).toContain('Practice map');
    expect(hostText).toContain('Common mistakes');
    expect(hostText).toContain('What to practice next');
    expect(hostText).toContain('Frontend fundamentals quiz FAQ');
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

  it('renders EEAT review notes and official reference links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const referenceLinks = host.querySelectorAll('[data-testid="fundamentals-official-references"] a');
    const linkTargets = hrefs();

    expect(referenceLinks.length).toBe(6);
    expect(hostText).toContain('weak answers usually stop at a definition');
    expect(hostText).toContain('visible UI consequence, the debugging step');
    expect(hostText).toContain('reviewed against FrontendAtlas trivia and coding drills');
    expect(hostText).toContain('official web platform references');
    expect(hostText).toContain('MDN Critical rendering path');
    expect(hostText).toContain('WAI-ARIA Authoring Practices Guide');
    expect(linkTargets).toContain('https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path');
    expect(linkTargets).toContain('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model');
    expect(linkTargets).toContain('https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction');
    expect(linkTargets).toContain('https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching');
    expect(linkTargets).toContain('https://www.w3.org/WAI/ARIA/apg/');
    expect(linkTargets).toContain('https://web.dev/learn/performance');
  });

  it('renders the optional advanced fundamentals add-on without changing the core score', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const coreQuestions = host.querySelectorAll('.question-card');
    const addOnCards = host.querySelectorAll('[data-testid="fundamentals-advanced-add-on"] .addon-card');

    expect(coreQuestions.length).toBe(12);
    expect(addOnCards.length).toBe(4);
    expect(hostText).toContain('optional 5-minute stretch');
    expect(hostText).toContain('Do not add these four prompts to the core score');
    expect(hostText).toContain('How do semantic HTML and accessibility change a component interview answer?');
    expect(hostText).toContain('How would you debug a responsive layout that breaks on mobile?');
    expect(hostText).toContain('What frontend performance issue would you check first in a slow UI?');
    expect(hostText).toContain('What framework fundamentals should you explain without guessing?');
  });

  it('renders long-tail intent phrases and answer quality guidance', () => {
    const hostText = text();

    expect(hostText).toContain('frontend interview fundamentals quiz');
    expect(hostText).toContain('15-minute frontend fundamentals diagnostic');
    expect(hostText).toContain('Use this readiness check before moving into coding');
    expect(hostText).toContain('Browser rendering interview questions');
    expect(hostText).toContain('CSS layout interview questions');
    expect(hostText).toContain('JavaScript async interview quiz');
    expect(hostText).toContain('HTTP caching frontend interview questions');
    expect(hostText).toContain('frontend interview score bands');
    expect(hostText).toContain('frontend technical interview');
    expect(hostText).toContain('accessibility, responsive layout, performance triage, and framework reasoning');
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
    expect(host.querySelector('[data-testid="fundamentals-spoken-answer-examples"]')).not.toBeNull();
    expect(hostText).toContain('Define the concept in plain English before using jargon.');
    expect(hostText).toContain('Attach one browser, CSS, JavaScript, or HTTP example to the answer.');
    expect(hostText).toContain('Name the failure mode or production trade-off that makes the concept matter.');
    expect(hostText).toContain('Weak spoken answer:');
    expect(hostText).toContain('Interview-ready spoken answer:');
    expect(hostText).toContain('Why it scores:');
    expect(hostText).toContain('The browser builds the DOM from HTML and the CSSOM from CSS');
    expect(hostText).toContain('I would inspect the computed box first');
    expect(hostText).toContain('Synchronous code runs first, then the browser drains the microtask queue');
    expect(hostText).toContain('I would start with semantic HTML, preserve keyboard and focus behavior');
    expect(hostText).toContain('Memorized definitions only');
    expect(hostText).toContain('Mixing browser queues');
    expect(hostText).toContain('What is a frontend interview fundamentals quiz?');
    expect(hostText).toContain('How do I use this as a 15-minute frontend fundamentals diagnostic?');
    expect(hostText).toContain('Which browser rendering interview questions should I know?');
    expect(hostText).toContain('Which CSS layout interview questions matter most?');
    expect(hostText).toContain('What JavaScript async topics appear in frontend interview quizzes?');
    expect(hostText).toContain('What HTTP caching topics should frontend engineers know?');
    expect(hostText).toContain('Should I include framework, accessibility, responsive, and performance questions in a fundamentals quiz?');
    expect(hostText).toContain('How is this frontend fundamentals quiz reviewed?');
  });
});
