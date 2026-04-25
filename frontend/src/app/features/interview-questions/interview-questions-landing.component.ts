import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { InterviewQuestionsHubResolved } from '../../core/resolvers/interview-questions.resolver';
import { AnalyticsService } from '../../core/services/analytics.service';
import { QuestionListItem, QuestionService } from '../../core/services/question.service';
import { SeoService, type SeoMeta } from '../../core/services/seo.service';
import { Tech } from '../../core/models/user.model';
import { PrepRoadmapComponent, type PrepRoadmapItem } from '../../shared/components/prep-roadmap/prep-roadmap.component';

type InterviewQuestionsLandingConfig = {
  keyword: string;
  title: string;
  techs: Tech[];
  isMasterHub: boolean;
  featuredLinks: HubLink[];
};

type Kind = 'coding' | 'trivia';
type PrepPriority = 'must_know' | 'high_leverage' | 'core_reinforcement';
type HubLink = { label: string; route: any[]; path: string };

type QuestionSummaryRow = {
  id: string;
  title: string;
  tech: Tech;
  kind: Kind;
  difficulty: string;
  importance: number;
  priority: PrepPriority;
  description: string;
  link: any[];
};

type RawQuestionSummaryRow = QuestionListItem & { tech: Tech };
type SchemaQuestionLink = { title: string; path: string };
type PrepPlanLink = { label: string; route: any[]; summary: string };
type HubConceptLink = { label: string; route: any[]; ariaLabel: string };
type HubIntentProfile = {
  heading: string;
  lead: string;
  tests: string[];
  usage: string[];
  credibility: string;
  relatedPrep: PrepPlanLink;
};
const DEFAULT_CONFIG: InterviewQuestionsLandingConfig = {
  keyword: 'javascript interview questions',
  title: 'JavaScript Interview Questions',
  techs: ['javascript'],
  isMasterHub: false,
  featuredLinks: [],
};

const INTERVIEW_HUB_LINKS: HubLink[] = [
  {
    label: 'Frontend interview questions',
    route: ['/interview-questions'],
    path: '/interview-questions',
  },
  {
    label: 'JavaScript interview questions',
    route: ['/javascript/interview-questions'],
    path: '/javascript/interview-questions',
  },
  {
    label: 'React interview questions',
    route: ['/react/interview-questions'],
    path: '/react/interview-questions',
  },
  {
    label: 'Angular interview questions',
    route: ['/angular/interview-questions'],
    path: '/angular/interview-questions',
  },
  {
    label: 'Vue interview questions',
    route: ['/vue/interview-questions'],
    path: '/vue/interview-questions',
  },
  {
    label: 'HTML interview questions',
    route: ['/html/interview-questions'],
    path: '/html/interview-questions',
  },
  {
    label: 'CSS interview questions',
    route: ['/css/interview-questions'],
    path: '/css/interview-questions',
  },
  {
    label: 'HTML CSS interview questions',
    route: ['/html-css/interview-questions'],
    path: '/html-css/interview-questions',
  },
];

const PREP_PLAN_LINKS: PrepPlanLink[] = [
  {
    label: 'JavaScript mastery crash track',
    route: ['/tracks', 'javascript-prep-path', 'mastery'],
    summary: 'Deep JavaScript path with checkpoints, output prediction, and coding drills.',
  },
  {
    label: 'Crash Track (7 days)',
    route: ['/tracks', 'crash-7d', 'preview'],
    summary: 'High-yield 7-day sprint for short interview timelines.',
  },
  {
    label: 'Foundations Track (30 days)',
    route: ['/tracks', 'foundations-30d', 'preview'],
    summary: '30-day study plan for fundamentals, framework practice, and architecture coverage.',
  },
];

const HUB_INTENT_PROFILES: Record<string, HubIntentProfile> = {
  master: {
    heading: 'What frontend interview rounds test',
    lead: 'Use this hub to build a compact prep loop across implementation, concept recall, and system-design reasoning before you branch into deeper paths.',
    tests: [
      'Whether you can implement small UI and JavaScript prompts under time pressure.',
      'Whether your explanations connect browser, framework, and state-management behavior.',
      'Whether you can choose the next practice surface without turning prep into random browsing.',
    ],
    usage: [
      'Start with the preparation guide so you know which rounds you are optimizing for.',
      'Use Essential 60 as the first compact practice route after the format is clear.',
      'Move into a framework prep path after repeated misses show a clear weak area.',
    ],
    credibility: 'Questions are curated from FrontendAtlas metadata, editorial review checks, and shipped practice routes rather than scraped generic lists.',
    relatedPrep: {
      label: 'Frontend interview preparation guide',
      route: ['/guides', 'interview-blueprint', 'intro'],
      summary: 'A route-level guide for interview stages, scoring signals, and how to sequence practice.',
    },
  },
  javascript: {
    heading: 'What JavaScript interview rounds test',
    lead: 'JavaScript interviews usually test execution order, data transformation, async safety, and whether you can explain trade-offs while coding.',
    tests: [
      'Async behavior, closures, prototypes, arrays, maps, and utility implementation details.',
      'Debugging stale state, race conditions, equality, coercion, and edge cases.',
      'Clear narration: what you chose, what can break, and how you would test it.',
    ],
    usage: [
      'Start with one coding prompt, then answer one concept question out loud.',
      'Use the prep path when misses repeat around async, closures, or utility design.',
      'Return to this hub to pick the next small rep instead of browsing the full library.',
    ],
    credibility: 'This hub is assembled from high-priority FrontendAtlas JavaScript prompts and reviewed for interview-specific trade-off language.',
    relatedPrep: {
      label: 'JavaScript interview prep path',
      route: ['/guides', 'framework-prep', 'javascript-prep-path'],
      summary: 'A 7/14/30-day path for async, closures, state, and utility prompts.',
    },
  },
  react: {
    heading: 'What React interview rounds test',
    lead: 'React interviews test component state, effects, rendering behavior, async UI, and whether your explanation survives follow-up questions.',
    tests: [
      'State ownership, effects, stale closures, refs, context, and rendering boundaries.',
      'Practical UI prompts such as search, forms, transfer lists, tables, and nested components.',
      'Performance judgment: when memoization, batching, or component splitting actually matters.',
    ],
    usage: [
      'Run one implementation prompt before opening deeper concept questions.',
      'Use concept questions to tighten explanations after you pass the basic UI behavior.',
      'Follow the React prep path when hooks or rerender reasoning keeps repeating as the miss.',
    ],
    credibility: 'React prompts are prioritized by FrontendAtlas importance signals and reviewed for concrete interview follow-ups.',
    relatedPrep: {
      label: 'React interview prep path',
      route: ['/guides', 'framework-prep', 'react-prep-path'],
      summary: 'A focused path for state, effects, rerender reasoning, and performance trade-offs.',
    },
  },
  angular: {
    heading: 'What Angular interview rounds test',
    lead: 'Angular interviews test RxJS flow control, change detection, dependency boundaries, forms, testing judgment, and how clearly you explain framework behavior.',
    tests: [
      'RxJS operators, HttpClient cancellation, async cleanup, and request race prevention.',
      'Change detection, DI scope, standalone boundaries, template binding, and forms trade-offs.',
      'Whether you can distinguish production bugs from memorized framework definitions.',
    ],
    usage: [
      'Start with one Angular coding prompt, then answer one concept question out loud.',
      'Use the top concept questions to rehearse explanations before deeper framework drills.',
      'Open the prep path when RxJS, change detection, or architecture misses repeat.',
    ],
    credibility: 'Angular prompts are curated from shipped FrontendAtlas practice routes and reviewed for interview-specific production pitfalls.',
    relatedPrep: {
      label: 'Angular interview prep path',
      route: ['/guides', 'framework-prep', 'angular-prep-path'],
      summary: 'A focused path for RxJS, change detection, DI boundaries, forms, and tests.',
    },
  },
  vue: {
    heading: 'What Vue interview rounds test',
    lead: 'Vue interviews test reactivity, rendering, component contracts, router/state decisions, and the ability to explain subtle lifecycle behavior.',
    tests: [
      'Reactivity, refs, computed values, watchers, nextTick, and render timing.',
      'Component communication, props/emits, v-model, provide/inject, and store boundaries.',
      'Practical debugging around key stability, state resets, and visibility toggles.',
    ],
    usage: [
      'Start with one Vue coding prompt, then rehearse one concept explanation.',
      'Use related concept questions to find weak reactivity or lifecycle assumptions.',
      'Follow the Vue prep path when the same rendering or state miss repeats.',
    ],
    credibility: 'Vue prompts are grouped by FrontendAtlas importance signals and reviewed for framework-specific interview traps.',
    relatedPrep: {
      label: 'Vue interview prep path',
      route: ['/guides', 'framework-prep', 'vue-prep-path'],
      summary: 'A focused path for reactivity, rendering, state, and component contracts.',
    },
  },
  html: {
    heading: 'What HTML interview rounds test',
    lead: 'HTML interview questions test semantic structure, forms, accessibility, metadata, and how browser defaults affect real UI behavior.',
    tests: [
      'Forms, labels, landmarks, document metadata, responsive images, and accessibility basics.',
      'Whether you can explain defaults without turning the answer into documentation recitation.',
      'Practical trade-offs around semantics, validation, SEO, and progressive enhancement.',
    ],
    usage: [
      'Start with one short concept question and explain the browser behavior in plain language.',
      'Use HTML questions as a quick fundamentals check before UI coding prompts.',
      'Move into the frontend fundamentals guide when browser basics feel inconsistent.',
    ],
    credibility: 'HTML questions are reviewed for practical browser behavior and interview-ready explanation quality.',
    relatedPrep: {
      label: 'Frontend fundamentals quiz guide',
      route: ['/guides', 'interview-blueprint', 'quiz'],
      summary: 'A compact browser, CSS, JavaScript, and HTTP fundamentals check.',
    },
  },
  css: {
    heading: 'What CSS interview rounds test',
    lead: 'CSS interviews test layout reasoning, selectors, cascade behavior, responsive constraints, accessibility, and whether you can debug visual bugs methodically.',
    tests: [
      'Flexbox, grid, cascade, specificity, custom properties, forms, and responsive layouts.',
      'Whether you can choose layout tools based on constraints instead of memorized rules.',
      'Practical debugging around overflow, alignment, stacking, and performance.',
    ],
    usage: [
      'Start with one CSS concept question, then implement one small layout prompt.',
      'Use the fundamentals guide when cascade or layout vocabulary is shaky.',
      'Return to the Question Library for broader UI coding practice after the basics stabilize.',
    ],
    credibility: 'CSS questions are reviewed for practical UI debugging and interview-ready trade-off language.',
    relatedPrep: {
      label: 'Frontend UI interviews guide',
      route: ['/guides', 'interview-blueprint', 'ui-interviews'],
      summary: 'A practical guide for accessible UI prompts and layout-focused rounds.',
    },
  },
};

const PRIMARY_TECH_HUB_PATHS = new Set<string>([
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
]);

const DIFFICULTY_RANK: Record<string, number> = {
  easy: 0,
  intermediate: 1,
  hard: 2,
};

@Component({
  standalone: true,
  selector: 'app-interview-questions-landing',
  imports: [CommonModule, RouterModule, PrepRoadmapComponent],
  templateUrl: './interview-questions-landing.component.html',
  styleUrls: ['./interview-questions-landing.component.css'],
})
export class InterviewQuestionsLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly questionService = inject(QuestionService);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);

  config: InterviewQuestionsLandingConfig = DEFAULT_CONFIG;
  loading = true;
  codingQuestions: QuestionSummaryRow[] = [];
  triviaQuestions: QuestionSummaryRow[] = [];
  relatedHubLinks: HubLink[] = [];
  featuredLinks: HubLink[] = [];
  readonly previewLimit = 3;

  ngOnInit(): void {
    const incoming = this.route.snapshot.data['interviewQuestions'] as Partial<InterviewQuestionsLandingConfig> | undefined;
    const techs = Array.isArray(incoming?.techs)
      ? incoming!.techs.filter((tech): tech is Tech =>
        ['javascript', 'react', 'angular', 'vue', 'html', 'css'].includes(String(tech)),
      )
      : [];
    const featuredLinks = this.normalizeHubLinks((incoming as { featuredLinks?: unknown } | undefined)?.featuredLinks);

    this.config = {
      keyword: String(incoming?.keyword || DEFAULT_CONFIG.keyword),
      title: String(incoming?.title || DEFAULT_CONFIG.title),
      techs: techs.length ? techs : DEFAULT_CONFIG.techs,
      isMasterHub: Boolean(incoming?.isMasterHub),
      featuredLinks,
    };

    this.featuredLinks = featuredLinks;
    this.relatedHubLinks = this.buildRelatedHubLinks();
    const resolved = this.route.snapshot.data['interviewQuestionsList'] as InterviewQuestionsHubResolved | undefined;
    if (resolved && this.hasResolvedRows(resolved)) {
      this.applyResolvedRows(resolved);
      this.loading = false;
      this.updateSchema();
      return;
    }

    this.loadLists();
  }

  keywordSentenceCase(): string {
    return this.config.keyword.charAt(0).toUpperCase() + this.config.keyword.slice(1);
  }

  introLead(): string {
    if (this.isMasterHub()) {
      return 'Guided warm-up for fast frontend interview prep: start with the most crucial JavaScript coding and concept prompts, then branch into the Question Library for broader coverage.';
    }

    return `Technology warm-up for ${this.keywordSentenceCase()}: tackle the most crucial coding and concept questions first, then expand into Study Plans, guides, and Company Prep.`;
  }

  listIntentItems(): string[] {
    if (this.isMasterHub()) {
      return [
        'Start with curated JavaScript essentials to warm up interview execution speed.',
        'Mix coding implementation drills with concept explanation checks in one short loop.',
        'Expand to framework hubs, guides, and tracks once your baseline is stable.',
      ];
    }

    const techName = this.currentHubTechLabel();
    return [
      `Prioritize high-impact ${techName} coding prompts first.`,
      `Use ${techName} concept rounds to sharpen explanation speed.`,
      'Escalate into the frontend interview prep platform for guided sequencing.',
    ];
  }

  codingSectionTitle(): string {
    if (this.isMasterHub()) return 'Most crucial JavaScript coding interview questions';
    return `Most crucial ${this.currentHubTechDisplay()} coding interview questions`;
  }

  codingSectionSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Curated by importance for fast onboarding. Start here, then open full libraries and tracks.';
    }
    return 'Ranked by interview importance so you can start with the highest-signal implementation drills.';
  }

  triviaSectionTitle(): string {
    if (this.isMasterHub()) return 'Most crucial JavaScript concept questions for interviews';
    return `Most crucial ${this.currentHubTechDisplay()} concept questions for interviews`;
  }

  triviaSectionSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Use these high-importance concept checks to tighten your fundamentals before deeper rounds.';
    }
    return 'Ranked by interview importance to strengthen your explanation speed where it matters most.';
  }

  masterTechHubLinks(): HubLink[] {
    return INTERVIEW_HUB_LINKS.filter((hub) => PRIMARY_TECH_HUB_PATHS.has(hub.path));
  }

  prepPlanLinks(): PrepPlanLink[] {
    return PREP_PLAN_LINKS;
  }

  prepRoadmapTitle(): string {
    return this.isMasterHub()
      ? 'Recommended frontend interview preparation'
      : `Recommended ${this.currentRoadmapTechDisplay()} interview preparation`;
  }

  prepRoadmapSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Start with the interview preparation guide, use Essential 60 as the core practice block, then broaden by format, stack, and final-round coverage.';
    }

    return `Start with the interview preparation guide and shared baseline, then tighten ${this.currentRoadmapTechDisplay()} coding, concepts, and follow-up depth.`;
  }

  prepRoadmapItems(): PrepRoadmapItem[] {
    if (this.isMasterHub()) {
      return [
        {
          step: 1,
          title: 'Frontend interview preparation guide',
          description: 'Learn the interview stages, scoring signals, and prep sequence before opening practice lists.',
          route: ['/guides', 'interview-blueprint', 'intro'],
          badge: 'Start here',
          meta: 'Process, rounds, and plan',
          tone: 'recommended',
        },
        {
          step: 2,
          title: 'FrontendAtlas Essential 60',
          description: 'Work through the core shortlist across JavaScript utilities, UI coding, concepts, and system design.',
          route: ['/interview-questions/essential'],
          meta: 'Core practice block',
          tone: 'practice',
        },
        {
          step: 3,
          title: 'Question Library',
          description: 'Broaden into more coding and concept coverage by format, stack, difficulty, and weak area.',
          route: ['/coding'],
          queryParams: { reset: 1 },
          meta: 'Broader coding + concepts',
          tone: 'structured',
        },
        {
          step: 4,
          title: 'Framework interview hubs',
          description: 'Branch into React, Angular, Vue, HTML, or CSS once the shared baseline shows which stack needs depth.',
          route: ['/react/interview-questions'],
          meta: 'React, Angular, Vue, HTML/CSS',
          tone: 'structured',
        },
        {
          step: 5,
          title: 'Study Plans / System Design',
          description: 'Move into longer tracks when you need weekly sequencing, architecture practice, or company-style prep.',
          route: ['/tracks'],
          meta: 'Structured weekly prep',
          tone: 'advanced',
        },
      ];
    }

    const tech = this.currentRoadmapTechDisplay();
    const primaryTech = this.primaryTechForLibrary() || this.config.techs[0] || 'javascript';

    return [
      {
        step: 1,
        title: 'Frontend interview preparation guide',
        description: 'Learn the interview stages and scoring signals before narrowing into this technology.',
        route: ['/guides', 'interview-blueprint', 'intro'],
        badge: 'Start here',
        meta: 'Process, rounds, and plan',
        tone: 'recommended',
      },
      {
        step: 2,
        title: 'FrontendAtlas Essential 60',
        description: 'Start with the shared shortlist to stabilize interview fundamentals before framework-specific depth.',
        route: ['/interview-questions/essential'],
        meta: 'Shared frontend baseline',
        tone: 'practice',
      },
      {
        step: 3,
        title: `${tech} coding + concept questions`,
        description: `Practice ${tech} implementation prompts and explanation follow-ups from one filtered library view.`,
        route: ['/coding'],
        queryParams: { tech: primaryTech, reset: 1 },
        meta: 'Coding execution + concept recall',
        tone: 'practice',
      },
      {
        step: 4,
        title: `${tech} interview prep path`,
        description: this.hubIntentProfile().relatedPrep.summary,
        route: this.hubIntentProfile().relatedPrep.route,
        meta: 'Framework-specific sequencing',
        tone: 'structured',
      },
      {
        step: 5,
        title: 'Final-round coverage',
        description: 'Add system design, behavioral, and company-style follow-ups after the framework baseline is stable.',
        route: ['/system-design'],
        meta: 'System design, behavioral, company rounds',
        tone: 'advanced',
      },
    ];
  }

  supportsMultipleTechs(): boolean {
    return this.config.techs.length > 1;
  }

  mustKnowCount(): number {
    return [...this.codingQuestions, ...this.triviaQuestions]
      .filter((row) => row.priority === 'must_know')
      .length;
  }

  previewRows(kind: Kind): QuestionSummaryRow[] {
    const rows = kind === 'coding' ? this.codingQuestions : this.triviaQuestions;
    return rows.slice(0, this.previewLimit);
  }

  topConceptRows(): QuestionSummaryRow[] {
    return this.previewRows('trivia');
  }

  topConceptLinks(): HubConceptLink[] {
    const primaryTech = this.primaryTechForLibrary();
    const featured = primaryTech === 'angular' ? this.featuredLinks.slice(0, 3) : [];
    if (featured.length) {
      return featured.map((link) => ({
        label: link.label,
        route: link.route,
        ariaLabel: `Open ${link.label}`,
      }));
    }

    return this.topConceptRows().map((row) => ({
      label: row.title,
      route: row.link,
      ariaLabel: this.questionAriaLabel(row),
    }));
  }

  hubIntentProfile(): HubIntentProfile {
    const key = this.isMasterHub() ? 'master' : this.primaryTechForLibrary();
    return HUB_INTENT_PROFILES[key || 'master'] || HUB_INTENT_PROFILES['master'];
  }

  questionCtaLabel(row: QuestionSummaryRow): string {
    const tech = this.techLabel(row.tech);
    return row.kind === 'trivia'
      ? `Open ${tech} interview question`
      : `Open ${tech} coding interview challenge`;
  }

  questionAriaLabel(row: QuestionSummaryRow): string {
    return `${this.questionCtaLabel(row)}: ${row.title}`;
  }

  viewAllTarget(kind: Kind): { route: any[]; queryParams?: Record<string, string | number | boolean> } {
    const queryParams: Record<string, string | number | boolean> = {
      kind,
      reset: 1,
    };
    const primaryTech = this.primaryTechForLibrary();
    if (primaryTech) queryParams['tech'] = primaryTech;
    return { route: ['/coding'], queryParams };
  }

  trackPrepRoadmapSelection(item: PrepRoadmapItem): void {
    this.analytics.track('interview_hub_route_selected', {
      hub_path: this.currentHubPath(),
      route_key: `roadmap_${item.step}`,
      roadmap_step: item.step,
      roadmap_title: item.title,
      is_master_hub: this.isMasterHub(),
    });
  }

  trackViewAll(kind: Kind): void {
    this.analytics.track('interview_hub_view_all_clicked', {
      hub_path: this.currentHubPath(),
      kind,
    });
  }

  priorityLabel(row: QuestionSummaryRow): string {
    switch (row.priority) {
      case 'must_know':
        return 'Must know';
      case 'high_leverage':
        return 'High leverage';
      default:
        return 'Core';
    }
  }

  priorityReason(row: QuestionSummaryRow): string {
    if (row.priority === 'must_know') {
      return row.kind === 'coding'
        ? 'Critical for coding rounds and edge-case discussion.'
        : 'Frequently tested in explanation-heavy rounds.';
    }

    if (row.priority === 'high_leverage') {
      return row.kind === 'coding'
        ? 'High interview value and common implementation surface.'
        : 'High-signal concept for concise interview explanations.';
    }

    return row.kind === 'coding'
      ? 'Solid reinforcement to stabilize your baseline execution.'
      : 'Useful reinforcement to keep recall fluent under pressure.';
  }

  isMasterHub(): boolean {
    return this.config.isMasterHub;
  }

  techLabel(tech: Tech): string {
    switch (tech) {
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
      default:
        return tech;
    }
  }

  private loadLists(): void {
    this.loading = true;
    const crucialTechs = this.crucialTechsForCurrentHub();

    forkJoin({
      coding: this.loadKindRows('coding', crucialTechs),
      trivia: this.loadKindRows('trivia', crucialTechs),
    }).subscribe({
      next: ({ coding, trivia }) => {
        this.codingQuestions = coding
          .map((row) => this.toRow(row, 'coding'))
          .slice(0, 12);
        this.triviaQuestions = trivia
          .map((row) => this.toRow(row, 'trivia'))
          .slice(0, 12);
        this.loading = false;
        this.updateSchema();
      },
      error: () => {
        this.codingQuestions = [];
        this.triviaQuestions = [];
        this.loading = false;
        this.updateSchema();
      },
    });
  }

  private loadKindRows(kind: Kind, techs: Tech[]) {
    return forkJoin(
      techs.map((tech) =>
        this.questionService.loadQuestionSummaries(tech, kind, { transferState: false }).pipe(
          map((rows) => rows.map((row) => ({ ...row, tech } as RawQuestionSummaryRow))),
          catchError(() => of([] as RawQuestionSummaryRow[])),
        ),
      ),
    ).pipe(
      map((buckets) => buckets.flat()),
      map((rows) =>
        rows
          .filter((row) => !!row.id && !!row.title && techs.includes(row.tech))
          .sort((a, b) => this.compareRows(a, b)),
      ),
    );
  }

  private hasResolvedRows(resolved: InterviewQuestionsHubResolved): boolean {
    return Array.isArray(resolved.coding) && Array.isArray(resolved.trivia);
  }

  private applyResolvedRows(resolved: InterviewQuestionsHubResolved): void {
    const crucialTechs = this.crucialTechsForCurrentHub();
    const codingRows = this.filterRowsForCurrentHub(resolved.coding, crucialTechs);
    const triviaRows = this.filterRowsForCurrentHub(resolved.trivia, crucialTechs);

    this.codingQuestions = codingRows
      .map((row) => this.toRow(row, 'coding'))
      .slice(0, 12);
    this.triviaQuestions = triviaRows
      .map((row) => this.toRow(row, 'trivia'))
      .slice(0, 12);
  }

  private filterRowsForCurrentHub(rows: RawQuestionSummaryRow[], techs: Tech[] = this.config.techs): RawQuestionSummaryRow[] {
    return rows
      .filter((row) => !!row.id && !!row.title && techs.includes(row.tech))
      .sort((a, b) => this.compareRows(a, b));
  }

  private crucialTechsForCurrentHub(): Tech[] {
    return this.isMasterHub() ? ['javascript'] : this.config.techs;
  }

  private compareRows(a: RawQuestionSummaryRow, b: RawQuestionSummaryRow): number {
    const aImportance = Number(a.importance || 0);
    const bImportance = Number(b.importance || 0);
    if (aImportance !== bImportance) return bImportance - aImportance;

    const aDifficulty = DIFFICULTY_RANK[String(a.difficulty || '').toLowerCase()] ?? 99;
    const bDifficulty = DIFFICULTY_RANK[String(b.difficulty || '').toLowerCase()] ?? 99;
    if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  private primaryTechForLibrary(): Tech | null {
    if (this.isMasterHub()) return 'javascript';
    if (this.config.techs.length === 1) return this.config.techs[0];
    return null;
  }

  private toRow(row: RawQuestionSummaryRow, kind: Kind): QuestionSummaryRow {
    const importance = Math.max(0, Number(row.importance || 0));
    return {
      id: String(row.id || ''),
      title: String(row.title || ''),
      tech: row.tech,
      kind,
      difficulty: String(row.difficulty || 'intermediate'),
      importance,
      priority: this.priorityFromImportance(importance),
      description: this.toShortDescription(row),
      link: ['/', row.tech, kind, row.id],
    };
  }

  private priorityFromImportance(importance: number): PrepPriority {
    if (importance >= 4) return 'must_know';
    if (importance >= 2) return 'high_leverage';
    return 'core_reinforcement';
  }

  private toShortDescription(row: QuestionListItem): string {
    const direct = this.cleanText(String(row.shortDescription || ''));
    if (direct) return direct;

    if (typeof row.description === 'string') {
      return this.cleanText(row.description);
    }

    const structured = row.description && typeof row.description === 'object'
      ? (row.description as { summary?: string; text?: string })
      : null;
    return this.cleanText(structured?.summary || structured?.text || '');
  }

  private cleanText(value: string): string {
    return String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private updateSchema(): void {
    const routeSeo = (this.route.snapshot.data['seo'] as SeoMeta | undefined) || {};
    const currentPath = this.currentRoutePath();
    const canonicalUrl = this.seo.buildCanonicalUrl(currentPath);
    const masterHubUrl = this.seo.buildCanonicalUrl('/interview-questions');
    const tracksUrl = this.seo.buildCanonicalUrl('/tracks');
    const companiesUrl = this.seo.buildCanonicalUrl('/companies');
    const description = String(
      routeSeo.description
      || `${this.config.title} with coding and concept prompts for frontend interview preparation.`,
    );

    const schemaLinks = this.schemaQuestionLinks();
    const itemListElement = schemaLinks.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: this.seo.buildCanonicalUrl(item.path),
    }));

    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: this.config.title,
      description,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: this.keywordSentenceCase() },
        { '@type': 'Thing', name: 'Frontend interview questions' },
      ],
      mentions: [
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ],
    };

    if (!this.isMasterHub()) {
      collectionPage['isPartOf'] = {
        '@type': 'CollectionPage',
        '@id': masterHubUrl,
        url: masterHubUrl,
        name: 'Frontend Interview Questions',
      };
      collectionPage['mentions'] = [
        { '@type': 'WebPage', name: 'Frontend interview questions library', url: masterHubUrl },
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    } else {
      collectionPage['hasPart'] = this.masterTechHubLinks().map((hub) => ({
        '@type': 'WebPage',
        name: hub.label,
        url: this.seo.buildCanonicalUrl(hub.path),
      }));
      collectionPage['mentions'] = [
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    }

    if (itemListElement.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement,
      };
    }

    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      itemListElement: this.breadcrumbItems(canonicalUrl, masterHubUrl),
    };

    this.seo.updateTags({
      ...routeSeo,
      canonical: currentPath,
      jsonLd: [collectionPage, breadcrumbList],
    });
  }

  private schemaQuestionLinks(): SchemaQuestionLink[] {
    const seen = new Set<string>();
    const out: SchemaQuestionLink[] = [];
    const combined = [...this.codingQuestions, ...this.triviaQuestions];

    for (const row of combined) {
      const path = `/${row.tech}/${row.kind}/${row.id}`;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({ title: row.title, path });
      if (out.length >= 20) break;
    }

    return out;
  }

  private breadcrumbItems(canonicalUrl: string, masterHubUrl: string): Array<Record<string, any>> {
    const items: Array<Record<string, any>> = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FrontendAtlas',
        item: this.seo.buildCanonicalUrl('/'),
      },
    ];

    if (!this.isMasterHub()) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Frontend Interview Questions',
        item: masterHubUrl,
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: this.config.title,
        item: canonicalUrl,
      });
      return items;
    }

    items.push({
      '@type': 'ListItem',
      position: 2,
      name: this.config.title,
      item: canonicalUrl,
    });
    return items;
  }

  private currentRoutePath(): string {
    const segments = this.route.snapshot.pathFromRoot
      .flatMap((entry) => entry.url || [])
      .map((segment) => segment.path)
      .filter((segment) => !!segment);

    return segments.length ? `/${segments.join('/')}` : '/';
  }

  private buildRelatedHubLinks(): HubLink[] {
    const currentPath = this.currentHubPath();
    return INTERVIEW_HUB_LINKS.filter((hub) => hub.path !== currentPath);
  }

  private normalizeHubLinks(raw: unknown): HubLink[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: HubLink[] = [];

    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const candidate = item as { label?: unknown; path?: unknown; route?: unknown };
      const path = String(candidate.path || '').trim();
      const label = String(candidate.label || '').trim();
      if (!path.startsWith('/') || !label) continue;
      if (seen.has(path)) continue;
      seen.add(path);

      const route = Array.isArray(candidate.route)
        ? candidate.route.filter((part) => typeof part === 'string' || typeof part === 'number')
        : [path];
      out.push({ label, path, route });
    }

    return out;
  }

  private currentHubPath(): string {
    if (this.config.isMasterHub) return '/interview-questions';
    if (this.config.techs.length === 1) {
      const tech = this.config.techs[0];
      if (
        tech === 'javascript'
        || tech === 'react'
        || tech === 'angular'
        || tech === 'vue'
        || tech === 'html'
        || tech === 'css'
      ) {
        return `/${tech}/interview-questions`;
      }
    }

    if (this.config.techs.includes('html') && this.config.techs.includes('css')) {
      return '/html-css/interview-questions';
    }

    return '/interview-questions';
  }

  private currentHubTechLabel(): string {
    if (!this.config.techs.length) return 'frontend';
    return this.techLabel(this.config.techs[0]).toLowerCase();
  }

  private currentHubTechDisplay(): string {
    if (!this.config.techs.length) return 'frontend';
    return this.techLabel(this.config.techs[0]);
  }

  private currentRoadmapTechDisplay(): string {
    if (this.config.techs.includes('html') && this.config.techs.includes('css')) {
      return 'HTML/CSS';
    }

    return this.currentHubTechDisplay();
  }
}
