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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Tech } from '../../core/models/user.model';
import { CodingDetailComponent } from '../coding/coding-detail/coding-detail.component';
import { PricingPlansSectionComponent } from '../pricing/components/pricing-plans-section/pricing-plans-section.component';
import { SystemDesignDetailComponent } from '../system-design-list/system-design-detail/system-design-detail.component';
import { TriviaDetailComponent } from '../trivia/trivia-detail/trivia-detail.component';
import { FaqSectionComponent } from '../../shared/faq-section/faq-section.component';

type DemoKey = 'ui' | 'html' | 'js' | 'react' | 'angular' | 'vue';
type TriviaTabKey = 'js-loop' | 'react-hooks' | 'angular-component' | 'vue-reactivity';
type LibraryLane = 'skills' | 'tech' | 'format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CodingDetailComponent, PricingPlansSectionComponent, FaqSectionComponent],
  selector: 'app-showcase-page',
  templateUrl: './showcase.page.html',
  styleUrls: ['./showcase.page.css'],
})

export class ShowcasePageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('observeSection', { read: ElementRef }) observeSections!: QueryList<
    ElementRef<HTMLElement>
  >;

  demoHidden = false;

  contact = {
    name: '',
    email: '',
    topic: 'general' as 'general' | 'billing' | 'bug' | 'feature',
    message: '',
  };

  contactSubmitting = false;

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
    { label: 'Real editors, not videos', tone: 'accent' },
    { label: 'UI-first problems', tone: 'muted' },
    { label: 'Frontend system design', tone: 'outline' },
    { label: 'High-signal feedback', tone: 'muted' },
  ];

  heroFlowSteps = [
    { key: 'editor', title: 'Editor', subtitle: 'Solve UI tasks with real constraints', icon: 'pi pi-code', status: 'active' },
    { key: 'tests', title: 'Tests', subtitle: 'Deterministic checks, fast iteration', icon: 'pi pi-check', status: 'idle' },
    { key: 'preview', title: 'Preview', subtitle: 'See real UI output instantly', icon: 'pi pi-eye', status: 'idle' },
    { key: 'review', title: 'Review', subtitle: 'Edge cases + review-ready signals', icon: 'pi pi-clone', status: 'idle' },
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
    { icon: 'editor', title: 'Real editors', copy: 'A full coding workspace with file trees, tabs, and split panes — not a textarea demo.' },
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

  faqItems: Array<{
    key: string;
    q: string;
    a: string;
  }> = [
      {
        key: 'what-is',
        q: 'What is FrontendAtlas?',
        a: `FrontendAtlas is a hands-on interview practice workspace. You solve UI and frontend problems in a real editor, run deterministic checks, and review results in the same flow — not just read explanations.`,
      },
      {
        key: 'who-for',
        q: 'Who is it for?',
        a: `Front-end engineers preparing for interviews (junior to senior), or anyone who wants structured practice across UI coding, JavaScript fundamentals, and front-end system design.`,
      },
      {
        key: 'how-different',
        q: 'How is this different from watching videos or reading solutions?',
        a: `You practice by doing: edit real files, see UI output, run checks, and iterate. The goal: build the muscle memory you need in real interviews (constraints, edge cases, and feedback loops).`,
      },
      {
        key: 'tech-supported',
        q: 'Which technologies are supported?',
        a: `Challenges and content are organized by tech (JavaScript/TypeScript, HTML/CSS, Angular, React, Vue) and by problem type (UI coding, trivia, and system design).`,
      },
      {
        key: 'tests',
        q: 'How do the checks work?',
        a: `Each coding question can ship with deterministic checks. You run them to validate behavior and catch edge cases early. The feedback is designed to be actionable and fast.`,
      },
      {
        key: 'persistence',
        q: 'Why does my code sometimes restore after refresh?',
        a: `Because the workspace can persist your progress locally (IndexedDB). If you want a clean slate, use the in-app reset controls instead of only clearing localStorage.`,
      },
      {
        key: 'offline',
        q: 'Can I use it with a flaky connection?',
        a: `Yes — the platform is built with a local-first mindset. Some features may still require network access, but core practice flows are designed to stay usable even when the connection isn’t perfect.`,
      },
      {
        key: 'pricing',
        q: 'What do I get on the free tier vs paid?',
        a: `Free gives you a preview of the workflow and selected content. Paid unlocks the full library and premium sets. (You can keep this answer intentionally high-level and let the pricing table do the details.)`,
      },
      {
        key: 'updates',
        q: 'Do I get new content over time?',
        a: `Yes. New questions and improvements are shipped continuously. The goal is to keep the library current with real interview patterns and modern frontend practices.`,
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
          { key: 'trivia', label: 'Trivia', count: 110 },
          { key: 'sd', label: 'System Design', count: 32 },
        ],
      },
    ];

  activeLane: LibraryLane = 'skills';
  activeOptionKey = 'a11y';

  libraryHighlights = [
    { no: 'Q-101', title: 'React Counter', desc: 'Guarded decrement + UI state.', tags: ['UI coding', 'React'], meta: { difficulty: 'Easy', minutes: 15 }, link: ['/react', 'coding', 'react-counter'] },
    { no: 'Q-142', title: 'HTML Links & Images', desc: 'Accessible anchors + alt text.', tags: ['HTML/CSS', 'Semantics'], meta: { difficulty: 'Beginner', minutes: 10 }, link: ['/html', 'coding', 'html-links-and-images'] },
    { no: 'Q-188', title: 'JS Event Loop', desc: 'Microtasks, macrotasks, render ticks.', tags: ['Trivia', 'Async'], meta: { difficulty: 'Medium', minutes: 15 }, link: ['/javascript', 'trivia', 'js-event-loop'] },
    { no: 'Q-240', title: 'Infinite Scroll List', desc: 'Cache, pagination, and perf budgets.', tags: ['System design', 'Performance'], meta: { difficulty: 'Medium', minutes: 45 }, link: ['/system-design', 'infinite-scroll-list'] },
  ];

  explanationVisible = false;

  constructor(private injector: Injector) { }

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

  submitContact() {
    // basic client-side guard (keep it simple)
    const name = this.contact.name.trim();
    const email = this.contact.email.trim();
    const message = this.contact.message.trim();
    const topic = this.contact.topic;

    if (!name || !email || !message) return;

    this.contactSubmitting = true;

    const to = 'support@frontendatlas.com'; // TODO: replace
    const subject = `[FrontendAtlas] ${topic} — ${name}`;
    const body =
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Topic: ${topic}\n\n` +
      `${message}\n`;

    const href =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    // open email client
    window.location.href = href;

    // optional: reset
    this.contact = { name: '', email: '', topic: 'general', message: '' };
    this.contactSubmitting = false;
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
}
