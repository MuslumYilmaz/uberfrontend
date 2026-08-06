import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { convertToParamMap } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Question } from '../models/question.model';
import { QuestionService } from '../services/question.service';
import {
  codingDetailResolver,
  normalizeSystemDesignDetail,
  QuestionDetailResolved,
  triviaDetailResolver,
} from './question-detail.resolver';

describe('normalizeSystemDesignDetail', () => {
  const indexEntry = {
    id: 'offline-email-client',
    title: 'Gmail-Style Offline Email Client Frontend System Design',
    description: 'Catalog description.',
    tags: ['email', 'offline-first'],
    type: 'system-design',
    access: 'free',
    difficulty: 'hard',
    publishedAt: '2026-07-29',
    updatedAt: '2026-07-30',
  };

  it('keeps index metadata authoritative while retaining detail content', () => {
    const detail = {
      title: 'Stale detail title',
      description: 'Stale detail description.',
      tags: ['stale'],
      access: 'premium',
      difficulty: 'intermediate',
      publishedAt: '2026-07-01',
      updatedAt: '2026-07-01',
      seo: { title: 'SEO title' },
      guideSlug: 'state-data',
      radio: [{ key: 'R', title: 'Requirements', blocks: [] }],
      contentLoadState: 'ready',
    };

    const resolved = normalizeSystemDesignDetail(
      indexEntry.id,
      [indexEntry],
      detail,
    );

    expect(resolved).toEqual(jasmine.objectContaining({
      id: indexEntry.id,
      title: indexEntry.title,
      description: indexEntry.description,
      tags: indexEntry.tags,
      access: 'free',
      difficulty: 'hard',
      publishedAt: '2026-07-29',
      updatedAt: '2026-07-30',
      seo: detail.seo,
      guideSlug: 'state-data',
      radio: detail.radio,
      contentLoadState: 'ready',
    }));
  });

  it('marks a catalog question as unavailable when its detail bundle does not load', () => {
    const resolved = normalizeSystemDesignDetail(
      indexEntry.id,
      [indexEntry],
      null,
    );

    expect(resolved).toEqual(jasmine.objectContaining({
      id: indexEntry.id,
      difficulty: 'hard',
      contentLoadState: 'error',
      practice: jasmine.objectContaining({
        targetLevel: 'senior',
        timeboxMinutes: 20,
        candidatePrompt: indexEntry.description,
      }),
    }));
  });

  it('returns null only when neither catalog nor detail knows the id', () => {
    expect(normalizeSystemDesignDetail('unknown', [], null)).toBeNull();
  });
});

describe('triviaDetailResolver', () => {
  const fullQuestion = {
    id: 'js-escape-vs-sanitize',
    title: 'Escaping vs Sanitizing: What is the Difference?',
    type: 'trivia',
    technology: 'javascript',
    access: 'free',
    difficulty: 'medium',
    tags: ['xss', 'security'],
    importance: 4,
    companies: ['Meta'],
    description: 'Escaping encodes output. Sanitizing filters allowed markup.',
    questionFormat: 'output',
    outputChallenge: {
      language: 'javascript',
      runtime: 'browser',
      responseType: 'single-choice',
      prompt: 'What is logged?',
      code: "console.log('A')",
      options: [
        { id: 'a', lines: ['A'] },
        { id: 'b', lines: ['B'] },
        { id: 'c', lines: ['C'] },
      ],
      correctOptionId: 'a',
      explanation: 'The synchronous log runs immediately.',
    },
    answer: {
      blocks: [
        {
          type: 'text',
          text: 'Escaping is context-specific encoding; sanitizing removes unsafe markup.',
        },
      ],
    },
  } as unknown as Question;

  const otherQuestion = {
    ...fullQuestion,
    id: 'event-delegation',
    title: 'Event delegation',
    answer: { blocks: [{ type: 'text', text: 'Delegate bubbling events.' }] },
  } as unknown as Question;

  function configure(platformId: 'browser' | 'server', questions: Question[] = [fullQuestion, otherQuestion]) {
    const questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadQuestions']);
    questionService.loadQuestions.and.returnValue(of(questions));

    TestBed.configureTestingModule({
      providers: [
        TransferState,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: QuestionService, useValue: questionService },
      ],
    });

    return questionService;
  }

  function route(id = fullQuestion.id) {
    return {
      parent: { paramMap: convertToParamMap({ tech: 'javascript' }) },
      paramMap: convertToParamMap({ id }),
    } as any;
  }

  function stateKey(id = fullQuestion.id) {
    return makeStateKey<QuestionDetailResolved>(`question-detail:javascript:trivia:${id}`);
  }

  function resolve(id = fullQuestion.id): Promise<QuestionDetailResolved> {
    const result = TestBed.runInInjectionContext(() =>
      triviaDetailResolver(route(id), {} as any),
    );
    return firstValueFrom(result as Observable<QuestionDetailResolved>);
  }

  function resolveCoding(id = fullQuestion.id): Promise<QuestionDetailResolved> {
    const result = TestBed.runInInjectionContext(() =>
      codingDetailResolver(route(id), {} as any),
    );
    return firstValueFrom(result as Observable<QuestionDetailResolved>);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses lightweight TransferState on the browser without fetching the full trivia bank', async () => {
    const questionService = configure('browser');
    const transferState = TestBed.inject(TransferState);
    transferState.set(stateKey(), {
      tech: 'javascript',
      kind: 'trivia',
      id: fullQuestion.id,
      list: [],
      listSummaries: [{
        id: fullQuestion.id,
        title: fullQuestion.title,
        type: fullQuestion.type,
        technology: fullQuestion.technology,
        access: fullQuestion.access,
        difficulty: fullQuestion.difficulty,
        tags: fullQuestion.tags,
        importance: fullQuestion.importance,
        companies: fullQuestion.companies,
        questionFormat: fullQuestion.questionFormat,
        description: undefined,
      }],
      question: fullQuestion,
    });

    const resolved = await resolve();

    expect(questionService.loadQuestions).not.toHaveBeenCalled();
    expect(resolved.list).toEqual([]);
    expect(resolved.listSummaries?.length).toBe(1);
    expect(resolved.listSummaries?.[0]?.questionFormat).toBe('output');
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
    expect((resolved.listSummaries?.[0] as any).outputChallenge).toBeUndefined();
    expect(resolved.question?.answer).toBe(fullQuestion.answer);
    expect(resolved.question?.outputChallenge).toBe(fullQuestion.outputChallenge);
    expect(transferState.hasKey(stateKey())).toBeFalse();
  });

  it('stores only the current full trivia question plus list summaries during prerender', async () => {
    const questionService = configure('server');
    const transferState = TestBed.inject(TransferState);

    const resolved = await resolve();
    const cached = transferState.get(stateKey(), null as QuestionDetailResolved | null);

    expect(questionService.loadQuestions).toHaveBeenCalledOnceWith('javascript' as any, 'trivia', { transferState: false });
    expect(resolved.list).toEqual([]);
    expect(resolved.listSummaries?.map((q) => q.id)).toEqual([fullQuestion.id, otherQuestion.id]);
    expect(resolved.listSummaries?.[0]?.questionFormat).toBe('output');
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
    expect((resolved.listSummaries?.[0] as any).outputChallenge).toBeUndefined();
    expect(resolved.question?.answer).toBe(fullQuestion.answer);
    expect(cached?.list).toEqual([]);
    expect(cached?.question?.id).toBe(fullQuestion.id);
  });

  it('does not embed the full coding bank in custom detail TransferState during prerender', async () => {
    const questionService = configure('server');
    const transferState = TestBed.inject(TransferState);

    const resolved = await resolveCoding();
    const codingStateKey = makeStateKey<QuestionDetailResolved>(
      `question-detail:javascript:coding:${fullQuestion.id}`,
    );

    expect(questionService.loadQuestions).toHaveBeenCalledOnceWith('javascript' as any, 'coding', { transferState: false });
    expect(resolved.list.map((q) => q.id)).toEqual([fullQuestion.id, otherQuestion.id]);
    expect(resolved.listSummaries).toBeUndefined();
    expect(transferState.hasKey(codingStateKey)).toBeFalse();
  });
});
