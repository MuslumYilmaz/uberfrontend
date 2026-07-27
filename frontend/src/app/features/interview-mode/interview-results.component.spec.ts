import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InterviewResult } from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewResultsComponent } from './interview-results.component';

describe('InterviewResultsComponent', () => {
  let fixture: ComponentFixture<InterviewResultsComponent>;
  let service: jasmine.SpyObj<InterviewService>;

  const result: InterviewResult = {
    sessionId: 'session-1',
    level: 'mid',
    track: 'react',
    completedAt: '2026-07-27T12:00:00.000Z',
    score: { correct: 4, incorrect: 1, unanswered: 0, total: 5 },
    sections: [{
      id: 'react',
      label: 'React',
      correct: 2,
      incorrect: 0,
      unanswered: 0,
      total: 2,
    }],
    questions: [{
      questionId: 'question-1',
      technology: 'react',
      competency: 'Effect cleanup',
      prompt: 'Which cleanup belongs to the current Effect run?',
      code: 'useEffect(() => subscribe(), [])',
      codeLanguage: 'javascript',
      options: [
        { id: 'option-a', label: 'Store it in state.' },
        { id: 'option-b', label: 'Return it from the Effect.' },
      ],
      selectedOptionId: 'option-a',
      correctOptionId: 'option-b',
      correct: false,
      explanation: 'The returned cleanup is scoped to that Effect execution.',
      remediationTopics: ['React Effect lifecycle'],
    }],
    remediationTopics: ['React Effect lifecycle'],
    coding: {
      sourceQuestionId: 'react-counter',
      attempted: true,
      submitted: true,
      locallyVerified: true,
      authoritativeEvaluation: false,
      evidenceMode: 'client-self-report',
      passedChecks: 2,
      totalChecks: 3,
      checks: [],
      rubric: [
        { id: 'base', label: 'Base behavior', criteria: [], status: 'passed' },
        { id: 'edge', label: 'Edge cases', criteria: [], status: 'failed' },
        { id: 'a11y', label: 'Accessibility', criteria: [], status: 'not_evaluated' },
      ],
    },
    disclaimer: 'This mock interview is preparation feedback, not an employment decision.',
    mcqTiming: { usedSeconds: 540, allowedSeconds: 600 },
    codingTiming: { usedSeconds: 2100, allowedSeconds: 2100 },
    xpAwarded: 0,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<InterviewService>('InterviewService', ['getResult']);
    service.getResult.and.returnValue(of(result));

    await TestBed.configureTestingModule({
      imports: [InterviewResultsComponent],
      providers: [
        { provide: InterviewService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'session-1' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InterviewResultsComponent);
  });

  it('shows diagnostic details, the disclaimer, and zero-XP semantics', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('4');
    expect(text).toContain('React Effect lifecycle');
    expect(text).toContain('preparation feedback, not an employment decision');
    expect(text).toContain('awarded 0 XP');
    expect(text).toContain('Base behavior');
    expect(text).toContain('Failed');
    expect(text).toContain('Not evaluated');
    expect(text).toContain('Open the original practice task');
    expect(text).toContain('2/3 browser checks passed for the submitted draft');
    expect(text).toContain('useEffect(() => subscribe(), [])');
    expect(text).not.toContain('80%');
    expect(text).not.toContain('Strong hire');
    expect(text).not.toContain('Hire');
  });

  it('does not describe an abandoned checked draft as submitted', () => {
    service.getResult.and.returnValue(of({
      ...result,
      coding: result.coding
        ? {
          ...result.coding,
          submitted: false,
        }
        : null,
    }));

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('latest saved draft, which was not submitted');
    expect(text).not.toContain('checks passed for the submitted draft');
  });

  it('returns a voided session home without rendering an answer report', () => {
    service.getResult.and.returnValue(throwError(() => ({
      status: 409,
      error: { code: 'INTERVIEW_SESSION_VOIDED' },
    })));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('no answer report was created');
    expect(text).toContain('Return to interview home');
    expect(text).not.toContain('Answer review');
  });
});
