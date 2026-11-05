import { Component, ElementRef, Injector, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { CompanyPlanAnswers, CompanyPlanAnswerLevel, CompanyPlanWhen } from '../../../core/models/company-plan.model';
import type { CompanyCard } from '../../../core/models/company-public.model';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyLogoMarkComponent } from '../../../shared/components/company-logo-mark/company-logo-mark.component';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { FaRotatingWordsComponent } from '../../../shared/ui/rotating-words/fa-rotating-words.component';
import { hasPremium, premiumEnded } from './company-plan-access';
import { companyMatchesSearch } from './company-plan-search';
import { COMPANY_PLAN_WHEEL as WHEEL } from './company-plan-wheel';
import { CompanyPlanData, CompanyPlanDataList, companyPlanDefaultList, companyPlanRoundKey } from './company-plan.engine';
import { LEVEL_LABELS, WHEN_LABELS, planCompanyNames, previewQueryParams } from './company-plan.format';
import { CompanyPlanService } from './company-plan.service';

const MAX_COMPANIES = 3;
const MAX_CUSTOM_LENGTH = 60;
const WIDE_LAYOUT = '(min-width: 960px)';

const WHEN_OPTIONS: readonly { readonly id: CompanyPlanWhen; readonly label: string; readonly sub: string }[] = [
  { id: 'tomorrow', label: 'Tomorrow', sub: 'Up to 3 tasks, from your first rounds.' },
  { id: 'this-week', label: 'This week', sub: 'Up to 4 tasks across the rounds.' },
  { id: 'next-week', label: 'Next week', sub: 'Up to 6 tasks across the rounds.' },
  { id: 'few-weeks', label: 'In two to four weeks', sub: 'Up to 8 tasks across the rounds.' },
  { id: 'later', label: 'Later or no date', sub: 'Up to 12 tasks across the rounds.' },
];

const LEVEL_OPTIONS: readonly { readonly id: CompanyPlanAnswerLevel; readonly label: string; readonly sub: string; readonly note: string }[] = [
  { id: 'junior', label: 'Junior', sub: '0 to 2 years', note: 'At most one system design task.' },
  { id: 'mid', label: 'Mid-level', sub: '2 to 5 years', note: 'At most one system design task.' },
  { id: 'senior', label: 'Senior', sub: '5+ years', note: 'Up to two system design tasks, where the rounds include design.' },
  { id: 'staff', label: 'Staff', sub: 'Leading across teams', note: 'Up to three system design tasks, where the rounds include design.' },
];

const FRAMEWORK_LABELS: Readonly<Record<string, string>> = { react: 'React', angular: 'Angular', vue: 'Vue', javascript: 'JavaScript' };

function joinNames(names: readonly string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '';
}

function shortDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

@Component({
  selector: 'app-company-plan-form',
  imports: [RouterLink, CompanyLogoMarkComponent, FaButtonComponent, FaRotatingWordsComponent],
  templateUrl: './company-plan-form.component.html',
  styleUrls: ['./company-plan-form.component.css'],
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class CompanyPlanFormComponent {
  /** The page heading. It lives in the hero so the sentence reads as the first thing on the page. */
  readonly heading = input.required<string>();
  /** The directory the page already resolved, so the picker works before the plan data arrives. */
  readonly directory = input<readonly CompanyCard[]>([]);

  readonly whenOptions = WHEN_OPTIONS;
  readonly levelOptions = LEVEL_OPTIONS;
  readonly wheelNames = WHEEL.map((company) => company.name);

  readonly step = signal<1 | 2 | 3 | 4>(1);
  private readonly maxStep = signal(1);
  readonly picked = signal<readonly string[]>([]);
  readonly custom = signal('');
  /** Someone has answered, so the sentence stops rotating and shows the answer. */
  readonly chosen = signal(false);
  readonly when = signal<CompanyPlanWhen>('next-week');
  readonly level = signal<CompanyPlanAnswerLevel>('senior');
  /** The round that is next, by company; a company not in here starts from its first round. */
  readonly next = signal<Readonly<Record<string, string>>>({});
  /** For a list whose rounds have no fixed order: the rounds the person marked as behind them, by company. */
  readonly behind = signal<Readonly<Record<string, readonly string[]>>>({});
  /** The person is a student or new graduate, so a company with a student list plans on it. */
  readonly student = signal(false);
  readonly open = signal(false);
  readonly query = signal('');
  readonly wheelIndex = signal(0);
  readonly hovering = signal(false);
  readonly wide = signal(false);
  readonly data = signal<CompanyPlanData | null>(null);

  private readonly plans = inject(CompanyPlanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('companySearch');
  private readonly slotButton = viewChild<ElementRef<HTMLButtonElement>>('slotButton');
  private started = false;

  readonly wheelPaused = computed(() => this.hovering() || this.open() || this.chosen() || this.step() !== 1);

  /** The companies the panel describes: the answer, or the one in the sentence until there is an answer. */
  private readonly shownSlugs = computed<readonly string[]>(() => {
    if (this.chosen()) return this.picked();
    // On a phone the card sits above the directory, so a rotating card would push the page up and down.
    return [WHEEL[this.wide() ? this.wheelIndex() : 0].slug];
  });

  private nameOf(slug: string): string {
    return this.data()?.companies[slug]?.name ?? this.directory().find((company) => company.slug === slug)?.label ?? WHEEL.find((company) => company.slug === slug)?.name ?? slug;
  }

  readonly companyLabel = computed(() => joinNames(this.picked().map((slug) => this.nameOf(slug))) || this.custom() || 'No company yet');

  readonly slotAria = computed(() => `Choose companies. Now: ${this.chosen() ? this.companyLabel() : WHEEL[this.wheelIndex()].name}`);

  /** The student or new-graduate list of a company, when its reports name one. */
  private studentsList(slug: string): CompanyPlanDataList | null {
    return this.data()?.companies[slug]?.variants.find((list) => list.students) ?? null;
  }

  /** The list a company's plan uses: its student list when the person is one and it has one, else the default. */
  private listFor(slug: string): CompanyPlanDataList | null {
    const company = this.data()?.companies[slug];
    if (!company) return null;
    return (this.student() && this.studentsList(slug)) || companyPlanDefaultList(company);
  }

  /** The picked companies whose reports name a student or new-graduate list, for the toggle under the level question. */
  readonly studentOffers = computed(() => this.picked().flatMap((slug) => (this.studentsList(slug) ? [{ slug, name: this.nameOf(slug) }] : [])));

  readonly studentOffersLine = computed(() => {
    const names = this.studentOffers().map((offer) => offer.name);
    return names.length === 1 ? `Uses the ${names[0]} student and new-graduate rounds instead.` : `Uses the student and new-graduate rounds at ${joinNames(names)}.`;
  });

  readonly steps = computed(() => {
    const whenLabel = WHEN_OPTIONS.find((option) => option.id === this.when())?.label ?? '';
    const levelLabel = (LEVEL_OPTIONS.find((option) => option.id === this.level())?.label ?? '') + (this.student() && this.studentOffers().length ? ', student' : '');
    const answers = [this.companyLabel(), whenLabel, levelLabel, this.nextLabel()];
    return ['Company', 'Interview date', 'Level', 'Next round'].map((name, index) => {
      const number = index + 1;
      const done = number < this.step();
      return {
        number,
        name,
        done,
        current: number === this.step(),
        reachable: number <= this.maxStep(),
        label: done ? answers[index] : name,
        aria: `${name}: ${done ? answers[index] : `step ${number}`}`,
      };
    });
  });

  readonly options = computed(() => {
    const data = this.data();
    const picked = this.picked();
    const all = data
      ? Object.entries(data.companies).map(([slug, company]) => ({ slug, name: company.name, signature: company.signature, aliases: company.aliases ?? [] }))
      : this.directory().map((company) => ({ slug: company.slug, name: company.label, signature: '', aliases: [] as readonly string[] }));
    return all
      .filter((company) => companyMatchesSearch(this.query(), company.name, company.aliases))
      .map((company) => ({ ...company, selected: this.chosen() && picked.includes(company.slug) }));
  });

  readonly notFound = computed(() => Boolean(this.query().trim()) && this.options().length === 0);

  readonly whenQuestion = computed(() => (this.picked().length > 1 ? 'When is your first interview?' : 'When is your interview?'));

  /**
   * The rounds of each picked company for "Which round is next?", with the one chosen as next (the first by default).
   * A list with no fixed order asks instead which rounds are behind the person; those are `behind`.
   */
  readonly roundChoices = computed(() => {
    const data = this.data();
    if (!data) return [];
    return this.picked().flatMap((slug) => {
      const company = data.companies[slug];
      const list = this.listFor(slug);
      if (!company || !list) return [];
      return [{
        slug,
        name: company.name,
        unordered: Boolean(list.unordered),
        next: this.next()[slug] ?? list.rounds[0]?.id ?? '',
        behind: this.behind()[slug] ?? [],
        rounds: list.rounds.map((round) => ({ id: round.id, name: round.name, note: round.note })),
      }];
    });
  });

  /** The keys of the rounds behind the person: the ones before the chosen next round, or the marked ones of an unordered list. */
  readonly passedRounds = computed<readonly string[]>(() => {
    return this.roundChoices().flatMap((group) => {
      const list = this.listFor(group.slug);
      if (!list) return [];
      if (group.unordered) return list.rounds.filter((round) => group.behind.includes(round.id)).map((round) => companyPlanRoundKey(group.slug, list.id, round.id));
      const at = list.rounds.findIndex((round) => round.id === group.next);
      return list.rounds.slice(0, Math.max(at, 0)).map((round) => companyPlanRoundKey(group.slug, list.id, round.id));
    });
  });

  readonly nextQuestion = computed(() => {
    const groups = this.roundChoices();
    if (groups.length === 1 && groups[0].unordered) return 'Which rounds are behind you?';
    return groups.length > 1 ? 'Which round is next at each company?' : 'Which round is next?';
  });

  /** What the fourth step's hint says: the ordered rule, the unordered rule, or both when the companies differ. */
  readonly nextHint = computed(() => {
    const groups = this.roundChoices();
    const ordered = groups.some((group) => !group.unordered);
    const unordered = groups.some((group) => group.unordered);
    const rules = [
      ordered ? 'The rounds before it count as passed, so your plan starts where you are.' : '',
      unordered ? 'Rounds with no fixed order: mark the ones behind you, and the rest stay in the plan.' : '',
    ];
    return rules.filter(Boolean).join(' ');
  });

  /** "From the Phone screen", "2 rounds behind you", "From the first round", or how many companies have started. */
  readonly nextLabel = computed(() => {
    const groups = this.roundChoices();
    const started = groups.filter((group) => (group.unordered ? group.behind.length > 0 : group.next !== group.rounds[0]?.id));
    if (groups.length > 1) return started.length ? `${started.length} of ${groups.length} past the first round` : 'From the first round';
    const group = started[0];
    if (!group) return 'From the first round';
    if (group.unordered) return `${group.behind.length} ${group.behind.length === 1 ? 'round' : 'rounds'} behind you`;
    const next = group.rounds.find((round) => round.id === group.next);
    return next ? `From the ${next.name}` : 'From the first round';
  });

  readonly cards = computed(() => {
    const data = this.data();
    if (!data) return [];
    const passed = new Set(this.passedRounds());
    return this.shownSlugs().flatMap((slug) => {
      const company = data.companies[slug];
      const list = this.listFor(slug);
      if (!company || !list) return [];
      // "With practice" counts the rounds the guide's table links a practice page on, the same rows a reader can see.
      const practice = list.rounds.filter((round) => list.tasks.some((task) => task.lead && task.rounds?.includes(round.id))).length;
      const sources = company.sourceCount ?? list.sourceCount;
      return [{
        slug,
        name: company.name,
        meta: `${list.rounds.length} reported rounds, ${practice} with practice · ${sources} public ${sources === 1 ? 'source' : 'sources'} · checked ${shortDate(company.checkedAt)}`,
        rounds: list.rounds.map((round) => ({
          id: round.id,
          name: round.name,
          practice: round.kinds.some((kind) => kind === 'coding' || kind === 'design' || kind === 'people'),
          passed: passed.has(companyPlanRoundKey(slug, list.id, round.id)),
        })),
      }];
    });
  });

  readonly generalCard = computed(() => {
    if (!this.chosen() || this.picked().length) return null;
    const custom = this.custom();
    return custom
      ? { title: custom, body: `We have not mapped ${custom} yet. Your plan starts from your date and level, and your search is counted.` }
      : { title: 'General frontend plan', body: 'Your plan starts from your date and level.' };
  });

  readonly answerLines = computed(() => {
    const lines: { label: string; text: string }[] = [];
    const frameworks = [...new Set(this.picked().flatMap((slug) => {
      const framework = this.data()?.companies[slug]?.framework;
      return framework ? [FRAMEWORK_LABELS[framework]] : [];
    }))];
    // The framework is not asked here: the plan shows where it comes from and switches it in one click.
    const chosen = this.plans.answers()?.framework;
    if (this.step() >= 2 && chosen) lines.push({ label: FRAMEWORK_LABELS[chosen], text: 'Tasks follow your framework. You can change it on the plan.' });
    else if (this.step() >= 2 && frameworks.length) {
      // "JavaScript" means the reports name no framework, so the line must not call it one.
      const named = frameworks.filter((label) => label !== 'JavaScript');
      lines.push({
        label: frameworks.join(', '),
        text: named.length ? 'Tasks follow the framework in these reports. You can change it on the plan.' : 'These reports name no framework. You can pick one on the plan.',
      });
    }
    if (this.maxStep() > 2) {
      const when = WHEN_OPTIONS.find((option) => option.id === this.when());
      if (when) lines.push({ label: when.label, text: when.sub });
    }
    if (this.step() >= 3) {
      const level = LEVEL_OPTIONS.find((option) => option.id === this.level());
      if (level) lines.push({ label: level.label, text: level.note });
      if (this.student() && this.studentOffers().length) lines.push({ label: 'Student', text: this.studentOffersLine() });
    }
    if (this.step() >= 4 && this.roundChoices().length) {
      const unordered = this.roundChoices().every((group) => group.unordered);
      lines.push({
        label: unordered ? 'Rounds behind you' : 'Next round',
        text: this.passedRounds().length
          ? `${this.nextLabel()}. ${unordered ? 'They count as passed; the rest stay in the plan.' : 'The rounds before it count as passed.'}`
          : 'From the first round. Every reported round is in the plan.',
      });
    }
    return lines;
  });

  /**
   * The plan to come back to: the account's, or one started in this browser. When the browser holds a different plan
   * than the account, it is offered through the preview, which asks before replacing the account's plan.
   */
  readonly resume = computed(() => {
    const data = this.data();
    if (!data) return null;
    const answers = this.plans.answers();
    const names = answers ? planCompanyNames(data, answers) : '';
    if (!answers || !names) return null;
    const user = this.auth.user();
    let status = this.plans.saved() ? 'saved to your account' : 'saved in this browser';
    if (hasPremium(user)) {
      const plan = this.plans.buildPlan(data, answers);
      status = `${plan.tasks.filter((task) => task.solved).length} of ${plan.tasks.length} solved`;
    }
    const draft = this.plans.draftConflict() ? this.plans.draft() : null;
    const draftNames = draft ? planCompanyNames(data, draft) : '';
    return {
      title: `Continue your ${names} plan`,
      line: `${WHEN_LABELS[answers.when]} · ${LEVEL_LABELS[answers.level]} · ${status}`,
      link: hasPremium(user) || premiumEnded(user) ? '/companies/plan' : '/companies/preview',
      draft: draft && draftNames ? { names: draftNames, params: previewQueryParams(draft) } : null,
    };
  });

  constructor() {
    afterNextRender(() => {
      const wide = window.matchMedia?.(WIDE_LAYOUT);
      this.wide.set(Boolean(wide?.matches));
      wide?.addEventListener?.('change', (event) => this.wide.set(event.matches));
      // After the first render, so a page loaded with the address still hydrates the prerendered first step.
      this.startWithCompany();
      this.plans.loadData().subscribe((data) => this.data.set(data));
    });
  }

  resumed(plan: 'saved' | 'started'): void {
    this.plans.track('company_plan_resumed', { from: 'companies', plan });
  }

  toggleOpen(): void {
    this.markStarted();
    if (this.open()) {
      this.closePicker();
      return;
    }
    this.query.set('');
    this.open.set(true);
    afterNextRender(() => this.searchInput()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Closing without a pick accepts the company the sentence was showing. */
  closePicker(returnFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    if (!this.chosen()) this.acceptWheel();
    if (returnFocus) this.slotButton()?.nativeElement.focus();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.querySelector('.plan-slot')?.contains(event.target as Node)) this.closePicker(false);
  }

  pickCompany(slug: string): void {
    this.markStarted();
    const current = this.chosen() ? this.picked() : [];
    const next = current.includes(slug)
      ? current.filter((value) => value !== slug)
      : [...current, slug].slice(-MAX_COMPANIES);
    this.picked.set(next);
    this.custom.set('');
    this.chosen.set(true);
    this.query.set('');
  }

  useCustom(): void {
    const custom = this.query().trim().slice(0, MAX_CUSTOM_LENGTH);
    if (!custom) return;
    this.plans.trackUnlistedCompany(custom);
    this.custom.set(custom);
    this.picked.set([]);
    this.chosen.set(true);
    this.query.set('');
    this.open.set(false);
  }

  continueFromCompany(): void {
    this.markStarted();
    if (!this.chosen()) this.acceptWheel();
    this.open.set(false);
    this.goTo(2);
  }

  noCompany(): void {
    this.markStarted();
    this.picked.set([]);
    this.custom.set('');
    this.chosen.set(true);
    this.open.set(false);
    this.goTo(2);
  }

  pickWhen(when: CompanyPlanWhen): void {
    this.when.set(when);
    this.goTo(3);
  }

  /** Switches the plan to the student lists; the next-round answer resets, since the other list has other rounds. */
  toggleStudent(): void {
    this.student.update((student) => !student);
    this.next.set({});
  }

  /** A company with mapped rounds gets the question "Which round is next?"; an unlisted or no company goes straight on. */
  pickLevel(level: CompanyPlanAnswerLevel): void {
    this.level.set(level);
    if (this.roundChoices().length) this.goTo(4);
    else this.finish();
  }

  /**
   * The round the person is about to face; the rounds before it are passed. With one company the answer is the last
   * click. On a list with no fixed order the click marks the round as behind them, and "See my plan" finishes.
   */
  pickNext(slug: string, roundId: string): void {
    if (this.roundChoices().find((group) => group.slug === slug)?.unordered) {
      this.behind.update((behind) => {
        const marked = behind[slug] ?? [];
        return { ...behind, [slug]: marked.includes(roundId) ? marked.filter((id) => id !== roundId) : [...marked, roundId] };
      });
      return;
    }
    this.next.update((next) => ({ ...next, [slug]: roundId }));
    if (this.roundChoices().length === 1) this.finish();
  }

  seePlan(): void {
    this.finish();
  }

  back(): void {
    const step = this.step();
    if (step > 1) this.step.set((step - 1) as 1 | 2 | 3);
  }

  goToStep(number: number): void {
    if (number <= this.maxStep()) this.step.set(number as 1 | 2 | 3 | 4);
  }

  private goTo(step: 2 | 3 | 4): void {
    this.plans.track('company_plan_step_completed', { step: step - 1 });
    this.step.set(step);
    this.maxStep.update((max) => Math.max(max, step));
  }

  /**
   * A company guide, or the home page with `from=home`, hands over a company in `?company=`: the form opens at the
   * date with it picked.
   */
  private startWithCompany(): void {
    const query = this.route.snapshot.queryParamMap;
    const slug = query.get('company')?.trim().toLowerCase();
    if (!slug || !this.directory().some((company) => company.slug === slug)) return;
    this.picked.set([slug]);
    this.chosen.set(true);
    this.started = true;
    this.plans.track('company_plan_form_started', { from: query.get('from') === 'home' ? 'home' : 'guide', companies: slug });
    this.goTo(2);
  }

  private acceptWheel(): void {
    this.picked.set([WHEEL[this.wheelIndex()].slug]);
    this.chosen.set(true);
  }

  private markStarted(): void {
    if (this.started) return;
    this.started = true;
    this.plans.track('company_plan_form_started');
  }

  private finish(): void {
    this.plans.track('company_plan_step_completed', { step: this.step() === 4 ? 4 : 3 });
    const slugs = this.picked();
    // A company planned on its student list names the list; the default list needs no name.
    const companies = slugs.map((slug) => {
      const company = this.data()?.companies[slug];
      const list = this.listFor(slug);
      return company && list && list.id !== companyPlanDefaultList(company).id ? { slug, list: list.id } : { slug };
    });
    const lists = companies.flatMap((company) => (company.list ? [`${company.slug}:${company.list}`] : [])).join(',');
    // Only a stated "next round" travels; starting from the first round states nothing, so an account keeps its own marks.
    const passedRounds = this.step() === 4 ? this.passedRounds() : [];
    // A framework chosen on an earlier plan stays: the person's stack does not change with the company.
    const framework = this.plans.answers()?.framework;
    const answers: CompanyPlanAnswers = {
      companies,
      level: this.level(),
      when: this.when(),
      ...(passedRounds.length ? { passedRounds } : {}),
      ...(framework ? { framework } : {}),
    };
    // A plan already on the account is replaced only from the preview, after the warning there.
    if (companies.length && !this.plans.saved()) this.plans.save(answers).subscribe();
    void this.router.navigate(['/companies/preview'], {
      queryParams: {
        ...(companies.length ? { companies: slugs.join(',') } : {}),
        ...(lists ? { lists } : {}),
        ...(this.custom() ? { custom: this.custom() } : {}),
        when: this.when(),
        level: this.level(),
        ...(passedRounds.length ? { passed: passedRounds.join(',') } : {}),
        ...(framework ? { framework } : {}),
      },
    });
  }
}
