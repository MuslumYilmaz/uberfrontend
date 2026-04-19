import { Location } from '@angular/common';
import { PLATFORM_ID, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CodingListStateService } from '../../../core/services/coding-list-state';
import { PracticeRegistryService } from '../../../core/services/practice-registry.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodingListComponent } from './coding-list.component';

describe('CodingListComponent', () => {
  it('renders solved styling without visible solved text for solved questions in the list', async () => {
    const routeData = {
      source: 'global-coding',
      kind: 'coding',
      questionList: {
        source: 'global-coding',
        kind: 'coding',
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
      },
    };

    const queryParamMap$ = new BehaviorSubject(convertToParamMap({ tech: 'javascript', kind: 'coding' }));
    const routeStub = {
      data: of(routeData),
      queryParamMap: queryParamMap$.asObservable(),
      snapshot: {
        data: routeData,
        queryParamMap: queryParamMap$.value,
        queryParams: { tech: 'javascript', kind: 'coding' },
      },
      parent: null,
    };

    const solvedIds = signal(['js-safe-json-parse']);

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
          },
        },
        {
          provide: PracticeRegistryService,
          useValue: {
            primaryHubEntries: () => [],
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

    const host = fixture.nativeElement as HTMLElement;
    const solvedMark = host.querySelector('[data-testid="question-card-solved-mark-js-safe-json-parse"]');
    const solvedCard = host.querySelector('[data-testid="question-card-js-safe-json-parse"]');

    expect(solvedMark).not.toBeNull();
    expect(solvedCard?.classList.contains('is-solved')).toBeTrue();
    expect(solvedCard?.textContent || '').not.toContain('Solved');
  });
});
