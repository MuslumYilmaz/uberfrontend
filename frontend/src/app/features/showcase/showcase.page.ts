import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute, RouterModule, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Tech } from '../../core/models/user.model';
import { CodingDetailComponent } from '../coding/coding-detail/coding-detail.component';
import { PricingComponent } from '../pricing/pricing.component';
import { SystemDesignDetailComponent } from '../system-design-list/system-design-detail/system-design-detail.component';
import { TriviaDetailComponent } from '../trivia/trivia-detail/trivia-detail.component';

type DemoKey = 'ui' | 'html' | 'js' | 'react' | 'angular' | 'vue';
type TriviaTabKey = 'js-loop' | 'react-hooks' | 'angular-component' | 'vue-reactivity';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, CodingDetailComponent, PricingComponent],
  selector: 'app-showcase-page',
  templateUrl: './showcase.page.html',
  styleUrls: ['./showcase.page.css'],
})

export class ShowcasePageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('observeSection', { read: ElementRef }) observeSections!: QueryList<
    ElementRef<HTMLElement>
  >;

  demoHidden = false;

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
  private flowTimer?: number;

  heroBadges = [
    { label: 'Realtime UI state', tone: 'accent' },
    { label: 'Bundler-safe snippets', tone: 'muted' },
    { label: 'Review-ready diffs', tone: 'outline' },
  ];

  heroFlowSteps = [
    { key: 'editor', title: 'Editor', subtitle: 'Framework-aware prompts + constraints', icon: 'pi pi-code', status: 'active' },
    { key: 'tests', title: 'Tests', subtitle: 'Deterministic checks (local-first)', icon: 'pi pi-check', status: 'idle' },
    { key: 'preview', title: 'Preview', subtitle: 'Real UI output in one view', icon: 'pi pi-eye', status: 'idle' },
    { key: 'review', title: 'Review', subtitle: 'Diff-ready feedback + edge cases', icon: 'pi pi-clone', status: 'idle' },
  ];

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
      questionId: 'angular-component-decorator',
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
  triviaDetailComponent = TriviaDetailComponent;
  triviaInjector!: Injector;
  systemPreviewLink: any[] = ['/system-design', 'infinite-scroll-list'];
  systemPreviewId = 'infinite-scroll-list';
  systemDesignDetailComponent = SystemDesignDetailComponent;
  systemInjector!: Injector;

  capabilities = [
    { icon: 'stack', title: 'Framework-aware questions', copy: 'Angular, React, Vue, JS, HTML/CSS: prompts and starters tailored to each tech.' },
    { icon: 'editor', title: 'Real editors', copy: 'Monaco-based editing with file trees, tabs, and split panes - not a textarea demo.' },
    { icon: 'grid', title: 'Frontend system design', copy: 'UI architecture, caching, pagination, state, performance budgets, and tradeoffs.' },
    { icon: 'cloud', title: 'Offline-first persistence', copy: 'Local-first progress plus code restore (IndexedDB). Works even when the network is flaky.' },
    { icon: 'shield', title: 'Practical testing', copy: 'Built-in deterministic tests and DOM-safe runners with clear pass/fail output.' },
    { icon: 'depth', title: 'Senior-level depth', copy: 'Edge cases, failure modes, perf constraints, accessibility, and maintainability.' },
  ];

  tracks = [
    {
      name: 'Crash Track (7 days)',
      bullets: [
        'Short deadline? Focused 7-day curriculum on the highest-signal topics.',
        'Daily checkpoints on UI, JS, and system design slices.',
        'Built for speed: compact tasks with deterministic tests.',
      ],
    },
    {
      name: 'Foundations Track (30 days)',
      bullets: [
        'Rebuild your fundamentals step by step before going deeper.',
        'Steady progression across HTML/CSS, state, data, and performance.',
        'Weekly assessments to lock in habits before advancing.',
      ],
    },
  ];

  explanationVisible = false;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    this.buildTriviaInjector();
    this.buildSystemInjector();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    if (!this.reduceMotion) {
      this.startFlowTicker();
    } else {
      this.markAllVisible();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (typeof window !== 'undefined' && this.flowTimer) window.clearInterval(this.flowTimer);
  }

  toggleExplanation() {
    this.explanationVisible = !this.explanationVisible;
  }

  setActiveTrivia(key: TriviaTabKey) {
    const tab = this.triviaTabs.find((t) => t.key === key);
    if (!tab || this.activeTriviaKey === key) return;
    this.activeTriviaKey = key;
    this.triviaPreviewId = tab.questionId;
    this.triviaPreviewTech = tab.questionTech;
    this.triviaPreviewLink = ['/', tab.questionTech, 'trivia', tab.questionId];
    this.buildTriviaInjector();
  }

  private setupObserver() {
    if (this.reduceMotion) return;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this.markAllVisible();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer?.unobserve(entry.target as Element);
          }
        });
      },
      { threshold: 0.2 },
    );

    this.observeSections?.forEach((section) => this.observer?.observe(section.nativeElement));
  }

  private markAllVisible() {
    this.observeSections?.forEach((section) => section.nativeElement.classList.add('visible'));
  }

  private startFlowTicker() {
    if (typeof window === 'undefined' || this.reduceMotion) return;
    if (this.flowTimer) window.clearInterval(this.flowTimer);
    this.flowTimer = window.setInterval(() => {
      this.activeFlowIndex = (this.activeFlowIndex + 1) % this.heroFlowSteps.length;
    }, 1600);
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

  get activeDemoKey(): DemoKey {
    return this.activePrimaryKey === 'ui' ? this.activeFrameworkKey : this.activePrimaryKey;
  }

  setActivePrimary(key: DemoKey) {
    this.activePrimaryKey = key;
    if (key !== 'ui') {
      this.activeFrameworkKey = 'react';
    }
    this.demoHidden = false;
  }

  setActiveFramework(key: DemoKey) {
    this.activeFrameworkKey = key;
    this.demoHidden = false;
  }

  get isHideableDemo() {
    return this.activeDemoKey === 'html' || this.activeDemoKey === 'js';
  }

  toggleDemoVisibility() {
    this.demoHidden = !this.demoHidden;
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
      providers: [{ provide: ActivatedRoute, useValue: routeStub }],
      parent: this.injector,
    });
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
      providers: [{ provide: ActivatedRoute, useValue: routeStub }],
      parent: this.injector,
    });
  }
}
