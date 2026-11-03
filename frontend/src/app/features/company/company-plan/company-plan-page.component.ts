import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { InlineCodeComponent, stripInlineMarkup } from '../../../shared/ui/inline-code/inline-code.component';
import { premiumEnded } from './company-plan-access';
import type { CompanyPlan, CompanyPlanData, PlannedRound, PlannedTask } from './company-plan.engine';
import {
  LEVEL_LABELS,
  clockText,
  frameworkLabel,
  hoursText,
  joinNames,
  planCompanyNames,
  planDateChip,
  planDatePassed,
  planEvidenceLine,
  planFrameworkChips,
  practiceState,
  roundSourcesLine,
  taskGroups,
  whyLine,
} from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';

const RETURN_URL = '/companies/plan';
const RETURN_LABEL = 'Back to plan';

export type CompanyPlanTaskView = {
  readonly task: PlannedTask;
  readonly domId: string;
  readonly why: string;
  readonly time: string;
  readonly next: boolean;
  /** Solved in the workspace, so the mark is not this page's to take back. */
  readonly locked: boolean;
  readonly doneLabel: string;
  /** The link's name once Premium has run out and the task opens the pricing page. */
  readonly renewLabel: string;
  readonly state: Record<string, unknown>;
};

const minutesOf = (tasks: readonly PlannedTask[]) => tasks.reduce((sum, task) => sum + task.minutes, 0);

/**
 * The plan a Premium member works through: the next task, a time map, every round in order with its tasks, and format
 * practice. The plan is rebuilt from the answers on the account, so marks and solved tasks move it as they change.
 */
@Component({
  selector: 'app-company-plan-page',
  imports: [RouterLink, NgTemplateOutlet, FaButtonComponent, InlineCodeComponent],
  templateUrl: './company-plan-page.component.html',
  styleUrls: ['./company-plan-page.component.css'],
})
export class CompanyPlanPageComponent {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly progress = inject(UserProgressService);
  readonly plans = inject(CompanyPlanService);

  readonly data = signal<CompanyPlanData | null>(null);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  /** The last mark did not reach the account, so the page shows it as it was. */
  readonly saveFailed = signal(false);
  private readonly now = new Date();

  readonly plan = computed<CompanyPlan | null>(() => {
    const data = this.data();
    const answers = this.plans.answers();
    if (!data || !answers) return null;
    const plan = this.plans.buildPlan(data, answers);
    // Every company in the answers left the data: there is nothing of this plan to show.
    return plan.general ? null : plan;
  });

  private readonly names = computed(() => {
    const data = this.data();
    const answers = this.plans.answers();
    return data && answers ? planCompanyNames(data, answers) : '';
  });

  private readonly answeredAt = computed(() => this.plans.saved()?.createdAt ?? this.now.toISOString());

  /** Premium ran out: the plan stays readable, and every task leads to renewing. */
  readonly ended = computed(() => premiumEnded(this.auth.user()));

  readonly pricingParams = computed(() => ({ src: `company_plan_${this.plan()?.companies[0]?.slug ?? 'general'}` }));

  readonly solvedCount = computed(() => this.plan()?.tasks.filter((task) => task.solved).length ?? 0);

  readonly title = computed(() => {
    const total = this.plan()?.tasks.length ?? 0;
    const solved = this.solvedCount();
    if (this.ended()) return `Your ${this.names()} plan is saved`;
    if (total && solved === total) return `You finished your ${this.names()} plan`;
    return solved ? `Welcome back to your ${this.names()} plan` : `Your ${this.names()} plan is ready`;
  });

  readonly chips = computed(() => {
    const plan = this.plan();
    const answers = this.plans.answers();
    if (!plan || !answers) return [];
    return [planDateChip(answers.when, this.answeredAt()), LEVEL_LABELS[answers.level], ...planFrameworkChips(plan)];
  });

  readonly evidence = computed(() => {
    const plan = this.plan();
    return plan ? planEvidenceLine(plan, this.names()) : '';
  });

  readonly warnings = computed(() => {
    const plan = this.plan();
    const answers = this.plans.answers();
    if (!plan || !answers) return [];
    const passed = planDatePassed(answers.when, this.answeredAt(), this.now)
      ? [`Your interview ${answers.when === 'tomorrow' ? 'day' : 'week'} has passed. Use Edit answers to update your date.`]
      : [];
    return [...passed, ...plan.warnings];
  });

  private readonly groups = computed(() => {
    const plan = this.plan();
    return plan ? taskGroups(plan) : new Map<string, string>();
  });

  private readonly views = computed(() => {
    const plan = this.plan();
    const ended = this.ended();
    const views = new Map<string, CompanyPlanTaskView>();
    for (const task of plan?.tasks ?? []) {
      const locked = this.progress.isSolved(task.id);
      const title = stripInlineMarkup(task.title);
      views.set(task.id, {
        task,
        domId: `plan-task-${task.id}`,
        why: whyLine(task.why),
        time: task.solved ? 'Solved' : clockText(task.minutes),
        next: !ended && task.id === plan?.next?.id,
        locked,
        doneLabel: `${locked ? 'Solved in the workspace' : task.solved ? 'Mark as not solved' : 'Mark as solved'}: ${title}`,
        renewLabel: `${title}, opens again with Premium`,
        state: practiceState(task, plan?.tasks ?? [], RETURN_URL, RETURN_LABEL),
      });
    }
    return views;
  });

  readonly panel = computed(() => {
    const plan = this.plan();
    if (!plan) return null;
    if (this.ended()) {
      return {
        label: 'Premium ended',
        title: 'Your plan is saved',
        meta: 'Renew to open your tasks again. Your solved tasks stay.',
        cta: 'Renew Premium',
        route: '/pricing',
        queryParams: this.pricingParams(),
        state: {},
        note: '',
        task: null,
      };
    }
    const next = plan.next;
    if (next) {
      const solved = this.solvedCount() > 0;
      return {
        label: solved ? 'Next up' : 'Start here',
        title: next.title,
        meta: `${this.groups().get(next.id) ?? 'Your plan'} · about ${clockText(next.minutes)}`,
        cta: solved ? 'Continue with the next task' : 'Start the first task',
        route: next.route,
        queryParams: null,
        state: this.views().get(next.id)?.state ?? {},
        note: next.kind === 'coding' || next.kind === 'debug' ? 'Runs in your browser.' : '',
        task: next,
      };
    }
    const framework = plan.companies[0].framework;
    const more = {
      cta: `Practice more ${frameworkLabel(framework)} tasks`,
      route: '/coding',
      queryParams: { tech: framework, kind: 'coding' },
      state: {},
      note: '',
      task: null,
    };
    return plan.tasks.length
      ? { label: 'Plan finished', title: 'Every task in this plan is done', meta: 'Ask your recruiter about format, tools and stack before the interview.', ...more }
      : { label: 'Nothing left', title: 'You marked every round with tasks as passed', meta: 'Undo a round below, or keep practicing.', ...more };
  });

  /** Each task as a block as long as its minutes, grouped by round, or by company when there are several. */
  readonly map = computed(() => {
    const plan = this.plan();
    if (!plan?.tasks.length) return null;
    const byCompany = plan.companies.length > 1;
    const groups = [
      ...(byCompany
        ? plan.companies.map((company) => ({ name: company.name, tasks: company.rounds.flatMap((round) => round.tasks) }))
        : plan.companies[0].rounds.map((round) => ({ name: round.name, tasks: round.tasks }))),
      { name: 'Format practice', tasks: plan.formatPractice },
    ].filter((group) => group.tasks.length);
    const longest = Math.max(1, ...groups.map((group) => minutesOf(group.tasks)));
    const solved = this.solvedCount();
    return {
      title: `About ${hoursText(plan.totalMinutes)}, ${byCompany ? 'company by company' : 'round by round'}`,
      progress: `${solved} of ${plan.tasks.length} solved${solved && plan.remainingMinutes ? `, about ${hoursText(plan.remainingMinutes)} left` : ''}`,
      groups: groups.map((group) => {
        const minutes = minutesOf(group.tasks);
        return {
          name: group.name,
          time: clockText(minutes),
          minutes,
          share: Math.round((minutes * 100) / longest),
          blocks: group.tasks.map((task) => {
            const status = task.solved ? 'Solved' : 'To do';
            const title = stripInlineMarkup(task.title);
            return { task, label: `${title}, about ${task.minutes} minutes, ${status}`, tip: `${title} · ${task.minutes} min · ${status}` };
          }),
        };
      }),
    };
  });

  readonly companies = computed(() => (this.plan()?.companies ?? []).map((company) => ({
    company,
    meta: `${company.list.title} · ${company.rounds.length} reported ${company.rounds.length === 1 ? 'round' : 'rounds'}`,
    guide: `/companies/${company.slug}/preview`,
    rounds: company.rounds.map((round, index) => ({
      round,
      sources: roundSourcesLine(round),
      last: index === company.rounds.length - 1,
      tasks: round.tasks.flatMap((task) => this.views().get(task.id) ?? []),
    })),
  })));

  readonly format = computed(() => {
    const plan = this.plan();
    if (!plan?.formatPractice.length) return null;
    return {
      title: `Format practice in ${joinNames([...new Set(plan.companies.map((company) => frameworkLabel(company.framework)))])}`,
      body: `Not reported at ${this.names()}. Same format as the coding rounds above.`,
      tasks: plan.formatPractice.flatMap((task) => this.views().get(task.id) ?? []),
    };
  });

  private tracked = false;

  private readonly trackOpen = effect(() => {
    const plan = this.plan();
    const answers = this.plans.answers();
    if (!plan || !answers || this.tracked) return;
    this.tracked = true;
    untracked(() => this.plans.track('company_plan_opened', {
      companies: plan.companies.map((company) => company.slug).join(','),
      when: answers.when,
      level: answers.level,
      solved: this.solvedCount(),
      total: plan.tasks.length,
      ended: this.ended(),
    }));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.plans.loadData().subscribe((data) => {
      this.data.set(data);
      this.state.set(data ? 'ready' : 'error');
    });
  }

  async togglePassed(round: PlannedRound): Promise<void> {
    this.saveFailed.set(!(await this.plans.setRoundPassed(round.key, !round.passed)));
  }

  async toggleDone(view: CompanyPlanTaskView): Promise<void> {
    if (view.locked) return;
    this.saveFailed.set(!(await this.plans.setTaskDone(view.task.id, !view.task.solved)));
  }

  /** A block on the time map leads to its task row. */
  jumpTo(task: PlannedTask): void {
    const row = this.document.getElementById(`plan-task-${task.id}`);
    if (!row) return;
    const still = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    row.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  }

  taskOpened(task: PlannedTask): void {
    this.plans.track('company_plan_task_opened', { task: task.id, kind: task.kind, next: task.id === this.plan()?.next?.id });
  }
}
