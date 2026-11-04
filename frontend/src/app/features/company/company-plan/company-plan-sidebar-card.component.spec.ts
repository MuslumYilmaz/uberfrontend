import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyPlanSidebarCardComponent } from './company-plan-sidebar-card.component';
import type { CompanyPlanData } from './company-plan.engine';
import { CompanyPlanService } from './company-plan.service';

describe('CompanyPlanSidebarCardComponent', () => {
  let fixture: ComponentFixture<CompanyPlanSidebarCardComponent>;
  const user = signal<unknown>(null);
  const answers = signal<CompanyPlanAnswers | null>(null);
  const planData = { schemaVersion: 1 } as unknown as CompanyPlanData;
  const nextTask = { id: 'react-debounced-search', kind: 'coding', tech: 'react', title: 'Debounced `search` box', route: '/react/coding/react-debounced-search', minutes: 30 };
  let plans: { answers: typeof answers; loadData: jasmine.Spy; buildPlan: jasmine.Spy; track: jasmine.Spy };

  const AGODA: CompanyPlanAnswers = { companies: [{ slug: 'agoda' }], when: 'later', level: 'mid' };
  const account = (access: Record<string, unknown>) => ({ _id: 'u1', role: 'user', companyPlan: { ...AGODA, passedRounds: [], markedDone: [] }, ...access });
  const PREMIUM = { accessTier: 'premium' };
  const FREE = { accessTier: 'free' };
  const ENDED = { accessTier: 'free', entitlements: { pro: { status: 'expired', validUntil: null } } };

  function setup(access: Record<string, unknown> | null, collapsed = false) {
    user.set(access ? account(access) : null);
    answers.set(access ? AGODA : null);
    plans = {
      answers,
      loadData: jasmine.createSpy('loadData').and.returnValue(of(planData)),
      buildPlan: jasmine.createSpy('buildPlan').and.returnValue({
        tasks: [{ ...nextTask, solved: false }, { id: 'a', solved: true }, { id: 'b', solved: false }, { id: 'c', solved: false }],
        next: nextTask,
      }),
      track: jasmine.createSpy('track'),
    };
    TestBed.configureTestingModule({
      imports: [CompanyPlanSidebarCardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { user } }, { provide: CompanyPlanService, useValue: plans }],
    });
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(CompanyPlanSidebarCardComponent);
    fixture.componentRef.setInput('collapsed', collapsed);
    fixture.detectChanges();
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string) => Array.from(host().querySelectorAll(selector)).map((el) => el.textContent?.trim());
  const follow = (link: HTMLAnchorElement) => {
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
  };

  it('shows a Premium member the plan, what is solved and the next task, which opens with the way back to the plan', () => {
    setup(PREMIUM);
    expect(text('.sidebar-plan__title')).toEqual(['Your Agoda plan']);
    expect(text('.sidebar-plan__line')).toEqual(['Later or no date · Mid-level', '1 of 4 solved']);
    expect(host().querySelector<HTMLElement>('.sidebar-plan__fill')?.style.width).toBe('25%');
    const open = host().querySelector<HTMLAnchorElement>('[data-testid="sidebar-company-plan-open"]')!;
    expect(open.getAttribute('href')).toBe('/companies/plan');
    expect(open.getAttribute('aria-label')).toBe('Your Agoda plan, Later or no date · Mid-level, 1 of 4 solved');
    const next = host().querySelector<HTMLAnchorElement>('[data-testid="sidebar-company-plan-next"]')!;
    expect(next.getAttribute('href')).toBe('/react/coding/react-debounced-search');
    expect(next.textContent).toContain('Debounced search box');
    expect(plans.buildPlan).toHaveBeenCalledWith(planData, AGODA);

    const emitted = jasmine.createSpy('followed');
    fixture.componentInstance.followed.subscribe(emitted);
    follow(next);
    expect(plans.track).toHaveBeenCalledWith('company_plan_task_opened', { task: 'react-debounced-search', kind: 'coding', next: true, from: 'sidebar' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
      state: jasmine.objectContaining({ returnToUrl: '/companies/plan', returnLabel: 'Back to plan' }),
    }));
    follow(open);
    expect(plans.track).toHaveBeenCalledWith('company_plan_resumed', { from: 'sidebar', plan: 'saved' });
    expect(emitted).toHaveBeenCalledTimes(2);
  });

  it('leads a free account to the plan preview, without progress and without loading the plan data', () => {
    setup(FREE);
    expect(text('.sidebar-plan__line')).toEqual(['Later or no date · Mid-level', 'Saved to your account']);
    expect(host().querySelector('[data-testid="sidebar-company-plan-open"]')?.getAttribute('href')).toBe('/companies/preview');
    expect(host().querySelector('[data-testid="sidebar-company-plan-next"]')).toBeNull();
    expect(plans.loadData).not.toHaveBeenCalled();
  });

  it('leads a member whose Premium ended to the plan, which offers to renew', () => {
    setup(ENDED);
    expect(text('.sidebar-plan__line')).toEqual(['Later or no date · Mid-level', 'Premium ended']);
    expect(host().querySelector('[data-testid="sidebar-company-plan-open"]')?.getAttribute('href')).toBe('/companies/plan');
    expect(plans.loadData).not.toHaveBeenCalled();
  });

  it('draws nothing without a plan on the account, and only a marked flag on the collapsed rail', () => {
    setup(null);
    expect(host().querySelector('[data-testid="sidebar-company-plan"]')).toBeNull();

    TestBed.resetTestingModule();
    setup(PREMIUM, true);
    const card = host().querySelector('[data-testid="sidebar-company-plan"]') as HTMLElement;
    expect(card.classList).toContain('sidebar-plan--rail');
    expect(getComputedStyle(card.querySelector('.sidebar-plan__body') as HTMLElement).display).toBe('none');
  });
});
