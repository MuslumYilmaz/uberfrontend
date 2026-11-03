import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyPlanPreviewComponent, readPreviewRequest } from './company-plan-preview.component';
import { CompanyPlanData, buildCompanyPlan } from './company-plan.engine';
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

  it('keeps at most three companies', () => {
    expect(read({ companies: 'agoda,meta,google,amazon', when: 'later', level: 'mid' })?.answers.companies.map((company) => company.slug)).toEqual(['agoda', 'meta', 'google']);
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
      expect(text('.preview__evidence')).toBe('Built from 6 public sources, last checked Oct 22, 2026. These are practice versions, not leaked questions.');
      expect(host.textContent).not.toContain('Which framework');
    });

    it('offers three tasks to open today, all free, with no account', () => {
      setup(ELEVENLABS);
      const rows = all('company-plan-open-task');
      expect(rows.length).toBe(3);
      expect(text('#company-plan-open-title')).toBe('Try these 3 tasks for free');
      expect(text('.preview__section-sub')).toBe('They run in your browser. No account needed.');
      expect(rows[0].getAttribute('href')).toMatch(/^\/javascript\/(coding|debug)\//);
      expect(rows[0].textContent).toContain('Based on a report: Aced, Oct 2026');
      // "Fix async race in `fetchWithCache`" shows its code as code.
      expect(rows.map((row) => row.querySelector('code')?.textContent)).toContain('fetchWithCache');
      expect(rows.some((row) => row.textContent?.includes('`'))).toBeFalse();
    });

    it('locks the rest of the list behind pricing, with an icon rather than a claim about each task', () => {
      setup(ELEVENLABS);
      const rows = all('company-plan-rest-task');
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.getAttribute('href')).toBe('/pricing?src=company_plan_elevenlabs');
        expect(row.querySelector('.plan-row__lock')).toBeTruthy();
        expect(row.getAttribute('aria-label')).toContain('locked until you build your plan');
        expect(row.textContent).not.toContain('Premium');
      }
      expect(text('[data-testid="company-plan-rest"] .preview__section-sub')).toBe('These unlock with Premium, along with every round in order.');
    });

    it('sums the plan up with real counts', () => {
      setup(ELEVENLABS);
      const facts = Array.from(host.querySelectorAll('.preview__facts li')).map((fact) => fact.textContent?.trim());
      expect(facts[0]).toMatch(/^6 tasks for next week, about [\d.]+ hours?$/);
      expect(facts[1]).toBe('All 5 reported rounds in order, each with its sources');
      expect(facts[2]).toBe(`Premium also opens ${DATA.general.premiumCounts.react} React tasks and ${DATA.general.premiumCounts.systemDesign} system design walkthroughs`);
    });

    it('counts a free task from outside the plan apart, so the rows add up to what the panel says', () => {
      setup({ companies: 'agoda', when: 'next-week', level: 'junior' });
      expect(text('.preview__facts li')).toMatch(/^6 tasks for next week, about [\d.]+ hours?, plus 1 free warm-up$/);
      expect(all('company-plan-open-task').length + all('company-plan-rest-task').length).toBe(7);
      expect(text('#company-plan-rest-title')).toBe('The rest of your plan');
    });

    it('calls the locked rows the plan when none of the free tasks is part of it', () => {
      setup({ companies: 'walmart', when: 'next-week', level: 'senior' });
      expect(text('.preview__facts li')).toMatch(/^6 tasks for next week, about [\d.]+ hours?, plus 3 free warm-ups$/);
      expect(all('company-plan-rest-task').length).toBe(6);
      expect(text('#company-plan-rest-title')).toBe('Your plan');
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

    it('does not offer a phone-only line in a way that hides the task list', () => {
      setup(ELEVENLABS);
      expect(text('.preview__phone-note')).toBe('Coding tasks need a larger screen.');
      expect(all('company-plan-open-task').length).toBe(3);
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
      expect(line?.textContent).toContain('These rounds come from Bangkok, Senior and Staff.');
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
