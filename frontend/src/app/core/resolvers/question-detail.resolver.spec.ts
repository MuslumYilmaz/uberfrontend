import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { convertToParamMap } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Question } from '../models/question.model';
import { QuestionService } from '../services/question.service';
import {
  codingDetailResolver,
  QuestionDetailResolved,
  triviaDetailResolver,
} from './question-detail.resolver';

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
        description: undefined,
      }],
      question: fullQuestion,
    });

    const resolved = await resolve();

    expect(questionService.loadQuestions).not.toHaveBeenCalled();
    expect(resolved.list).toEqual([]);
    expect(resolved.listSummaries?.length).toBe(1);
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
    expect(resolved.question?.answer).toBe(fullQuestion.answer);
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
    expect((resolved.listSummaries?.[0] as any).answer).toBeUndefined();
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
