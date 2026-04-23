import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { EssentialQuestionsService } from './essential-questions.service';
import { QuestionService } from './question.service';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';
import { ASSET_READER } from './asset-reader';

describe('EssentialQuestionsService', () => {
  let service: EssentialQuestionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EssentialQuestionsService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: PracticeAssetResolverService,
          useValue: {
            getVersion: () => of('bank-v1'),
            getAssetUrls: () => ({
              primary: 'assets/questions/collections/frontend-essential-60.json',
              fallback: 'assets/questions/collections/frontend-essential-60.json',
            }),
          },
        },
        {
          provide: QuestionService,
          useValue: {
            loadAllQuestionSummaries: (kind: 'coding' | 'trivia') => {
              if (kind === 'coding') {
                return of([
                  {
                    id: 'js-debounce',
                    title: 'Debounce Function',
                    type: 'coding',
                    technology: 'javascript',
                    access: 'free',
                    difficulty: 'intermediate',
                    tags: ['async'],
                    importance: 4,
                    companies: ['google'],
                    description: 'Debounce a function.',
                    tech: 'javascript',
                  },
                  {
                    id: 'react-debounced-search',
                    title: 'React Debounced Search with Fake API',
                    type: 'coding',
                    technology: 'react',
                    access: 'premium',
                    difficulty: 'intermediate',
                    tags: ['react', 'debounce'],
                    importance: 5,
                    companies: [],
                    description: 'Build debounced search.',
                    tech: 'react',
                  },
                  {
                    id: 'angular-debounced-search',
                    title: 'Angular Debounced Search with Fake API (RxJS)',
                    type: 'coding',
                    technology: 'angular',
                    access: 'premium',
                    difficulty: 'intermediate',
                    tags: ['angular', 'debounce'],
                    importance: 5,
                    companies: [],
                    description: 'Build debounced search.',
                    tech: 'angular',
                  },
                  {
                    id: 'vue-debounced-search',
                    title: 'Vue Debounced Search with Fake API',
                    type: 'coding',
                    technology: 'vue',
                    access: 'premium',
                    difficulty: 'intermediate',
                    tags: ['vue', 'debounce'],
                    importance: 5,
                    companies: [],
                    description: 'Build debounced search.',
                    tech: 'vue',
                  },
                ]);
              }

              return of([
                {
                  id: 'js-event-loop',
                  title: 'Explain the JavaScript Event Loop',
                  type: 'trivia',
                  technology: 'javascript',
                  access: 'free',
                  difficulty: 'hard',
                  tags: ['event-loop'],
                  importance: 5,
                  companies: [],
                  description: 'Explain event loop ordering.',
                  tech: 'javascript',
                },
              ]);
            },
            loadSystemDesign: () =>
              of([
                {
                  id: 'notification-toast-system',
                  title: 'Notification Toast System',
                  description: 'Design a toast API.',
                  access: 'free',
                  difficulty: 'intermediate',
                  tags: ['toast'],
                  companies: ['google'],
                },
              ]),
          },
        },
        {
          provide: ASSET_READER,
          useValue: {
            readJson: () => of(null),
          },
        },
      ],
    });

    service = TestBed.inject(EssentialQuestionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the curated registry and resolves framework families into one item with alternates', async () => {
    const promise = firstValueFrom(service.loadResolvedCollection());

    const req = httpMock.expectOne('assets/questions/collections/frontend-essential-60.json');
    req.flush({
      id: 'frontend-essential-60',
      title: 'FrontendAtlas Essential 60',
      description: 'Curated shortlist.',
      updatedAt: '2026-04-23',
      benchmarkSources: [],
      items: [
        {
          id: 'js-debounce',
          rank: 1,
          section: 'javascript-functions',
          tier: 'must-know',
          score: 93,
          primary: { tech: 'javascript', kind: 'coding', id: 'js-debounce' },
          rationale: 'Timing primitive.',
          benchmarkTopics: ['debounce'],
        },
        {
          id: 'ui-debounced-search',
          rank: 2,
          section: 'ui-coding',
          tier: 'must-know',
          score: 92,
          primary: { tech: 'react', kind: 'coding', id: 'react-debounced-search' },
          alternates: [
            { tech: 'angular', kind: 'coding', id: 'angular-debounced-search' },
            { tech: 'vue', kind: 'coding', id: 'vue-debounced-search' },
          ],
          rationale: 'Async search.',
          benchmarkTopics: ['autocomplete'],
        },
        {
          id: 'sys-notification-toast-system',
          rank: 3,
          section: 'system-design',
          tier: 'must-know',
          score: 88,
          primary: { kind: 'system-design', id: 'notification-toast-system' },
          rationale: 'Global notifications.',
          benchmarkTopics: ['toast'],
        },
      ],
    });

    const resolved = await promise;
    expect(resolved?.items.length).toBe(3);

    const jsItem = resolved?.items[0];
    expect(jsItem?.title).toBe('Debounce Function');
    expect(jsItem?.path).toBe('/javascript/coding/js-debounce');

    const uiItem = resolved?.items[1];
    expect(uiItem?.title).toBe('Debounced Search with Fake API');
    expect(uiItem?.variants.length).toBe(3);
    expect(uiItem?.variants.map((variant) => variant.techLabel)).toEqual(['React', 'Angular', 'Vue']);

    const systemItem = resolved?.items[2];
    expect(systemItem?.isSystemDesign).toBeTrue();
    expect(systemItem?.path).toBe('/system-design/notification-toast-system');
  });

  it('drops entries whose primary reference cannot be resolved', async () => {
    const promise = firstValueFrom(service.loadResolvedCollection());

    const req = httpMock.expectOne('assets/questions/collections/frontend-essential-60.json');
    req.flush({
      id: 'frontend-essential-60',
      title: 'FrontendAtlas Essential 60',
      description: 'Curated shortlist.',
      updatedAt: '2026-04-23',
      benchmarkSources: [],
      items: [
        {
          id: 'missing-primary',
          rank: 1,
          section: 'javascript-functions',
          tier: 'must-know',
          score: 99,
          primary: { tech: 'javascript', kind: 'coding', id: 'does-not-exist' },
          rationale: 'Broken reference.',
          benchmarkTopics: ['broken'],
        },
      ],
    });

    const resolved = await promise;
    expect(resolved?.items).toEqual([]);
  });
});
