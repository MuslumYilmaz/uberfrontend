import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { QuestionService } from './question.service';
import { SolvedQuestionsService } from './solved-questions.service';

describe('SolvedQuestionsService', () => {
  let service: SolvedQuestionsService;
  let questionService: jasmine.SpyObj<QuestionService>;

  beforeEach(() => {
    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadQuestions',
      'loadSystemDesign',
    ]);

    questionService.loadAllQuestionSummaries.and.returnValue(of([]));
    questionService.loadQuestions.and.callFake((tech, kind) => {
      if (kind === 'debug' && tech === 'javascript') {
        return of([
          {
            id: 'js-debug-off-by-one',
            title: 'Fix off-by-one in chunk',
            technology: 'javascript',
            type: 'debug',
            access: 'free',
            difficulty: 'easy',
            importance: 4,
          } as any,
        ]);
      }
      return of([]);
    });
    questionService.loadSystemDesign.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        SolvedQuestionsService,
        { provide: QuestionService, useValue: questionService },
      ],
    });

    service = TestBed.inject(SolvedQuestionsService);
  });

  it('resolves debug question metadata instead of falling back to unknown', async () => {
    const rows = await firstValueFrom(service.resolved(['js-debug-off-by-one']));

    expect(rows).toEqual([
      {
        id: 'js-debug-off-by-one',
        title: 'Fix off-by-one in chunk',
        tech: 'javascript',
        kind: 'debug',
      },
    ]);
  });
});
