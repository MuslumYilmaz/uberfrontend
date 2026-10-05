import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { TestBed } from '@angular/core/testing';
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
      imports: [TradeoffDetailComponent, RouterTestingModule],
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
    expect(resource?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(resource?.dateModified).toBe(seoContentDateModified(resource.url));

    expect(payload.robots).toBeUndefined();
    expect(breadcrumb).toBeTruthy();
    expect(resource).toBeTruthy();
    expect(resource?.url || '').toContain('/tradeoffs/context-vs-zustand-vs-redux');
    expect(resource?.learningResourceType).toBe('Tradeoff battle');
    expect(resource?.isAccessibleForFree).toBeTrue();
  });

  it('reveals analysis after choosing an option', async () => {
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const analysis = fixture.nativeElement.querySelector('#tradeoff-analysis') as HTMLElement;
    expect(analysis.hidden).toBeTrue();
    expect(analysis.textContent).toContain(resolvedDetail.battle.strongAnswer.summary);
    expect(analysis.textContent).toContain(resolvedDetail.battle.interviewerPushback[0].answer);
    expect(fixture.nativeElement.querySelectorAll('#tradeoff-analysis').length).toBe(1);
    expect(progress.saveDraft).not.toHaveBeenCalled();
    expect(progress.revealAnalysis).not.toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
    const reveal = fixture.nativeElement.querySelector('[aria-controls="tradeoff-analysis"]') as HTMLButtonElement;
    expect(reveal.disabled).toBeTrue();
    expect(reveal.getAttribute('aria-expanded')).toBe('false');
    component.selectOption('zustand');
    component.revealAnalysis();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#tradeoff-analysis')).toBe(analysis);
    expect(analysis.hidden).toBeFalse();
    expect(reveal.getAttribute('aria-expanded')).toBe('true');
    expect(progress.saveDraft).toHaveBeenCalled();
    expect(progress.revealAnalysis).toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent || '').toContain('STRONG ANSWER');
    expect(fixture.nativeElement.textContent || '').toContain('Decision matrix');
    expect(fixture.nativeElement.textContent || '').toContain('Interviewer pushback');
    expect(fixture.nativeElement.textContent || '').toContain('Mark as completed');
  });

  it('restores a saved reveal only after the first render and resets on new or missing routes', async () => {
    const saved = { ...progress.getRecord(''), selectedOptionId: 'zustand', analysisRevealed: true, completed: true };
    progress.getRecord.calls.reset();
    progress.getRecord.and.callFake((id) => id === resolvedDetail.id ? saved : {
      started: false, completed: false, analysisRevealed: false, lastPlayedAt: null, selectedOptionId: '',
    });
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });
    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    const component = fixture.componentInstance;
    expect(progress.getRecord).not.toHaveBeenCalled();
    expect(component.selectedOptionId()).toBe('');
    expect(component.analysisRevealed()).toBeFalse();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.analysisRevealed()).toBeTrue();
    expect(component.completed()).toBeTrue();
    expect(component.selectedOptionId()).toBe('zustand');

    routeData$.next({ tradeoffBattleDetail: { ...resolvedDetail,
      battle: { ...resolvedDetail.battle, meta: { ...resolvedDetail.battle.meta, id: 'other-battle' } },
    } });
    fixture.detectChanges();
    expect(component.selectedOptionId()).toBe('');
    expect(component.analysisRevealed()).toBeFalse();
    expect(component.completed()).toBeFalse();
    component.selectOption('context');
    component.loginPromptOpen = true;
    routeData$.next({ tradeoffBattleDetail: { ...resolvedDetail, battle: null } });
    fixture.detectChanges();
    expect(component.selectedOptionId()).toBe('');
    expect(component.loginPromptOpen).toBeFalse();
    expect(fixture.nativeElement.querySelector('#tradeoff-analysis')).toBeNull();
  });

  it('does not reveal or complete before a valid choice and reveal action', async () => {
    authUser.set({ _id: 'user-1' });
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });
    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectOption('missing-option');
    component.revealAnalysis();
    component.markComplete();
    expect(progress.saveDraft).not.toHaveBeenCalled();
    expect(progress.revealAnalysis).not.toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
    component.selectOption('context');
    component.markComplete();
    expect(progress.markCompleted).not.toHaveBeenCalled();
  });

  it('restores each account scope without background records or profile updates replacing a live choice', async () => {
    const initial = progress.getRecord('');
    const record = signal({ ...initial, selectedOptionId: 'zustand', analysisRevealed: true });
    progress.getRecord.and.callFake(() => authUser()?._id === 'user-2' ? initial : record());
    authUser.set({ _id: 'user-1' });
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });
    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.selectedOptionId()).toBe('zustand');
    component.selectOption('context');
    record.set({ ...initial, selectedOptionId: 'zustand', analysisRevealed: true });
    authUser.set({ _id: 'user-1', username: 'updated-name' });
    fixture.detectChanges();
    expect(component.selectedOptionId()).toBe('context');
    authUser.set({ _id: 'user-2' });
    fixture.detectChanges();
    expect(component.selectedOptionId()).toBe('');
    expect(component.analysisRevealed()).toBeFalse();
    expect(progress.revealAnalysis).not.toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
  });

  it('links to the hub and adjacent battles using the resolved order, including premium previews', async () => {
    const previous = { ...resolvedDetail.list[0], id: 'previous-battle', title: 'Previous battle' };
    const next = { ...resolvedDetail.list[0], id: 'premium-next-battle', title: 'Premium next battle', access: 'premium' };
    routeData$.next({ tradeoffBattleDetail: { ...resolvedDetail, prev: previous, next } });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tradeoff-detail__back a')?.getAttribute('href')).toBe('/tradeoffs');
    const links = [...fixture.nativeElement.querySelectorAll('.tradeoff-detail__footer a')] as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/tradeoffs/previous-battle',
      '/tradeoffs/premium-next-battle',
    ]);
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Previous: Previous battle',
      'Next: Premium next battle',
    ]);
    expect(fixture.componentInstance.locked()).toBeFalse();
  });

  it('keeps unavailable adjacent destinations disabled and without links', async () => {
    routeData$.next({ tradeoffBattleDetail: resolvedDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.tradeoff-detail__footer a').length).toBe(0);
    const buttons = [...fixture.nativeElement.querySelectorAll('.tradeoff-detail__footer button')] as HTMLButtonElement[];
    expect(buttons.length).toBe(2);
    expect(buttons.every((button) => button.disabled)).toBeTrue();
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
    await fixture.whenStable();
    fixture.detectChanges();
    // PrimeNG mounts body-appended overlays outside the component fixture.
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Create a free account to keep completed battles');
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
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview-rich"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview"]')).toBeNull();
    expect(fixture.nativeElement.textContent || '').not.toContain('Reveal analysis');
    expect(fixture.nativeElement.querySelector('#tradeoff-analysis')).toBeNull();
    expect(fixture.nativeElement.textContent || '').not.toContain(resolvedDetail.battle.strongAnswer.summary);
    fixture.componentInstance.selectOption('zustand');
    fixture.componentInstance.revealAnalysis();
    fixture.componentInstance.markComplete();
    expect(progress.saveDraft).not.toHaveBeenCalled();
    expect(progress.revealAnalysis).not.toHaveBeenCalled();
    expect(progress.markCompleted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.tradeoff-detail__back a')?.getAttribute('href')).toBe('/tradeoffs');
    expect(fixture.nativeElement.querySelector('.tradeoff-detail__footer')).toBeNull();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');
    expect(resource?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(resource?.dateModified).toBe(seoContentDateModified(resource.url));
    expect(payload.robots).toBe('noindex,follow');
    expect(payload.canonical).toBe('/tradeoffs/context-vs-zustand-vs-redux');
    expect(resource?.isAccessibleForFree).toBeFalse();
    expect(JSON.stringify(graph)).not.toContain('Lean Zustand for this prompt');
  });

  it('keeps premium tradeoff robots noindex for active premium users', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.battle.meta.access = 'premium';
    authUser.set({ accessTier: 'premium' });
    routeData$.next({ tradeoffBattleDetail: premiumDetail });

    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    expect(payload.robots).toBe('noindex,follow');
    expect(fixture.nativeElement.textContent || '').toContain('Reveal analysis');
  });

  it('removes premium analysis and local state immediately when access is lost', async () => {
    const premiumDetail = structuredClone(resolvedDetail);
    premiumDetail.battle.meta.access = 'premium';
    authUser.set({ _id: 'user-1', accessTier: 'premium' });
    routeData$.next({ tradeoffBattleDetail: premiumDetail });
    const fixture = TestBed.createComponent(TradeoffDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectOption('zustand');
    component.revealAnalysis();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#tradeoff-analysis')?.hidden).toBeFalse();
    authUser.set({ _id: 'user-1', accessTier: 'free' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#tradeoff-analysis')).toBeNull();
    expect(component.selectedOptionId()).toBe('');
    expect(component.analysisRevealed()).toBeFalse();
    expect(component.completed()).toBeFalse();
  });
});
