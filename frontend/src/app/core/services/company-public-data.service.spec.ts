import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { CompanyIndexResolved, CompanyPreviewResolved } from '../models/company-public.model';
import { CompanyPublicDataService } from './company-public-data.service';
import { MixedQuestionListItem, QuestionService } from './question.service';

describe('CompanyPublicDataService', () => {
  let questions: jasmine.SpyObj<QuestionService>;

  function configure(platform = 'browser', transferState = new TransferState()): CompanyPublicDataService {
    TestBed.resetTestingModule();
    questions = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadAllQuestionSummaries', 'loadSystemDesign']);
    questions.loadAllQuestionSummaries.and.returnValue(of([]));
    questions.loadSystemDesign.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [
      { provide: QuestionService, useValue: questions },
      { provide: PLATFORM_ID, useValue: platform },
      { provide: TransferState, useValue: transferState },
    ] });
    return TestBed.inject(CompanyPublicDataService);
  }

  function question(id: string, kind: 'coding' | 'trivia' = 'coding', access: 'free' | 'premium' = 'free'): MixedQuestionListItem {
    return {
      id, title: id, type: kind, technology: 'react', tech: 'react', access,
      difficulty: 'easy', tags: [], importance: 1, companies: ['amazon'],
    };
  }

  it('waits for the catalog and retains framework-family counts and brand labels', async () => {
    const service = configure();
    const coding = new Subject<MixedQuestionListItem[]>();
    questions.loadAllQuestionSummaries.and.callFake((kind) => kind === 'coding' ? coding : of([]));
    let resolved: CompanyIndexResolved | undefined;
    const pending = firstValueFrom(service.loadIndex()).then((value) => { resolved = value; });
    expect(resolved).toBeUndefined();
    coding.next([
      question('react-counter'),
      { ...question('angular-counter-starter'), tech: 'angular' },
      { ...question('ai-stream'), companies: ['openai'] },
      { ...question('feed'), companies: ['bytedance'] },
    ]);
    expect(resolved).toBeUndefined();
    coding.complete();
    await pending;
    expect(resolved?.companies).toEqual([
      { slug: 'amazon', label: 'Amazon', count: 1 },
      { slug: 'bytedance', label: 'ByteDance', count: 1 },
      { slug: 'openai', label: 'OpenAI', count: 1 },
    ]);
    expect(questions.loadAllQuestionSummaries).toHaveBeenCalledWith('coding', { transferState: false });
    expect(questions.loadAllQuestionSummaries).toHaveBeenCalledWith('trivia', { transferState: false });
    expect(questions.loadSystemDesign).toHaveBeenCalledWith({ transferState: false });
  });

  it('keeps the 3 coding, 3 trivia, 2 system sample order and transfers only the compact preview', async () => {
    const transferState = new TransferState();
    const service = configure('server', transferState);
    questions.loadAllQuestionSummaries.and.callFake((kind) => of(
      Array.from({ length: 4 }, (_, i) => ({
        ...question(`${kind}-${i}`, kind, i === 1 ? 'premium' : 'free'),
        solution: 'PRIVATE_SOLUTION_SENTINEL',
        description: 'FULL_CATALOG_DESCRIPTION_SENTINEL',
      })),
    ));
    questions.loadSystemDesign.and.returnValue(of([0, 1, 2].map((i) => ({
      id: `system-${i}`, title: `System ${i}`, type: 'system-design' as const,
      companies: ['amazon'], access: 'premium' as const, difficulty: 'hard' as const,
    })) as any));

    const resolved = await firstValueFrom(service.loadPreview(' AMAZON '));
    expect(resolved.counts).toEqual({ all: 11, coding: 4, trivia: 4, system: 3 });
    expect(resolved.samples.map((item) => item.id)).toEqual([
      'coding-0', 'coding-1', 'coding-2', 'trivia-0', 'trivia-1', 'trivia-2', 'system-0', 'system-1',
    ]);
    expect(resolved.samples[1].access).toBe('premium');
    const serialized = transferState.toJson();
    expect(serialized).not.toContain('PRIVATE_SOLUTION_SENTINEL');
    expect(serialized).not.toContain('FULL_CATALOG_DESCRIPTION_SENTINEL');
    expect(serialized).not.toContain('coding-3');
    expect(serialized).toContain('company-public:preview:amazon');

    const browserService = configure('browser', transferState);
    expect(await firstValueFrom(browserService.loadPreview('amazon'))).toEqual(resolved);
    expect(questions.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questions.loadSystemDesign).not.toHaveBeenCalled();
    expect(transferState.hasKey(makeStateKey<CompanyPreviewResolved>('company-public:preview:amazon'))).toBeFalse();
  });

  it('de-duplicates samples and fills sparse kind buckets without exceeding eight', async () => {
    const service = configure();
    questions.loadAllQuestionSummaries.and.callFake((kind) => of(kind === 'coding'
      ? [question('same'), question('same'), ...Array.from({ length: 7 }, (_, i) => question(`extra-${i}`))]
      : [question('concept', 'trivia')],
    ));
    const resolved = await firstValueFrom(service.loadPreview('amazon'));
    expect(resolved.samples.map((item) => item.id)).toEqual([
      'same', 'extra-0', 'concept', 'extra-1', 'extra-2', 'extra-3', 'extra-4', 'extra-5',
    ]);
  });

  it('keeps authored previews independent of catalog availability', async () => {
    const service = configure();
    questions.loadAllQuestionSummaries.and.throwError('Catalog must not be loaded');
    for (const slug of ['google', 'openai', 'netflix']) {
      const resolved = await firstValueFrom(service.loadPreview(slug));
      expect(resolved.mode).toBe('editorial');
      expect(resolved.slug).toBe(slug);
      expect(resolved.samples).toEqual([]);
    }
    expect(questions.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questions.loadSystemDesign).not.toHaveBeenCalled();
  });

  it('returns terminal empty data on failure and does not reuse another company state', async () => {
    const transferState = new TransferState();
    const service = configure('browser', transferState);
    transferState.set(makeStateKey<CompanyPreviewResolved>('company-public:preview:amazon'), {
      slug: 'amazon', mode: 'catalog', counts: { all: 1, coding: 1, trivia: 0, system: 0 },
      samples: [{ id: 'old', title: 'Old', kind: 'coding', difficulty: 'easy', access: 'free' }],
    });
    questions.loadAllQuestionSummaries.and.returnValue(throwError(() => new Error('Offline')));
    expect(await firstValueFrom(service.loadIndex())).toEqual({ companies: [] });
    const resolved = await firstValueFrom(service.loadPreview('bytedance'));
    expect(resolved.slug).toBe('bytedance');
    expect(resolved.counts.all).toBe(0);
    expect(resolved.samples).toEqual([]);
    expect(transferState.hasKey(makeStateKey('company-public:preview:amazon'))).toBeTrue();
  });
});
