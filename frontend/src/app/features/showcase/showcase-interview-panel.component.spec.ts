import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { ShowcaseInterviewPanelComponent } from './showcase-interview-panel.component';

const DRAFT_KEY = 'fa:company-plan:draft:v1';
const plan = (slug: string, extra: object = {}) => ({
  companies: [{ slug }],
  level: 'senior',
  when: 'next-week',
  createdAt: '2026-11-02T10:00:00.000Z',
  passedRounds: [],
  markedDone: [],
  ...extra,
});

describe('ShowcaseInterviewPanelComponent', () => {
  let fixture: ComponentFixture<ShowcaseInterviewPanelComponent>;
  let component: ShowcaseInterviewPanelComponent;
  let host: HTMLElement;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  function setup(options: { user?: unknown; firstRenderOnly?: boolean } = {}) {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    TestBed.configureTestingModule({
      imports: [ShowcaseInterviewPanelComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: AuthService, useValue: { user: signal(options.user ?? null) } },
      ],
    });
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ShowcaseInterviewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // A plan shows only after the first render, as in the browser after hydration.
    if (!options.firstRenderOnly) fixture.detectChanges();
    host = fixture.nativeElement;
  }

  const byTestId = <T extends HTMLElement>(id: string) => host.querySelector<T>(`[data-testid="${id}"]`) as T;
  const follow = (link: HTMLElement) => {
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.removeItem(DRAFT_KEY));
  afterEach(() => {
    fixture.destroy();
    localStorage.removeItem(DRAFT_KEY);
  });

  it('opens the form at the date with the company the sentence shows', () => {
    setup();
    const build = byTestId<HTMLAnchorElement>('showcase-interview-build');
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Interview coming up?');
    expect(build.getAttribute('href')).toBe('/companies?company=google&from=home');
    expect(byTestId('showcase-interview-slot').getAttribute('aria-label')).toBe('Choose your company. Now: Google');

    component.index.set(6);
    fixture.detectChanges();
    expect(build.getAttribute('href')).toBe('/companies?company=capital-one&from=home');

    follow(build);
    expect(analytics.track).toHaveBeenCalledOnceWith('lp_conversion_link_clicked', {
      action: 'build_plan',
      src: 'showcase_hero',
      surface: 'interview_panel',
      destination: '/companies',
      company: 'capital-one',
    });
  });

  it('lists the companies with their signature round, each into the form, and the way to all of them', () => {
    setup();
    byTestId('showcase-interview-slot').click();
    fixture.detectChanges();
    const menu = byTestId('showcase-interview-menu');
    const options = Array.from(menu.querySelectorAll<HTMLAnchorElement>('.interview-option'));
    // The names visitors look for first lead the list; the companies with a distinctive round follow.
    expect(options.map((option) => option.querySelector('.interview-option__name')?.textContent)).toEqual([
      'Google', 'Meta', 'Amazon', 'Uber',
      'ElevenLabs', 'Agoda', 'Capital One', 'Intuit', 'Revolut', 'Stripe', 'GitLab', 'Walmart',
    ]);
    expect(options[4].querySelector('.interview-option__signature')?.textContent).toBe('Timed coding assessment');
    expect(options[9].getAttribute('href')).toBe('/companies?company=stripe&from=home');

    const all = menu.querySelector<HTMLAnchorElement>('.interview-menu__all') as HTMLAnchorElement;
    expect(all.textContent?.trim()).toBe('See all 30 companies');
    expect(all.getAttribute('href')).toBe('/companies');
    follow(all);
    expect(analytics.track).toHaveBeenCalledOnceWith('lp_conversion_link_clicked', {
      action: 'browse_companies',
      src: 'showcase_hero',
      surface: 'company_menu',
      destination: '/companies',
    });
    expect(byTestId('showcase-interview-menu')).toBeNull();
  });

  it('draws the first render without the plan, so hydration finds what the server drew, and shows the plan after', () => {
    setup({ user: { _id: 'u1', companyPlan: plan('elevenlabs') }, firstRenderOnly: true });
    expect(byTestId('showcase-interview-build')).not.toBeNull();
    expect(byTestId('showcase-interview-resume')).toBeNull();
    fixture.detectChanges();
    expect(byTestId('showcase-interview-resume')).not.toBeNull();
  });

  it('leads a free account back to the preview of the plan on its account', () => {
    setup({ user: { _id: 'u1', companyPlan: plan('elevenlabs') } });
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Your plan');
    expect(host.querySelector('.interview-panel__sentence')?.textContent).toBe('Continue your ElevenLabs plan');
    expect(host.querySelector('.interview-panel__sub')?.textContent).toBe('Next week · Senior · saved to your account');
    const resume = byTestId<HTMLAnchorElement>('showcase-interview-resume');
    expect(resume.getAttribute('href')).toBe('/companies/preview');
    follow(resume);
    expect(analytics.track).toHaveBeenCalledOnceWith('company_plan_resumed', { from: 'home', plan: 'saved' });
  });

  it('leads a Premium member, or one whose Premium ended, to the plan itself', () => {
    setup({ user: { _id: 'u1', role: 'user', entitlements: { pro: { status: 'expired', validUntil: null } }, companyPlan: plan('agoda', { companies: [{ slug: 'agoda' }, { slug: 'stripe' }] }) } });
    expect(host.querySelector('.interview-panel__sentence')?.textContent).toBe('Continue your Agoda and Stripe plan');
    expect(byTestId('showcase-interview-resume').getAttribute('href')).toBe('/companies/plan');
  });

  it('offers a plan started in this browser to a guest', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ companies: [{ slug: 'gitlab' }], level: 'staff', when: 'later' }));
    setup();
    expect(host.querySelector('.interview-panel__sentence')?.textContent).toBe('Continue your GitLab plan');
    expect(host.querySelector('.interview-panel__sub')?.textContent).toBe('Later or no date · Staff · saved in this browser');
    follow(byTestId('showcase-interview-resume'));
    expect(analytics.track).toHaveBeenCalledOnceWith('company_plan_resumed', { from: 'home', plan: 'started' });
  });

  it('ignores a stored draft that cannot be a plan', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ companies: [], level: 'senior', when: 'later' }));
    setup();
    expect(byTestId('showcase-interview-resume')).toBeNull();
    expect(byTestId('showcase-interview-build')).not.toBeNull();
  });
});
