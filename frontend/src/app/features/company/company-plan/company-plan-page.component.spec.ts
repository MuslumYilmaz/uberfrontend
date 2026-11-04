import { WritableSignal, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanAnswers, SavedCompanyPlan } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CompanyPlanPageComponent } from './company-plan-page.component';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from './company-plan-sets';
import { CompanyPlanData, buildCompanyPlan } from './company-plan.engine';
import { CompanyPlanService } from './company-plan.service';

const DATA = rawPlanData as unknown as CompanyPlanData;
const TODAY = '2026-11-02';
// Local times, so the week is the person's week wherever the tests run.
const ANSWERED = new Date(2026, 10, 2, 10).toISOString();
const NOW = new Date(2026, 10, 4, 9);

const ELEVENLABS: SavedCompanyPlan = {
  companies: [{ slug: 'elevenlabs' }],
  level: 'senior',
  when: 'next-week',
  createdAt: ANSWERED,
  passedRounds: [],
  markedDone: [],
};

describe('CompanyPlanPageComponent', () => {
  let fixture: ComponentFixture<CompanyPlanPageComponent>;
  let host: HTMLElement;
  let saved: WritableSignal<SavedCompanyPlan | null>;
  let solved: WritableSignal<Set<string>>;
  let plans: {
    saved: WritableSignal<SavedCompanyPlan | null>;
    answers: unknown;
    loadData: jasmine.Spy;
    buildPlan: (data: CompanyPlanData, answers: CompanyPlanAnswers) => ReturnType<typeof buildCompanyPlan>;
    setRoundPassed: jasmine.Spy;
    setTaskDone: jasmine.Spy;
    track: jasmine.Spy;
  };

  const tasksOf = (plan: SavedCompanyPlan, solvedIds: readonly string[] = []) => buildCompanyPlan(DATA, {
    companies: plan.companies.map((company) => company.slug),
    when: plan.when,
    level: plan.level,
    passedRounds: plan.passedRounds,
    solvedTaskIds: [...solvedIds, ...plan.markedDone],
    today: TODAY,
  });

  function setup(plan: SavedCompanyPlan | null, options: { solvedIds?: string[]; data?: CompanyPlanData | null; now?: Date; user?: unknown } = {}) {
    saved = signal(plan);
    solved = signal(new Set(options.solvedIds ?? []));
    plans = {
      saved,
      answers: computed(() => saved()),
      loadData: jasmine.createSpy('loadData').and.returnValue(of(options.data === undefined ? DATA : options.data)),
      buildPlan: (data, answers) => buildCompanyPlan(data, {
        companies: answers.companies.map((company) => company.slug),
        when: answers.when,
        level: answers.level,
        passedRounds: saved()?.passedRounds ?? [],
        solvedTaskIds: [...solved(), ...(saved()?.markedDone ?? [])],
        today: TODAY,
      }),
      setRoundPassed: jasmine.createSpy('setRoundPassed').and.callFake(async (key: string, on: boolean) => {
        saved.update((current) => current && { ...current, passedRounds: on ? [...current.passedRounds, key] : current.passedRounds.filter((k) => k !== key) });
        return true;
      }),
      setTaskDone: jasmine.createSpy('setTaskDone').and.callFake(async (id: string, on: boolean) => {
        saved.update((current) => current && { ...current, markedDone: on ? [...current.markedDone, id] : current.markedDone.filter((k) => k !== id) });
        return true;
      }),
      track: jasmine.createSpy('track'),
    };
    TestBed.configureTestingModule({
      imports: [CompanyPlanPageComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyPlanService, useValue: plans },
        { provide: UserProgressService, useValue: { isSolved: (id: string) => solved().has(id) } },
        { provide: AuthService, useValue: { user: signal(options.user ?? { _id: 'member', entitlements: { pro: { status: 'active' } } }) } },
      ],
    });
    fixture = TestBed.createComponent(CompanyPlanPageComponent);
    (fixture.componentInstance as unknown as { now: Date }).now = options.now ?? NOW;
    fixture.detectChanges();
    host = fixture.nativeElement;
  }

  const text = (selector: string) => (host.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const all = (testId: string) => Array.from(host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('opens on the first task, with the date, the time map and every round', () => {
    setup(ELEVENLABS);
    const plan = tasksOf(ELEVENLABS);

    expect(text('h1')).toBe('Your ElevenLabs plan is ready');
    expect(Array.from(host.querySelectorAll('.plan-hero__chip')).map((chip) => chip.textContent)).toEqual(['Week of Nov 9', 'Senior', 'React, from reports']);
    expect(text('.plan-panel__label')).toBe('Start here');
    expect(text('.plan-panel__title')).toBe(plan.next!.title);
    expect(host.querySelector('[data-testid="company-plan-next"]')?.getAttribute('href')).toBe(plan.next!.route);
    expect(text('[data-testid="company-plan-next"]')).toContain('Start the first task');
    expect(text('[data-testid="company-plan-progress"]')).toBe(`0 of ${plan.tasks.length} solved`);
    expect(all('company-plan-map-block').length).toBe(plan.tasks.length);
    expect(all('company-plan-task').length).toBe(plan.tasks.length);
    expect(all('company-plan-round').length).toBe(plan.companies[0].rounds.length);
    expect(host.querySelector('.plan-task--next')?.textContent).toContain('Next up');
    expect(all('company-plan-warning').length).toBe(0);
    expect(plans.track).toHaveBeenCalledOnceWith('company_plan_opened', jasmine.objectContaining({ companies: 'elevenlabs', total: plan.tasks.length }));
  });

  it('moves on as tasks are solved, and calls a finished plan finished', () => {
    const plan = tasksOf(ELEVENLABS);
    setup(ELEVENLABS, { solvedIds: [plan.tasks[0].id] });
    expect(text('h1')).toBe('Welcome back to your ElevenLabs plan');
    expect(text('.plan-panel__label')).toBe('Next up');
    expect(text('[data-testid="company-plan-next"]')).toContain('Continue with the next task');
    expect(text('[data-testid="company-plan-progress"]')).toMatch(new RegExp(`^1 of ${plan.tasks.length} solved, about [\\d.]+ hours? left$`));

    TestBed.resetTestingModule();
    setup(ELEVENLABS, { solvedIds: plan.tasks.map((task) => task.id) });
    expect(text('h1')).toBe('You finished your ElevenLabs plan');
    expect(text('.plan-panel__label')).toBe('Plan finished');
    expect(host.querySelector('[data-testid="company-plan-next"]')?.getAttribute('href')).toBe('/coding?tech=react&kind=coding');
  });

  it('marks a round as passed, hides its details and gives its tasks to the rounds left', async () => {
    setup(ELEVENLABS);
    const before = tasksOf(ELEVENLABS);
    const round = before.companies[0].rounds.find((entry) => entry.tasks.length)!;
    const index = before.companies[0].rounds.indexOf(round);
    const button = all('company-plan-round-pass')[index] as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    await settle();

    expect(plans.setRoundPassed).toHaveBeenCalledOnceWith(round.key, true);
    const row = all('company-plan-round')[index];
    expect(row.querySelector('.plan-round__pass')?.textContent?.trim()).toBe('Passed. Undo');
    expect(row.querySelector('.plan-round__pass')?.getAttribute('aria-pressed')).toBe('true');
    expect(row.querySelector('.plan-round__note')).toBeNull();
    expect(row.querySelectorAll('[data-testid="company-plan-task"]').length).toBe(0);
    const after = tasksOf({ ...ELEVENLABS, passedRounds: [round.key] });
    expect(all('company-plan-task').length).toBe(after.tasks.length);
  });

  it('marks a task by hand, but leaves a task solved in the workspace as it is', async () => {
    const plan = tasksOf(ELEVENLABS);
    const [workspaceSolved, open] = plan.tasks;
    setup(ELEVENLABS, { solvedIds: [workspaceSolved.id] });

    const checks = all('company-plan-task-check') as HTMLButtonElement[];
    const lockedCheck = host.querySelector<HTMLButtonElement>(`#plan-task-${workspaceSolved.id} [data-testid="company-plan-task-check"]`)!;
    expect(lockedCheck.disabled).toBeTrue();
    expect(lockedCheck.getAttribute('aria-label')).toBe(`Solved in the workspace: ${workspaceSolved.title}`);
    expect(checks.length).toBe(plan.tasks.length);

    host.querySelector<HTMLButtonElement>(`#plan-task-${open.id} [data-testid="company-plan-task-check"]`)!.click();
    await settle();

    expect(plans.setTaskDone).toHaveBeenCalledOnceWith(open.id, true);
    expect(host.querySelector(`#plan-task-${open.id}`)?.classList).toContain('plan-task--done');
    expect(text(`#plan-task-${open.id} .plan-task__time`)).toBe('Solved');
  });

  it('says so when a mark does not reach the account', async () => {
    setup(ELEVENLABS);
    plans.setRoundPassed.and.resolveTo(false);
    all('company-plan-round-pass')[1].click();
    await settle();
    expect(text('[data-testid="company-plan-save-failed"]')).toBe('We could not save that just now. Try again.');
  });

  it('warns once the interview date has passed', () => {
    // Thursday 1 October 2026: "next week" was the week of 5 October.
    setup({ ...ELEVENLABS, createdAt: new Date(2026, 9, 1, 10).toISOString() });
    expect(host.querySelector('.plan-hero__chip')?.textContent).toBe('Week of Oct 5');
    expect(text('[data-testid="company-plan-warning"]')).toBe('Your interview week has passed. Use Edit answers to update your date.');
  });

  it('groups the time map by company when there are several', () => {
    setup({ ...ELEVENLABS, companies: [{ slug: 'elevenlabs' }, { slug: 'agoda' }] });
    expect(text('.plan-map__title')).toMatch(/^About [\d.]+ hours?, company by company$/);
    expect(Array.from(host.querySelectorAll('.plan-map__group-name')).map((name) => name.textContent)).toEqual(['ElevenLabs', 'Agoda', 'Extra React practice']);
    expect(Array.from(host.querySelectorAll('.plan-company__title')).map((title) => title.textContent)).toEqual(['ElevenLabs, round by round', 'Agoda, round by round']);
  });

  it('keeps the plan readable after Premium ends, and leads every task to renewing', () => {
    setup(ELEVENLABS, { user: { _id: 'member', entitlements: { pro: { status: 'expired' } } } });
    const pricing = '/pricing?src=company_plan_elevenlabs';

    expect(text('h1')).toBe('Your ElevenLabs plan is saved');
    expect(text('.plan-panel__label')).toBe('Premium ended');
    expect(text('.plan-panel__meta')).toBe('Renew to open your tasks again. Your solved tasks stay.');
    expect(text('[data-testid="company-plan-next"]')).toContain('Renew Premium');
    expect(host.querySelector('[data-testid="company-plan-next"]')?.getAttribute('href')).toBe(pricing);
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('.plan-task__link'));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute('href') === pricing)).toBeTrue();
    expect(links[0].getAttribute('aria-label')).toMatch(/, opens again with Premium$/);
    expect(host.querySelectorAll('.plan-task__lock').length).toBe(links.length);
    expect(host.querySelector('.plan-task--next')).toBeNull();
    expect(all('company-plan-beyond')).toEqual([]);
  });

  it('points past the plan to each company set and the whole Premium library', () => {
    setup({ ...ELEVENLABS, companies: [{ slug: 'elevenlabs' }, { slug: 'amazon' }] });
    const links = Array.from(all('company-plan-beyond')[0].querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
      [`The full ElevenLabs set: ${COMPANY_SET_COUNTS['elevenlabs']!.all} questions`, '/companies/elevenlabs/all'],
      [`The full Amazon set: ${COMPANY_SET_COUNTS['amazon']!.all} questions`, '/companies/amazon/all'],
      [`All ${PREMIUM_QUESTION_COUNT} Premium questions`, '/coding'],
    ]);
  });

  it('prints code in a title as code, never as backticks', () => {
    setup(ELEVENLABS);
    const row = host.querySelector('#plan-task-js-debug-async-race')!;
    expect(row.querySelector('.plan-task__title code')?.textContent).toBe('fetchWithCache');
    expect(row.textContent).not.toContain('`');
    expect(row.querySelector('[data-testid="company-plan-task-check"]')?.getAttribute('aria-label')).toBe('Mark as solved: Fix async race in fetchWithCache');
    expect(host.querySelector('[data-testid="company-plan-map"]')?.innerHTML).not.toContain('`');
  });

  it('tracks a task opened from the plan', () => {
    setup(ELEVENLABS);
    const plan = tasksOf(ELEVENLABS);
    host.querySelector<HTMLAnchorElement>(`#plan-task-${plan.next!.id} .plan-task__link`)!.click();
    expect(plans.track).toHaveBeenCalledWith('company_plan_task_opened', { task: plan.next!.id, kind: plan.next!.kind, next: true });
  });

  it('offers the form when there is no plan, and a retry when the data does not load', () => {
    setup(null);
    expect(host.querySelector('[data-testid="company-plan-empty"] a')?.getAttribute('href')).toBe('/companies');

    TestBed.resetTestingModule();
    setup(ELEVENLABS, { data: null });
    expect(host.querySelector('[data-testid="company-plan-error"]')).toBeTruthy();
    plans.loadData.and.returnValue(of(DATA));
    host.querySelector<HTMLButtonElement>('[data-testid="company-plan-error"] button')!.click();
    fixture.detectChanges();
    expect(text('h1')).toBe('Your ElevenLabs plan is ready');
  });
});
