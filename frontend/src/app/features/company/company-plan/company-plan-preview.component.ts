import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import type { CompanyPlanAnswers, CompanyPlanAnswerLevel, CompanyPlanWhen } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { InlineCodeComponent, stripInlineMarkup } from '../../../shared/ui/inline-code/inline-code.component';
import type { CompanyPlan, CompanyPlanData, PlannedTask } from './company-plan.engine';
import {
  LEVEL_LABELS,
  WHEN_LABELS,
  clockText,
  frameworkLabel,
  planCompanyNames,
  planEvidenceLine,
  planFrameworkChips,
  planSummaryLine,
  practiceState,
  taskGroups,
  whyLine,
} from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';

const WHENS: readonly CompanyPlanWhen[] = ['tomorrow', 'this-week', 'next-week', 'later'];
const LEVELS: readonly CompanyPlanAnswerLevel[] = ['junior', 'mid', 'senior', 'staff'];
const MAX_COMPANIES = 3;
const MAX_CUSTOM_LENGTH = 60;

export type PreviewRequest = {
  readonly answers: CompanyPlanAnswers;
  /** A company we have not mapped, as typed. */
  readonly custom: string;
};

/**
 * Reads the answers from the address, so a reload or a shared link keeps them and a broken one cannot break the page:
 * unknown companies are ignored, and a bad date or level falls back to the default. With nothing in the address the
 * saved answers are used. Null means there is nothing to show, and the form is the place to start.
 */
export function readPreviewRequest(params: ParamMap, data: CompanyPlanData, saved: CompanyPlanAnswers | null): PreviewRequest | null {
  const inAddress = ['companies', 'custom', 'when', 'level'].some((key) => params.has(key));
  if (!inAddress) return saved ? { answers: saved, custom: '' } : null;

  const lists = new Map((params.get('lists') ?? '').split(',').map((entry): [string, string] => {
    const [slug, list] = entry.split(':');
    return [slug, list ?? ''];
  }));
  const slugs = [...new Set((params.get('companies') ?? '').split(',').map((slug) => slug.trim()))]
    .filter((slug) => Boolean(data.companies[slug]))
    .slice(0, MAX_COMPANIES);
  const companies = slugs.map((slug) => {
    const list = lists.get(slug);
    return list && data.companies[slug].variants.some((variant) => variant.id === list) ? { slug, list } : { slug };
  });
  const when = params.get('when') as CompanyPlanWhen;
  const level = params.get('level') as CompanyPlanAnswerLevel;
  return {
    answers: {
      companies,
      when: WHENS.includes(when) ? when : 'next-week',
      level: LEVELS.includes(level) ? level : 'senior',
    },
    custom: companies.length ? '' : (params.get('custom') ?? '').trim().slice(0, MAX_CUSTOM_LENGTH),
  };
}

@Component({
  selector: 'app-company-plan-preview',
  imports: [RouterLink, FaButtonComponent, InlineCodeComponent],
  templateUrl: './company-plan-preview.component.html',
  styleUrls: ['./company-plan-preview.component.css'],
})
export class CompanyPlanPreviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly plans = inject(CompanyPlanService);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly data = signal<CompanyPlanData | null>(null);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly building = signal(false);

  readonly request = computed(() => {
    const data = this.data();
    return data ? readPreviewRequest(this.params(), data, this.plans.answers()) : null;
  });

  readonly plan = computed<CompanyPlan | null>(() => {
    const data = this.data();
    const request = this.request();
    return data && request ? this.plans.buildPlan(data, request.answers) : null;
  });

  readonly viewer = computed<'guest' | 'free' | 'premium'>(() => {
    const user = this.auth.user();
    if (!user) return 'guest';
    return isProActive(user) ? 'premium' : 'free';
  });

  private readonly names = computed(() => {
    const data = this.data();
    const request = this.request();
    return data && request ? planCompanyNames(data, request.answers) : '';
  });

  readonly title = computed(() => {
    const request = this.request();
    if (this.plan()?.general) return request?.custom ? `We have not mapped ${request.custom} yet` : 'Start with these frontend tasks';
    return `Your ${this.names()} plan at a glance`;
  });

  readonly chips = computed(() => {
    const request = this.request();
    const plan = this.plan();
    if (!request || !plan) return [];
    return [WHEN_LABELS[request.answers.when], LEVEL_LABELS[request.answers.level], ...planFrameworkChips(plan)];
  });

  readonly evidence = computed(() => {
    const plan = this.plan();
    if (!plan) return '';
    if (plan.general) {
      return this.request()?.custom
        ? 'Start with these general frontend tasks. Your search is counted, so the next company we map is one people ask for.'
        : 'You have not picked a company, so these are general frontend tasks.';
    }
    return planEvidenceLine(plan, this.names());
  });

  private readonly groups = computed(() => {
    const plan = this.plan();
    return plan ? taskGroups(plan) : new Map<string, string>();
  });

  /**
   * A visitor gets three free tasks, taken from outside the plan when it has fewer of its own. Premium opens every task,
   * so a member starts on the plan itself.
   */
  private readonly rows = computed<CompanyPlan['preview']>(() => {
    const plan = this.plan();
    if (!plan) return { open: [], rest: [] };
    if (plan.general || this.viewer() !== 'premium') return plan.preview;
    const open = plan.tasks.filter((task) => task.kind !== 'guide').slice(0, plan.preview.open.length);
    return { open, rest: plan.tasks.filter((task) => !open.includes(task)) };
  });

  /** How many of the open tasks sit outside the plan, so the counts on the screen add up. */
  private readonly warmups = computed(() => {
    const planned = new Set((this.plan()?.tasks ?? []).map((task) => task.id));
    return this.rows().open.filter((task) => !planned.has(task.id)).length;
  });

  readonly openTasks = computed(() => this.rows().open.map((task) => ({
    task,
    why: whyLine(task.why),
    time: clockText(task.minutes),
    state: practiceState(task, this.rows().open, this.router.url, 'Back to plan'),
  })));

  readonly restTasks = computed(() => this.rows().rest.map((task) => ({
    task,
    meta: `${this.groups().get(task.id) ?? 'Plan'} · about ${clockText(task.minutes)}`,
    aria: this.viewer() === 'premium' ? stripInlineMarkup(task.title) : `${stripInlineMarkup(task.title)}, locked until you build your plan`,
  })));

  readonly restTitle = computed(() => (this.warmups() === this.rows().open.length ? 'Your plan' : 'The rest of your plan'));

  /** The plan a person already has, when building this one would replace it. */
  readonly replacing = computed(() => {
    const data = this.data();
    const saved = this.plans.saved();
    const request = this.request();
    if (!data || !saved || !request) return '';
    const same = (list: CompanyPlanAnswers) => JSON.stringify(list.companies.map((company) => company.slug).sort());
    if (same(saved) === same(request.answers)) return '';
    return planCompanyNames(data, saved);
  });

  readonly facts = computed(() => {
    const data = this.data();
    const plan = this.plan();
    const request = this.request();
    if (!data || !plan || !request || plan.general) return [];
    const rounds = plan.companies.reduce((sum, company) => sum + company.rounds.length, 0);
    const counts = data.general.premiumCounts;
    const framework = plan.companies[0].framework;
    const lastFact = this.viewer() === 'premium'
      ? 'Progress saved as you go'
      : counts && `Premium also opens ${counts[framework]} ${frameworkLabel(framework)} tasks and ${counts.systemDesign} system design walkthroughs`;
    const warmups = this.warmups();
    return [
      planSummaryLine(plan, request.answers.when) + (warmups ? `, plus ${warmups} free ${warmups === 1 ? 'warm-up' : 'warm-ups'}` : ''),
      `All ${rounds} reported rounds in order, each with its sources`,
      ...(lastFact ? [lastFact] : []),
    ];
  });

  readonly ctaNote = computed(() => {
    if (this.plan()?.general) return '';
    if (this.replacing()) return `This replaces your ${this.replacing()} plan. Your solved tasks stay.`;
    switch (this.viewer()) {
      case 'premium':
        return 'You have Premium, so your plan opens right away.';
      case 'free':
        return this.plans.saved()
          ? 'Saved to your account. Your plan is part of Premium, and you land on it right after payment.'
          : 'Your plan is part of Premium. You land on it right after payment.';
      default:
        return 'Your plan is part of Premium. You land on it right after payment.';
    }
  });

  readonly pricingParams = computed(() => {
    const slug = this.plan()?.companies[0]?.slug;
    return { src: slug ? `company_plan_${slug}` : 'company_plan_general' };
  });

  readonly signupParams = computed(() => ({ redirectTo: this.router.url }));

  private tracked = false;

  private readonly trackView = effect(() => {
    const plan = this.plan();
    if (!plan || this.tracked) return;
    this.tracked = true;
    untracked(() => this.plans.track('company_plan_preview_viewed', {
      companies: plan.companies.map((company) => company.slug).join(','),
      general: plan.general,
      viewer: this.viewer(),
    }));
  });

  /** An address with nothing to show goes back to the form instead of an empty page. */
  private readonly leaveEmpty = effect(() => {
    if (this.data() && !this.request()) void this.router.navigate(['/companies'], { replaceUrl: true });
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

  taskOpened(task: PlannedTask): void {
    this.plans.track('company_plan_free_task_opened', { task: task.id, general: this.plan()?.general ?? false });
  }

  /** Switches a company to its other round list, and keeps the answer unless a different plan is on the account. */
  switchList(slug: string, listId: string): void {
    const request = this.request();
    if (!request) return;
    const answers: CompanyPlanAnswers = {
      ...request.answers,
      companies: request.answers.companies.map((company) => (company.slug === slug ? { slug, list: listId } : company)),
    };
    if (!this.replacing()) this.plans.save(answers).subscribe();
    const lists = answers.companies.flatMap((company) => (company.list ? [`${company.slug}:${company.list}`] : [])).join(',');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { companies: answers.companies.map((company) => company.slug).join(','), lists, when: answers.when, level: answers.level, custom: null },
      replaceUrl: true,
    });
  }

  build(): void {
    const request = this.request();
    if (!request || this.building()) return;
    this.building.set(true);
    const premium = this.viewer() === 'premium';
    this.plans.track('company_plan_build_clicked', {
      companies: request.answers.companies.map((company) => company.slug).join(','),
      when: request.answers.when,
      level: request.answers.level,
      viewer: this.viewer(),
    });
    // Whatever the write does, the draft is kept, so the person always moves on.
    this.plans.save(request.answers).subscribe(() => {
      this.building.set(false);
      void (premium
        ? this.router.navigate(['/companies/plan'])
        : this.router.navigate(['/pricing'], { queryParams: this.pricingParams() }));
    });
  }
}
