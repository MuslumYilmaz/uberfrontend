import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InterviewResult } from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewRecoveryStore } from '../../core/services/interview-recovery.store';
import { InterviewResultsComponent } from './interview-results.component';

describe('InterviewResultsComponent', () => {
  let fixture: ComponentFixture<InterviewResultsComponent>;
  let service: jasmine.SpyObj<InterviewService>;
  let recovery: InterviewRecoveryStore;
  const recoveryKey = 'fa:interview:recovery:v2:user-1:coding:session-1';

  const result: InterviewResult = {
    sessionId: 'session-1',
    interviewFormat: 'coding',
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
    systemDesign: null,
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
    recovery = TestBed.inject(InterviewRecoveryStore);
    recovery.setUserScope('user-1');
    fixture = TestBed.createComponent(InterviewResultsComponent);
  });

  it('shows diagnostic details, the disclaimer, and zero-XP semantics', () => {
    expect(recovery.saveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-1',
      payload: { local: 'stale' },
    })).toBeTrue();
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
    expect(localStorage.getItem(recoveryKey)).toBeNull();
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

  it('returns an abandoned session home without retrying or rendering answer data', () => {
    expect(recovery.saveForCurrentUser({
      kind: 'coding',
      sessionId: 'session-1',
      payload: { local: 'stale' },
    })).toBeTrue();
    service.getResult.and.returnValue(throwError(() => ({
      status: 409,
      error: { code: 'INTERVIEW_SESSION_ABANDONED' },
    })));

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('withheld to prevent extraction of the question bank');
    expect(text).toContain('Return to interview home');
    expect(text).not.toContain('Try again');
    expect(fixture.nativeElement.querySelector('#answers-title')).toBeNull();
    expect(localStorage.getItem(recoveryKey)).toBeNull();
  });

  it('offers an exact resume link when the report route is opened before completion', () => {
    service.getResult.and.returnValue(throwError(() => ({
      status: 409,
      error: { code: 'INTERVIEW_RESULTS_NOT_READY' },
    })));

    fixture.detectChanges();
    const resume = fixture.nativeElement.querySelector(
      'a[href="/interview/session-1"]',
    ) as HTMLAnchorElement | null;

    expect(fixture.nativeElement.textContent).toContain('still active');
    expect(resume?.textContent).toContain('Resume interview');
    expect(fixture.nativeElement.textContent).not.toContain('Try again');
  });

  it('renders system-design evidence and the submitted artifact without MCQ scoring', () => {
    service.getResult.and.returnValue(of({
      ...result,
      interviewFormat: 'system-design',
      score: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
      sections: [],
      questions: [],
      remediationTopics: [],
      coding: null,
      systemDesign: {
        sourceContentId: 'ai-chat-textarea-design',
        scenarioId: 'int-sd-ai-chat-composer-mid-v1',
        scenarioTitle: 'Resilient AI chat composer',
        outcome: 'timed_out',
        partialEvidence: true,
        practiceSignal: 'on-track',
        axes: [{
          id: 'architecture',
          label: 'Architecture and ownership',
          status: 'developing',
          evidence: ['A single request owner was identified.'],
        }],
        contradictions: [{
          id: 'cache-identity',
          severity: 'major',
          label: 'The cache key omits locale.',
          explanation: 'Results from different locales can collide.',
        }],
        remediationTopics: ['Cache identity'],
        designSnapshot: null,
        summary: {
          priorities: [{ id: 'ordering', title: 'Preserve request ordering', rank: 1 }],
          lanes: [{
            id: 'data',
            title: 'Data',
            cards: [{ id: 'controller', title: 'Request controller', order: 0 }],
          }],
          connections: [{
            fromCardId: 'input',
            fromTitle: 'Search input',
            toCardId: 'controller',
            toTitle: 'Request controller',
            typeId: 'event-flow',
            typeTitle: 'Event flow',
          }],
          decisions: [{
            id: 'ownership',
            title: 'Request ownership',
            option: { id: 'abort', label: 'Abort obsolete requests' },
            rationales: [{ id: 'ordering', label: 'Prevent stale results' }],
          }],
          twistActions: [{ id: 'locale-key', label: 'Include locale in request identity' }],
        },
        frameworkLens: {
          title: 'React request ownership',
          prompt: 'Keep request identity in the owning hook.',
        },
        timing: { usedSeconds: 900, allowedSeconds: 900 },
      },
    }));

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('On Track');
    expect(text).toContain('Your design');
    expect(text).toContain('Request controller');
    expect(text).toContain('reached its time limit');
    expect(text).toContain('Cache identity');
    expect(text).toContain('React request ownership');
    expect(text).toContain('Open the full system design walkthrough');
    expect(text).not.toContain('Answer review');
    expect(text).not.toContain('MCQ time used');
    expect(
      (fixture.nativeElement.querySelector(
        'a.walkthrough-link'
      ) as HTMLAnchorElement | null)?.getAttribute('href')
    ).toBe('/system-design/ai-chat-textarea-design');
  });
});
