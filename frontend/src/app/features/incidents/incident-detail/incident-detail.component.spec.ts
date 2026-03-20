import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReplaySubject } from 'rxjs';
import { IncidentProgressService } from '../../../core/services/incident-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import { IncidentDetailComponent } from './incident-detail.component';

describe('IncidentDetailComponent', () => {
  let routeData$: ReplaySubject<any>;
  let seo: jasmine.SpyObj<SeoService>;

  const resolvedDetail = {
    id: 'incident-1',
    prev: null,
    next: {
      id: 'incident-2',
      title: 'Next incident',
      tech: 'react',
      difficulty: 'easy',
      summary: 'Next',
      signals: ['signal'],
      estimatedMinutes: 12,
      tags: ['react'],
      updatedAt: '2026-03-19',
      access: 'free',
    },
    list: [
      {
        id: 'incident-1',
        title: 'Incident one',
        tech: 'react',
        difficulty: 'easy',
        summary: 'Summary',
        signals: ['signal'],
        estimatedMinutes: 12,
        tags: ['react'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
    ],
    incident: {
      meta: {
        id: 'incident-1',
        title: 'Incident one',
        tech: 'react',
        difficulty: 'easy',
        summary: 'Summary',
        signals: ['signal'],
        estimatedMinutes: 12,
        tags: ['react'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
      context: {
        symptom: 'Typing lags.',
        userImpact: 'Users quit.',
        environment: 'React page',
        evidence: [
          { type: 'note', title: 'Evidence', body: 'Something broke.' },
        ],
      },
      stages: [
        {
          id: 'root-cause',
          type: 'single-select',
          title: 'Stage 1',
          prompt: 'Pick root cause',
          options: [
            { id: 'correct', label: 'Correct cause', points: 25, feedback: 'Correct diagnosis.' },
            { id: 'wrong', label: 'Wrong cause', points: 0, feedback: 'Wrong diagnosis.' },
          ],
        },
        {
          id: 'debug-order',
          type: 'priority-order',
          title: 'Stage 2',
          prompt: 'Sort',
          candidates: [
            { id: 'check-logs', label: 'Check logs' },
            { id: 'profile-ui', label: 'Profile UI' },
            { id: 'inspect-code', label: 'Inspect code' },
          ],
          expectedOrder: ['check-logs', 'profile-ui', 'inspect-code'],
          slotWeights: [12, 8, 5],
        },
        {
          id: 'fix-set',
          type: 'multi-select',
          title: 'Stage 3',
          prompt: 'Fixes',
          options: [
            { id: 'fix-a', label: 'Fix A', points: 10, feedback: 'A helps.' },
            { id: 'fix-b', label: 'Fix B', points: 10, feedback: 'B helps.' },
            { id: 'fix-c', label: 'Fix C', points: 5, feedback: 'C helps.' },
            { id: 'harmful', label: 'Harmful', points: -5, feedback: 'Bad fix.', isHarmful: true },
          ],
        },
        {
          id: 'guardrail',
          type: 'single-select',
          title: 'Stage 4',
          prompt: 'Guardrail',
          options: [
            { id: 'guard', label: 'Guard', points: 25, feedback: 'Best guard.' },
            { id: 'weak', label: 'Weak', points: 0, feedback: 'Weak guard.' },
          ],
        },
      ],
      debrief: {
        scoreBands: [
          { min: 0, max: 69, label: 'Review again', summary: 'Need more work.' },
          { min: 70, max: 100, label: 'Passed', summary: 'Solid run.' },
        ],
        idealRunbook: ['Profile first', 'Protect with tests'],
        teachingBlocks: [
          { type: 'text', text: 'Debrief text.' },
        ],
        optionalReflectionPrompt: 'What would you do next?',
      },
      relatedPractice: [
        { tech: 'react', kind: 'coding', id: 'react-debounced-search' },
      ],
    },
  };

  beforeEach(async () => {
    routeData$ = new ReplaySubject<any>(1);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags']);
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');

    await TestBed.configureTestingModule({
      imports: [IncidentDetailComponent, RouterTestingModule],
      providers: [
        IncidentProgressService,
        { provide: SeoService, useValue: seo },
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');
  });

  it('shows stage feedback after submitting a response', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const startButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Begin simulator')) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector('[data-testid="incident-option-root-cause-correct"]') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();

    const submitButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Submit response')) as HTMLButtonElement;
    submitButton.click();
    fixture.detectChanges();

    const feedback = fixture.nativeElement.querySelector('[data-testid="incident-feedback-root-cause"]') as HTMLElement | null;
    expect(feedback?.textContent || '').toContain('Correct diagnosis.');
  });

  it('reorders priority candidates with keyboard controls', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.startIncident();
    component.activateOption(component.stages()[0]!, 'correct');
    component.submitCurrentStage();
    component.nextStep();
    fixture.detectChanges();

    const firstBefore = fixture.nativeElement.querySelector('.incident-priority__title') as HTMLElement;
    expect(firstBefore.textContent?.trim()).toBe('Check logs');

    const moveDown = fixture.nativeElement.querySelector('[data-testid="incident-priority-down-check-logs"]') as HTMLButtonElement;
    moveDown.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    const firstAfter = fixture.nativeElement.querySelector('.incident-priority__title') as HTMLElement;
    expect(firstAfter.textContent?.trim()).toBe('Profile UI');
  });

  it('renders related practice links on the debrief step', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.startIncident();

    component.activateOption(component.stages()[0]!, 'correct');
    component.submitCurrentStage();
    component.nextStep();

    component.submitCurrentStage();
    component.nextStep();

    component.activateOption(component.stages()[2]!, 'fix-a');
    component.activateOption(component.stages()[2]!, 'fix-b');
    component.activateOption(component.stages()[2]!, 'fix-c');
    component.submitCurrentStage();
    component.nextStep();

    component.activateOption(component.stages()[3]!, 'guard');
    component.submitCurrentStage();
    component.nextStep();
    fixture.detectChanges();

    const relatedLink = fixture.nativeElement.querySelector('[data-testid="incident-related-react-debounced-search"]') as HTMLAnchorElement | null;
    expect(relatedLink).toBeTruthy();
    expect(relatedLink?.getAttribute('href') || '').toContain('/react/coding/react-debounced-search');
  });
});
