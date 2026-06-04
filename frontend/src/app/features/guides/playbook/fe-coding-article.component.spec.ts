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
    expect(hostText).toContain('25 frontend coding interview questions to practice');
    expect(hostText).toContain('Evaluation rubric');
    expect(hostText).toContain('45-minute and 60-minute interview strategy');
    expect(hostText).toContain('Worked example: autocomplete');
    expect(hostText).toContain('What to practice next');
    expect(questions.length).toBe(10);
    expect(fixture.nativeElement.querySelectorAll('.question-list li').length).toBe(25);
    expect(hostText).toContain('Build accessible autocomplete with debounce and keyboard selection');
    expect(hostText).toContain('Design a shopping cart or transfer list with derived totals and selection');
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
