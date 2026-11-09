import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { companyBrandFor } from '../../../shared/company-branding';
import { stripInlineMarkup } from '../../../shared/ui/inline-code/inline-code.component';
import { hasPremium, premiumEnded } from './company-plan-access';
import type { CompanyPlanData, PlannedTask } from './company-plan.engine';
import { LEVEL_LABELS, WHEN_LABELS, joinNames, practiceState } from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';

const RETURN_URL = '/companies/plan';
const RETURN_LABEL = 'Back to plan';

/**
 * The plan on the account, kept in the sidebar so it is one click away from every page: its date and level, and for a
 * Premium member what is solved and the next task. The sidebar loads it through a defer block, only for an account
 * with a plan.
 */
@Component({
  selector: 'app-company-plan-sidebar-card',
  imports: [RouterLink, TooltipModule],
  templateUrl: './company-plan-sidebar-card.component.html',
  styleUrls: ['./company-plan-sidebar-card.component.css'],
})
export class CompanyPlanSidebarCardComponent {
  /** The rail shows icons only, so the card shrinks to a marked icon with a tooltip. */
  readonly collapsed = input(false);
  /** A link on the card was followed, so a drawer can close. */
  readonly followed = output<void>();

  private readonly auth = inject(AuthService);
  private readonly plans = inject(CompanyPlanService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = signal<CompanyPlanData | null>(null);
  private dataRequested = false;

  private readonly premium = computed(() => hasPremium(this.auth.user()));

  readonly card = computed(() => {
    const user = this.auth.user();
    const answers = this.plans.answers();
    if (!user?.companyPlan || !answers) return null;
    const names = joinNames(answers.companies.map((company) => companyBrandFor(company.slug)?.label ?? company.slug));
    const data = this.premium() ? this.data() : null;
    const plan = data ? this.plans.buildPlan(data, answers) : null;
    const solved = plan ? plan.tasks.filter((task) => task.solved).length : 0;
    const progress = plan && plan.tasks.length
      ? { text: `${solved} of ${plan.tasks.length} solved`, percent: Math.round((solved / plan.tasks.length) * 100) }
      : null;
    const status = this.premium() ? '' : premiumEnded(user) ? 'Premium ended' : 'Saved to your account';
    const line = `${WHEN_LABELS[answers.when]} · ${LEVEL_LABELS[answers.level]}`;
    return {
      title: `Your ${names} plan`,
      line,
      status,
      progress,
      link: this.premium() || premiumEnded(user) ? RETURN_URL : '/companies/preview',
      label: [`Your ${names} plan`, line, progress?.text ?? status].filter(Boolean).join(', '),
      next: plan?.next ? { task: plan.next, title: stripInlineMarkup(plan.next.title), state: practiceState(plan.next, plan.tasks, RETURN_URL, RETURN_LABEL) } : null,
    };
  });

  constructor() {
    // The plan data is large, so it loads only for a member who can see the progress.
    effect(() => {
      if (this.premium() && this.plans.answers()) untracked(() => this.loadData());
    });
  }

  opened(): void {
    this.plans.track('company_plan_resumed', { from: 'sidebar', plan: 'saved' });
    this.followed.emit();
  }

  nextOpened(task: PlannedTask): void {
    this.plans.track('company_plan_task_opened', { task: task.id, kind: task.kind, next: true, from: 'sidebar' });
    this.followed.emit();
  }

  private loadData(): void {
    if (this.dataRequested) return;
    this.dataRequested = true;
    this.plans.loadData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => this.data.set(data));
  }
}
