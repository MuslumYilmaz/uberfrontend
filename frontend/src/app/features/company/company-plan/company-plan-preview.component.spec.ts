import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyPlanPreviewComponent, readPreviewRequest } from './company-plan-preview.component';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from './company-plan-sets';
import { CompanyPlanData, buildCompanyPlan } from './company-plan.engine';
import { companySetLine } from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';

const DATA = rawPlanData as unknown as CompanyPlanData;
const TODAY = '2026-11-02';

type Viewer = 'guest' | 'free' | 'premium';

describe('readPreviewRequest', () => {
  const read = (params: Record<string, string>, saved: CompanyPlanAnswers | null = null) => readPreviewRequest(convertToParamMap(params), DATA, saved);

  it('reads companies, lists, date and level', () => {
    expect(read({ companies: 'agoda,elevenlabs', lists: 'agoda:gurgaon', when: 'tomorrow', level: 'mid' })?.answers).toEqual({
      companies: [{ slug: 'agoda', list: 'gurgaon' }, { slug: 'elevenlabs' }],
      when: 'tomorrow',
      level: 'mid',
    });
  });

  it('survives a broken address', () => {
    const request = read({ companies: 'vercel,agoda,agoda,<script>', lists: 'agoda:nope,vercel:x', when: 'someday', level: 'principal' });
    expect(request?.answers).toEqual({ companies: [{ slug: 'agoda' }], when: 'next-week', level: 'senior' });
  });

  it('keeps the passed rounds the data knows for the companies in the address, and leaves them out otherwise', () => {
    const passed = 'amazon/experienced/phone-screen,amazon/experienced/online-assessment,amazon/experienced/online-assessment,amazon/experienced/nope,amazon/students/online-assessment,agoda/bangkok/recruiter-prep-call,meta';
    expect(read({ companies: 'amazon', when: 'tomorrow', level: 'junior', passed })?.answers.passedRounds)
      .toEqual(['amazon/experienced/online-assessment', 'amazon/experienced/phone-screen']);
    expect(read({ companies: 'amazon', when: 'tomorrow', level: 'junior' })?.answers.passedRounds).toBeUndefined();
    expect(read({ companies: 'amazon', when: 'tomorrow', level: 'junior', passed: 'agoda/bangkok/recruiter-prep-call' })?.answers.passedRounds).toBeUndefined();
  });

  it('keeps at most three companies', () => {
    expect(read({ companies: 'agoda,meta,google,amazon', when: 'later', level: 'mid' })?.answers.companies.map((company) => company.slug)).toEqual(['agoda', 'meta', 'google']);
  });

  it('keeps a framework it knows and ignores any other', () => {
    expect(read({ companies: 'agoda', when: 'later', level: 'mid', framework: 'angular' })?.answers.framework).toBe('angular');
    expect(read({ companies: 'agoda', when: 'later', level: 'mid', framework: 'svelte' })?.answers.framework).toBeUndefined();
    expect(read({ companies: 'agoda', when: 'later', level: 'mid' })?.answers.framework).toBeUndefined();
  });

  it('treats only unknown companies as a general plan', () => {
    expect(read({ companies: 'vercel', when: 'later', level: 'mid' })?.answers.companies).toEqual([]);
  });

  it('keeps an unlisted name, shortened, only when no company is known', () => {
    expect(read({ custom: 'V'.repeat(90), when: 'later', level: 'mid' })?.custom.length).toBe(60);
    expect(read({ companies: 'agoda', custom: 'Vercel', when: 'later', level: 'mid' })?.custom).toBe('');
  });

  it('falls back to the saved answers, and to nothing when there are none', () => {
    const saved: CompanyPlanAnswers = { companies: [{ slug: 'meta' }], when: 'later', level: 'staff' };
    expect(read({}, saved)?.answers).toEqual(saved);
    expect(read({})).toBeNull();
  });
});

describe('CompanyPlanPreviewComponent', () => {
  let fixture: ComponentFixture<CompanyPlanPreviewComponent>;
  let host: HTMLElement;
  let navigate: jasmine.Spy;
  let plans: { save: jasmine.Spy; track: jasmine.Spy; loadData: jasmine.Spy; saved: ReturnType<typeof signal<any>>; answers: any; buildPlan: any };

  function setup(params: Record<string, string>, options: { viewer?: Viewer; saved?: CompanyPlanAnswers | null; data?: CompanyPlanData | null } = {}) {
    const viewer = options.viewer ?? 'guest';
    const saved = signal<any>(options.saved ?? null);
    plans = {
      saved,
      answers: computed(() => saved()),
      save: jasmine.createSpy('save').and.returnValue(of('saved')),
      track: jasmine.createSpy('track'),
      loadData: jasmine.createSpy('loadData').and.returnValue(of(options.data === undefined ? DATA : options.data)),
      buildPlan: (data: CompanyPlanData, answers: CompanyPlanAnswers) => buildCompanyPlan(data, {
        companies: answers.companies.map((company) => company.slug),
        lists: Object.fromEntries(answers.companies.flatMap((company) => (company.list ? [[company.slug, company.list]] : []))),
        when: answers.when,
        level: answers.level,
        passedRounds: answers.passedRounds ?? [],
        ...(answers.framework ? { framework: answers.framework } : {}),
        today: TODAY,
      }),
    };
    const user = viewer === 'guest' ? null : { _id: 'a', entitlements: viewer === 'premium' ? { pro: { status: 'lifetime' } } : { pro: { status: 'none' } } };
    TestBed.configureTestingModule({
      imports: [CompanyPlanPreviewComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(user) } },
        { provide: CompanyPlanService, useValue: plans },
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)), snapshot: { queryParamMap: convertToParamMap(params) } } },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CompanyPlanPreviewComponent);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    host = fixture.nativeElement;
  }

  const text = (selector: string) => host.querySelector(selector)?.textContent?.trim() ?? '';
  const testId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const all = (id: string) => Array.from(host.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  const ELEVENLABS = { companies: 'elevenlabs', when: 'next-week', level: 'senior' };

  describe('for a visitor', () => {
    it('shows the plan at a glance, with the sources and a framework it did not ask for', () => {
      setup(ELEVENLABS);
      expect(text('h1')).toBe('Your ElevenLabs plan at a glance');
      expect(Array.from(host.querySelectorAll('.preview__chip')).map((chip) => chip.textContent)).toEqual(['Next week', 'Senior', 'React, from reports']);
      expect(text('.preview__evidence')).toBe('Rounds and tasks from 7 public sources, last checked Oct 22, 2026. These are practice versions, not leaked questions.');
      expect(host.textContent).not.toContain('Which framework');
    });

    it('starts past the rounds the address says are passed, and says so', () => {
      setup({ companies: 'amazon', when: 'tomorrow', level: 'junior', passed: 'amazon/experienced/online-assessment' });
      expect(Array.from(host.querySelectorAll('.preview__chip')).map((chip) => chip.textContent)).toContain('From the Phone screen');
      const facts = Array.from(host.querySelectorAll('.preview__facts li')).map((fact) => fact.textContent?.trim() ?? '');
      expect(facts[1]).toMatch(/^4 of 5 reported rounds left, in order, (with their tasks and your progress|tasks on \d of them, and your progress)$/);
      const plan = fixture.componentInstance.plan()!;
      expect(plan.companies[0].rounds.map((round) => round.passed)).toEqual([true, false, false, false, false]);
      expect(plan.tasks.every((task) => plan.companies[0].rounds[0].tasks.every((other) => other.id !== task.id))).toBeTrue();

      testId('company-plan-build')?.click();
      expect(plans.save).toHaveBeenCalledOnceWith(jasmine.objectContaining({ passedRounds: ['amazon/experienced/online-assessment'] }));
      expect(plans.track).toHaveBeenCalledWith('company_plan_build_clicked', jasmine.objectContaining({ passed_count: 1 }));
    });

    it('offers three tasks to open today, all free, with no account', () => {
      setup(ELEVENLABS);
      const rows = all('company-plan-open-task');
      expect(rows.length).toBe(3);
      expect(text('#company-plan-open-title')).toBe('Try these 3 tasks for free');
      expect(text('.preview__section-sub')).toBe('They run in your browser. No account needed.');
      expect(rows[0].getAttribute('href')).toMatch(/^\/javascript\/(coding|debug)\//);
      expect(rows[0].textContent).toMatch(/Modelled on a report: Aced, (Jul|Oct) 2026 · Coding assessment/);
      // "Fix async race in `fetchWithCache`" shows its code as code.
      expect(rows.map((row) => row.querySelector('code')?.textContent)).toContain('fetchWithCache');
      expect(rows.some((row) => row.textContent?.includes('`'))).toBeFalse();
    });

    it('names every task in the rest of the plan, locks the Premium ones with their round, source and a lock, and leaves free ones open', () => {
      setup(ELEVENLABS);
      const rows = all('company-plan-rest-task');
      const planned = fixture.componentInstance.restTasks();
      expect(rows.length).toBe(planned.length);
      expect(planned.some((row) => row.locked)).toBeTrue();
      planned.forEach((row, index) => {
        const element = rows[index];
        const title = row.task.title.replace(/`/g, '');
        expect(element.getAttribute('href')).toBe(row.task.route);
        expect(element.textContent).toContain(title);
        expect(element.querySelector('.plan-row__meta')?.textContent).toMatch(/ · about \d/);
        expect(element.querySelector('.plan-row__why')?.textContent).toBe(row.why);
        if (row.locked) {
          expect(row.task.access).toBe('premium');
          expect(element.classList).toContain('plan-row--locked');
          expect(element.querySelector('.plan-row__lock')).toBeTruthy();
          expect(element.querySelector('.plan-row__tag--locked')?.textContent).toBe('Premium');
          expect(element.getAttribute('aria-label')).toBe(`${title}, ${row.meta.replace(' · ', ', ')}, opens with Premium`);
          // The locked page shows the way back here; a locked task joins no practice session.
          expect(row.state).toEqual({ returnToUrl: TestBed.inject(Router).url, returnLabel: 'Back to plan' });
        } else {
          expect(row.task.access).toBe('free');
          expect(element.querySelector('.plan-row__lock')).toBeNull();
          expect(element.querySelector('.plan-row__tag--free')?.textContent).toBe('Free');
          expect(element.getAttribute('aria-label')).toBe(title);
          if (row.task.kind !== 'guide') expect(row.state['returnLabel']).toBe('Back to plan');
        }
      });
      expect(text('[data-testid="company-plan-rest"] .preview__section-sub')).toBe('Premium opens the locked tasks, with every round in order.');
    });

    it('marks the tasks that run as an interview, in the list and in the panel', () => {
      setup(ELEVENLABS);
      const plan = fixture.componentInstance.plan()!;
      // The count covers what the page badges: the plan's tasks and the free warm-ups shown beside them.
      const pressure = new Set([...plan.tasks, ...plan.preview.open].filter((task) => task.pressure).map((task) => task.id)).size;
      const facts = Array.from(host.querySelectorAll('.preview__facts li')).map((fact) => fact.textContent?.trim() ?? '');
      const fact = facts.find((line) => line.includes('(Pressure Mode)'));
      expect(Boolean(fact)).toBe(pressure > 0);
      if (fact) expect(fact).toBe(`${pressure} ${pressure === 1 ? 'task runs' : 'tasks run'} as an interview (Pressure Mode): the requirements change while you code`);
      const tagged = Array.from(host.querySelectorAll('[data-testid="company-plan-rest-task"], [data-testid="company-plan-open-task"]'))
        .filter((row) => Array.from(row.querySelectorAll('.plan-row__tag')).some((tag) => tag.textContent === 'Pressure Mode')).length;
      const shown = [...fixture.componentInstance.openTasks(), ...fixture.componentInstance.restTasks()].filter((row) => row.task.pressure).length;
      expect(tagged).toBe(shown);
      expect(pressure).toBe(shown);
    });

    it('writes a company with a hyphen into the pricing source the way the guides do', () => {
      setup({ companies: 'capital-one', when: 'next-week', level: 'senior' });
      testId('company-plan-build')?.click();
      expect(navigate).toHaveBeenCalledOnceWith(['/pricing'], { queryParams: { src: 'company_plan_capital_one' } });
    });

    it('sums the plan up with real counts: the plan, the company set and the whole Premium library', () => {
      setup(ELEVENLABS);
      const facts = Array.from(host.querySelectorAll('.preview__facts li')).map((fact) => fact.textContent?.trim() ?? '');
      const set = COMPANY_SET_COUNTS['elevenlabs']!;
      const plan = fixture.componentInstance.plan()!;
      const open = plan.tasks.filter((task) => task.access === 'free').length;
      expect(facts[0]).toMatch(new RegExp(`^6 tasks for next week, about \\d+ hours?( \\d+ minutes)?: ${open} open now, ${6 - open} with Premium(, plus \\d free warm-ups? outside the plan)?$`));
      expect(facts[1]).toMatch(/^All 5 reported rounds in order, (with their tasks and your progress|tasks on \d of them, and your progress)$/);
      expect(facts).toContain(companySetLine([{ name: 'ElevenLabs', counts: set }]));
      expect(facts.some((fact) => fact.includes(`The full ElevenLabs set: ${set.all} questions`))).toBeTrue();
      expect(facts[facts.length - 1]).toBe(`Premium opens all ${PREMIUM_QUESTION_COUNT} Premium questions, including ${DATA.general.premiumCounts.react} React tasks and ${DATA.general.premiumCounts.systemDesign} system design walkthroughs`);
    });

    it('counts a free task from outside the plan apart, so the rows add up to what the panel says', () => {
      // A Tomorrow plan holds three tasks, one of them Premium, so a company with many free tasks always has a warm-up outside it.
      setup({ companies: 'intuit', when: 'tomorrow', level: 'mid' });
      const plan = fixture.componentInstance.plan()!;
      const planned = new Set(plan.tasks.map((task) => task.id));
      const warmups = plan.preview.open.filter((task) => !planned.has(task.id)).length;
      expect(warmups).toBeGreaterThan(0);
      expect(text('.preview__facts li')).toMatch(new RegExp(`^3 tasks for tomorrow, about \\d+ (hours?|minutes)( \\d+ minutes)?: \\d open now, \\d with Premium, plus ${warmups} free warm-ups? outside the plan$`));
      expect(all('company-plan-open-task').length + all('company-plan-rest-task').length).toBe(plan.tasks.length + warmups);
      expect(text('#company-plan-rest-title')).toBe('The rest of your plan');
    });

    it('calls the locked rows the plan when none of the free tasks is part of it', () => {
      // Every real list now carries an open task, so a list of Premium-only candidates is made up here.
      const walmart = DATA.companies['walmart'];
      const premiumOnly = {
        ...DATA,
        companies: { walmart: { ...walmart, variants: walmart.variants.map((list) => ({ ...list, tasks: list.tasks.filter((row) => DATA.tasks[row.id]?.access === 'premium') })) } },
      } as CompanyPlanData;
      setup({ companies: 'walmart', when: 'next-week', level: 'senior' }, { data: premiumOnly });
      expect(text('.preview__facts li')).toMatch(/^6 tasks for next week, about [\d.]+ hours?(: \d open now, \d with Premium)?, plus 3 free warm-ups outside the plan$/);
      expect(all('company-plan-rest-task').length).toBe(6);
      expect(text('#company-plan-rest-title')).toBe('Your plan');
    });

    it('says the rounds are grouped by type where the table gives no order', () => {
      setup({ companies: 'airbnb', when: 'later', level: 'senior' });
      const facts = Array.from(host.querySelectorAll('.preview__facts li')).map((fact) => fact.textContent?.trim() ?? '');
      expect(facts[1]).toMatch(/^All \d+ reported rounds grouped by type, (with their tasks and your progress|tasks on \d of them, and your progress)$/);
      expect(text('.preview__rest .preview__section-sub')).toBe('Premium opens the locked tasks, with every round.');
    });

    it('keeps an open task in a plan whose reports are all Premium, so the plan never reads "0 open now"', () => {
      setup({ companies: 'walmart', when: 'next-week', level: 'senior' });
      expect(text('.preview__facts li')).toMatch(/^6 tasks for next week, about \d+ hours?( \d+ minutes)?: [1-9] open now, \d with Premium/);
      expect(text('#company-plan-rest-title')).toBe('The rest of your plan');
    });

    it('says what the button does: the plan opens with Premium', () => {
      setup(ELEVENLABS);
      expect(text('[data-testid="company-plan-build"]')).toBe('Unlock my plan →');
    });

    it('offers to save the plan on a free account and comes back here after signing up', () => {
      setup(ELEVENLABS);
      expect(testId('company-plan-save-link')?.getAttribute('href')).toContain('/auth/signup?redirectTo=');
      expect(text('[data-testid="company-plan-cta-note"]')).toBe('Your plan is part of Premium. You land on it right after payment.');
    });

    it('goes to pricing with the company in the source, after keeping the answers', () => {
      setup(ELEVENLABS);
      testId('company-plan-build')?.click();
      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' });
      expect(navigate).toHaveBeenCalledOnceWith(['/pricing'], { queryParams: { src: 'company_plan_elevenlabs' } });
      expect(plans.track).toHaveBeenCalledWith('company_plan_build_clicked', jasmine.objectContaining({ companies: 'elevenlabs', viewer: 'guest' }));
    });

    it('tells a phone what the tasks are good for there, without hiding the task list', () => {
      setup(ELEVENLABS);
      expect(text('.preview__phone-note')).toBe('On a phone, each task opens as a question with its solution. Writing code and running checks need a desktop or tablet.');
      expect(testId('company-plan-phone-note')?.querySelector('a')).toBeNull();
      expect(text('.preview__section-sub--phone')).toBe('Read them here; the code runs on a desktop or tablet. No account needed.');
      expect(all('company-plan-open-task').length).toBe(3);
    });

    it('the night before an interview, points a phone at the guide to read', () => {
      setup({ ...ELEVENLABS, when: 'tomorrow' });
      expect(text('.preview__phone-note')).toContain('Tonight on a phone, read the ElevenLabs guide: its rounds and open prompts.');
      expect(testId('company-plan-phone-note')?.querySelector('a')?.getAttribute('href')).toBe('/companies/elevenlabs/preview');
    });
  });

  describe('for a free account', () => {
    it('says the plan is saved when it is on the account', () => {
      setup(ELEVENLABS, { viewer: 'free', saved: { companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' } });
      expect(text('[data-testid="company-plan-cta-note"]')).toBe('Saved to your account. Your plan is part of Premium, and you land on it right after payment.');
      expect(testId('company-plan-save-link')).toBeNull();
    });

    it('warns before replacing another plan and writes nothing until the click', () => {
      setup(ELEVENLABS, { viewer: 'free', saved: { companies: [{ slug: 'agoda' }], when: 'later', level: 'mid' } });
      expect(text('[data-testid="company-plan-cta-note"]')).toBe('This replaces your Agoda plan. Your solved tasks stay.');
      expect(plans.save).not.toHaveBeenCalled();
      testId('company-plan-build')?.click();
      expect(plans.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('for a Premium member', () => {
    it('opens the rest of the list and goes straight to the plan', () => {
      setup(ELEVENLABS, { viewer: 'premium' });
      expect(text('#company-plan-open-title')).toBe('Start with these 3 tasks');
      expect(text('[data-testid="company-plan-cta-note"]')).toBe('You have Premium, so your plan opens right away.');
      const rest = all('company-plan-rest-task');
      expect(rest[0].getAttribute('href')).not.toContain('/pricing');
      expect(rest[0].querySelector('.plan-row__lock')).toBeNull();
      expect(rest[0].querySelector('.plan-row__tag--locked')).toBeNull();
      expect(rest[0].textContent).toContain(fixture.componentInstance.restTasks()[0].task.title.replace(/`/g, ''));
      expect(text('[data-testid="company-plan-build"]')).toBe('Open my plan →');

      testId('company-plan-build')?.click();
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/plan']);
    });

    it('starts on the plan itself, with no free warm-ups', () => {
      setup({ companies: 'walmart', when: 'next-week', level: 'senior' }, { viewer: 'premium' });
      expect(text('.preview__facts li')).toMatch(/^6 tasks for next week, about [\d.]+ hours?$/);
      expect(all('company-plan-open-task').length + all('company-plan-rest-task').length).toBe(6);
      expect(text('#company-plan-rest-title')).toBe('The rest of your plan');
    });
  });

  describe('round lists and warnings', () => {
    it('explains where the rounds come from and switches the list on request', () => {
      setup({ companies: 'agoda', when: 'next-week', level: 'senior' });
      const line = testId('company-plan-switch-line');
      expect(line?.textContent).toContain('These rounds come from Senior and Staff candidates in Bangkok.');
      (line?.querySelector('button') as HTMLButtonElement).click();

      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'agoda', list: 'gurgaon' }], when: 'next-week', level: 'senior' });
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate.calls.mostRecent().args[1].queryParams).toEqual(jasmine.objectContaining({ companies: 'agoda', lists: 'agoda:gurgaon' }));
    });

    it('does not touch another plan on the account when switching', () => {
      setup({ companies: 'agoda', when: 'next-week', level: 'senior' }, { viewer: 'free', saved: { companies: [{ slug: 'meta' }], when: 'later', level: 'mid' } });
      (testId('company-plan-switch-line')?.querySelector('button') as HTMLButtonElement).click();
      expect(plans.save).not.toHaveBeenCalled();
    });

    it('offers every other list at a company with three', () => {
      setup({ companies: 'crowdstrike', when: 'next-week', level: 'senior' });
      expect(testId('company-plan-switch-line')?.querySelectorAll('button').length).toBe(2);
    });

    it('shows no switch line at a company with one list', () => {
      setup(ELEVENLABS);
      expect(testId('company-plan-switch-line')).toBeNull();
    });

    it('says the tasks follow the reports and switches to the framework the person uses', () => {
      setup(ELEVENLABS);
      const line = testId('company-plan-framework-line');
      expect(line?.textContent).toContain('UI tasks follow React, the framework in the reports.');
      expect(Array.from(line?.querySelectorAll('button') ?? []).map((button) => button.textContent)).toEqual(['Use Angular', 'Use Vue']);
      (line?.querySelector('button') as HTMLButtonElement).click();

      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior', framework: 'angular' });
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate.calls.mostRecent().args[1].queryParams).toEqual(jasmine.objectContaining({ companies: 'elevenlabs', framework: 'angular' }));
    });

    it('builds the plan in the chosen framework, says whose choice it is, and offers the way back to the reports', () => {
      setup({ ...ELEVENLABS, framework: 'angular' });
      expect(Array.from(host.querySelectorAll('.preview__chip')).map((chip) => chip.textContent)).toEqual(['Next week', 'Senior', 'Angular, your choice']);
      const plan = fixture.componentInstance.plan()!;
      expect(plan.tasks.some((task) => task.tech === 'angular')).toBeTrue();
      expect(plan.tasks.filter((task) => task.family).every((task) => task.tech === 'angular')).toBeTrue();

      const line = testId('company-plan-framework-line');
      expect(line?.textContent).toContain('UI tasks and extra practice follow Angular, your choice; the reported JavaScript tasks stay as reported.');
      const back = Array.from(line?.querySelectorAll('button') ?? []).find((button) => button.textContent === 'Back to the reports') as HTMLButtonElement;
      back.click();
      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' });
      expect(navigate.calls.mostRecent().args[1].queryParams['framework']).toBeUndefined();

      testId('company-plan-build')?.click();
      expect(plans.track).toHaveBeenCalledWith('company_plan_build_clicked', jasmine.objectContaining({ framework: 'angular' }));
    });

    it('shows no framework line on a general plan, which follows no reports', () => {
      setup({ custom: 'Vercel', when: 'later', level: 'mid' });
      expect(testId('company-plan-framework-line')).toBeNull();
    });

    it('warns about a level the accounts do not cover and about old reports', () => {
      setup({ companies: 'agoda', when: 'next-week', level: 'junior' });
      expect(all('company-plan-warning')[0].textContent).toContain('No report from a junior candidate at Agoda.');
    });

    it('warns when the newest report behind the rounds is old', () => {
      setup({ companies: 'booking-com', when: 'next-week', level: 'mid' });
      expect(all('company-plan-warning').some((warning) => warning.textContent?.includes('The newest report behind these rounds is from July 2023.'))).toBeTrue();
    });
  });

  describe('with no mapped company', () => {
    it('names the unlisted company, starts the first free task and locks nothing', () => {
      setup({ custom: 'Vercel', when: 'this-week', level: 'mid' });
      expect(text('h1')).toBe('We have not mapped Vercel yet');
      expect(text('.preview__evidence')).toContain('Your search is counted');
      expect(text('.preview__panel-title')).toBe('Start here');
      expect(host.querySelector('.preview__facts')).toBeNull();
      expect(testId('company-plan-start-first')?.getAttribute('href')).toMatch(/^\/javascript\/coding\//);
      expect(testId('company-plan-premium-link')?.getAttribute('href')).toBe('/pricing?src=company_plan_general');
      expect(testId('company-plan-rest')).toBeNull();
      expect(testId('company-plan-build')).toBeNull();
      expect(testId('company-plan-save-link')).toBeNull();
    });

    it('uses plain copy when no company was picked', () => {
      setup({ when: 'later', level: 'senior' });
      expect(text('h1')).toBe('Start with these frontend tasks');
      expect(text('.preview__evidence')).toBe('You have not picked a company, so these are general frontend tasks.');
    });
  });

  describe('states', () => {
    it('goes back to the form when there is nothing to show', () => {
      setup({});
      expect(navigate).toHaveBeenCalledOnceWith(['/companies'], { replaceUrl: true });
    });

    it('shows the saved plan when the address carries nothing', () => {
      setup({}, { viewer: 'free', saved: { companies: [{ slug: 'meta' }], when: 'later', level: 'staff' } });
      expect(text('h1')).toBe('Your Meta plan at a glance');
    });

    it('offers a retry when the data does not load, and the retry works', () => {
      setup(ELEVENLABS, { data: null });
      expect(testId('company-plan-preview-error')).not.toBeNull();
      expect(navigate).not.toHaveBeenCalled();

      plans.loadData.and.returnValue(of(DATA));
      (testId('company-plan-preview-error')?.querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(testId('company-plan-preview')).not.toBeNull();
    });

    it('counts the view once and each opened task', () => {
      setup(ELEVENLABS);
      fixture.detectChanges();
      expect(plans.track.calls.allArgs().filter(([name]) => name === 'company_plan_preview_viewed').length).toBe(1);
      all('company-plan-open-task')[0].click();
      expect(plans.track).toHaveBeenCalledWith('company_plan_free_task_opened', jasmine.objectContaining({ general: false }));
    });
  });
});
