import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReplaySubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../../../core/services/seo.service';
import { TradeoffBattleProgressService } from '../../../core/services/tradeoff-battle-progress.service';
import { TradeoffDetailComponent } from './tradeoff-detail.component';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { computed, signal } from '@angular/core';

describe('TradeoffDetailComponent', () => {
  let routeData$: ReplaySubject<any>;
  let seo: jasmine.SpyObj<SeoService>;
  let progress: jasmine.SpyObj<TradeoffBattleProgressService>;
  let authUser: ReturnType<typeof signal<any>>;

  const resolvedDetail = {
    id: 'context-vs-zustand-vs-redux',
    prev: null,
    next: null,
    list: [
      {
        id: 'context-vs-zustand-vs-redux',
        title: 'Context vs Zustand vs Redux for a growing React dashboard',
        tech: 'react',
        difficulty: 'intermediate',
        summary: 'Shared state tradeoff question.',
        tags: ['react', 'tradeoffs'],
        access: 'free',
        estimatedMinutes: 14,
        updatedAt: '2026-03-21',
      },
    ],
    battle: {
      meta: {
        id: 'context-vs-zustand-vs-redux',
        title: 'Context vs Zustand vs Redux for a growing React dashboard',
        tech: 'react',
        difficulty: 'intermediate',
        summary: 'Shared state tradeoff question.',
        tags: ['react', 'tradeoffs'],
        access: 'free',
        estimatedMinutes: 14,
        updatedAt: '2026-03-21',
      },
      scenario: 'Scenario text.',
      prompt: 'Prompt text.',
      options: [
        {
          id: 'context',
          label: 'Context + useReducer',
          summary: 'Built-in option.',
          whenItWins: ['Small state'],
          watchOutFor: ['Rerenders'],
        },
        {
          id: 'zustand',
          label: 'Zustand',
          summary: 'Lightweight store.',
          whenItWins: ['Fast iteration'],
          watchOutFor: ['Conventions'],
        },
      ],
      decisionMatrix: [
        {
          id: 'current-prompt',
          title: 'The exact prompt in this battle',
          prompt: 'Broad shared state and async complexity.',
          cells: [
            { optionId: 'context', verdict: 'stretch', note: 'Too broad for Context.' },
            { optionId: 'zustand', verdict: 'reasonable', note: 'Still workable.' },
          ],
        },
      ],
      evaluationDimensions: [
        {
          id: 'state-surface',
          title: 'How wide is the shared state?',
          description: 'Shared state size matters.',
        },
      ],
      strongAnswer: {
        title: 'Lean Zustand for this prompt',
        summary: 'A balanced answer can lean Zustand.',
        reasoning: ['It is a good middle ground.'],
        recommendation: 'Use Context for low-frequency app concerns.',
      },
      interviewerPushback: [
        {
          question: 'Why not Context?',
          answer: 'Because the state surface is too broad.',
        },
        {
          question: 'What would change your answer?',
          answer: 'A smaller app could shift the answer.',
        },
      ],
      answerExamples: [
        {
          level: 'weak',
          title: 'Weak answer',
          answer: 'Redux is enterprise.',
          whyItWorks: 'Too generic.',
        },
        {
          level: 'decent',
          title: 'Decent answer',
          answer: 'Zustand is lighter.',
          whyItWorks: 'Some reasoning, but not enough context.',
        },
        {
          level: 'strong',
          title: 'Strong answer',
          answer: 'I would choose based on the scenario constraints.',
          whyItWorks: 'Grounded in the prompt.',
        },
      ],
      answerFramework: ['Start from the scenario.'],
      antiPatterns: ['There is one universal winner.'],
    },
  };

  beforeEach(async () => {
    routeData$ = new ReplaySubject<any>(1);
    authUser = signal<any>(null);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });
    progress = jasmine.createSpyObj<TradeoffBattleProgressService>(
      'TradeoffBattleProgressService',
      ['getRecord', 'saveDraft', 'revealAnalysis', 'markCompleted'],
    );
    progress.getRecord.and.returnValue({
      started: false,
      completed: false,
      analysisRevealed: false,
      lastPlayedAt: null,
      selectedOptionId: '',
    });
    progress.saveDraft.and.returnValue({
      started: true,
      completed: false,
      analysisRevealed: false,
      lastPlayedAt: '2026-03-21T10:00:00.000Z',
      selectedOptionId: 'zustand',
    });
    progress.revealAnalysis.and.returnValue({
      started: true,
      completed: false,
      analysisRevealed: true,
      lastPlayedAt: '2026-03-21T10:03:00.000Z',
      selectedOptionId: 'zustand',
    });
    progress.markCompleted.and.returnValue({
      started: true,
      completed: true,
      analysisRevealed: true,
      lastPlayedAt: '2026-03-21T10:05:00.000Z',
      selectedOptionId: 'zustand',
    });

    await TestBed.configureTestingModule({
      imports: [TradeoffDetailComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: SeoService, useValue: seo },
        { provide: TradeoffBattleProgressService, useValue: progress },
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
          } satisfies Partial<AuthService>,
        },
        { provide: BugReportService, useValue: jasmine.createSpyObj<BugReportService>('BugReportService', ['open']) },
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
      ],
    }).compileComponents();
  });

  it('publishes LearningResource schema through seo tags', async () => {
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');

    expect(breadcrumb).toBeTruthy();
    expect(resource).toBeTruthy();
    expect(resource?.url || '').toContain('/tradeoffs/context-vs-zustand-vs-redux');
    expect(resource?.learningResourceType).toBe('Tradeoff battle');
  });

  it('reveals analysis after choosing an option', async () => {
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectOption('zustand');
    component.revealAnalysis();
    fixture.detectChanges();

    expect(progress.saveDraft).toHaveBeenCalled();
    expect(progress.revealAnalysis).toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent || '').toContain('STRONG ANSWER');
    expect(fixture.nativeElement.textContent || '').toContain('Decision matrix');
    expect(fixture.nativeElement.textContent || '').toContain('Interviewer pushback');
    expect(fixture.nativeElement.textContent || '').toContain('Mark as completed');
  });

  it('marks the battle completed only after the explicit completion action', async () => {
    authUser.set({
      _id: 'user-1',
      email: 'user@example.com',
      username: 'user1',
    });
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectOption('zustand');
    component.revealAnalysis();
    component.markComplete();
    fixture.detectChanges();

    expect(progress.markCompleted).toHaveBeenCalled();
    expect(component.completed()).toBeTrue();
    expect(fixture.nativeElement.textContent || '').toContain('Completed');
  });

  it('opens the login prompt instead of completing for guests', async () => {
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectOption('zustand');
    component.revealAnalysis();
    component.markComplete();
    fixture.detectChanges();

    expect(progress.markCompleted).not.toHaveBeenCalled();
    expect(component.loginPromptOpen).toBeTrue();
    expect(fixture.nativeElement.textContent || '').toContain('Sign in to save completed tradeoff battles');
  });

  it('renders the locked premium preview on premium tradeoff battles', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.battle.meta.access = 'premium';
    routeData$.next({ tradeoffBattleDetail: premiumDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent || '').toContain('Premium');
    expect(fixture.nativeElement.textContent || '').toContain('View pricing');
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent || '').not.toContain('Reveal analysis');
  });
});
