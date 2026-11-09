import { Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CompanyPlanAnswers } from '../../core/models/company-plan.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyLogoMarkComponent } from '../../shared/components/company-logo-mark/company-logo-mark.component';
import { companyBrandFor } from '../../shared/company-branding';
import { COMPANY_SIGNATURES } from '../../shared/company-previews/company-signatures';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaRotatingWordsComponent } from '../../shared/ui/rotating-words/fa-rotating-words.component';
import { hasPremium, premiumEnded } from '../company/company-plan/company-plan-access';
import { cleanCompanyPlanAnswers, readCompanyPlanDraft } from '../company/company-plan/company-plan-draft';
import { COMPANY_PLAN_WHEEL } from '../company/company-plan/company-plan-wheel';
import { LEVEL_LABELS, WHEN_LABELS, joinNames } from '../company/company-plan/company-plan.format';

/** Half the rotation interval, so this sentence and the practice card above never move at the same moment. */
const START_DELAY_MS = 1200;

/**
 * The home page door into a company plan: "I'm interviewing at …" opens the form at the date with that company
 * picked. Someone with a plan sees it instead. The page is prerendered for everyone, so the plan only shows after
 * the first render in the browser.
 */
@Component({
  selector: 'app-showcase-interview-panel',
  imports: [RouterLink, CompanyLogoMarkComponent, FaButtonComponent, FaRotatingWordsComponent],
  templateUrl: './showcase-interview-panel.component.html',
  styleUrls: ['./showcase-interview-panel.component.css'],
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ShowcaseInterviewPanelComponent {
  readonly companies = COMPANY_PLAN_WHEEL.map((company) => ({ ...company, signature: COMPANY_SIGNATURES[company.slug] ?? '' }));
  readonly names = this.companies.map((company) => company.name);
  readonly companyCount = Object.keys(COMPANY_SIGNATURES).length;
  readonly startDelayMs = START_DELAY_MS;

  readonly index = signal(0);
  readonly open = signal(false);
  readonly hovering = signal(false);
  readonly focused = signal(false);
  readonly paused = computed(() => this.hovering() || this.focused() || this.open());
  readonly company = computed(() => this.companies[this.index()]);

  private readonly auth = inject(AuthService);
  private readonly analytics = inject(AnalyticsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly slotButton = viewChild<ElementRef<HTMLButtonElement>>('slotButton');
  private readonly rendered = signal(false);
  private readonly draft = signal<CompanyPlanAnswers | null>(null);

  /** The plan to come back to: the account's, or one started in this browser. The account wins, as on /companies. */
  readonly resume = computed(() => {
    if (!this.rendered()) return null;
    const user = this.auth.user();
    const saved = cleanCompanyPlanAnswers(user?.companyPlan);
    const answers = saved ?? this.draft();
    if (!answers) return null;
    const names = joinNames(answers.companies.map((company) => companyBrandFor(company.slug)?.label ?? company.slug));
    return {
      title: `Continue your ${names} plan`,
      line: `${WHEN_LABELS[answers.when]} · ${LEVEL_LABELS[answers.level]} · ${saved ? 'saved to your account' : 'saved in this browser'}`,
      link: hasPremium(user) || premiumEnded(user) ? '/companies/plan' : '/companies/preview',
      plan: saved ? ('saved' as const) : ('started' as const),
    };
  });

  constructor() {
    afterNextRender(() => {
      this.draft.set(readCompanyPlanDraft());
      this.rendered.set(true);
    });
  }

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(returnFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.slotButton()?.nativeElement.focus();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.querySelector('.interview-slot')?.contains(event.target as Node)) this.close(false);
  }

  built(slug: string, surface: 'interview_panel' | 'company_menu'): void {
    this.open.set(false);
    this.analytics.track('lp_conversion_link_clicked', { action: 'build_plan', src: 'showcase_hero', surface, destination: '/companies', company: slug });
  }

  browsed(): void {
    this.open.set(false);
    this.analytics.track('lp_conversion_link_clicked', { action: 'browse_companies', src: 'showcase_hero', surface: 'company_menu', destination: '/companies' });
  }

  resumed(plan: 'saved' | 'started'): void {
    this.analytics.track('company_plan_resumed', { from: 'home', plan });
  }
}
