import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  QueryList,
  PLATFORM_ID,
  Type,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, convertToParamMap } from '@angular/router';
import { Observable, firstValueFrom, forkJoin, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { IncidentService } from '../../core/services/incident.service';
import { Tech } from '../../core/models/user.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { ExperimentService } from '../../core/services/experiment.service';
import { QuestionService, ShowcaseStatsPayload } from '../../core/services/question.service';
import { SEO_SUPPRESS_TOKEN } from '../../core/services/seo-context';
import { TradeoffBattleService } from '../../core/services/tradeoff-battle.service';
import { FaqSectionComponent } from '../../shared/faq-section/faq-section.component';
import { PricingPlansSectionComponent } from '../pricing/components/pricing-plans-section/pricing-plans-section.component';
import { PlanId } from '../../core/utils/payments-provider.util';
import { apiUrl } from '../../core/utils/api-base';
import { SHOWCASE_STATS } from '../../generated/content-metadata';
import { CompanyLogoMarkComponent } from '../../shared/components/company-logo-mark/company-logo-mark.component';
import { PrepRoadmapComponent } from '../../shared/components/prep-roadmap/prep-roadmap.component';
import { INTERVIEW_PREP_ROADMAP_ITEMS } from '../../shared/components/prep-roadmap/prep-roadmap-sequence';
import { ShowcaseIconComponent, ShowcaseIconName } from './showcase-icon.component';

type DemoKey = 'ui' | 'html' | 'js' | 'react' | 'angular' | 'vue';
type TriviaTabKey = 'js-loop' | 'react-hooks' | 'angular-component' | 'vue-reactivity';
type LibraryLane = 'skills' | 'tech' | 'format';
type ContactTopic = 'general' | 'billing' | 'bug' | 'feature';
type ContactStatus = { tone: 'success' | 'error'; text: string };
type CompanyQuestionCard = {
  name: string;
  slug: string;
  note: string;
  link: any[];
};
type ReasoningPreviewCard = {
  id: string;
  title: string;
  summary: string;
  techLabel: string;
  difficulty: string;
  estimatedMinutes: number;
  route: any[];
  signalTeasers?: string[];
  optionTeasers?: string[];
};

const SHOWCASE_STATIC_STATS = SHOWCASE_STATS as ShowcaseStatsPayload;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PricingPlansSectionComponent, FaqSectionComponent, ShowcaseIconComponent, CompanyLogoMarkComponent, PrepRoadmapComponent],
  selector: 'app-showcase-page',
  templateUrl: './showcase.page.html',
  styleUrls: ['./showcase.page.css'],
})

export class ShowcasePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly incidentService = inject(IncidentService);
  private readonly tradeoffBattleService = inject(TradeoffBattleService);
  @ViewChildren('observeSection', { read: ElementRef }) observeSections!: QueryList<
    ElementRef<HTMLElement>
  >;

  demoHidden = false;
  demoLoading = false;
  demoComponent?: Type<unknown>;
  private demoComponentPromise?: Promise<Type<unknown>>;

  paymentsEnabled = true;
  paymentsConfigReady = false;
  checkoutAvailability: Partial<Record<PlanId, boolean>> | null = null;
  private checkoutConfigRequested = false;

  contact = {
    name: '',
    email: '',
    topic: 'general' as ContactTopic,
    message: '',
  };

  contactSubmitting = false;
  contactStatus: ContactStatus | null = null;
  readonly supportEmail = 'support@frontendatlas.com';

  readonly reduceMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  demoTabsPrimary: Array<{
    key: DemoKey;
    label: string;
    caption: string;
    pill: string;
    questionId: string;
    questionTech: Tech;
    storageKey: string;
  }> = [
      {
        key: 'ui',
        label: 'User interface',
        caption: 'React counter with guarded decrement.',
        pill: 'React · UI',
        questionId: 'react-counter',
        questionTech: 'react',
        storageKey: 'showcase-demo:react-counter',
      },
      {
        key: 'html',
        label: 'HTML',
        caption: 'Link + image markup essentials.',
        pill: 'HTML · Markup',
        questionId: 'html-links-and-images',
        questionTech: 'html',
        storageKey: 'showcase-demo:html-links-and-images',
      },
      {
        key: 'js',
        label: 'JavaScript',
        caption: 'Object emptiness guard in vanilla JS.',
        pill: 'JavaScript · Logic',
        questionId: 'js-is-object-empty',
        questionTech: 'javascript',
        storageKey: 'showcase-demo:js-is-object-empty',
      },
    ];

  demoTabsFramework: Array<{
    key: DemoKey;
    label: string;
    caption: string;
    pill: string;
    questionId: string;
    questionTech: Tech;
    storageKey: string;
  }> = [
      {
        key: 'react',
        label: 'React',
        caption: 'Counter challenge in React.',
        pill: 'React · UI',
        questionId: 'react-counter',
        questionTech: 'react',
        storageKey: 'showcase-demo:react-counter',
      },
      {
        key: 'angular',
        label: 'Angular',
        caption: 'Counter challenge in Angular.',
        pill: 'Angular · UI',
        questionId: 'angular-counter-starter',
        questionTech: 'angular',
        storageKey: 'showcase-demo:angular-counter-starter',
      },
      {
        key: 'vue',
        label: 'Vue',
        caption: 'Counter challenge in Vue.',
        pill: 'Vue · UI',
        questionId: 'vue-counter',
        questionTech: 'vue',
        storageKey: 'showcase-demo:vue-counter',
      },
    ];

  activePrimaryKey: DemoKey = 'ui';
  activeFrameworkKey: DemoKey = 'react';

  private observer?: IntersectionObserver;

  heroHeadline = 'Practice frontend interviews in a real coding workflow';
  heroLede = 'FrontendAtlas turns prep into repeatable loops: solve real prompts, run deterministic checks, inspect live UI behavior, and explain tradeoffs like a senior engineer.';
  heroPrimaryCtaLabel = 'Start with the guide';
  private heroExperimentVariant: 'control' | 'outcome' = 'control';

  heroFlowSteps = [
    { key: 'editor', title: 'Editor', subtitle: 'Code in a real IDE with files, tabs, and split panes', icon: 'editor' as ShowcaseIconName, status: 'active' },
    { key: 'tests', title: 'Checks', subtitle: 'Run deterministic tests and fix exact failures fast', icon: 'checks' as ShowcaseIconName, status: 'idle' },
    { key: 'preview', title: 'Preview', subtitle: 'Validate real UI output and interaction behavior instantly', icon: 'preview' as ShowcaseIconName, status: 'idle' },
    { key: 'review', title: 'Review', subtitle: 'Strengthen edge cases, tradeoffs, and interview explanations', icon: 'review' as ShowcaseIconName, status: 'idle' },
  ];

  readonly homepagePrepRoadmapItems = INTERVIEW_PREP_ROADMAP_ITEMS;

  activeFlowIndex = 0;
  triviaTabs: Array<{
    key: TriviaTabKey;
    label: string;
    caption: string;
    questionId: string;
    questionTech: Tech;
  }> = [
      {
        key: 'js-loop',
        label: 'JS · Event loop',
        caption: 'Microtasks, macrotasks, and render ticks.',
        questionId: 'js-event-loop',
        questionTech: 'javascript',
      },
      {
        key: 'react-hooks',
        label: 'React · Hooks',
        caption: 'State with useState and render cycles.',
        questionId: 'react-usestate-purpose',
        questionTech: 'react',
      },
      {
        key: 'angular-component',
        label: 'Angular · Components',
        caption: '@Component decorator and metadata.',
        questionId: 'angular-component-metadata',
        questionTech: 'angular',
      },
      {
        key: 'vue-reactivity',
        label: 'Vue · Reactivity',
        caption: 'How Vue tracks and updates state.',
        questionId: 'vue-reactivity-system',
        questionTech: 'vue',
      },
    ];

  activeTriviaKey: TriviaTabKey = 'js-loop';
  triviaPreviewLink: any[] = ['/javascript', 'trivia', 'js-event-loop'];
  triviaPreviewId = 'js-event-loop';
  triviaPreviewTech: Tech = 'javascript';
  triviaDetailComponent?: Type<unknown>;
  triviaInjector!: Injector;
  systemPreviewLink: any[] = ['/system-design', 'infinite-scroll-list'];
  systemPreviewId = 'infinite-scroll-list';
  systemDesignDetailComponent?: Type<unknown>;
  systemInjector!: Injector;

  capabilities: Array<{ icon: ShowcaseIconName; title: string; copy: string }> = [
    { icon: 'stack', title: 'Framework-aware questions', copy: 'Angular, React, Vue, JS, HTML/CSS: prompts and starters tailored to each tech.' },
    { icon: 'editor', title: 'Real editors', copy: 'A full coding workspace with file trees, tabs, and split panes - not a textarea demo.' },
    { icon: 'grid', title: 'Frontend system design', copy: 'UI architecture, caching, pagination, state, performance budgets, and tradeoffs.' },
    { icon: 'cloud', title: 'Offline-first persistence', copy: 'Local-first progress plus code restore (IndexedDB). Works even when the network is flaky.' },
    { icon: 'shield', title: 'Practical testing', copy: 'Built-in deterministic tests and DOM-safe runners with clear pass/fail output.' },
    { icon: 'depth', title: 'Senior-level depth', copy: 'Edge cases, failure modes, perf constraints, accessibility, and maintainability.' },
  ];

  tracks = [
    {
      name: 'Crash Track (7 days)',
      bullets: [
        '30 high-yield questions for a focused 7-day sprint.',
        'JS async/core + UI data flows + 2 must-know system design prompts.',
        'Repeat-friendly sequencing built for short interview timelines.',
      ],
    },
    {
      name: 'Foundations Track (30 days)',
      bullets: [
        '113-question progression from fundamentals to medium-level concepts.',
        'Framework coding drills in React/Angular/Vue with framework-agnostic concept questions.',
        'Includes 5 frontend system design scenarios for architecture tradeoffs.',
      ],
    },
  ];

  faqGroups = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        {
          id: 'what-is-frontendatlas',
          q: 'What is FrontendAtlas?',
          a: `FrontendAtlas is built to make you <strong>interview-ready faster</strong> by turning prep into <strong>repeatable practice loops</strong>.<br><br>
What you do here:<br>
- Solve realistic coding tasks with starter code + fast feedback (preview/tests)<br>
- Learn core concepts in a way you can actually explain in interviews<br>
- Practice front-end system design by making tradeoffs, not memorizing buzzwords<br><br>
If you want “less reading, more doing” — this is the workflow.`,
        },
        {
          id: 'install-anything',
          q: 'Do I need to install anything, or is it all in the browser?',
          a: `It’s all in the browser — <strong>no setup tax</strong>.<br><br>
Open the app → pick a task → code immediately.<br>
No local project, no dependency hell, no “works on my machine”.<br><br>
Desktop/laptop is recommended so you can use the editor/preview layout efficiently.`,
        },
        {
          id: 'supported-browsers-devices',
          q: 'Which browsers/devices are supported?',
          a: `Best experience on modern desktop browsers:<br>
- Chrome / Edge (top pick for speed + compatibility)<br>
- Safari<br>
- Firefox<br><br>
Mobile/tablet works for reading and browsing, but serious practice is designed for desktop (editor + preview + checks).`,
        },
      ],
    },
    {
      id: 'content-learning',
      title: 'Content & Learning',
      items: [
        {
          id: 'exercise-types',
          q: 'What kinds of exercises are included (coding tasks vs concepts)?',
          a: `You’ll practice the three things interviews actually test:<br><br>
<strong>1) Coding tasks</strong><br>
Build/modify real UI and logic with starter code, then validate with preview/tests.<br><br>
<strong>2) Concept questions</strong><br>
Short prompts that force clean mental models (the kind you can explain under pressure).<br><br>
<strong>3) Front-end system design</strong><br>
Architecture prompts focused on constraints + tradeoffs (how seniors think).`,
        },
        {
          id: 'tech-coverage',
          q: 'Which technologies are covered (JS/TS, HTML/CSS, React/Angular/Vue)?',
          a: `Coverage is designed to match real job requirements:<br>
- JavaScript / TypeScript fundamentals (async, closures, DOM, performance, etc.)<br>
- HTML / CSS (layout, responsive UI, practical accessibility basics)<br>
- React / Angular / Vue (component patterns, state, rendering, performance)<br>
- Front-End System Design track (architecture and tradeoffs)<br><br>
So you can prep for “framework interview” <em>and</em> “real-world frontend” at the same time.`,
        },
        {
          id: 'difficulty-and-tags',
          q: 'How are difficulty levels and tags organized?',
          a: `Everything is structured to reduce decision fatigue and keep you consistent.<br><br>
You can filter/sort by:<br>
- Technology (JS/TS, HTML/CSS, React, Angular, Vue, System Design)<br>
- Difficulty (ramp up without getting stuck or bored)<br>
- Tags (the exact skill being tested: event delegation, memoization, layout, state, etc.)<br><br>
This makes it easy to build a weekly plan: pick a focus → grind a tight set → level up.`,
        },
        {
          id: 'solutions-and-explanations',
          q: 'Do exercises include solutions and explanations?',
          a: `Yes — many tasks include solutions and detailed explanations, and more are added over time.<br><br>
When available, solutions focus on what matters in interviews:<br>
- a clean baseline implementation<br>
- edge cases + common mistakes<br>
- tradeoffs between approaches (when it’s not just “one right answer”)<br><br>
Some prompts are intentionally open-ended to mirror real interview discussion.`,
        },
      ],
    },
    {
      id: 'coding-experience',
      title: 'Coding Experience',
      items: [
        {
          id: 'live-preview',
          q: 'Do tasks have a live preview (rendered output) while I code?',
          a: `Yes — many tasks have live preview so you can iterate fast and see what you’re building immediately.<br><br>
This is ideal for HTML/CSS and UI work where “correct” is visual.<br><br>
If preview isn’t the right signal (pure logic), the task uses checks/tests instead — so you still get clear pass/fail feedback.`,
        },
        {
          id: 'run-tests',
          q: 'Can I run tests / validate my solution inside the app?',
          a: `Yes — tasks that can be validated deterministically include checks/tests (common for JS/TS).<br><br>
This helps you practice like a professional workflow:<br>
write → run checks → fix edge cases → ship.<br><br>
HTML/CSS tasks typically rely on live preview first, because visuals are the primary correctness signal.`,
        },
        {
          id: 'save-progress',
          q: 'Does FrontendAtlas save my code and progress between sessions?',
          a: `Yes — your work is saved locally in the browser so you don’t lose progress mid-practice.<br><br>
Why this matters:<br>
- You can do short sessions (even 15–30 min) and continue later<br>
- Your drafts stay private on your device by default<br><br>
You can also reset any task back to the starter whenever you want to re-practice from scratch.`,
        },
      ],
    },
  ];


  libraryLanes: Array<{
    key: LibraryLane;
    label: string;
    hint: string;
    options: Array<{ key: string; label: string; count: number }>;
  }> = [
      {
        key: 'skills',
        label: 'Skills',
        hint: 'What you’re training',
        options: [
          { key: 'a11y', label: 'Accessibility', count: 18 },
          { key: 'async', label: 'Async', count: 22 },
          { key: 'performance', label: 'Performance', count: 14 },
          { key: 'forms', label: 'Forms', count: 16 },
        ],
      },
      {
        key: 'tech',
        label: 'Tech',
        hint: 'Where you practice',
        options: [
          { key: 'js', label: 'JavaScript', count: 64 },
          { key: 'ts', label: 'TypeScript', count: 40 },
          { key: 'react', label: 'React', count: 52 },
          { key: 'angular', label: 'Angular', count: 46 },
          { key: 'vue', label: 'Vue', count: 28 },
          { key: 'htmlcss', label: 'HTML/CSS', count: 38 },
        ],
      },
      {
        key: 'format',
        label: 'Format',
        hint: 'How it’s evaluated',
        options: [
          { key: 'ui', label: 'UI Coding', count: 90 },
          { key: 'trivia', label: 'Concepts', count: 110 },
          { key: 'sd', label: 'System Design', count: 32 },
        ],
      },
    ];

  activeLane: LibraryLane = 'skills';
  activeOptionKey = 'a11y';

  libraryHighlights = [
    { no: 'Q-101', title: 'React Counter', desc: 'Guarded decrement + UI state.', tags: ['UI coding', 'React'], meta: { difficulty: 'Easy', minutes: 15 }, link: ['/react', 'coding', 'react-counter'] },
    { no: 'Q-142', title: 'HTML Links & Images', desc: 'Accessible anchors + alt text.', tags: ['HTML/CSS', 'Semantics'], meta: { difficulty: 'Beginner', minutes: 10 }, link: ['/html', 'coding', 'html-links-and-images'] },
    { no: 'Q-188', title: 'JS Event Loop', desc: 'Microtasks, macrotasks, render ticks.', tags: ['Concepts', 'Async'], meta: { difficulty: 'Medium', minutes: 15 }, link: ['/javascript', 'trivia', 'js-event-loop'] },
    { no: 'Q-240', title: 'Infinite Scroll List', desc: 'Cache, pagination, and perf budgets.', tags: ['System design', 'Performance'], meta: { difficulty: 'Medium', minutes: 45 }, link: ['/system-design', 'infinite-scroll-list'] },
  ];

  companyQuestions: CompanyQuestionCard[] = [
    { name: 'Google', slug: 'google', note: 'UI, JS, systems', link: ['/companies', 'google', 'preview'] },
    { name: 'Amazon', slug: 'amazon', note: 'Scaling lists, auth, UX', link: ['/companies', 'amazon', 'preview'] },
    { name: 'Netflix', slug: 'netflix', note: 'UI architecture, state', link: ['/companies', 'netflix', 'preview'] },
    { name: 'Apple', slug: 'apple', note: 'UI polish, accessibility', link: ['/companies', 'apple', 'preview'] },
  ];

  companyCounts: ShowcaseStatsPayload['companyCounts'] = SHOWCASE_STATIC_STATS.companyCounts || {};
  heroQuestionCount = SHOWCASE_STATIC_STATS.totalQuestions || 0;
  reasoningCounts = {
    incidents: 0,
    tradeoffBattles: 0,
  };
  incidentPreview: ReasoningPreviewCard = {
    id: 'stale-search-race',
    title: 'Latest query loses to stale search results',
    summary: 'Cached results and slower network results both update the same list, so an older query can briefly show up again.',
    techLabel: 'JavaScript',
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    route: ['/incidents', 'stale-search-race'],
    signalTeasers: [
      'Older results flash back in',
      'Cache and network both write into one list',
      'Debounce reduced traffic, not the stale update',
    ],
  };
  tradeoffPreview: ReasoningPreviewCard = {
    id: 'context-vs-zustand-vs-redux',
    title: 'Context vs Zustand vs Redux for a growing React dashboard',
    summary: 'Pick the state layer you would defend once shared filters, optimistic updates, and multiple teams all touch the same surface.',
    techLabel: 'React',
    difficulty: 'intermediate',
    estimatedMinutes: 14,
    route: ['/tradeoffs', 'context-vs-zustand-vs-redux'],
    optionTeasers: ['Context + useReducer', 'Zustand', 'Redux Toolkit'],
  };

  explanationVisible = false;
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly MOBILE_DEMO_GUARD_BREAKPOINT = 768;
  showMobileCodingGuard = false;
  sectionVisible = {
    reasoning: false,
    library: false,
    company: false,
    capabilities: false,
    tracks: false,
    faq: false,
    contact: false,
  };

  private readonly LP_SRC_PATTERN = /^[a-z0-9_-]{1,64}$/;
  private reasoningPreviewLoaded = false;

  constructor(
    private injector: Injector,
    private qs: QuestionService,
    private analytics: AnalyticsService,
    private billingCheckout: BillingCheckoutService,
    private experiments: ExperimentService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.heroExperimentVariant = this.experiments.variant('hero_headline_cta_v1', 'showcase');
    this.experiments.expose(
      'hero_headline_cta_v1',
      this.heroExperimentVariant,
      'showcase_hero',
      'showcase',
    );
    this.applyHeroExperimentCopy();
    this.refreshShowcaseStats();

    this.analytics.track('lp_viewed', {
      src: this.readLandingSource(),
      page: 'showcase',
      hero_variant: this.heroExperimentVariant,
    });
    if (this.isBrowser) {
      this.syncViewportState();
      window.addEventListener('resize', this.onViewportResize, { passive: true });
    }
    this.buildTriviaInjector();
    this.buildSystemInjector();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupObserver();
    } else {
      this.markAllVisible();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onViewportResize);
    }
  }

  private async loadCheckoutConfig(): Promise<void> {
    if (this.checkoutConfigRequested) {
      return;
    }
    this.checkoutConfigRequested = true;
    const config = await this.billingCheckout.getCheckoutConfig();
    this.paymentsEnabled = config?.enabled ?? false;
    this.checkoutAvailability = config?.plans ?? null;
    this.paymentsConfigReady = true;
  }

  toggleExplanation() {
    this.explanationVisible = !this.explanationVisible;
  }

  activateDemo() {
    if (!this.isBrowser) return;
    if (this.demoComponent || this.demoLoading) {
      this.demoHidden = false;
      return;
    }
    this.demoLoading = true;
    const loader =
      this.demoComponentPromise ||
      import('../coding/coding-detail/coding-detail.component').then((m) => m.CodingDetailComponent);
    this.demoComponentPromise = loader;
    loader
      .then((cmp) => {
        this.demoComponent = cmp;
      })
      .finally(() => {
        this.demoLoading = false;
      });
  }

  setActiveTrivia(key: TriviaTabKey) {
    const tab = this.triviaTabs.find((t) => t.key === key);
    if (!tab || this.activeTriviaKey === key) return;
    this.activeTriviaKey = key;
    this.triviaPreviewId = tab.questionId;
    this.triviaPreviewTech = tab.questionTech;
    this.triviaPreviewLink = ['/', tab.questionTech, 'trivia', tab.questionId];
    this.buildTriviaInjector();
    this.loadTriviaPreview();
  }

  private setupObserver() {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this.markAllVisible();
      return;
    }
    if (!this.observeSections?.length) {
      this.markAllVisible();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleDeferredSection(entry.target as HTMLElement);
            entry.target.classList.add('visible');
            this.observer?.unobserve(entry.target as Element);
          }
        });
      },
      { threshold: 0.15, rootMargin: '140px 0px' },
    );

    this.observeSections?.forEach((section) => this.observer?.observe(section.nativeElement));
  }

  private markAllVisible() {
    this.observeSections?.forEach((section) => section.nativeElement.classList.add('visible'));
    this.activateDemo();
    this.loadTriviaPreview();
    this.loadSystemPreview();
    this.loadReasoningPreview();
    void this.loadCheckoutConfig();
    (Object.keys(this.sectionVisible) as Array<keyof typeof this.sectionVisible>)
      .forEach((key) => { this.sectionVisible[key] = true; });
  }

  private handleDeferredSection(el: HTMLElement) {
    const key = el.dataset['load'];
    if (!key) return;
    if (key === 'demo') {
      this.activateDemo();
      return;
    }
    if (key === 'stats') {
      return;
    }
    if (key === 'trivia') {
      this.loadTriviaPreview();
      return;
    }
    if (key === 'system') {
      this.loadSystemPreview();
      return;
    }
    if (key === 'reasoning') {
      this.sectionVisible.reasoning = true;
      this.loadReasoningPreview();
      return;
    }
    if (key === 'company') {
      this.sectionVisible.company = true;
      return;
    }
    if (key === 'library') {
      this.sectionVisible.library = true;
      return;
    }
    if (key === 'capabilities') {
      this.sectionVisible.capabilities = true;
      return;
    }
    if (key === 'tracks') {
      this.sectionVisible.tracks = true;
      return;
    }
    if (key === 'faq') {
      this.sectionVisible.faq = true;
      return;
    }
    if (key === 'pricing') {
      void this.loadCheckoutConfig();
      return;
    }
    if (key === 'contact') {
      this.sectionVisible.contact = true;
    }
  }

  private onViewportResize = () => {
    this.syncViewportState();
  };

  private syncViewportState() {
    if (!this.isBrowser) return;
    this.showMobileCodingGuard = window.innerWidth < this.MOBILE_DEMO_GUARD_BREAKPOINT;
  }

  get activeDemo() {
    const all = this.allDemoTabs;
    return all.find((tab) => tab.key === this.activeDemoKey) ?? all[0];
  }

  get activeTriviaTab() {
    return this.triviaTabs.find((tab) => tab.key === this.activeTriviaKey) ?? this.triviaTabs[0];
  }

  get allDemoTabs() {
    return [...this.demoTabsPrimary, ...this.demoTabsFramework];
  }

  get demoChoiceTabs() {
    const tabs = [
      ...this.demoTabsFramework,
      ...this.demoTabsPrimary.filter((tab) => tab.key !== 'ui'),
    ];
    return tabs.filter((tab) => tab.key !== this.activeDemoKey);
  }

  get activeDemoKey(): DemoKey {
    return this.activePrimaryKey === 'ui' ? this.activeFrameworkKey : this.activePrimaryKey;
  }

  setActivePrimary(key: DemoKey) {
    this.activePrimaryKey = key;
    if (key !== 'ui') {
      this.activeFrameworkKey = 'react';
    }
    this.demoHidden = false;
    this.activateDemo();
  }

  setActiveFramework(key: DemoKey) {
    this.activeFrameworkKey = key;
    this.demoHidden = false;
    this.activateDemo();
  }

  selectDemoChoice(key: DemoKey) {
    if (key === 'react' || key === 'angular' || key === 'vue') {
      this.activePrimaryKey = 'ui';
      this.activeFrameworkKey = key;
    } else {
      this.activePrimaryKey = key;
      this.activeFrameworkKey = 'react';
    }
    this.demoHidden = false;
    this.activateDemo();
  }

  get isHideableDemo() {
    return !!this.demoComponent && (this.activeDemoKey === 'html' || this.activeDemoKey === 'js');
  }

  toggleDemoVisibility() {
    this.demoHidden = !this.demoHidden;
    if (!this.demoHidden) {
      this.activateDemo();
    }
  }

  onHeroPrimaryClick() {
    this.analytics.track('lp_primary_cta_clicked', {
      src: 'lp_hero',
      destination: 'interview_blueprint',
      route: '/guides/interview-blueprint/intro',
      start_path_variant: 'guide_first',
      hero_variant: this.heroExperimentVariant,
    });
  }

  onHeroSecondaryClick() {
    this.analytics.track('lp_secondary_cta_clicked', {
      src: 'lp_hero',
      destination: 'essential_60',
      route: '/interview-questions/essential',
      start_path_variant: 'guide_first',
      hero_variant: this.heroExperimentVariant,
    });
  }

  get demoInputs() {
    const tab = this.activeDemo;
    return {
      questionId: tab.questionId,
      questionTech: tab.questionTech,
      demoMode: true,
      liteMode: true,
      storageKeyOverride: tab.storageKey,
      hideRestoreBanner: true,
      hideFooterBar: true,
      footerLinkTo: ['/', tab.questionTech, 'coding', tab.questionId],
      footerLinkLabel: 'Open this challenge fully',
      disablePersistence: true,
    };
  }

  private buildTriviaInjector() {
    const parentStub: Partial<ActivatedRoute> = {
      paramMap: of(convertToParamMap({ tech: this.triviaPreviewTech })),
      snapshot: {
        paramMap: convertToParamMap({ tech: this.triviaPreviewTech }),
        queryParamMap: convertToParamMap({}),
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null as any,
        routeConfig: null,
        root: null as any,
        parent: null as any,
        firstChild: null as any,
        children: [],
        pathFromRoot: [] as any,
        toString: () => '/',
      } as any,
    };

    const routeStub: Partial<ActivatedRoute> = {
      parent: parentStub as ActivatedRoute,
      paramMap: of(convertToParamMap({ id: this.triviaPreviewId })),
      snapshot: {
        paramMap: convertToParamMap({ id: this.triviaPreviewId }),
        queryParamMap: convertToParamMap({}),
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null as any,
        routeConfig: null,
        root: null as any,
        parent: parentStub as any,
        firstChild: null as any,
        children: [],
        pathFromRoot: [] as any,
        toString: () => '/',
      } as any,
      data: of({}),
      queryParamMap: of(convertToParamMap({})),
      fragment: of(null),
    };

    this.triviaInjector = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: SEO_SUPPRESS_TOKEN, useValue: true },
      ],
      parent: this.injector,
    });
  }

  private readLandingSource(): string {
    const raw = String(this.route.snapshot.queryParamMap.get('src') || '')
      .trim()
      .toLowerCase();
    if (!raw || !this.LP_SRC_PATTERN.test(raw)) return 'direct';
    return raw;
  }

  private applyHeroExperimentCopy() {
    this.heroPrimaryCtaLabel = 'Start with the guide';
  }

  private buildSystemInjector() {
    const routeStub: Partial<ActivatedRoute> = {
      paramMap: of(convertToParamMap({ id: this.systemPreviewId })),
      snapshot: {
        paramMap: convertToParamMap({ id: this.systemPreviewId }),
        queryParamMap: convertToParamMap({}),
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null as any,
        routeConfig: null,
        root: null as any,
        parent: null as any,
        firstChild: null as any,
        children: [],
        pathFromRoot: [] as any,
        toString: () => '/',
      } as any,
      data: of({}),
      queryParamMap: of(convertToParamMap({})),
      fragment: of(null),
    };

    this.systemInjector = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: SEO_SUPPRESS_TOKEN, useValue: true },
      ],
      parent: this.injector,
    });
  }

  async submitContact(): Promise<void> {
    const name = this.contact.name.trim();
    const email = this.contact.email.trim();
    const message = this.contact.message.trim();
    const topic = this.contact.topic;

    if (!name || !email || !message) return;

    this.contactSubmitting = true;
    this.contactStatus = null;

    try {
      await firstValueFrom(this.http.post(apiUrl('/contact'), {
        name,
        email,
        topic,
        message,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }, { responseType: 'text' }));

      this.contact = { name: '', email: '', topic: 'general', message: '' };
      this.contactStatus = {
        tone: 'success',
        text: 'Message sent. We will reply to the email address you provided.',
      };
    } catch (err) {
      this.contactStatus = {
        tone: 'error',
        text: this.mapContactError(err),
      };
    } finally {
      this.contactSubmitting = false;
    }
  }

  private mapContactError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const apiMessage =
        typeof err.error === 'string'
          ? err.error
          : (typeof err.error?.error === 'string' ? err.error.error : '');
      if (apiMessage) return apiMessage;
      if (err.status === 429) {
        return `Too many messages right now. Please wait a bit or email ${this.supportEmail} directly.`;
      }
    }
    return `We could not send your message right now. Please email ${this.supportEmail} directly.`;
  }

  setActiveLane(lane: LibraryLane) {
    this.activeLane = lane;
    // pick first option by default
    this.activeOptionKey = this.libraryLanes.find(x => x.key === lane)?.options[0]?.key ?? '';
  }

  setActiveOption(key: string) {
    this.activeOptionKey = key;
  }

  get activeLaneModel() {
    return this.libraryLanes.find(l => l.key === this.activeLane);
  }

  get activeOptions() {
    return this.activeLaneModel ? this.activeLaneModel.options : [];
  }

  private loadTriviaPreview() {
    if (!this.isBrowser || this.triviaDetailComponent) return;
    import('../trivia/trivia-detail/trivia-detail.component').then((m) => {
      this.triviaDetailComponent = m.TriviaDetailComponent;
    });
  }

  private loadSystemPreview() {
    if (!this.isBrowser || this.systemDesignDetailComponent) return;
    import('../system-design-list/system-design-detail/system-design-detail.component').then((m) => {
      this.systemDesignDetailComponent = m.SystemDesignDetailComponent;
    });
  }

  private loadReasoningPreview() {
    if (!this.isBrowser || this.reasoningPreviewLoaded) return;
    this.reasoningPreviewLoaded = true;

    firstValueFrom(
      forkJoin({
        incidents: this.incidentService.loadIncidentIndex({ transferState: false }),
        tradeoffBattles: this.tradeoffBattleService.loadIndex({ transferState: false }),
      }),
    )
      .then(({ incidents, tradeoffBattles }) => {
        this.reasoningCounts = {
          incidents: incidents.length,
          tradeoffBattles: tradeoffBattles.length,
        };

        const incident = incidents.find((item) => item.id === this.incidentPreview.id) ?? incidents[0] ?? null;
        if (incident) {
          this.incidentPreview = {
            ...this.incidentPreview,
            id: incident.id,
            title: incident.title,
            summary: incident.summary,
            techLabel: this.formatTechLabel(incident.tech),
            difficulty: incident.difficulty,
            estimatedMinutes: incident.estimatedMinutes,
            route: ['/incidents', incident.id],
            signalTeasers: incident.signals.slice(0, 3),
          };
        }

        const battle = tradeoffBattles.find((item) => item.id === this.tradeoffPreview.id) ?? tradeoffBattles[0] ?? null;
        if (!battle) return;

        this.tradeoffPreview = {
          ...this.tradeoffPreview,
          id: battle.id,
          title: battle.title,
          summary: battle.summary,
          techLabel: this.formatTechLabel(battle.tech as Tech | 'system-design'),
          difficulty: battle.difficulty,
          estimatedMinutes: battle.estimatedMinutes,
          route: ['/tradeoffs', battle.id],
        };

        this.tradeoffBattleService
          .loadScenario(battle.id, { transferState: false })
          .pipe(take(1))
          .subscribe((scenario) => {
            if (!scenario?.options?.length) return;
            this.tradeoffPreview = {
              ...this.tradeoffPreview,
              optionTeasers: scenario.options.slice(0, 3).map((option) => option.label),
            };
          });
      })
      .catch(() => {
        // Keep curated fallback previews when live data is unavailable.
      });
  }

  private formatTechLabel(value: Tech | 'system-design'): string {
    switch (value) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'system-design':
        return 'System design';
      default:
        return 'Frontend';
    }
  }

  private refreshShowcaseStats() {
    if (!this.isBrowser) return;
    this.qs.loadShowcaseStats({ transferState: false }).pipe(take(1)).subscribe((stats) => {
      if (stats.totalQuestions > 0) {
        this.heroQuestionCount = stats.totalQuestions;
      }
      if (Object.keys(stats.companyCounts || {}).length > 0) {
        this.companyCounts = stats.companyCounts;
      }
    });
  }
}
