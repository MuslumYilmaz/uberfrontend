import { Location } from '@angular/common';
import { PLATFORM_ID, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
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
    systemDesignItems?: any[];
    solved?: string[];
  }) {
    const routeData = {
      source: 'global-coding',
      kind: 'coding',
      questionList: {
        source: 'global-coding',
        kind: 'coding',
        items: options?.items ?? [],
      },
    };

    const queryParams = options?.queryParams ?? { tech: 'javascript', kind: 'coding' };
    const queryParamMap$ = new BehaviorSubject(convertToParamMap(queryParams));
    const routeStub = {
      data: of(routeData),
      queryParamMap: queryParamMap$.asObservable(),
      snapshot: {
        data: routeData,
        queryParamMap: queryParamMap$.value,
        queryParams,
      },
      parent: null,
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
            loadAllQuestionSummaries: jasmine.createSpy('loadAllQuestionSummaries').and.returnValue(of([])),
            loadQuestionSummaries: jasmine.createSpy('loadQuestionSummaries').and.returnValue(of([])),
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

  it('renders solved styling without visible solved text for solved questions in the list', async () => {
    const fixture = await createComponent({
      items: [
        {
          id: 'js-safe-json-parse',
          title: 'Safe JSON parse',
          difficulty: 'easy',
          importance: 3,
          tech: 'javascript',
          tags: [],
        },
      ],
      solved: ['js-safe-json-parse'],
    });

    const host = fixture.nativeElement as HTMLElement;
    const solvedMark = host.querySelector('[data-testid="question-card-solved-mark-js-safe-json-parse"]');
    const solvedCard = host.querySelector('[data-testid="question-card-js-safe-json-parse"]');

    expect(solvedMark).not.toBeNull();
    expect(solvedCard?.classList.contains('is-solved')).toBeTrue();
    expect(solvedCard?.textContent || '').not.toContain('Solved');
  });

  it('frames the default global coding route as the question library', async () => {
    const fixture = await createComponent({
      queryParams: { reset: '1' },
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.fa-page-kicker')?.textContent?.trim()).toBe('Question library');
    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('Question Library');
    expect(host.textContent || '').not.toContain('Frontend coding challenges');
    expect(host.querySelector('[data-testid="interview-hub-support-link"]')).not.toBeNull();
  });

  it('opens formats UI as practice formats with compact framework prep support', async () => {
    const fixture = await createComponent({
      queryParams: { view: 'formats', category: 'ui', reset: '1' },
    });
    const host = fixture.nativeElement as HTMLElement;
    const supportLink = host.querySelector('[data-testid="framework-prep-support-link"]') as HTMLAnchorElement | null;

    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('Practice Formats');
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

    expect(host.querySelector('.fa-page-kicker')?.textContent?.trim()).toBe('System design route');
    expect(host.querySelector('.fa-page-title')?.textContent?.trim()).toBe('System Design Practice');
    expect(host.textContent || '').not.toContain('Frontend coding challenges');
    expect(systemCard?.textContent || '').toContain('System design prompt');
    expect(systemCard?.getAttribute('href')).toBe('/system-design/design-news-feed');
  });
});
