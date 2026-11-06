import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import type { CompanyPlanAnswers, CompanyPlanAnswerLevel, CompanyPlanFrameworkChoice, CompanyPlanWhen } from '../../../core/models/company-plan.model';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { InlineCodeComponent, stripInlineMarkup } from '../../../shared/ui/inline-code/inline-code.component';
import type { CompanyPlan, CompanyPlanData, PlannedTask } from './company-plan.engine';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from './company-plan-sets';
import {
  LEVEL_LABELS,
  WHEN_LABELS,
  clockText,
  companySetLine,
  frameworkLabel,
  nextRoundName,
  openTaskCount,
  planCompanyNames,
  planEvidenceLine,
  planFrameworkChips,
  planFrameworkLine,
  planPricingSource,
  planSummaryLine,
  practiceState,
  previewQueryParams,
  taskGroups,
  whyLine,
  whyLineFor,
} from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';
import { isCompanyGuideGated } from '../company-preview/company-guide-gate';

/** The practice prompts a guide keeps open without an account or Premium; the answer guides after them are Premium. */
const OPEN_GUIDE_PROMPTS = 3;

const WHENS: readonly CompanyPlanWhen[] = ['tomorrow', 'this-week', 'next-week', 'few-weeks', 'later'];
const LEVELS: readonly CompanyPlanAnswerLevel[] = ['junior', 'mid', 'senior', 'staff'];
const FRAMEWORKS: readonly CompanyPlanFrameworkChoice[] = ['react', 'angular', 'vue'];
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
  // A framework the person chose over the reports'; an unknown one is ignored, and the tasks follow the reports.
  const framework = params.get('framework') as CompanyPlanFrameworkChoice;
  // "Which round is next?" travels as the keys of the rounds behind the person; a key the data does not know is dropped.
  const passedRounds = (params.get('passed') ?? '').split(',').map((key) => key.trim()).filter((key) => {
    const [slug, listId, roundId] = key.split('/');
    const company = companies.find((entry) => entry.slug === slug);
    const list = company && data.companies[slug].variants.find((variant) => variant.id === listId);
    return Boolean(list?.rounds.some((round) => round.id === roundId));
  });
  return {
    answers: {
      companies,
      when: WHENS.includes(when) ? when : 'next-week',
      level: LEVELS.includes(level) ? level : 'senior',
      ...(passedRounds.length ? { passedRounds: [...new Set(passedRounds)].sort() } : {}),
      ...(FRAMEWORKS.includes(framework) ? { framework } : {}),
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
    // A plan that starts past the first rounds says so, per company when there are several.
    const starts = plan.companies.flatMap((company) => {
      const next = nextRoundName(company);
      if (!next) return [];
      return [plan.companies.length > 1 ? `${company.name} from the ${next}` : `From the ${next}`];
    });
    return [WHEN_LABELS[request.answers.when], LEVEL_LABELS[request.answers.level], ...planFrameworkChips(plan), ...starts];
  });

  /** Where the tasks' framework comes from, with the other frameworks to switch to. A general plan has no reports to follow. */
  readonly frameworkLine = computed(() => {
    const plan = this.plan();
    return plan && !plan.general ? planFrameworkLine(plan) : null;
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

  readonly openTasks = computed(() => {
    const planned = new Set((this.plan()?.tasks ?? []).map((task) => task.id));
    return this.rows().open.map((task) => ({
      task,
      why: planned.has(task.id) ? whyLineFor(task.why, this.groups().get(task.id) ?? null) : 'Free warm-up, outside your plan',
      time: clockText(task.minutes),
      state: practiceState(task, this.rows().open, this.router.url, 'Back to plan'),
    }));
  });

  /**
   * The rest of the plan by name: what a Premium task is, which round it serves and where it was reported, so the
   * person can see what Premium opens. Free tasks past the first three stay open.
   */
  readonly restTasks = computed(() => this.rows().rest.map((task) => {
    const group = this.groups().get(task.id) ?? 'Plan';
    const time = clockText(task.minutes);
    const title = stripInlineMarkup(task.title);
    const locked = this.viewer() !== 'premium' && task.access === 'premium';
    return {
      task,
      locked,
      why: whyLine(task.why),
      meta: `${group} · about ${time}`,
      aria: locked ? `${title}, ${group}, about ${time}, opens with Premium` : title,
      // A locked task carries no practice session, only the way back to this plan from its locked page.
      state: locked ? { returnToUrl: this.router.url, returnLabel: 'Back to plan' } : practiceState(task, this.rows().rest, this.router.url, 'Back to plan'),
    };
  }));

  readonly restTitle = computed(() => (this.warmups() === this.rows().open.length ? 'Your plan' : 'The rest of your plan'));

  /** Whether every list in the plan gives its rounds in order; a table that groups them by type says so instead. */
  readonly ordered = computed(() => !(this.plan()?.companies ?? []).some((company) => company.list.unordered));

  readonly restLine = computed(() => {
    if (this.viewer() === 'premium') return 'These open with your plan.';
    const order = this.ordered() ? ' in order' : '';
    return this.restTasks().some((row) => row.locked)
      ? `Premium opens the locked tasks, with every round${order}.`
      : `Every round${order}, with the tasks the reports describe and your progress.`;
  });

  readonly roundsLine = computed(() => `Your plan adds every round${this.ordered() ? ' in order' : ''}, with the tasks the reports describe and your progress.`);

  readonly buildLabel = computed(() => (this.viewer() === 'premium' ? 'Open my plan' : 'Unlock my plan'));

  /**
   * Shown on a phone only. The tasks open there as questions with their solutions, while the code runs on a larger
   * screen; the night before an interview, the guide's rounds and open prompts are the reading a phone is good for.
   */
  readonly phoneNote = computed<{ text: string; guide: { name: string; path: string } | null }>(() => {
    const plan = this.plan();
    const company = plan && !plan.general && plan.companies.length === 1 ? plan.companies[0] : null;
    if (company && this.request()?.answers.when === 'tomorrow') {
      // The guide's answer guides past the open prompts are Premium and read on a phone: the one thing a
      // purchase opens tonight. A gated guide keeps only its first prompt open before the account step.
      const first = isCompanyGuideGated(company.slug) ? 2 : OPEN_GUIDE_PROMPTS + 1;
      const last = company.promptCount;
      const guides = last >= first
        ? ` Premium also opens the answer guides for ${last === first ? `prompt ${first}` : last === first + 1 ? `prompts ${first} and ${last}` : `prompts ${first} to ${last}`} there, readable on this phone tonight.`
        : '';
      return {
        text: `Tonight on a phone, read the ${company.name} guide: its rounds and open prompts. The tasks here open as questions with their solutions; the code runs on a desktop or tablet.${guides}`,
        guide: { name: company.name, path: `/companies/${company.slug}/preview` },
      };
    }
    return { text: 'On a phone, each task opens as a question with its solution. Writing code and running checks need a desktop or tablet.', guide: null };
  });

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
    const openRounds = plan.companies.flatMap((company) => company.rounds.filter((round) => !round.passed));
    const left = openRounds.length;
    const withTasks = openRounds.filter((round) => round.tasks.length).length;
    const order = this.ordered() ? 'in order' : 'grouped by type';
    // The plan names every round; it only promises tasks on the rounds that hold one.
    const tasksOn = withTasks === left ? 'with their tasks and your progress' : `tasks on ${withTasks} of them, and your progress`;
    const roundsFact = left < rounds
      ? `${left} of ${rounds} reported rounds left, ${order}, ${tasksOn}`
      : `All ${rounds} reported rounds ${order}, ${tasksOn}`;
    const counts = data.general.premiumCounts;
    const framework = plan.companies[0].framework;
    const sets = companySetLine(plan.companies.map((company) => ({ name: company.name, counts: COMPANY_SET_COUNTS[company.slug] })));
    const lastFact = this.viewer() === 'premium'
      ? 'Progress saved as you go'
      : counts && `Premium opens all ${PREMIUM_QUESTION_COUNT} Premium questions, including ${counts[framework]} ${frameworkLabel(framework)} tasks and ${counts.systemDesign} system design walkthroughs`;
    const warmups = this.warmups();
    const open = openTaskCount(plan);
    const locked = plan.tasks.length - open;
    // A fact about the plan counts the plan's tasks; a free warm-up outside it keeps its badge but is not counted.
    const pressure = plan.tasks.filter((task) => task.pressure).length;
    // One set of numbers: the plan's tasks, how many open now, and the warm-ups that sit outside it.
    const split = this.viewer() === 'premium' || !locked ? '' : `: ${open} open now, ${locked} with Premium`;
    return [
      planSummaryLine(plan, request.answers.when) + split + (warmups ? `, plus ${warmups} free ${warmups === 1 ? 'warm-up' : 'warm-ups'} outside the plan` : ''),
      roundsFact,
      ...(pressure ? [`${pressure} ${pressure === 1 ? 'task' : 'tasks'} in your plan ${pressure === 1 ? 'runs' : 'run'} as an interview (Pressure Mode): the requirements change while you code`] : []),
      ...(sets ? [sets] : []),
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

  readonly pricingParams = computed(() => ({ src: planPricingSource(this.plan()?.companies[0]?.slug) }));

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
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...previewQueryParams(answers), custom: null },
      replaceUrl: true,
    });
  }

  /** Rebuilds the plan in the framework the person uses, or back in the reports' framework, keeping the answer as switchList does. */
  switchFramework(framework: CompanyPlanFrameworkChoice | null): void {
    const request = this.request();
    if (!request) return;
    const { framework: _previous, ...rest } = request.answers;
    const answers: CompanyPlanAnswers = { ...rest, ...(framework ? { framework } : {}) };
    if (!this.replacing()) this.plans.save(answers).subscribe();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...previewQueryParams(answers), custom: null },
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
      passed_count: request.answers.passedRounds?.length ?? 0,
      framework: request.answers.framework ?? 'reports',
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
