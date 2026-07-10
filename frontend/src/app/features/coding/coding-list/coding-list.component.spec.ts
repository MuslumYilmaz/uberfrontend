import { Location } from '@angular/common';
import { PLATFORM_ID, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CodingListStateService } from '../../../core/services/coding-list-state';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodingListComponent } from './coding-list.component';

describe('CodingListComponent', () => {
  async function createComponent(options?: {
    queryParams?: Record<string, string>;
    items?: any[];
    debugItems?: any[];
    systemDesignItems?: any[];
    solved?: string[];
    source?: 'global-coding' | 'company';
    kind?: 'coding' | 'trivia' | 'all' | 'system-design';
    companySlug?: string;
  }) {
    const routeData = {
      source: options?.source ?? 'global-coding',
      kind: options?.kind ?? 'coding',
      questionList: {
        source: 'global-coding',
        kind: 'coding',
        items: options?.items ?? [],
      },
    };

    const queryParams = options?.queryParams ?? { tech: 'javascript', kind: 'coding' };
    const queryParamMap$ = new BehaviorSubject(convertToParamMap(queryParams));
    const parentParamMap$ = new BehaviorSubject(convertToParamMap({ slug: options?.companySlug ?? '' }));
    const routeStub = {
      data: of(routeData),
      queryParamMap: queryParamMap$.asObservable(),
      snapshot: {
        data: routeData,
        queryParamMap: queryParamMap$.value,
        queryParams,
      },
      parent: options?.source === 'company'
        ? {
          paramMap: parentParamMap$.asObservable(),
          snapshot: { paramMap: parentParamMap$.value },
        }
        : null,
    };

    const solvedIds = signal(options?.solved ?? []);

    await TestBed.configureTestingModule({
      imports: [CodingListComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ActivatedRoute, useValue: routeStub },
        {
          provide: QuestionService,
          useValue: {
            loadAllQuestionSummaries: jasmine.createSpy('loadAllQuestionSummaries').and.returnValue(of(options?.items ?? [])),
            loadQuestionSummaries: jasmine.createSpy('loadQuestionSummaries').and.callFake((tech: string, kind: string) => {
              const source = kind === 'debug' ? (options?.debugItems ?? []) : (options?.items ?? []);
              return of(source.filter((item) => !item.tech || item.tech === tech));
            }),
            loadQuestions: jasmine.createSpy('loadQuestions').and.callFake((tech: string, kind: string) => {
              const source = kind === 'debug' ? (options?.debugItems ?? []) : (options?.items ?? []);
              return of(source.filter((item) => !item.tech || item.tech === tech));
            }),
            loadSystemDesignList: jasmine
              .createSpy('loadSystemDesignList')
              .and.returnValue(of(options?.systemDesignItems ?? [])),
          },
        },
        {
          provide: UserProgressService,
          useValue: {
            solvedIds: computed(() => solvedIds()),
          },
        },
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
          },
        },
        {
          provide: SeoService,
          useValue: {
            updateTags: jasmine.createSpy('updateTags'),
            buildCanonicalUrl: jasmine.createSpy('buildCanonicalUrl').and.callFake((value: string) => value),
          },
        },
        {
          provide: CodingListStateService,
          useValue: {
            globalCodingState: {},
          },
        },
        {
          provide: Location,
          useValue: {
            path: () => '/coding?tech=javascript',
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodingListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const question = (overrides: Partial<any> = {}) => ({
    id: 'js-safe-json-parse',
    title: 'Safe JSON parse',
    type: 'coding',
    technology: 'javascript',
    access: 'free',
    difficulty: 'easy',
    importance: 3,
    tech: 'javascript',
    tags: [],
    companies: [],
    description: 'Parse JSON safely.',
    ...overrides,
  });

  it('renders solved styling without visible solved text for solved questions in the list', async () => {
    const fixture = await createComponent({
      items: [question()],
      solved: ['js-safe-json-parse'],
    });

    const host = fixture.nativeElement as HTMLElement;
    const solvedMark = host.querySelector('[data-testid="question-card-solved-mark-js-safe-json-parse"]');
    const solvedCard = host.querySelector('[data-testid="question-card-js-safe-json-parse"]');

    expect(solvedMark).not.toBeNull();
    expect(solvedCard?.classList.contains('is-solved')).toBeTrue();
    expect(solvedCard?.textContent || '').not.toContain('Solved');
  });

  it('renders a company logo signal for company-tagged question rows', async () => {
    const fixture = await createComponent({
      items: [question({ companies: ['google'] })],
    });
    const host = fixture.nativeElement as HTMLElement;
    const signal = host.querySelector('[data-testid="company-signal-google"]') as HTMLElement | null;
    const logo = signal?.querySelector('[data-testid="company-signal-logo"]') as HTMLImageElement | null;

    expect(signal).not.toBeNull();
    expect(signal?.textContent || '').toContain('Google');
    expect(signal?.getAttribute('aria-label')).toBe('Company prep signal: Google');
    expect(logo?.getAttribute('src')).toBe('/assets/images/company-logos/google.svg');
    expect(logo?.getAttribute('alt')).toBe('');
  });

  it('shows one primary company logo and a compact overflow count', async () => {
    const fixture = await createComponent({
      items: [question({ companies: ['amazon', 'google', 'meta'] })],
    });
    const host = fixture.nativeElement as HTMLElement;
    const signal = host.querySelector('[data-testid="company-signal-amazon"]') as HTMLElement | null;

    expect(signal).not.toBeNull();
    expect(signal?.textContent || '').toContain('Amazon');
    expect(signal?.querySelector('[data-testid="company-signal-overflow"]')?.textContent?.trim()).toBe('+2');
    expect(signal?.getAttribute('aria-label')).toBe('Company prep signal: Amazon and 2 more');
  });

  it('prioritizes the active company route when a question has multiple companies', async () => {
    const fixture = await createComponent({
      source: 'company',
      kind: 'coding',
      companySlug: 'google',
      queryParams: {},
      items: [question({ companies: ['amazon', 'google', 'meta'] })],
    });
    const host = fixture.nativeElement as HTMLElement;
    const signal = host.querySelector('[data-testid="company-signal-google"]') as HTMLElement | null;

    expect(signal).not.toBeNull();
    expect(signal?.textContent || '').toContain('Google');
    expect(signal?.querySelector('[data-testid="company-signal-overflow"]')?.textContent?.trim()).toBe('+2');
    expect(signal?.getAttribute('aria-label')).toBe('Company prep signal: Google and 2 more');
  });

  it('does not render a company signal for rows without companies', async () => {
    const fixture = await createComponent({
      items: [question({ companies: [] })],
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid^="company-signal-"]')).toBeNull();
  });

  it('frames the default global coding route as a frontend coding challenge hub', async () => {
    const fixture = await createComponent({
      queryParams: { reset: '1' },
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.fa-page-kicker')?.textContent?.trim()).toBe('Coding Challenge Hub');
    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('Frontend Coding Challenges');
    expect(host.textContent || '').toContain('Build and debug focused frontend prompts');
    expect(host.querySelector('[data-testid="coding-list-primary-action"]')?.textContent || '').toContain('Start with Debounce');
    expect(Array.from(host.querySelectorAll('[data-testid="coding-list-fit-pill"]')).map((pill) =>
      pill.textContent?.trim()
    )).toEqual(['Real prompts', 'Starter code', 'Tests', 'Solutions + follow-ups', 'Free to start']);
    expect(host.textContent || '').toContain('Selected frontend coding challenges are free to start');
    expect(host.querySelector('[data-testid="interview-hub-support-link"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="essential-questions-support-link"]')).not.toBeNull();

    const results = host.querySelector('[data-testid="coding-list-results"]') as HTMLElement | null;
    const discovery = host.querySelector('[data-testid="coding-discovery-sections"]') as HTMLElement | null;
    expect(results).not.toBeNull();
    expect(discovery).not.toBeNull();
    expect(results!.compareDocumentPosition(discovery!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders free coding hub discovery anchors by technology and skips premium discovery items', async () => {
    const fixture = await createComponent({
      queryParams: { reset: '1' },
      items: [
        question({ id: 'js-debounce', title: 'Debounce Function', importance: 5, difficulty: 'intermediate' }),
        question({ id: 'react-state-toggle', title: 'React State Toggle', technology: 'react', tech: 'react', importance: 5 }),
        question({ id: 'react-premium-grid', title: 'React Premium Grid', technology: 'react', tech: 'react', access: 'premium', importance: 6 }),
        question({ id: 'angular-form-control', title: 'Angular Form Control', technology: 'angular', tech: 'angular' }),
        question({ id: 'vue-todo-list', title: 'Vue Todo List', technology: 'vue', tech: 'vue' }),
        question({ id: 'html-form-semantics', title: 'HTML Form Semantics', technology: 'html', tech: 'html' }),
        question({ id: 'css-card-grid', title: 'CSS Card Grid', technology: 'css', tech: 'css' }),
      ],
    });
    const host = fixture.nativeElement as HTMLElement;
    const discovery = host.querySelector('[data-testid="coding-discovery-sections"]') as HTMLElement | null;

    expect(discovery).not.toBeNull();
    expect(discovery?.textContent || '').toContain('JavaScript coding challenges');
    expect(discovery?.textContent || '').toContain('React UI challenges');
    expect(discovery?.textContent || '').toContain('Angular challenges');
    expect(discovery?.textContent || '').toContain('Vue challenges');
    expect(discovery?.textContent || '').toContain('HTML/CSS implementation exercises');
    expect(discovery?.textContent || '').toContain('Debugging challenges');
    expect(discovery?.querySelector('[data-testid="coding-discovery-link-js-debounce"]')?.getAttribute('href'))
      .toBe('/javascript/coding/js-debounce');
    expect(discovery?.querySelector('[data-testid="coding-discovery-link-react-state-toggle"]')?.getAttribute('href'))
      .toBe('/react/coding/react-state-toggle');
    expect(discovery?.querySelector('[data-testid="coding-discovery-link-js-debug-async-race"]')?.getAttribute('href'))
      .toBe('/javascript/debug/js-debug-async-race');
    expect(discovery?.querySelector('[data-testid="coding-discovery-link-react-premium-grid"]')).toBeNull();
    expect(discovery?.textContent || '').not.toContain('React Premium Grid');
  });

  it('opens Debounce directly from the unfiltered guest global library start action', async () => {
    const fixture = await createComponent({
      queryParams: { reset: '1' },
      items: [
        question({ id: 'css-selectors-text-basics', title: 'Selectors & Text Warm-Up', technology: 'css', tech: 'css', importance: 5 }),
        question({ id: 'js-debounce', title: 'Debounce Function', difficulty: 'intermediate', importance: 5 }),
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    fixture.componentInstance.openFirstVisible();

    expect(navigate).toHaveBeenCalledWith(['/', 'javascript', 'coding', 'js-debounce']);
  });

  it('keeps filtered library start actions tied to the first visible unlocked row', async () => {
    const fixture = await createComponent({
      queryParams: { tech: 'react', kind: 'coding' },
      items: [
        question({ id: 'js-debounce', title: 'Debounce Function', difficulty: 'intermediate', importance: 5 }),
        question({ id: 'react-counter', title: 'React Counter', technology: 'react', tech: 'react', importance: 4 }),
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    fixture.componentInstance.openFirstVisible();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalledWith(['/', 'javascript', 'coding', 'js-debounce']);
    expect(navigate.calls.mostRecent().args[0]).toEqual(['/', 'react', 'coding', 'react-counter']);
  });

  it('opens formats UI as practice types with compact framework prep support', async () => {
    const fixture = await createComponent({
      queryParams: { view: 'formats', category: 'ui', reset: '1' },
    });
    const host = fixture.nativeElement as HTMLElement;
    const supportLink = host.querySelector('[data-testid="framework-prep-support-link"]') as HTMLAnchorElement | null;

    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('Practice Types');
    expect(host.querySelector('[data-testid="coding-list-primary-action"]')?.textContent || '').toContain('Start format practice');
    expect(Array.from(host.querySelectorAll('[data-testid="coding-list-fit-pill"]')).map((pill) =>
      pill.textContent?.trim()
    )).toEqual(['Format-first', 'Good after basics']);
    expect(host.textContent || '').not.toContain('Coding route');
    expect(supportLink).not.toBeNull();
    expect(supportLink?.getAttribute('href')).toBe('/guides/framework-prep');
  });

  it('opens system design formats as system design practice and keeps detail links on /system-design/:id', async () => {
    const fixture = await createComponent({
      queryParams: { view: 'formats', category: 'system', reset: '1' },
      systemDesignItems: [
        {
          id: 'design-news-feed',
          title: 'Design a news feed',
          description: 'Plan feed rendering and delivery.',
          tags: ['system-design'],
          companies: [],
        },
      ],
    });
    const host = fixture.nativeElement as HTMLElement;
    const systemCard = host.querySelector('[data-testid="question-card-design-news-feed"]') as HTMLAnchorElement | null;

    expect(host.querySelector('.fa-page-kicker')?.textContent?.trim()).toBe('System Design Practice');
    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('System Design Practice');
    expect(host.querySelector('[data-testid="coding-list-primary-action"]')?.textContent || '').toContain('Start system design prompt');
    expect(Array.from(host.querySelectorAll('[data-testid="coding-list-fit-pill"]')).map((pill) =>
      pill.textContent?.trim()
    )).toEqual(['Senior signal', 'Architecture + tradeoffs']);
    expect(host.textContent || '').not.toContain('Frontend coding challenges');
    expect(systemCard?.textContent || '').toContain('System design');
    expect(systemCard?.querySelector('[data-testid="coding-list-fit-pill"]')).toBeNull();
    expect(systemCard?.getAttribute('href')).toBe('/system-design/design-news-feed');
  });
});
