import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FeUiIn60Article } from './fe-ui-in-60.component';

describe('FeUiIn60Article', () => {
  let fixture: ComponentFixture<FeUiIn60Article>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/ui-interviews');

    await TestBed.configureTestingModule({
      imports: [FeUiIn60Article],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeUiIn60Article);
    fixture.componentInstance.readerPromise = 'Custom UI guide promise.';
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

  it('renders the UI practice map shell, freshness, and proof CTA band', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const h1 = host.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = host.querySelector('[data-testid="ui-guide-freshness"]');
    const proof = host.querySelector('[data-testid="ui-guide-practice-proof"]') as HTMLElement | null;
    const links = Array.from(proof?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    const proofText = proof?.textContent || '';

    expect(h1?.textContent?.trim()).toBe('Frontend UI Interview Questions: Build Accessible Components Under Time');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Team');
    expect(hostText).toContain('Custom UI guide promise.');
    expect(hostText).toContain('frontend UI coding interview');
    expect(hostText).toContain('component interview questions');
    expect(hostText).toContain('React UI coding interview');
    expect(proofText).toContain('500+');
    expect(proofText).toContain('practice questions');
    expect(proofText).toContain('UI');
    expect(proofText).toContain('component drills');
    expect(proofText).toContain('Live');
    expect(proofText).toContain('editor + checks');
    expect(proofText).toContain('Accessibility-first');
    expect(proofText).toContain('patterns');
    expect(links[0]?.getAttribute('href') || '').toContain('/coding?view=formats&category=ui');
    expect(links[1]?.getAttribute('href') || '').toBe('/guides/interview-blueprint/coding-interviews');
  });

  it('renders 12 frontend UI prompt cards with direct practice links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const cards = host.querySelectorAll('[data-testid="ui-prompt-cards"] .prompt-card');
    const linkTargets = hrefs();

    expect(hostText).toContain('Most asked frontend UI interview questions and component prompts');
    expect(cards.length).toBe(12);
    expect(hostText).toContain('Modal / Confirm Dialog');
    expect(hostText).toContain('Autocomplete');
    expect(hostText).toContain('Contact Form');
    expect(hostText).toContain('Tabs');
    expect(hostText).toContain('Accordion');
    expect(hostText).toContain('Data Table / Pagination');
    expect(hostText).toContain('Nested Checkbox Tree');
    expect(hostText).toContain('Progress Bar');
    expect(hostText).toContain('accessible modal');
    expect(hostText).toContain('React autocomplete interview question');
    expect(hostText).toContain('React tabs interview question');
    expect(hostText).toContain('React accordion interview question');
    expect(hostText).toContain('React data table pagination interview question');
    expect(hostText).toContain('React nested checkbox interview question');
    expect(linkTargets).toContain('/html/coding/html-dialog-confirm-a11y');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/react/coding/react-tabs-switcher');
    expect(linkTargets).toContain('/react/coding/react-accordion-faq');
    expect(linkTargets).toContain('/react/coding/react-pagination-table');
    expect(linkTargets).toContain('/react/coding/react-nested-checkboxes');
    expect(linkTargets).toContain('/react/coding/react-nested-comments');
    expect(linkTargets).toContain('/react/coding/react-star-rating');
  });

  it('renders an interview-grade Confirm Dialog worked example', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Worked example: Confirm Dialog');
    expect(hostText).toContain('Clarify checklist');
    expect(hostText).toContain('DOM/state model');
    expect(hostText).toContain('Focus restore');
    expect(hostText).toContain('Focus trap policy');
    expect(hostText).toContain('Escape policy');
    expect(hostText).toContain('outside click');
    expect(hostText).toContain('A11y checks');
    expect(hostText).toContain('accessible name');
    expect(hostText).toContain('visible focus');
    expect(linkTargets).toContain('/html/coding/html-dialog-confirm-a11y');
  });

  it('renders the UI round flow, scoring rubric, skip/prioritize guidance, format links, and FAQ', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('45/60-minute UI round flow');
    expect(hostText).toContain('Clarify prompt, data shape, interactions, keyboard expectations, and edge cases.');
    expect(hostText).toContain('Ship MVP markup and the smallest visible state path.');
    expect(hostText).toContain('Harden keyboard/a11y, responsive styling, loading, empty, and error states.');
    expect(hostText).toContain('What interviewers score');
    expect(hostText).toContain('Component boundaries');
    expect(hostText).toContain('State correctness');
    expect(hostText).toContain('Keyboard support');
    expect(hostText).toContain('ARIA and semantics');
    expect(hostText).toContain('What to skip vs prioritize');
    expect(hostText).toContain('Prioritize');
    expect(hostText).toContain('Skip unless asked');
    expect(hostText).toContain('What are the most common frontend UI interview questions?');
    expect(hostText).toContain('How do I practice frontend UI coding interview questions?');
    expect(hostText).toContain('Which React UI component questions should I practice?');
    expect(hostText).toContain('How do interviewers score accessibility and keyboard support?');
    expect(hostText).toContain('Is this different from frontend machine coding interviews?');
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=ui'))).toBeTrue();
    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/api-design');
  });
});
