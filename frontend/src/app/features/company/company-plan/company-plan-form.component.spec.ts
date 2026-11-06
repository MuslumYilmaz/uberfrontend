import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyPlanFormComponent } from './company-plan-form.component';
import { CompanyPlanData } from './company-plan.engine';
import { CompanyPlanService } from './company-plan.service';

const round = (id: string, kinds: string[]) => ({ id, name: `${id} round`, kinds, note: 'Note.', sources: [] });
const company = (name: string, extra: object = {}) => ({
  name,
  signature: `${name} signature`,
  framework: 'react',
  checkedAt: '2026-10-22',
  variants: [{ id: 'main', title: 'Engineers', sourceCount: 6, rounds: [round('recruiter', ['recruiter']), round('coding', ['coding'])], tasks: [{ id: 'lead-task', rounds: ['coding'], lead: true }] }],
  ...extra,
});

const DATA = {
  schemaVersion: 1,
  tasks: { 'lead-task': { id: 'lead-task', title: 'Lead task', route: '/react/coding/lead-task', kind: 'coding', access: 'free', minutes: 30 } },
  general: { starters: [], formatPractice: { react: [], angular: [], vue: [], javascript: [] }, guides: { people: '/guides/behavioral', design: '/guides/system-design-blueprint' }, premiumCounts: {} },
  companies: {
    elevenlabs: company('ElevenLabs'),
    agoda: company('Agoda'),
    stripe: company('Stripe', { framework: 'javascript' }),
    meta: company('Meta', { aliases: ['Facebook', 'Instagram'], framework: 'javascript' }),
    amazon: company('Amazon', {
      framework: 'javascript',
      variants: [
        { id: 'students', title: 'Students', sourceCount: 1, students: true, rounds: [round('students', ['coding'])], tasks: [] },
        { id: 'experienced', title: 'Experienced', sourceCount: 9, default: true, rounds: [round('loop', ['coding'])], tasks: [] },
      ],
    }),
  },
} as unknown as CompanyPlanData;

describe('CompanyPlanFormComponent', () => {
  let fixture: ComponentFixture<CompanyPlanFormComponent>;
  let component: CompanyPlanFormComponent;
  let plans: {
    loadData: jasmine.Spy;
    saved: ReturnType<typeof signal<any>>;
    draft: ReturnType<typeof signal<any>>;
    answers: unknown;
    draftConflict: unknown;
    buildPlan: jasmine.Spy;
    save: jasmine.Spy;
    track: jasmine.Spy;
    trackUnlistedCompany: jasmine.Spy;
  };
  let navigate: jasmine.Spy;
  let host: HTMLElement;

  function setup(options: { data?: CompanyPlanData | null; wide?: boolean; saved?: unknown; draft?: unknown; user?: unknown; company?: string; from?: string } = {}) {
    const saved = signal<any>(options.saved ?? null);
    const draft = signal<any>(options.draft ?? null);
    plans = {
      loadData: jasmine.createSpy('loadData').and.returnValue(new BehaviorSubject(options.data === undefined ? DATA : options.data)),
      saved,
      draft,
      answers: computed(() => saved() ?? draft()),
      draftConflict: computed(() => Boolean(saved() && draft() && JSON.stringify(saved()) !== JSON.stringify(draft()))),
      buildPlan: jasmine.createSpy('buildPlan').and.returnValue({ tasks: [{ solved: true }, { solved: false }, { solved: false }] }),
      save: jasmine.createSpy('save').and.returnValue(of('draft')),
      track: jasmine.createSpy('track'),
      trackUnlistedCompany: jasmine.createSpy('trackUnlistedCompany'),
    };
    spyOn(window, 'matchMedia').and.returnValue({ matches: options.wide ?? true, addEventListener: () => undefined } as unknown as MediaQueryList);
    TestBed.configureTestingModule({
      imports: [CompanyPlanFormComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyPlanService, useValue: plans },
        { provide: AuthService, useValue: { user: signal(options.user ?? null) } },
        ...(options.company === undefined
          ? []
          : [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ company: options.company, ...(options.from ? { from: options.from } : {}) }) } } }]),
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CompanyPlanFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('heading', 'Company Frontend Interview Questions');
    fixture.componentRef.setInput('directory', [{ slug: 'elevenlabs', label: 'ElevenLabs', count: 3 }, { slug: 'walmart', label: 'Walmart', count: 2 }]);
    fixture.detectChanges();
    // The data arrives after the first render, as it does on the page.
    fixture.detectChanges();
    host = fixture.nativeElement;
  }

  const click = (testId: string) => {
    const element = host.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
    if (!element) throw new Error(`Missing ${testId}`);
    element.click();
    fixture.detectChanges();
  };
  const openPicker = () => click('company-plan-slot');
  const search = (text: string) => {
    const input = host.querySelector<HTMLInputElement>('#company-plan-search') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const optionNames = () => Array.from(host.querySelectorAll('.plan-option__name')).map((name) => name.textContent?.trim());
  const cardNames = () => Array.from(host.querySelectorAll('.plan-card__name')).map((name) => name.textContent?.trim());

  afterEach(() => fixture.destroy());

  describe('the first screen', () => {
    it('holds the page heading and works before any data arrives', () => {
      setup({ data: null });
      expect(host.querySelector('h1')?.textContent?.trim()).toBe('Company Frontend Interview Questions');
      expect(host.querySelector('.plan-sentence')?.textContent).toContain("I'm interviewing at");
      expect(host.querySelector('.plan-card__body')?.textContent).toContain('Pick a company');
      openPicker();
      expect(optionNames()).toEqual(['ElevenLabs', 'Walmart']);
    });

    it('starts on step one with the later steps locked', () => {
      setup();
      const steps = Array.from(host.querySelectorAll<HTMLButtonElement>('.plan-step'));
      expect(steps.map((step) => step.disabled)).toEqual([false, true, true, true]);
      expect(steps[0].getAttribute('aria-current')).toBe('step');
    });

    it('names the rotating company for screen readers', () => {
      setup();
      expect(host.querySelector('[data-testid="company-plan-slot"]')?.getAttribute('aria-label')).toBe('Choose companies. Now: ElevenLabs');
      component.wheelIndex.set(1);
      fixture.detectChanges();
      expect(host.querySelector('[data-testid="company-plan-slot"]')?.getAttribute('aria-label')).toBe('Choose companies. Now: Agoda');
    });

    it('follows the sentence with the card on a wide screen', () => {
      setup({ wide: true });
      expect(cardNames()).toEqual(['ElevenLabs']);
      component.wheelIndex.set(1);
      fixture.detectChanges();
      expect(cardNames()).toEqual(['Agoda']);
    });

    it('keeps the card still on a phone, so the page below does not jump', () => {
      setup({ wide: false });
      expect(cardNames()).toEqual(['ElevenLabs']);
      component.wheelIndex.set(1);
      fixture.detectChanges();
      expect(cardNames()).toEqual(['ElevenLabs']);
    });

    it('says "no account needed" to a visitor', () => {
      setup();
      expect(host.querySelector('.plan-footnote')?.textContent?.trim()).toBe('Takes three clicks, or four if you have started. No account needed.');
    });

    it('does not say "no account needed" to a signed-in person', () => {
      setup({ user: { _id: 'u', entitlements: { pro: { status: 'none' } } } });
      expect(host.querySelector('.plan-footnote')?.textContent?.trim()).toBe('Takes three clicks, or four if you have started.');
    });

    it('describes a company from the data in one line', () => {
      setup();
      expect(host.querySelector('.plan-card__meta')?.textContent).toBe('2 reported rounds, tasks on 1 of them · 6 public sources · checked Oct 22, 2026');
      const rounds = Array.from(host.querySelectorAll('.plan-rounds__item'));
      expect(rounds.map((item) => item.classList.contains('plan-rounds__item--practice'))).toEqual([false, true]);
    });

    it('counts and marks the rounds the plan holds tasks on, as the preview does, not every practice-type round', () => {
      // A people round with no guide data and a coding round whose only task is taken: the plan leaves both empty.
      const data = {
        ...DATA,
        general: { ...DATA.general, guides: { people: '/guides/missing', design: '/guides/missing' } },
        companies: {
          ...DATA.companies,
          elevenlabs: company('ElevenLabs', {
            variants: [{ id: 'main', title: 'Engineers', sourceCount: 6, rounds: [round('coding', ['coding']), round('people', ['people']), round('second', ['coding'])], tasks: [{ id: 'lead-task', rounds: ['coding', 'second'], lead: true }] }],
          }),
        },
      } as unknown as CompanyPlanData;
      setup({ data });
      expect(host.querySelector('.plan-card__meta')?.textContent).toBe('3 reported rounds, tasks on 1 of them · 6 public sources · checked Oct 22, 2026');
      const rounds = Array.from(host.querySelectorAll('.plan-rounds__item'));
      expect(rounds.map((item) => item.classList.contains('plan-rounds__item--practice'))).toEqual([true, false, false]);
    });
  });

  describe('picking companies', () => {
    it('accepts the company in the sentence when someone just continues', () => {
      setup();
      component.wheelIndex.set(1);
      click('company-plan-continue');
      expect(component.picked()).toEqual(['agoda']);
      expect(component.step()).toBe(2);
      expect(plans.track).toHaveBeenCalledWith('company_plan_form_started');
      expect(plans.track).toHaveBeenCalledWith('company_plan_step_completed', { step: 1 });
    });

    it('stops the sentence once the picker opens', () => {
      setup();
      expect(component.wheelPaused()).toBeFalse();
      openPicker();
      expect(component.wheelPaused()).toBeTrue();
    });

    it('keeps at most three companies, dropping the oldest', () => {
      setup();
      openPicker();
      for (const slug of ['elevenlabs', 'agoda', 'stripe', 'meta']) click(`company-plan-option-${slug}`);
      expect(component.picked()).toEqual(['agoda', 'stripe', 'meta']);
      expect(host.querySelector('.plan-slot__answer')?.textContent).toBe('Agoda, Stripe and Meta');
      expect(cardNames()).toEqual(['Agoda', 'Stripe', 'Meta']);
    });

    it('removes a company on a second click', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-option-stripe');
      click('company-plan-option-agoda');
      expect(component.picked()).toEqual(['stripe']);
    });

    it('marks a chosen option for assistive technology', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      const option = host.querySelector('[data-testid="company-plan-option-agoda"]');
      expect(option?.getAttribute('aria-pressed')).toBe('true');
    });

    it('finds a company by another name', () => {
      setup();
      openPicker();
      search('Instagram');
      expect(optionNames()).toEqual(['Meta']);
      search('eleven labs');
      expect(optionNames()).toEqual(['ElevenLabs']);
    });

    it('offers an unlisted company and counts the search', () => {
      setup();
      openPicker();
      search('Vercel');
      expect(optionNames()).toEqual(['Continue with Vercel']);
      click('company-plan-custom');

      expect(plans.trackUnlistedCompany).toHaveBeenCalledOnceWith('Vercel');
      expect(component.custom()).toBe('Vercel');
      expect(component.picked()).toEqual([]);
      expect(host.querySelector('.plan-slot__answer')?.textContent).toBe('Vercel');
      expect(host.querySelector('.plan-card__body')?.textContent).toContain('We have not mapped Vercel yet');
    });

    it('closes on Escape or an outside click, keeping the shown company', () => {
      setup();
      openPicker();
      host.querySelector('.plan-slot')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(component.open()).toBeFalse();
      expect(component.picked()).toEqual(['elevenlabs']);

      openPicker();
      document.body.click();
      fixture.detectChanges();
      expect(component.open()).toBeFalse();
    });

    it('lets someone go on with no company', () => {
      setup();
      click('company-plan-no-company');
      expect(component.step()).toBe(2);
      expect(component.picked()).toEqual([]);
      expect(host.querySelector('.plan-card__name')?.textContent).toBe('General frontend plan');
    });
  });

  describe('arriving with a company from a guide or the home page', () => {
    it('opens at the date with the company the guide handed over, and still lets it change', () => {
      setup({ company: 'ElevenLabs' });
      expect(component.step()).toBe(2);
      expect(host.querySelector('.plan-question__title')?.textContent?.trim()).toBe('When is your interview?');
      const steps = Array.from(host.querySelectorAll<HTMLButtonElement>('.plan-step'));
      expect(steps[0].textContent).toContain('ElevenLabs');
      expect(steps.map((step) => step.disabled)).toEqual([false, false, true, true]);
      expect(cardNames()).toEqual(['ElevenLabs']);
      expect(plans.track.calls.allArgs()).toEqual([
        ['company_plan_form_started', { from: 'guide', companies: 'elevenlabs' }],
        ['company_plan_step_completed', { step: 1 }],
      ]);

      click('company-plan-when-next-week');
      click('company-plan-level-senior');
      expect(component.step()).toBe(4);
      click('company-plan-see-plan');
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'elevenlabs', when: 'next-week', level: 'senior' } });

      steps[0].click();
      fixture.detectChanges();
      expect(host.querySelector('.plan-slot__answer')?.textContent?.trim()).toBe('ElevenLabs');
    });

    it('names the home page as the way in when the address says so', () => {
      setup({ company: 'walmart', from: 'home' });
      expect(component.step()).toBe(2);
      expect(plans.track).toHaveBeenCalledWith('company_plan_form_started', { from: 'home', companies: 'walmart' });
    });

    it('starts at the first step when the company is not one it lists', () => {
      setup({ company: 'vercel' });
      expect(component.step()).toBe(1);
      expect(component.chosen()).toBeFalse();
      expect(plans.track).not.toHaveBeenCalled();
    });
  });

  describe('the date and level steps', () => {
    it('asks about the first interview only when there are several companies', () => {
      setup();
      click('company-plan-continue');
      expect(host.querySelector('.plan-question__title')?.textContent).toBe('When is your interview?');

      component.back();
      fixture.detectChanges();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-continue');
      expect(host.querySelector('.plan-question__title')?.textContent).toBe('When is your first interview?');
    });

    it('moves on with one click and goes back to any reached step', () => {
      setup();
      click('company-plan-continue');
      click('company-plan-when-tomorrow');
      expect(component.when()).toBe('tomorrow');
      expect(component.step()).toBe(3);
      expect(host.querySelector('.plan-question__title')?.textContent).toBe('What level is the role?');
      expect(host.querySelector('.plan-answers')?.textContent).toContain('Tomorrow:');

      (host.querySelectorAll<HTMLButtonElement>('.plan-step')[0]).click();
      fixture.detectChanges();
      expect(component.step()).toBe(1);
      expect(host.querySelectorAll<HTMLButtonElement>('.plan-step')[2].disabled).toBeFalse();
    });

    it('states the framework from the reports without ever asking for one', () => {
      setup();
      click('company-plan-continue');
      expect(host.querySelector('.plan-answers')?.textContent).toContain('React: Tasks follow the framework in these reports. You can change it on the plan.');
      expect(host.textContent).not.toContain('Which framework');
    });

    it('does not call JavaScript a framework when the reports name none', () => {
      setup();
      openPicker();
      click('company-plan-option-stripe');
      click('company-plan-continue');
      expect(host.querySelector('.plan-answers')?.textContent).toContain('JavaScript: These reports name no framework. You can pick one on the plan.');
    });

    it('carries a framework chosen on an earlier plan into the new answers, and says so', () => {
      setup({ draft: { companies: [{ slug: 'elevenlabs' }], when: 'later', level: 'senior', framework: 'angular' } });
      click('company-plan-continue');
      expect(host.querySelector('.plan-answers')?.textContent).toContain('Angular: Tasks follow your framework. You can change it on the plan.');
      click('company-plan-when-tomorrow');
      click('company-plan-level-senior');
      click('company-plan-see-plan');
      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'elevenlabs' }], level: 'senior', when: 'tomorrow', framework: 'angular' });
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'elevenlabs', when: 'tomorrow', level: 'senior', framework: 'angular' } });
    });

    it('shows the rounds of the default list, whatever the level', () => {
      setup();
      openPicker();
      click('company-plan-option-amazon');
      click('company-plan-continue');
      expect(Array.from(host.querySelectorAll('.plan-rounds__item')).map((item) => item.textContent)).toEqual(['loop round']);
      component.level.set('junior');
      fixture.detectChanges();
      expect(Array.from(host.querySelectorAll('.plan-rounds__item')).map((item) => item.textContent)).toEqual(['loop round']);
    });
  });

  describe('coming back', () => {
    const ELEVENLABS = { companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' };
    const AGODA = { companies: [{ slug: 'agoda' }], when: 'this-week', level: 'mid' };
    const text = (testId: string) => host.querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ').trim();
    const href = (testId: string) => host.querySelector(`[data-testid="${testId}"]`)?.getAttribute('href');

    it('leads a Premium member back to the plan, with the progress so far', () => {
      setup({ saved: ELEVENLABS, user: { _id: 'u', entitlements: { pro: { status: 'active' } } } });
      expect(host.querySelector('.plan-resume__title')?.textContent).toBe('Continue your ElevenLabs plan');
      expect(host.querySelector('.plan-resume__line')?.textContent).toBe('Next week · Senior · 1 of 3 solved');
      expect(href('company-plan-resume-open')).toBe('/companies/plan');

      click('company-plan-resume-open');
      expect(plans.track).toHaveBeenCalledWith('company_plan_resumed', { from: 'companies', plan: 'saved' });
    });

    it('leads a free account back to the preview of the plan on its account', () => {
      setup({ saved: ELEVENLABS, user: { _id: 'u', entitlements: { pro: { status: 'none' } } } });
      expect(host.querySelector('.plan-resume__line')?.textContent).toBe('Next week · Senior · saved to your account');
      expect(href('company-plan-resume-open')).toBe('/companies/preview');
    });

    it('leads a guest back to the preview of the plan kept in this browser', () => {
      setup({ draft: ELEVENLABS });
      expect(host.querySelector('.plan-resume__line')?.textContent).toBe('Next week · Senior · saved in this browser');
      expect(href('company-plan-resume-open')).toBe('/companies/preview');
    });

    it('leads a member whose Premium ran out to the plan, where renewing is offered', () => {
      setup({ saved: ELEVENLABS, user: { _id: 'u', entitlements: { pro: { status: 'expired' } } } });
      expect(href('company-plan-resume-open')).toBe('/companies/plan');
      expect(host.querySelector('.plan-resume__line')?.textContent).toBe('Next week · Senior · saved to your account');
    });

    it('offers a plan started in this browser through the preview, which asks before replacing the account plan', () => {
      setup({ saved: ELEVENLABS, draft: AGODA, user: { _id: 'u', entitlements: { pro: { status: 'none' } } } });
      expect(text('company-plan-resume-draft')).toBe('Use the Agoda plan you started instead');
      expect(href('company-plan-resume-draft')).toBe('/companies/preview?companies=agoda&when=this-week&level=mid');
    });

    it('stays away without a plan', () => {
      setup();
      expect(host.querySelector('[data-testid="company-plan-resume"]')).toBeNull();
    });

    it('steps aside once a new form is under way', () => {
      setup({ saved: ELEVENLABS });
      expect(host.querySelector('[data-testid="company-plan-resume"]')).toBeTruthy();
      click('company-plan-no-company');
      expect(host.querySelector('[data-testid="company-plan-resume"]')).toBeNull();
    });
  });

  describe('finishing', () => {
    /** Date, level, and the rounds step where the form asks it, from the first round. */
    const finish = () => {
      click('company-plan-when-next-week');
      click('company-plan-level-mid');
      if (component.step() === 4) click('company-plan-see-plan');
    };

    it('keeps the answers and opens the preview with them in the address', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-option-stripe');
      click('company-plan-continue');
      finish();

      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'agoda' }, { slug: 'stripe' }], level: 'mid', when: 'next-week' });
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'agoda,stripe', when: 'next-week', level: 'mid' } });
      expect(plans.track).toHaveBeenCalledWith('company_plan_step_completed', { step: 3 });
      expect(plans.track).toHaveBeenCalledWith('company_plan_step_completed', { step: 4 });
    });

    it('asks which round is next, marks the rounds before it as passed and carries them to the preview', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-continue');
      click('company-plan-when-tomorrow');
      click('company-plan-level-junior');

      expect(component.step()).toBe(4);
      expect(host.querySelector('.plan-question__title')?.textContent).toBe('Which round is next?');
      const choices = Array.from(host.querySelectorAll('.plan-choices--compact .plan-choice'));
      expect(choices.map((choice) => choice.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
      expect(choices.map((choice) => choice.querySelector('.plan-choice__label')?.textContent)).toEqual(['recruiter round', 'coding round']);
      expect(host.querySelectorAll('.plan-step')[3].textContent).toContain('Next round');
      expect(host.querySelector('.plan-answers')?.textContent).toContain('From the first round. Every reported round is in the plan.');
      expect(plans.track).toHaveBeenCalledWith('company_plan_step_completed', { step: 3 });

      // One company: the round clicked is the last answer, and the one before it is passed.
      click('company-plan-next-agoda-coding');
      expect(component.passedRounds()).toEqual(['agoda/main/recruiter']);
      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'agoda' }], level: 'junior', when: 'tomorrow', passedRounds: ['agoda/main/recruiter'] });
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'agoda', when: 'tomorrow', level: 'junior', passed: 'agoda/main/recruiter' } });
      expect(plans.track).toHaveBeenCalledWith('company_plan_step_completed', { step: 4 });
    });

    it('with several companies, takes a next round per company and finishes on the button', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-option-amazon');
      click('company-plan-continue');
      click('company-plan-when-next-week');
      click('company-plan-level-mid');

      expect(host.querySelector('.plan-question__title')?.textContent).toBe('Which round is next at each company?');
      expect(Array.from(host.querySelectorAll('.plan-choice-group__name')).map((name) => name.textContent)).toEqual(['Agoda', 'Amazon']);
      click('company-plan-next-agoda-coding');
      expect(navigate).not.toHaveBeenCalled();
      expect(component.nextLabel()).toBe('1 of 2 past the first round');
      expect(Array.from(host.querySelectorAll('.plan-rounds__item--passed')).map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['recruiter round passed']);
      expect(host.querySelector('.plan-answers')?.textContent).toContain('1 of 2 past the first round. The rounds before it count as passed.');

      click('company-plan-see-plan');
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'agoda,amazon', when: 'next-week', level: 'mid', passed: 'agoda/main/recruiter' } });
    });

    it('offers the student rounds under the level question, plans on them and names the list in the address', () => {
      setup();
      openPicker();
      click('company-plan-option-amazon');
      click('company-plan-continue');
      click('company-plan-when-few-weeks');
      expect(host.querySelector('[data-testid="company-plan-student"]')?.getAttribute('aria-pressed')).toBe('false');
      expect(host.querySelector('.plan-toggle__sub')?.textContent).toBe('Uses the Amazon student and new-graduate rounds instead.');

      click('company-plan-student');
      expect(Array.from(host.querySelectorAll('.plan-rounds__item')).map((item) => item.textContent)).toEqual(['students round']);
      expect(host.querySelector('.plan-answers')?.textContent).toContain('Student:');
      click('company-plan-level-junior');
      expect(host.querySelectorAll('.plan-step')[2].textContent).toContain('Junior, student');
      expect(Array.from(host.querySelectorAll('.plan-choices--compact .plan-choice__label')).map((label) => label.textContent)).toEqual(['students round']);

      click('company-plan-see-plan');
      expect(plans.save).toHaveBeenCalledOnceWith({ companies: [{ slug: 'amazon', list: 'students' }], level: 'junior', when: 'few-weeks' });
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { companies: 'amazon', lists: 'amazon:students', when: 'few-weeks', level: 'junior' } });
    });

    it('offers no student switch to a company without a student list', () => {
      setup();
      openPicker();
      click('company-plan-option-agoda');
      click('company-plan-continue');
      click('company-plan-when-next-week');
      expect(host.querySelector('[data-testid="company-plan-student"]')).toBeNull();
    });

    it('can go back from the rounds step and still reach it again', () => {
      setup();
      click('company-plan-continue');
      click('company-plan-when-next-week');
      click('company-plan-level-mid');
      expect(component.step()).toBe(4);
      component.back();
      fixture.detectChanges();
      expect(component.step()).toBe(3);
      expect(host.querySelectorAll<HTMLButtonElement>('.plan-step')[3].disabled).toBeFalse();
      component.goToStep(4);
      fixture.detectChanges();
      expect(host.querySelector('[data-testid="company-plan-next-step"]')).toBeTruthy();
    });

    it('leaves a plan already on the account until the preview has warned about replacing it', () => {
      setup({ saved: { companies: [{ slug: 'elevenlabs' }], level: 'senior', when: 'later' } });
      click('company-plan-continue');
      finish();
      expect(plans.save).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('saves nothing for an unlisted company or no company, and still opens the preview', () => {
      setup();
      openPicker();
      search('Vercel');
      click('company-plan-custom');
      click('company-plan-continue');
      finish();
      expect(plans.save).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledOnceWith(['/companies/preview'], { queryParams: { custom: 'Vercel', when: 'next-week', level: 'mid' } });
    });
  });
});
