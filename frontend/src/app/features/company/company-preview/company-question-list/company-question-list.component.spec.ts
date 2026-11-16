import { TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import type { CompanyInterviewProcess, InterviewProcessSource } from '../../../../shared/company-previews/company-interview-processes';
import { summariseQuestionList } from '../../../../shared/company-previews/company-question-list';
import { COMPANY_GUIDE_FEATURES, type CompanyGuideFeatures } from '../company-guide-features';
import type { FreeUnlock } from '../../../../core/models/free-unlock.model';
import type { AuthoredPracticePrompt } from '../../../../shared/company-previews/authored-company-preview.model';
import { CompanyQuestionListComponent, practiceTaskId, type CompanyGuideViewer, type FreeUnlockState } from './company-question-list.component';

const account = (id: string, date: string): InterviewProcessSource => ({
  label: 'Taro',
  url: `https://www.jointaro.com/interviews/companies/acme/experiences/frontend-engineer-united-states-march-3-2026-no-offer-neutral-${id}/`,
  kind: 'report',
  date,
});

function acme(rows: number): CompanyInterviewProcess {
  return {
    summary: '',
    caveat: '',
    checkedAt: '2026-11-01',
    variants: [{ title: 'Engineers', stages: [{ stage: 'Coding round', format: 'f', appliesTo: 'a', sources: [] }] }],
    questions: [
      { id: 'open-one', round: 'Coding round', kind: 'React build', topic: 'Open widget', question: 'Build the open widget.', sources: [account('0000000a', '2026-10')] },
      { id: 'with-task', round: 'Coding round', kind: 'React debugging', topic: 'Locked widget fix', question: 'Fix the locked widget.', sources: [account('0000000b', '2024-03')], practice: { label: 'Fix it', path: '/react/coding/react-x' } },
      { id: 'bare', kind: 'Algorithm', topic: 'Bare puzzle', question: 'Solve the bare puzzle.', sources: [account('0000000c', '2025-01')] },
      ...Array.from({ length: rows - 3 }, (_, i) => ({ id: `extra-${i}`, kind: 'Algorithm' as const, topic: `Extra puzzle ${i}`, question: `Extra ${i}.`, sources: [account(`000001${String(i).padStart(2, '0')}`, '2023-01')] })),
    ],
    behaviouralQuestions: [{ id: 'why-acme', question: 'Why Acme?', sources: [account('0000000d', '2025-06')] }],
  };
}

describe('CompanyQuestionListComponent', () => {
  let fixture: ComponentFixture<CompanyQuestionListComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  function create(
    viewer: CompanyGuideViewer,
    options: {
      features?: Partial<CompanyGuideFeatures>; rows?: number; today?: string; freeUnlock?: FreeUnlock; unlockState?: FreeUnlockState;
      practised?: ReadonlySet<string>; edit?: (process: CompanyInterviewProcess) => CompanyInterviewProcess;
      guides?: Record<string, AuthoredPracticePrompt>;
    } = {},
  ) {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    TestBed.configureTestingModule({
      imports: [CompanyQuestionListComponent],
      providers: [provideRouter([]), { provide: AnalyticsService, useValue: analytics }],
    });
    // The prerender's day travels with the page; the list reads it instead of the reader's clock.
    if (options.today) TestBed.inject(TransferState).set(makeStateKey<string>('company-guide-today'), options.today);
    const process = (options.edit ?? ((same) => same))(acme(options.rows ?? 4));
    fixture = TestBed.createComponent(CompanyQuestionListComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', process);
    fixture.componentRef.setInput('summary', summariseQuestionList(process));
    if (options.guides) fixture.componentRef.setInput('guides', options.guides);
    fixture.componentRef.setInput('viewer', viewer);
    fixture.componentRef.setInput('features', { ...COMPANY_GUIDE_FEATURES, ...options.features });
    fixture.componentRef.setInput('offer', { price: '$24', priceNote: 'lower prices in many countries' });
    fixture.componentRef.setInput('pricingSource', 'company_preview_acme_list');
    if (options.freeUnlock) fixture.componentRef.setInput('freeUnlock', options.freeUnlock);
    if (options.unlockState) fixture.componentRef.setInput('unlockState', options.unlockState);
    if (options.practised) fixture.componentRef.setInput('practised', options.practised);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('[data-testid="company-question-row"]'));
  const choose = (host: HTMLElement, index: number) => {
    (rows(host)[index].querySelector('.cq-row__locked') as HTMLButtonElement).click();
    fixture.detectChanges();
    return rows(host)[index].querySelector('[data-testid="company-question-choice"]') as HTMLElement;
  };

  it('offers a visitor the free unlock only on a row with a practice task or answer guide, beside Premium', () => {
    const host = create('guest');
    const unlockable = choose(host, 1);
    const links = Array.from(unlockable.querySelectorAll('a')).map((a) => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Open this one free with an account', '/auth/signup?redirectTo=%2Fcompanies%2Facme%2Fpreview'],
      ['Unlock all 3 with Premium', '/pricing?src=company_preview_acme_list'],
    ]);
    expect(analytics.track).toHaveBeenCalledWith('company_question_locked_clicked', jasmine.objectContaining({ question_id: 'with-task', unlockable: true }));

    const bare = choose(host, 2);
    expect(bare.textContent).not.toContain('Open this one free');
    expect(bare.textContent).toContain('the free unlock does not apply to it');
  });

  it('lets an account spend its free unlock on the row, through the parent', () => {
    const host = create('account');
    const spent: string[] = [];
    fixture.componentInstance.unlock.subscribe((id) => spent.push(id));
    const choice = choose(host, 1);
    (choice.querySelector('button') as HTMLButtonElement).click();
    expect(spent).toEqual(['with-task']);
    expect(analytics.track).toHaveBeenCalledWith('company_question_choice', jasmine.objectContaining({ question_id: 'with-task', choice: 'free_unlock' }));
  });

  it('opens every row with the locked-questions switch off, the SEO rollback', () => {
    const host = create('guest', { features: { lockedQuestions: false } });
    expect(host.querySelectorAll('.premium-locked').length).toBe(0);
    expect(rows(host).every((row) => row.querySelector('.cq-row__title'))).toBeTrue();
    expect(host.querySelector('[data-testid="company-question-offer"]')).toBeNull();
  });

  it('keeps the lock but drops counts, NEW, the free unlock and the offer with the Premium-pull switch off', () => {
    const host = create('guest', { features: { premiumPull: false }, today: '2026-11-13' });
    expect(host.querySelectorAll('.cq-row--locked').length).toBe(3);
    expect(host.querySelector('[data-testid="company-question-new"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-question-allowance"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-question-offer"]')).toBeNull();
    expect(choose(host, 1).textContent).not.toContain('Open this one free');
  });

  it('tags a question NEW until 60 days after its newest account month, by the prerender date', () => {
    expect(create('guest', { today: '2026-12-30' }).querySelectorAll('[data-testid="company-question-new"]').length).toBe(1);
    TestBed.resetTestingModule();
    expect(create('guest', { today: '2026-12-31' }).querySelectorAll('[data-testid="company-question-new"]').length).toBe(0);
  });

  it('shows the first eight rows until the reader asks for all, with every row in the page', () => {
    const host = create('guest', { rows: 11 });
    expect(rows(host).length).toBe(11);
    expect(rows(host).filter((row) => row.classList.contains('cq-row--hidden')).length).toBe(3);
    (host.querySelector('[data-testid="company-question-more"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows(host).filter((row) => row.classList.contains('cq-row--hidden')).length).toBe(0);
  });

  it('names each locked question by its topic, outside the lock, and keeps the wording locked', () => {
    const host = create('guest');
    const row = host.querySelectorAll<HTMLElement>('[data-testid="company-question-row"]')[1];
    const topic = row.querySelector('[data-testid="company-question-topic"]') as HTMLElement;
    expect(topic.textContent?.trim()).toBe('Locked widget fix');
    expect(topic.closest('.premium-locked')).toBeNull();
    expect(row.querySelector('.cq-row__question.premium-locked')?.textContent?.trim()).toBe('Fix the locked widget.');
    expect(row.querySelector('.cq-row__locked')?.getAttribute('aria-label')).toContain('Locked widget fix');
    // The open row shows its own title, not a second topic line.
    expect(host.querySelector('[data-testid="company-question-row"]')?.querySelector('[data-testid="company-question-topic"]')).toBeNull();
  });

  it('shows the behavioural questions open, with how often they were reported', () => {
    const host = create('guest');
    const group = host.querySelector('[data-testid="company-question-behavioural"]') as HTMLElement;
    expect(group.querySelector('.premium-locked')).toBeNull();
    expect(group.textContent).toContain('Why Acme?');
    expect(group.textContent).toContain('Reported in 1 account · Jun 2025');
    // One account behind the group reads as one source, not as "the same reports".
    expect(group.querySelector('.cq-behavioural__intro')?.textContent?.trim()).toBe('Open to everyone: 1 question from one public source.');
  });

  describe('the Premium trailer in the offer', () => {
    type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
    /** The trailer's observers: `near` a screen ahead of view (it has a root margin), `inView` half in view. */
    let observers: { near?: Callback; inView?: Callback };
    let realObserver: typeof IntersectionObserver;
    beforeEach(() => {
      observers = {};
      realObserver = window.IntersectionObserver;
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
        constructor(callback: Callback, options?: IntersectionObserverInit) { observers[options?.rootMargin ? 'near' : 'inView'] = callback; }
        observe(): void {}
        disconnect(): void {}
      };
    });
    afterEach(() => {
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = realObserver;
    });
    const video = (host: HTMLElement) => host.querySelector('[data-testid="company-question-trailer"] video') as HTMLVideoElement;

    it('shows a visitor a silent trailer that loads nothing, not even its poster, before it comes near', async () => {
      const host = create('guest');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(video(host).getAttribute('preload')).toBe('none');
      expect(video(host).hasAttribute('muted')).toBeTrue();
      expect(video(host).hasAttribute('autoplay')).toBeFalse();
      expect(video(host).hasAttribute('poster')).withContext('poster before it is near').toBeFalse();
      observers.near!([{ isIntersecting: true }]);
      fixture.detectChanges();
      expect(video(host).getAttribute('poster')).toBe('/assets/media/premium-trailer-poster.jpg');
      expect(video(host).querySelector('source')?.getAttribute('src')).toBe('/assets/media/premium-trailer.mp4');
      expect(Array.from(host.querySelectorAll('.cq-offer__steps li'), (li) => li.textContent?.trim())).toEqual([
        'A Premium task in the real editor, with a live preview.',
        'Run the checks: each failing check says what failed.',
        'Pressure Mode: the interviewer adds a constraint every round.',
      ]);
    });

    it('plays while half of it is in view and pauses out of it', async () => {
      const play = spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
      const pause = spyOn(HTMLMediaElement.prototype, 'pause');
      const host = create('guest');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(observers.inView).withContext('observed').toBeDefined();
      expect(video(host).muted).toBeTrue();
      observers.inView!([{ isIntersecting: true }]);
      expect(play).toHaveBeenCalledTimes(1);
      observers.inView!([{ isIntersecting: false }]);
      expect(pause).toHaveBeenCalledTimes(1);
    });

    it('waits with its controls and poster for a reader who asked for reduced motion', async () => {
      spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
      const play = spyOn(HTMLMediaElement.prototype, 'play').and.returnValue(Promise.resolve());
      const host = create('guest');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(video(host).hasAttribute('controls')).toBeTrue();
      expect(observers.inView).toBeUndefined();
      observers.near!([{ isIntersecting: true }]);
      fixture.detectChanges();
      expect(video(host).getAttribute('poster')).toBe('/assets/media/premium-trailer-poster.jpg');
      expect(play).not.toHaveBeenCalled();
    });

    it('is not shown to a member, who gets no offer', () => {
      expect(create('member').querySelector('[data-testid="company-question-trailer"]')).toBeNull();
    });
  });

  describe('what a locked row holds', () => {
    const guide: AuthoredPracticePrompt = {
      id: 'g-bare', title: 'Solve the bare puzzle', statement: 'Solve it.', whatThisMeasures: 'Care.', clarifyFirst: [],
      strongAnswer: ['Name the edge cases.'], commonMiss: '', resourceLabel: 'Bare', resourcePath: '/react/coding/react-x',
    };
    // Row 3 gets an answer guide and a Premium task, and keeps its prompt to the accounts.
    const withGuide = (process: CompanyInterviewProcess): CompanyInterviewProcess => ({
      ...process,
      questions: process.questions!.map((question) => (question.id === 'bare'
        ? { ...question, answerGuide: 'g-bare', promptNotShared: true, practice: { label: 'Debug it', path: '/react/coding/react-debug-transcript-sync' } }
        : question)),
    });
    const contents = (host: HTMLElement) => rows(host).map((row) => row.querySelector('[data-testid="company-question-contents"]')?.textContent?.trim() ?? null);

    it('says on every locked row, before any choice, what the free unlock or Premium would open', () => {
      const host = create('guest', { edit: withGuide, guides: { 'g-bare': guide } });
      expect(contents(host)).toEqual([
        null,
        // A free task is said to be free and not named: its title would give the locked question away.
        'Behind the lock: the question only. Its practice task is free for everyone.',
        "Behind the lock: the accounts' description (they do not share the prompt), an answer guide and a Premium practice task.",
        'Behind the lock: the question only.',
      ]);
      expect(host.textContent).not.toContain('Fix it');
      // The choice no longer repeats a promise the row does not keep.
      expect(choose(host, 1).textContent).not.toContain('its answer guide where it has one');
    });

    it('drops the line from a row the reader opened, and from every row for a member', () => {
      let host = create('account', { freeUnlock: { company: 'acme', questionId: 'with-task', practiceId: 'react-x', unlockedAt: '2026-11-13T00:00:00.000Z' } });
      expect(contents(host)).toEqual([null, null, 'Behind the lock: the question only.', 'Behind the lock: the question only.']);
      TestBed.resetTestingModule();
      host = create('member');
      expect(contents(host).every((line) => line === null)).toBeTrue();
    });
  });

  describe('counts and rows past "Show all"', () => {
    it('counts the questions still locked once the free unlock opened one here', () => {
      const host = create('account', { rows: 10, freeUnlock: { company: 'acme', questionId: 'with-task', practiceId: 'react-x', unlockedAt: '2026-11-13T00:00:00.000Z' } });
      expect(host.querySelector('.cq__intro')?.textContent?.trim())
        .toBe('The first question is open. The others show their topic and what is behind the lock; Premium opens all 8 still locked.');
      expect(host.querySelector('.cq-offer__title')?.textContent?.trim()).toBe('Unlock all 8 Acme questions');
    });

    it('tells a visitor that the open question\'s outline waits for a free account', () => {
      const host = create('guest');
      expect(host.querySelector('.cq__intro')?.textContent?.trim()).toBe(
        'The first question is open to read; its answer outline opens with a free account. The others show their topic and what is behind the lock; Premium opens all 3 still locked.',
      );
    });

    it('keeps the question opened with the free unlock in view when it sits past "Show all"', () => {
      const host = create('account', { rows: 12, freeUnlock: { company: 'acme', questionId: 'extra-8', practiceId: null, unlockedAt: '2026-11-13T00:00:00.000Z' } });
      const hidden = (id: string) => host.querySelector(`#acme-question-${id}`)!.classList.contains('cq-row--hidden');
      expect(hidden('extra-8')).toBeFalse();
      expect(hidden('extra-7')).toBeTrue();
    });

    it('opens the list at a row past "Show all" when a link points at it, as a round\'s count in the process table does', async () => {
      const host = create('guest', { rows: 12 });
      expect(host.querySelector('#acme-question-extra-8')!.classList.contains('cq-row--hidden')).toBeTrue();
      await TestBed.inject(Router).navigateByUrl('/#acme-question-extra-8');
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toBeTrue();
      expect(host.querySelector('#acme-question-extra-8')!.classList.contains('cq-row--hidden')).toBeFalse();
    });
  });

  describe('progress for a reader with an account', () => {
    const progress = (host: HTMLElement) => host.querySelector('[data-testid="company-question-progress"]')?.textContent?.trim() ?? null;
    const solvedRows = (host: HTMLElement) => rows(host).map((row) => !!row.querySelector('[data-testid="company-question-solved"]'));

    it('counts the practice tasks the account has solved, as the plan does, and tags each solved row', () => {
      const host = create('account', { practised: new Set(['react-x', 'not-on-this-list']) });
      expect(progress(host)).toBe('Your Acme prep: 1 of the one practice task in this list solved');
      expect(solvedRows(host)).toEqual([false, true, false, false]);
    });

    it('counts none for an account that has not practised yet', () => {
      const host = create('account', { practised: new Set() });
      expect(progress(host)).toBe('Your Acme prep: 0 of the one practice task in this list solved');
      expect(solvedRows(host)).toEqual([false, false, false, false]);
    });

    it('shows a member the same count, beside the open rows', () => {
      const host = create('member', { practised: new Set(['react-x']) });
      expect(progress(host)).toBe('Your Acme prep: 1 of the one practice task in this list solved');
      expect(solvedRows(host)).toEqual([false, true, false, false]);
    });

    it('shows a visitor no progress, so the prerendered page carries none', () => {
      const host = create('guest', { practised: new Set(['react-x']) });
      expect(progress(host)).toBeNull();
      expect(solvedRows(host)).toEqual([false, false, false, false]);
    });

    it('reads a task id the way the plan writes it: a question by its id, a guide by its route', () => {
      expect(practiceTaskId('/javascript/coding/js-debounce')).toBe('js-debounce');
      expect(practiceTaskId('/system-design/infinite-scroll-list')).toBe('infinite-scroll-list');
      expect(practiceTaskId('/guides/behavioral/stories')).toBe('/guides/behavioral/stories');
    });
  });

  describe('the free unlock', () => {
    const spent = (company: string, questionId: string): FreeUnlock => ({ company, questionId, practiceId: 'react-x', unlockedAt: '2026-11-13T10:00:00.000Z' });

    it('passes a visitor\'s choice up, so it can be kept until they have an account, and says the choice is final', () => {
      const host = create('guest');
      const chosen: string[] = [];
      fixture.componentInstance.unlock.subscribe((id) => chosen.push(id));
      const choice = choose(host, 1);
      expect(choice.textContent).toContain('cannot be moved later');
      (choice.querySelector('a') as HTMLAnchorElement).dispatchEvent(new MouseEvent('click', { cancelable: true }));
      expect(chosen).toEqual(['with-task']);
    });

    it('opens the row an account unlocked, tags it, and stops offering the unlock anywhere else', () => {
      const host = create('account', { freeUnlock: spent('acme', 'with-task') });
      const row = rows(host)[1];
      expect(row.classList).not.toContain('cq-row--locked');
      expect(row.querySelector('[data-testid="company-question-unlocked"]')).not.toBeNull();
      expect(row.querySelector('.premium-locked')).toBeNull();
      expect(row.querySelector('.cq-row__practice a')?.getAttribute('href')).toBe('/react/coding/react-x');
      expect(host.querySelector('[data-testid="company-question-allowance"]')?.textContent).toContain('You opened question 2 with your free unlock');
      expect(host.querySelector('[data-testid="company-question-offer"] .cq-offer__title')?.textContent).toContain('Unlock all 2 Acme questions');
    });

    it('names the guide where an account already spent it and offers only Premium', () => {
      const host = create('account', { freeUnlock: spent('elevenlabs', 'some-question') });
      expect(host.querySelector('[data-testid="company-question-allowance"]')?.textContent).toContain('You used your free unlock in the ElevenLabs guide');
      const choice = choose(host, 1);
      expect(choice.querySelector('button')).toBeNull();
      expect(choice.textContent).toContain('Your free unlock is already used in the ElevenLabs guide');
    });

    it('shows the unlock running and failing on its row', () => {
      let host = create('account', { unlockState: { questionId: 'with-task', status: 'pending' } });
      let button = choose(host, 1).querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
      expect(button.textContent?.trim()).toBe('Opening…');
      TestBed.resetTestingModule();
      host = create('account', { unlockState: { questionId: 'with-task', status: 'error' } });
      expect(choose(host, 1).querySelector('[data-testid="company-question-unlock-error"]')).not.toBeNull();
    });
  });
});
