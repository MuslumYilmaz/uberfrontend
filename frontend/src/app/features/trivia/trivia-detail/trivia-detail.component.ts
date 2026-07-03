/* ========================= trivia-detail.component.ts ========================= */
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import { Subscription, combineLatest, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { PrismHighlightDirective } from '../../../core/directives/prism-highlight.directive';
import {
  Question,
  QuestionInterviewFocus,
  TriviaIncidentOption,
  isQuestionLockedForTier,
} from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionDetailResolved } from '../../../core/resolvers/question-detail.resolver';
import { QuestionListItem, QuestionService } from '../../../core/services/question.service';
import { SEO_SUPPRESS_TOKEN } from '../../../core/services/seo-context';
import { buildLockedPreviewForTrivia, LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AppUiStylesService } from '../../../core/services/app-ui-styles.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { ExperimentService } from '../../../core/services/experiment.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import {
  TriviaIncidentPrompt,
  TriviaIncidentService,
} from '../../../core/services/trivia-incident.service';
import { LifecycleMilestoneId, LifecyclePromptService } from '../../../core/services/lifecycle-prompt.service';
import { DialogModule } from 'primeng/dialog';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { FaGlyphComponent } from '../../../shared/ui/icon/fa-glyph.component';
import { seoDescriptionForQuestion, seoTitleForQuestion } from './trivia-seo.util';
import {
  freeChallengeForFramework,
  frameworkLabel,
  preferredFramework,
  timelineLabel,
} from '../../../core/utils/onboarding-personalization.util';
import { TAG_REGISTRY, TOPIC_REGISTRY } from '../../../generated/content-metadata';

/** ============== Rich Answer Format ============== */
type BlockText = { type: 'text'; text: string };
type BlockCode = { type: 'code'; language?: string; code: string };
type BlockImage = {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};
type BlockList = {
  type: 'list';
  columns: string[];
  rows: string[][];
  caption?: string;
};

type AnswerBlock = BlockText | BlockCode | BlockImage | BlockList;
type RichAnswer = { blocks: AnswerBlock[] } | null | undefined;

type PracticeItem = { tech: Tech; kind: 'trivia' | 'coding'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number } | null;
type QuestionListEntry = QuestionListItem;
type SimilarItem = { question: QuestionListEntry; difficulty: string };
type TagMatcher = { tag: string; re: RegExp };
type IncidentCardModel = {
  title: string;
  scenario: string;
  options: TriviaIncidentOption[];
};
type ReturnValueSimulatorKey = 'null' | 'false' | 'undefined' | 'zero' | 'fragment' | 'parent-conditional';
type ReturnValueSimulatorOption = {
  key: ReturnValueSimulatorKey;
  label: string;
  componentReturn: string;
  domOutput: string;
  mountedState: string;
  testingAssertion: string;
};
type AsyncRaceSimulatorKey = 'no-guard' | 'abort-controller' | 'request-id' | 'take-latest';
type AsyncRaceTimelineTone = 'neutral' | 'fresh' | 'stale' | 'blocked' | 'cancelled';
type AsyncRaceTimelineNode = {
  id: string;
  label: string;
  detail: string;
  status: string;
  tone: AsyncRaceTimelineTone;
};
type AsyncRaceSimulatorOption = {
  key: AsyncRaceSimulatorKey;
  label: string;
  timelineNodes: AsyncRaceTimelineNode[];
  timeline: string;
  finalUi: string;
  whyItHappens: string;
  testAssertion: string;
};
type EqualityPredictorKey = 'string-number' | 'zero-false' | 'null-undefined' | 'nan-nan' | 'positive-negative-zero' | 'array-string';
type EqualityPredictorResult = {
  model: string;
  value: 'true' | 'false';
  note: string;
};
type EqualityPredictorScenario = {
  key: EqualityPredictorKey;
  label: string;
  left: string;
  right: string;
  whyItHappens: string;
  productionRule: string;
  results: EqualityPredictorResult[];
};
type NgRxSelectorTraceKey = 'root-state' | 'broad-feature' | 'atomic-selectors' | 'vm-selector';
type NgRxSelectorTraceOption = {
  key: NgRxSelectorTraceKey;
  label: string;
  inputBoundary: string;
  unrelatedUpdate: string;
  projectorTrace: string;
  componentVm: string;
  reviewSignal: string;
  projectorRuns: boolean;
  componentRebuilds: boolean;
};
type LockedPath = {
  id: string;
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
};
type TriviaAnalyticsLocation = 'sidebar' | 'mobile_nav' | 'similar' | 'guides' | 'prep_bridge' | 'body';

const TRIVIA_H1_INTENT_LABEL = 'Frontend interview answer';
const RETURN_VALUE_SIMULATOR_QUESTION_ID = 'react-render-nothing-return-value';
const ASYNC_RACE_SIMULATOR_QUESTION_ID = 'js-async-race-conditions';
const EQUALITY_PREDICTOR_QUESTION_ID = 'js-equality-vs-strict-equality';
const NGRX_SELECTOR_TRACE_QUESTION_ID = 'ngrx-selectors-memoization-derived-state-performance';
const RETURN_VALUE_SIMULATOR_OPTIONS: ReturnValueSimulatorOption[] = [
  {
    key: 'null',
    label: 'null',
    componentReturn: 'return null;',
    domOutput: 'No DOM output for this component render.',
    mountedState: 'Mounted if the parent still renders the component.',
    testingAssertion: 'Assert the region is absent with queryByRole(...).not.toBeInTheDocument().',
  },
  {
    key: 'false',
    label: 'false',
    componentReturn: 'return false;',
    domOutput: 'No DOM output when it is treated as a JSX child hole.',
    mountedState: 'Mounted if this is produced inside a still-rendered component.',
    testingAssertion: 'Assert the expected element is absent; booleans should not create DOM nodes.',
  },
  {
    key: 'undefined',
    label: 'undefined',
    componentReturn: 'return undefined;',
    domOutput: 'Unclear intent, usually a missing return bug.',
    mountedState: 'Do not rely on this as an empty UI state; fix the return path.',
    testingAssertion: 'Use an explicit return null, then assert the intended DOM is absent.',
  },
  {
    key: 'zero',
    label: '0',
    componentReturn: 'return 0;',
    domOutput: 'Renders a text node: 0.',
    mountedState: 'Mounted and visible as text unless your condition prevents it.',
    testingAssertion: "After fixing numeric &&, assert screen.queryByText('0') is not present.",
  },
  {
    key: 'fragment',
    label: 'Fragment',
    componentReturn: 'return <>{children}</>;',
    domOutput: 'Children render without an extra wrapper node.',
    mountedState: 'Mounted normally; the fragment only changes wrapper DOM.',
    testingAssertion: 'Assert child content exists and no wrapper-only test id is required.',
  },
  {
    key: 'parent-conditional',
    label: 'parent conditional',
    componentReturn: '{show ? <Child /> : null}',
    domOutput: 'No child DOM when the condition is false.',
    mountedState: 'The child is not rendered, so state and effects are torn down.',
    testingAssertion: 'Assert child UI is absent and cleanup-sensitive effects stop.',
  },
];
const ASYNC_RACE_SIMULATOR_OPTIONS: AsyncRaceSimulatorOption[] = [
  {
    key: 'no-guard',
    label: 'No guard',
    timelineNodes: [
      { id: 'rea-starts', label: "rea request starts", status: 'A starts', tone: 'neutral', detail: "The user types 'rea' and request A begins." },
      { id: 'react-starts', label: "react request starts", status: 'B starts', tone: 'neutral', detail: "The user types 'react' and request B becomes the newer intent." },
      { id: 'react-resolves', label: "react resolves", status: 'fresh result', tone: 'fresh', detail: "Request B resolves first and renders the correct 'react' results." },
      { id: 'rea-resolves', label: "rea resolves last", status: 'older completion', tone: 'stale', detail: 'Request A is older, but it still reaches the completion handler.' },
      { id: 'ui-write', label: 'UI write allowed', status: 'stale write', tone: 'stale', detail: "No ownership check blocks A, so stale 'rea' results overwrite the screen." },
    ],
    timeline: "A: 'rea' starts -> B: 'react' starts -> B resolves -> A resolves last.",
    finalUi: "Stale UI: results for 'rea' overwrite the newer 'react' results.",
    whyItHappens: 'Nothing checks whether request A is still current, so the older completion can write state after request B.',
    testAssertion: 'A failing test would show final results equal to stale data after the older promise resolves.',
  },
  {
    key: 'abort-controller',
    label: 'AbortController',
    timelineNodes: [
      { id: 'rea-starts', label: "rea request starts", status: 'A starts', tone: 'neutral', detail: "The user types 'rea' and request A begins with an AbortSignal." },
      { id: 'react-starts', label: "react request starts", status: 'B owns UI', tone: 'fresh', detail: "The user types 'react'; the new controller aborts request A." },
      { id: 'react-resolves', label: "react resolves", status: 'fresh result', tone: 'fresh', detail: "Request B resolves and renders the correct 'react' results." },
      { id: 'rea-resolves', label: "rea resolves last", status: 'cancelled', tone: 'cancelled', detail: "Request A rejects as AbortError instead of publishing stale data." },
      { id: 'ui-write', label: 'UI write blocked', status: 'cancelled write', tone: 'blocked', detail: 'The AbortError branch returns before old work can write UI state.' },
    ],
    timeline: "A: 'rea' starts -> B: 'react' starts and aborts A -> only B can resolve.",
    finalUi: "Fresh UI: results for 'react' remain visible.",
    whyItHappens: 'The old fetch receives an AbortSignal before it can complete, so its result is ignored as cancelled work.',
    testAssertion: "expect(view.results()).toEqual(['React docs']); expect(oldSignal.aborted).toBeTrue();",
  },
  {
    key: 'request-id',
    label: 'request id guard',
    timelineNodes: [
      { id: 'rea-starts', label: "rea request starts", status: 'id 1', tone: 'neutral', detail: "The user types 'rea' and request A receives id 1." },
      { id: 'react-starts', label: "react request starts", status: 'id 2', tone: 'fresh', detail: "The user types 'react' and request B becomes the latest id." },
      { id: 'react-resolves', label: "react resolves", status: 'fresh result', tone: 'fresh', detail: 'Request B resolves while id 2 still matches the latest request id.' },
      { id: 'rea-resolves', label: "rea resolves last", status: 'stale id', tone: 'blocked', detail: 'Request A resolves later, but id 1 no longer matches the latest id.' },
      { id: 'ui-write', label: 'UI write blocked', status: 'guarded', tone: 'blocked', detail: 'The guard returns before stale request A can overwrite the screen.' },
    ],
    timeline: "A gets id 1 -> B gets id 2 -> B resolves -> A resolves but id 1 is stale.",
    finalUi: "Fresh UI: request B owns the screen, so A cannot overwrite it.",
    whyItHappens: 'The completion handler compares its id with the latest id before writing state.',
    testAssertion: "Resolve B, then A; expect(view.results()).toEqual(['React docs']).",
  },
  {
    key: 'take-latest',
    label: 'takeLatest / switchMap',
    timelineNodes: [
      { id: 'rea-starts', label: "rea request starts", status: 'inner A', tone: 'neutral', detail: "The input stream starts inner work for 'rea'." },
      { id: 'react-starts', label: "react request starts", status: 'inner B', tone: 'fresh', detail: "The next input switches ownership to the 'react' inner work." },
      { id: 'react-resolves', label: "react resolves", status: 'fresh result', tone: 'fresh', detail: "The latest inner work publishes the 'react' result." },
      { id: 'rea-resolves', label: "rea resolves last", status: 'replaced', tone: 'cancelled', detail: "The earlier inner work has been cancelled or ignored by the latest-owner policy." },
      { id: 'ui-write', label: 'UI write blocked', status: 'latest only', tone: 'blocked', detail: 'Only the latest stream owner can publish UI state.' },
    ],
    timeline: "Input 'rea' starts inner work -> input 'react' replaces it -> only the latest stream writes.",
    finalUi: "Fresh UI: only the newest input is allowed to publish results.",
    whyItHappens: 'takeLatest-style ownership cancels or ignores earlier inner work when newer input arrives.',
    testAssertion: 'Emit rea then react; expect the subscriber to publish only the react result.',
  },
];
const EQUALITY_PREDICTOR_SCENARIOS: EqualityPredictorScenario[] = [
  {
    key: 'string-number',
    label: "'5' vs 5",
    left: "'5'",
    right: '5',
    whyItHappens: 'Loose equality converts the string toward a number before comparing. The other models compare without coercion.',
    productionRule: 'Parse form or query strings once, then compare normalized numbers with ===.',
    results: [
      { model: '==', value: 'true', note: 'String is coerced to number.' },
      { model: '===', value: 'false', note: 'Different types stay different.' },
      { model: 'Object.is', value: 'false', note: 'No coercion is applied.' },
      { model: 'SameValueZero', value: 'false', note: 'No coercion for collection lookup.' },
    ],
  },
  {
    key: 'zero-false',
    label: '0 vs false',
    left: '0',
    right: 'false',
    whyItHappens: 'Loose equality converts false to 0, so both operands become the same number.',
    productionRule: 'Keep boolean checks and numeric checks separate; do not let empty or false-like input pass numeric guards.',
    results: [
      { model: '==', value: 'true', note: 'false converts to 0.' },
      { model: '===', value: 'false', note: 'Number and boolean differ.' },
      { model: 'Object.is', value: 'false', note: 'Different types are not the same value.' },
      { model: 'SameValueZero', value: 'false', note: 'Different types do not match.' },
    ],
  },
  {
    key: 'null-undefined',
    label: 'null vs undefined',
    left: 'null',
    right: 'undefined',
    whyItHappens: 'Loose equality has a special nullish rule: null and undefined only loosely equal each other.',
    productionRule: 'Choose one missing-value convention or write an explicit nullish check with value == null only when that is intentional.',
    results: [
      { model: '==', value: 'true', note: 'Special nullish match.' },
      { model: '===', value: 'false', note: 'Different types.' },
      { model: 'Object.is', value: 'false', note: 'Not the same value.' },
      { model: 'SameValueZero', value: 'false', note: 'No nullish special case.' },
    ],
  },
  {
    key: 'nan-nan',
    label: 'NaN vs NaN',
    left: 'NaN',
    right: 'NaN',
    whyItHappens: 'NaN is not equal to itself under == or ===. Object.is and SameValueZero treat NaN as the same value.',
    productionRule: 'Use Number.isNaN(value) for validation; remember Map, Set, and includes can find NaN.',
    results: [
      { model: '==', value: 'false', note: 'NaN never loosely equals itself.' },
      { model: '===', value: 'false', note: 'NaN is not strictly equal to itself.' },
      { model: 'Object.is', value: 'true', note: 'SameValue treats NaN as same.' },
      { model: 'SameValueZero', value: 'true', note: 'Collections can match NaN.' },
    ],
  },
  {
    key: 'positive-negative-zero',
    label: '+0 vs -0',
    left: '+0',
    right: '-0',
    whyItHappens: '== and === consider signed zero values equal. Object.is preserves the sign difference; SameValueZero collapses it.',
    productionRule: 'Use Object.is only when signed zero matters, such as low-level numeric or rendering edge cases.',
    results: [
      { model: '==', value: 'true', note: 'Signed zero is equal.' },
      { model: '===', value: 'true', note: 'Signed zero is equal.' },
      { model: 'Object.is', value: 'false', note: 'Sign is preserved.' },
      { model: 'SameValueZero', value: 'true', note: 'Sign is ignored.' },
    ],
  },
  {
    key: 'array-string',
    label: "[1] vs '1'",
    left: '[1]',
    right: "'1'",
    whyItHappens: 'Loose equality converts the array to a primitive string before comparing it with the string operand.',
    productionRule: 'Never rely on object-to-primitive conversion in app logic; extract the intended value first.',
    results: [
      { model: '==', value: 'true', note: 'Array becomes "1".' },
      { model: '===', value: 'false', note: 'Array reference and string differ.' },
      { model: 'Object.is', value: 'false', note: 'Different values and types.' },
      { model: 'SameValueZero', value: 'false', note: 'No object-to-string coercion.' },
    ],
  },
];
const NGRX_SELECTOR_TRACE_OPTIONS: NgRxSelectorTraceOption[] = [
  {
    key: 'root-state',
    label: 'Root state',
    inputBoundary: 'Component selects the whole root store.',
    unrelatedUpdate: 'A notification badge updates outside the products feature.',
    projectorTrace: 'Mapping work runs again because every root emission reaches the component.',
    componentVm: 'The component rebuilds a new array/object VM.',
    reviewSignal: 'High churn: move derivation into composed selectors.',
    projectorRuns: true,
    componentRebuilds: true,
  },
  {
    key: 'broad-feature',
    label: 'Broad feature',
    inputBoundary: 'Selector reads the entire products feature slice.',
    unrelatedUpdate: 'A sibling field in products changes, such as pagination metadata.',
    projectorTrace: 'Projector runs even when the filtered list inputs did not matter.',
    componentVm: 'The component receives a fresh VM more often than needed.',
    reviewSignal: 'Split the feature into narrow input selectors.',
    projectorRuns: true,
    componentRebuilds: true,
  },
  {
    key: 'atomic-selectors',
    label: 'Atomic selectors',
    inputBoundary: 'Selector composes ids, entities, query, and sort separately.',
    unrelatedUpdate: 'Another feature updates while product input references stay stable.',
    projectorTrace: 'Projector is skipped and the cached result is reused.',
    componentVm: 'The component keeps the same VM reference.',
    reviewSignal: 'Good memoization boundary for unrelated updates.',
    projectorRuns: false,
    componentRebuilds: false,
  },
  {
    key: 'vm-selector',
    label: 'VM selector',
    inputBoundary: 'Component selects one final UI-ready view-model selector.',
    unrelatedUpdate: 'Only loading/error/items inputs determine recomputation.',
    projectorTrace: 'Projector runs once when selected inputs change, then returns a stable contract.',
    componentVm: 'The component only binds the final VM and avoids local map/filter/sort.',
    reviewSignal: 'Best interview answer: narrow inputs plus component contract.',
    projectorRuns: true,
    componentRebuilds: false,
  },
];

const TAG_MATCHERS: TagMatcher[] = buildTagMatchers([
  ...(Array.isArray((TAG_REGISTRY as any)?.tags) ? (TAG_REGISTRY as any).tags : []),
  ...((Array.isArray((TOPIC_REGISTRY as any)?.topics) ? (TOPIC_REGISTRY as any).topics : [])
    .flatMap((topic: any) => Array.isArray(topic?.tags) ? topic.tags : [])),
]);
const TRIVIA_SCROLL_THRESHOLDS = [25, 50, 75, 100];

function buildTagMatchers(rawTags: unknown[]): TagMatcher[] {
  const unique = new Set<string>();
  const matchers: TagMatcher[] = [];

  for (const raw of rawTags) {
    if (typeof raw !== 'string') continue;
    const tag = raw.trim().toLowerCase();
    if (!tag || unique.has(tag)) continue;
    unique.add(tag);
    matchers.push({ tag, re: buildTagRegex(tag) });
  }

  return matchers;
}

function buildTagRegex(tag: string): RegExp {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\\-/g, '[\\s-]+');
  return new RegExp(`\\b${pattern}\\b`);
}

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    DialogModule,
    LoginRequiredDialogComponent,
    FooterComponent,
    LockedPreviewComponent,
    PrismHighlightDirective,
    SafeHtmlPipe,
    FaGlyphComponent,
  ],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.css'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sideScroll') sideScroll?: ElementRef<HTMLElement>;
  @ViewChild('mainScroll') mainScroll?: ElementRef<HTMLElement>;
  tech!: Tech;

  questionsList: QuestionListEntry[] = [];
  sidebarQuestions: QuestionListEntry[] = [];
  sidebarTitle = 'All Questions';
  question = signal<Question | null>(null);
  copiedIndex = signal<number | null>(null);
  selectedReturnValueSimulatorKey = signal<ReturnValueSimulatorKey>('null');
  selectedAsyncRaceSimulatorKey = signal<AsyncRaceSimulatorKey>('no-guard');
  selectedEqualityPredictorKey = signal<EqualityPredictorKey>('string-number');
  selectedNgRxSelectorTraceKey = signal<NgRxSelectorTraceKey>('root-state');
  returnValueSimulatorOptions = RETURN_VALUE_SIMULATOR_OPTIONS;
  asyncRaceSimulatorOptions = ASYNC_RACE_SIMULATOR_OPTIONS;
  equalityPredictorScenarios = EQUALITY_PREDICTOR_SCENARIOS;
  ngrxSelectorTraceOptions = NGRX_SELECTOR_TRACE_OPTIONS;
  solved = signal(false);
  loadState = signal<'loading' | 'loaded' | 'notFound'>('loading');
  loginPromptOpen = false;
  lifecyclePromptOpen = false;
  lifecyclePromptMilestone: LifecycleMilestoneId | null = null;
  lifecyclePromptSolvedTotal = 0;
  private lifecyclePromptQuestionId: string | null = null;
  loginPromptTitle = 'Sign in to save progress';
  loginPromptBody = 'To track completed questions and keep your progress synced, sign in or create a free account.';
  loginPromptCta = 'Go to login';
  private signupPromptVariant: 'control' | 'benefit' = 'control';
  private premiumGateVariant: 'control' | 'value' = 'control';
  lockedPersonalizationLine = '';
  lockedPaths: LockedPath[] = [];
  similarOpen = signal(true);
  qnavOpen = signal(false);
  incidentPromptOpen = false;
  incidentSubmitBusy = false;
  incidentSelectedOptionId = signal<string | null>(null);
  incidentOutcome = signal<'correct' | 'wrong' | null>(null);
  incidentPromptMessage = signal<string>('');
  incidentCard = signal<IncidentCardModel | null>(null);
  private incidentPromptLoading = false;
  private incidentPromptCache = new Map<string, IncidentCardModel | null>();
  private incidentPromptQuestionId: string | null = null;

  private sub?: Subscription;
  private readonly suppressSeo = inject(SEO_SUPPRESS_TOKEN);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ngZone = inject(NgZone);
  private dataLoaded = false;
  private readonly sideScrollStoragePrefix = 'fa:trivia:side-scroll:';
  private maxTriviaDepthPercent = 0;
  private trackedTriviaDepths = new Set<number>();
  private triviaReadEngagedTracked = false;
  private visibleTriviaMs = 0;
  private triviaVisibleIntervalId: number | null = null;

  // practice session
  private practice: PracticeSession = null;
  private sessionSource: string | null = null;
  returnTo: any[] | null = null;
  private returnToUrl: string | null = null;
  private returnLabel = signal<string | null>(null);
  locked = computed(() => {
    const q = this.question();
    const user = this.auth.user();
    return q ? isQuestionLockedForTier(q, user) : false;
  });
  lockedTitle = computed(() => this.question()?.title || 'Premium question');
  lockedMemberCopy = computed(() =>
    this.premiumGateVariant === 'value'
      ? this.personalizedMemberCopy('value')
      : this.personalizedMemberCopy('control')
  );
  lockedGuestCopy = computed(() =>
    this.premiumGateVariant === 'value'
      ? this.personalizedGuestCopy('value')
      : this.personalizedGuestCopy('control')
  );
  lockedSummary = computed(() => {
    const q = this.question();
    if (!q) return '';
    const desc = q.description as any;
    let raw = '';
    if (desc && typeof desc === 'object' && typeof desc.summary === 'string') {
      raw = desc.summary;
    }
    if (!raw) {
      raw = this.descText(q.description || '');
    }
    const normalized = this.normalizePreviewText(raw || this.questionDescription(q));
    return this.trimWords(normalized, 45);
  });
  lockedBullets = computed(() => {
    const desc = this.question()?.description as any;
    const requirements: unknown[] = Array.isArray(desc?.specs?.requirements) ? desc.specs.requirements : [];
    return requirements
      .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => this.trimWords(this.normalizePreviewText(item), 12))
      .filter((item) => item.length > 0)
      .slice(0, 2);
  });
  lockedPreview = computed<LockedPreviewData | null>(() => {
    const q = this.question();
    if (!q) return null;
    return buildLockedPreviewForTrivia(q, {
      candidates: this.questionsList as any,
      tech: this.tech,
      kind: 'trivia',
    });
  });

  // footer helpers
  progressText(): string {
    return this.practice ? `${this.practice.index + 1} / ${this.practice.items.length}` : '—';
  }
  hasPrev() { return !!this.practice && this.practice.index > 0; }
  hasNext() { return !!this.practice && this.practice.index + 1 < this.practice.items.length; }
  trackByQuestionId = (_: number, q: QuestionListEntry): string => q.id;
  trackByAnswerBlock = (index: number, block: AnswerBlock): string => `${block.type}:${index}`;
  trackByStringValue = (index: number, value: string): string => value || String(index);
  trackByRowCells = (index: number, row: string[]): string => `${index}:${row.join('|')}`;
  trackByCellValue = (index: number, cell: string): string => `${index}:${cell}`;
  trackBySimilarQuestion = (_: number, item: SimilarItem): string => item.question.id;
  trackByLockedPath = (_: number, path: LockedPath): string => path.id;
  trackByIncidentOption = (_: number, option: TriviaIncidentOption): string => option.id;
  trackByReturnValueSimulatorOption = (_: number, option: ReturnValueSimulatorOption): string => option.key;
  trackByAsyncRaceSimulatorOption = (_: number, option: AsyncRaceSimulatorOption): string => option.key;
  trackByAsyncRaceTimelineNode = (_: number, node: AsyncRaceTimelineNode): string => node.id;
  trackByEqualityPredictorScenario = (_: number, option: EqualityPredictorScenario): string => option.key;
  trackByEqualityPredictorResult = (_: number, result: EqualityPredictorResult): string => result.model;
  trackByNgRxSelectorTraceOption = (_: number, option: NgRxSelectorTraceOption): string => option.key;

  isStackedMobileTable(block: BlockList | null | undefined): boolean {
    const columns = block?.columns;
    return Array.isArray(columns) && columns.length >= 4;
  }

  tableColumnLabel(block: BlockList | null | undefined, index: number): string {
    const columns = block?.columns;
    const raw = Array.isArray(columns) ? columns[index] : '';
    const label = this.normalizePreviewText(String(raw || ''));
    return label || `Column ${index + 1}`;
  }

  /** ============== Derived UI helpers ============== */

  answerIsRich = computed<boolean>(() => {
    const q = this.question();
    const a: any = q?.answer;
    return !!(a && typeof a === 'object' && Array.isArray(a.blocks));
  });

  /** Does a block look like the “Still so complicated?” one? */
  private isExtraHelpBlock(b: AnswerBlock): b is BlockText {
    return (b as any)?.type === 'text'
      && typeof (b as any).text === 'string'
      && /still\s+so\s+complicated\?/i.test((b as any).text);
  }

  /** Does a block look like the “Summary” one? */
  private isSummaryBlock(b: AnswerBlock): b is BlockText {
    return (b as any)?.type === 'text'
      && typeof (b as any).text === 'string'
      && /<strong>\s*summary\s*<\/strong>|^#{1,6}\s*summary/i.test((b as any).text);
  }

  /** Strip heading/icon from a help/summary text so only body remains */
  private stripLeadHeading(s: string): string {
    return s.replace(
      /^\s*(?:<i[^>]*>\s*<\/i>\s*)?(?:<strong>.*?<\/strong>|#{1,6}\s.*)\s*(?:\n|<br\s*\/?>)+/i,
      ''
    );
  }


  /** The “Still so complicated?” HTML (or null) */
  extraHelp = computed<string | null>(() => {
    if (!this.answerIsRich()) return null;
    const q = this.question();
    const blocks = (q?.answer as RichAnswer)?.blocks ?? [];
    const hit = blocks.find(b => this.isExtraHelpBlock(b)) as BlockText | undefined;
    if (!hit) return null;
    const bodyOnly = this.stripLeadHeading(hit.text || '');
    return this.md(bodyOnly);
  });

  /** The “Summary” HTML (or null) */
  summaryHelp = computed<string | null>(() => {
    if (!this.answerIsRich()) return null;
    const q = this.question();
    const blocks = (q?.answer as RichAnswer)?.blocks ?? [];
    const hit = blocks.find(b => this.isSummaryBlock(b)) as BlockText | undefined;
    if (!hit) return null;
    const bodyOnly = this.stripLeadHeading(hit.text || '');
    return this.md(bodyOnly);
  });

  /** Blocks for the main Answer card (exclude summary and extra-help) */
  answerBlocks = computed<AnswerBlock[]>(() => {
    const q = this.question();
    const a = q?.answer as RichAnswer;
    if (!a?.blocks) return [];
    return a.blocks.filter(b => !this.isExtraHelpBlock(b) && !this.isSummaryBlock(b));
  });

  selectedReturnValueSimulatorOption = computed<ReturnValueSimulatorOption>(() => {
    const key = this.selectedReturnValueSimulatorKey();
    return RETURN_VALUE_SIMULATOR_OPTIONS.find((option) => option.key === key) ?? RETURN_VALUE_SIMULATOR_OPTIONS[0];
  });

  selectedAsyncRaceSimulatorOption = computed<AsyncRaceSimulatorOption>(() => {
    const key = this.selectedAsyncRaceSimulatorKey();
    return ASYNC_RACE_SIMULATOR_OPTIONS.find((option) => option.key === key) ?? ASYNC_RACE_SIMULATOR_OPTIONS[0];
  });

  selectedEqualityPredictorScenario = computed<EqualityPredictorScenario>(() => {
    const key = this.selectedEqualityPredictorKey();
    return EQUALITY_PREDICTOR_SCENARIOS.find((option) => option.key === key) ?? EQUALITY_PREDICTOR_SCENARIOS[0];
  });

  selectedNgRxSelectorTraceOption = computed<NgRxSelectorTraceOption>(() => {
    const key = this.selectedNgRxSelectorTraceKey();
    return NGRX_SELECTOR_TRACE_OPTIONS.find((option) => option.key === key) ?? NGRX_SELECTOR_TRACE_OPTIONS[0];
  });

  showEqualityPredictor(q?: Question | null): boolean {
    return q?.id === EQUALITY_PREDICTOR_QUESTION_ID;
  }

  selectEqualityPredictor(key: EqualityPredictorKey): void {
    this.selectedEqualityPredictorKey.set(key);
  }

  showNgRxSelectorTrace(q?: Question | null): boolean {
    return q?.id === NGRX_SELECTOR_TRACE_QUESTION_ID;
  }

  selectNgRxSelectorTrace(key: NgRxSelectorTraceKey): void {
    this.selectedNgRxSelectorTraceKey.set(key);
  }

  showAsyncRaceSimulator(q?: Question | null): boolean {
    return q?.id === ASYNC_RACE_SIMULATOR_QUESTION_ID;
  }

  selectAsyncRaceSimulator(key: AsyncRaceSimulatorKey): void {
    this.selectedAsyncRaceSimulatorKey.set(key);
  }

  showReturnValueSimulator(q?: Question | null): boolean {
    return q?.id === RETURN_VALUE_SIMULATOR_QUESTION_ID;
  }

  selectReturnValueSimulator(key: ReturnValueSimulatorKey): void {
    this.selectedReturnValueSimulatorKey.set(key);
  }

  /** Similar questions based on shared tags (top 3). */
  similarItems = computed<SimilarItem[]>(() => {
    const current = this.question();
    if (!current) return [];

    const baseTags = this.getQuestionTags(current);
    const baseSet = new Set(baseTags);
    const currentDifficulty = String(current.difficulty || '').trim().toLowerCase();
    const scored = this.questionsList
      .filter((q) => q.id !== current.id)
      .map((q) => {
        const tags = this.getQuestionTags(q as Question);
        let overlap = 0;
        for (const tag of tags) {
          if (baseSet.has(tag)) overlap += 1;
        }
        const sameDifficulty = String(q.difficulty || '').trim().toLowerCase() === currentDifficulty;
        return { question: q, overlap, sameDifficulty, importance: q.importance ?? 0 };
      })
      .filter((item) => {
        if (baseSet.size > 0) {
          return item.overlap > 0 || item.sameDifficulty;
        }
        return true;
      });

    scored.sort((a, b) =>
      b.overlap - a.overlap
      || Number(b.sameDifficulty) - Number(a.sameDifficulty)
      || b.importance - a.importance
      || (a.question.title || '').localeCompare(b.question.title || '')
    );

    return scored.slice(0, 3).map((item) => ({
      question: item.question,
      difficulty: this.difficultyLabel(item.question.difficulty),
    }));
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private qs: QuestionService,
    private seo: SeoService,
    private progress: UserProgressService,
    public auth: AuthService,
    private activity: ActivityService,
    private analytics: AnalyticsService,
    private appUiStyles: AppUiStylesService,
    private bugReport: BugReportService,
    private experiments: ExperimentService,
    private onboarding: OnboardingService,
    private triviaIncident: TriviaIncidentService,
    private lifecyclePrompts: LifecyclePromptService,
  ) {
    effect(() => {
      const q = this.question();
      const solvedIds = this.progress.solvedIds();
      if (q) {
        this.solved.set(solvedIds.includes(q.id));
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.signupPromptVariant = this.experiments.variant('signup_prompt_copy_v1', 'trivia_detail');
    this.premiumGateVariant = this.experiments.variant('premium_gate_copy_v1', 'trivia_detail');
    this.applySignupPromptCopy();

    this.hydrateState();

    this.sub = this.route.data
      .pipe(
        switchMap((data) => {
          const resolved = data['questionDetail'] as QuestionDetailResolved | undefined;
          if (resolved) {
            this.applyResolved(resolved);
            return of(null);
          }

          return combineLatest([this.route.parent!.paramMap, this.route.paramMap]).pipe(
            map(([parentPm, childPm]) => ({
              tech: parentPm.get('tech')! as Tech,
              id: childPm.get('id')!,
            })),
            tap(({ tech }) => (this.tech = tech)),
            switchMap(({ tech, id }) =>
              this.qs.loadQuestions(tech, 'trivia').pipe(
                tap((all) => {
                  this.questionsList = all;
                  this.dataLoaded = true;
                  this.refreshSidebarQuestions();
                  this.selectQuestion(id);
                  this.syncPracticeIndexById(id);
                })
              )
            )
          );
        })
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.syncSidebarAfterSelection();
    this.startTriviaVisibilityTimer();
    this.updateTriviaScrollDepth();
  }

  ngOnDestroy() {
    this.saveSidebarScrollPosition();
    this.sub?.unsubscribe();
    if (this.triviaVisibleIntervalId !== null) {
      window.clearInterval(this.triviaVisibleIntervalId);
      this.triviaVisibleIntervalId = null;
    }
  }

  onSideScroll() {
    this.saveSidebarScrollPosition();
  }

  onMainScroll() {
    this.updateTriviaScrollDepth();
  }

  onTrackedRootClick(event: Event) {
    const context = this.triviaAnalyticsContext();
    if (!context) return;

    const target = event.target as Element | null;
    const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const targetPath = this.normalizeTrackedInternalPath(anchor);
    if (!targetPath) return;

    const location = this.classifyTriviaLinkLocation(anchor);
    if (!location) return;

    this.analytics.track('trivia_internal_link_clicked', {
      ...context,
      location,
      target_path: targetPath,
    });
  }

  private applyResolved(resolved: QuestionDetailResolved) {
    this.tech = resolved.tech;
    const listEntries = resolved.listSummaries?.length ? resolved.listSummaries : resolved.list;
    this.questionsList = listEntries?.length
      ? listEntries
      : resolved.question ? [resolved.question] : [];
    this.dataLoaded = true;
    this.refreshSidebarQuestions();
    this.selectQuestion(resolved.id, resolved.question);
    this.syncPracticeIndexById(resolved.id);
  }

  private hydrateState() {
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    const browserState = this.isBrowser ? history.state : null;
    const s = (navState ?? browserState) as any;
    this.practice = (s?.session ?? null) as PracticeSession;
    this.sessionSource = typeof s?.sessionSource === 'string' ? s.sessionSource : null;
    this.returnTo = s?.returnTo ?? null;
    this.returnToUrl = typeof s?.returnToUrl === 'string' ? s.returnToUrl : null;
    this.returnLabel.set(s?.returnLabel ?? null);
    this.refreshSidebarQuestions();
  }

  backToReturn() {
    if (this.returnTo) {
      this.router.navigate(this.returnTo);
    } else if (this.returnToUrl) {
      this.router.navigateByUrl(this.returnToUrl);
    } else if (this.isBrowser && window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/coding']);
    }
  }

  private ensurePracticeBuilt(currentId: string) {
    if (!this.practice) {
      const items: PracticeItem[] = this.questionsList.map(q => ({
        tech: this.tech, kind: 'trivia', id: q.id
      }));
      const index = Math.max(0, items.findIndex(i => i.id === currentId));
      this.practice = { items, index };
      this.refreshSidebarQuestions();
    }
  }

  private syncPracticeIndexById(id: string) {
    this.ensurePracticeBuilt(id);
    if (!this.practice) return;
    const i = this.practice.items.findIndex(it => it.id === id);
    if (i >= 0) this.practice = { ...this.practice, index: i };
  }

  private navToPracticeIndex(newIndex: number) {
    if (!this.practice) return;
    const it = this.practice.items[newIndex];
    this.router.navigate(['/', it.tech, it.kind, it.id], {
      state: {
        session: { items: this.practice.items, index: newIndex },
        sessionSource: this.sessionSource ?? undefined,
        returnTo: this.returnTo ?? undefined,
        returnToUrl: this.returnToUrl ?? undefined,
        returnLabel: this.returnLabel() ?? undefined
      }
    });
  }

  private selectQuestion(id: string, resolvedQuestion: Question | null = null) {
    const listHit = this.questionsList.find((q) => q.id === id);
    const found = resolvedQuestion?.id === id
      ? resolvedQuestion
      : this.isFullQuestion(listHit) ? listHit : null;
    this.question.set(found);
    this.ensureQuestionIconFonts(found);
    this.resetTriviaEngagementState();
    this.resetIncidentPrompt();
    this.solved.set(found ? this.progress.isSolved(found.id) : false);
    this.refreshLockedPersonalization();
    this.setLoadState(found);
    if (found && isQuestionLockedForTier(found, this.auth.user())) {
      this.experiments.expose(
        'premium_gate_copy_v1',
        this.premiumGateVariant,
        `trivia_locked_${found.id}`,
        'trivia_detail',
      );
    }
    this.updateSeo(found);
    this.scrollMainToTop();
    this.syncSidebarAfterSelection();
    this.updateTriviaScrollDepth();
  }

  private isFullQuestion(q: QuestionListEntry | Question | undefined): q is Question {
    return !!q && Object.prototype.hasOwnProperty.call(q, 'answer');
  }

  private ensureQuestionIconFonts(q: Question | null): void {
    if (!q || !this.questionUsesFontAwesome(q)) return;
    this.appUiStyles.ensureIconFontsLoaded({ defer: true });
  }

  private questionUsesFontAwesome(q: Question): boolean {
    const haystack = [
      q.description,
      q.answer,
      (q as any).interviewFocus,
      (q as any).incident,
    ];
    return haystack.some((value) => this.valueUsesFontAwesome(value));
  }

  private valueUsesFontAwesome(value: unknown): boolean {
    if (typeof value === 'string') {
      return /\bfa-(?:solid|regular|brands|[a-z0-9-]+)\b/i.test(value);
    }
    if (Array.isArray(value)) {
      return value.some((entry) => this.valueUsesFontAwesome(entry));
    }
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((entry) => this.valueUsesFontAwesome(entry));
    }
    return false;
  }

  private setLoadState(found: Question | null) {
    if (found) {
      this.loadState.set('loaded');
      return;
    }
    if (this.isBrowser && this.dataLoaded) {
      this.loadState.set('notFound');
      return;
    }
    this.loadState.set('loading');
  }

  isActive(q: QuestionListEntry) { return this.question()?.id === q.id; }

  private normalizePreviewText(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/`+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private trimWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}…`;
  }

  private questionDescription(q: Question): string {
    const raw = this.descText(q.description || '');
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain) return plain;
    return `Front-end interview concept question for ${this.tech}.`;
  }

  private seoTitle(q: Question): string {
    return seoTitleForQuestion(q);
  }

  private seoDescription(q: Question): string {
    return seoDescriptionForQuestion(q, this.questionDescription(q), this.tech);
  }

  private questionKeywords(q: Question): string[] {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const companies: string[] = (q as any).companies ?? (q as any).companyTags ?? [];
    const base = ['front end interview concepts', `${this.tech} interview concepts`];

    return Array.from(
      new Set([...base, ...tags, ...companies].map(k => String(k || '').trim()).filter(Boolean))
    );
  }

  private resolveAuthor(q: Question): string {
    return String((q as any).author || 'FrontendAtlas Team').trim() || 'FrontendAtlas Team';
  }

  private resolveUpdatedIso(q: Question): string | null {
    const raw = (q as any).updatedAt;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  private resolvePublishedIso(q: Question, dateModified: string | null): string {
    const raw = (q as any).publishedAt;
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return dateModified || '2025-01-01T00:00:00.000Z';
  }

  visibleQuestionHeadline(q?: Question | null): string {
    const title = this.visibleH1QuestionText(q);
    const intentLabel = this.visibleH1IntentLabel(q);
    if (title && intentLabel) return `${title} - ${intentLabel}`;
    return title || intentLabel;
  }

  visibleH1QuestionText(q?: Question | null): string {
    return String(q?.seo?.h1 || q?.title || '').trim();
  }

  visibleH1IntentLabel(q?: Question | null): string {
    if (String(q?.seo?.h1 || '').trim()) return '';
    return String(q?.seo?.h1IntentLabel || TRIVIA_H1_INTENT_LABEL).trim() || TRIVIA_H1_INTENT_LABEL;
  }

  private structuredDataImageUrl(): string {
    return this.seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  }

  authorLabel(q?: Question | null): string {
    if (!q) return 'FrontendAtlas Team';
    return this.resolveAuthor(q);
  }

  updatedLabel(q?: Question | null): string | null {
    if (!q) return null;
    const iso = this.resolveUpdatedIso(q);
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private updateSeo(q: Question | null): void {
    if (this.suppressSeo) return;
    if (!q) {
      this.seo.updateTags({
        title: 'Front-end interview concept question',
        description: 'Quick front-end concept explanation for interview prep.',
      });
      return;
    }

    const canonical = this.seo.buildCanonicalUrl(`/${this.tech}/trivia/${q.id}`);
    const seoTitle = this.seoTitle(q);
    const description = this.seoDescription(q);
    const keywords = this.questionKeywords(q);
    const authorName = this.resolveAuthor(q);
    const dateModified = this.resolveUpdatedIso(q);
    const datePublished = this.resolvePublishedIso(q, dateModified);
    const imageUrl = this.structuredDataImageUrl();
    const interviewHubUrl = this.interviewQuestionsHubUrl();
    const interviewHubLabel = this.interviewQuestionsHubLabel();
    const studyPlanUrl = this.seo.buildCanonicalUrl(this.studyPlanPath());
    const companiesUrl = this.seo.buildCanonicalUrl('/companies');
    const articleExtensions = this.articleStructuredDataExtensions(q);

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: interviewHubLabel,
          item: interviewHubUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: q.title,
          item: canonical,
        },
      ],
    };

    const article = {
      '@type': 'TechArticle',
      '@id': canonical,
      headline: this.visibleQuestionHeadline(q),
      description,
      url: canonical,
      image: [imageUrl],
      datePublished,
      mainEntityOfPage: canonical,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: authorName },
      publisher: {
        '@type': 'Organization',
        name: 'FrontendAtlas',
        logo: {
          '@type': 'ImageObject',
          url: imageUrl,
        },
      },
      isPartOf: {
        '@type': 'CollectionPage',
        '@id': interviewHubUrl,
        url: interviewHubUrl,
        name: interviewHubLabel,
      },
      about: [
        { '@type': 'Thing', name: `${this.interviewTopicLabel()} interview concepts` },
        { '@type': 'Thing', name: 'Frontend interview preparation' },
      ],
      mentions: [
        { '@type': 'WebPage', name: interviewHubLabel, url: interviewHubUrl },
        { '@type': 'WebPage', name: this.studyPlanLabel(), url: studyPlanUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ],
      ...articleExtensions,
      isAccessibleForFree: q.access !== 'premium',
      keywords: keywords.join(', '),
      dateModified: dateModified || datePublished,
    };

    const questionStructuredData = this.questionStructuredData(q, canonical);
    const jsonLd = questionStructuredData
      ? [breadcrumb, article, questionStructuredData]
      : [breadcrumb, article];

    this.seo.updateTags({
      title: seoTitle,
      description,
      keywords,
      canonical,
      ogType: 'article',
      jsonLd,
    });
  }

  private articleStructuredDataExtensions(q: Question): Record<string, any> {
    if (q.id === 'ngrx-selectors-memoization-derived-state-performance') {
      return {
        articleSection: 'Angular state management',
        about: [
          { '@type': 'Thing', name: 'NgRx selectors' },
          { '@type': 'Thing', name: 'selector memoization' },
          { '@type': 'Thing', name: 'derived state' },
          { '@type': 'Thing', name: 'immutable reducer outputs' },
        ],
        mentions: [
          { '@type': 'Thing', name: 'createSelector' },
          { '@type': 'Thing', name: 'createFeatureSelector' },
          { '@type': 'Thing', name: 'feature selector' },
          { '@type': 'Thing', name: 'entity/base selectors' },
          { '@type': 'Thing', name: 'view model selector' },
          { '@type': 'Thing', name: 'projector function' },
          { '@type': 'Thing', name: 'stable references' },
          { '@type': 'Thing', name: 'root state selection' },
          { '@type': 'Thing', name: 'filter/sort/map derivation' },
          { '@type': 'Thing', name: 'selector factory' },
          { '@type': 'Thing', name: 'projector tests' },
          { '@type': 'Thing', name: 'selector purity' },
          { '@type': 'Thing', name: 'component contract' },
          { '@type': 'Thing', name: 'AsyncPipe' },
          { '@type': 'Thing', name: 'selector projector' },
          { '@type': 'Thing', name: 'memoization trace' },
          { '@type': 'Thing', name: 'NgRx official docs' },
          { '@type': 'Thing', name: 'source reference' },
          { '@type': 'Thing', name: 'projector unit test' },
          { '@type': 'Thing', name: 'FrontendAtlas review note' },
          { '@type': 'Thing', name: 'review evidence' },
          { '@type': 'Thing', name: 'editorial policy' },
          { '@type': 'Thing', name: 'interactive memoization trace' },
          { '@type': 'Thing', name: 'selector recomputation simulator' },
          { '@type': 'Thing', name: 'projector run visualization' },
        ],
        hasPart: [
          { '@type': 'WebPageElement', name: 'Interview quick answer' },
          { '@type': 'WebPageElement', name: 'Memoized read model' },
          { '@type': 'WebPageElement', name: 'Worked example' },
          { '@type': 'WebPageElement', name: 'Failure pattern' },
          { '@type': 'WebPageElement', name: 'Composed selector flow' },
          { '@type': 'WebPageElement', name: 'Memoization behavior' },
          { '@type': 'WebPageElement', name: 'Selector purity and projector tests' },
          { '@type': 'WebPageElement', name: 'Testable proof' },
          { '@type': 'WebPageElement', name: 'Projector run trace' },
          { '@type': 'WebPageElement', name: 'Selector performance pitfalls' },
          { '@type': 'WebPageElement', name: 'Selector factory boundary' },
          { '@type': 'WebPageElement', name: 'Selector review checklist' },
          { '@type': 'WebPageElement', name: 'FrontendAtlas review note' },
          { '@type': 'WebPageElement', name: 'Source check' },
          { '@type': 'WebPageElement', name: 'Selector memoization trace simulator' },
          { '@type': 'WebPageElement', name: 'Interview summary' },
        ],
        citation: [
          {
            '@type': 'WebPage',
            name: 'NgRx Selectors',
            url: 'https://ngrx.io/guide/store/selectors',
          },
          {
            '@type': 'WebPage',
            name: 'NgRx createSelector API',
            url: 'https://ngrx.io/api/store/createSelector',
          },
          {
            '@type': 'WebPage',
            name: 'FrontendAtlas Editorial Policy',
            url: this.seo.buildCanonicalUrl('/legal/editorial-policy'),
          },
        ],
      };
    }

    if (q.id === 'js-equality-vs-strict-equality') {
      return {
        articleSection: 'JavaScript equality and coercion',
        about: [
          { '@type': 'Thing', name: 'JavaScript equality operators' },
          { '@type': 'Thing', name: 'Loose equality' },
          { '@type': 'Thing', name: 'Strict equality' },
          { '@type': 'Thing', name: 'Type coercion' },
        ],
        mentions: [
          { '@type': 'Thing', name: '==' },
          { '@type': 'Thing', name: '===' },
          { '@type': 'Thing', name: '!==' },
          { '@type': 'Thing', name: 'implicit coercion' },
          { '@type': 'Thing', name: 'explicit conversion' },
          { '@type': 'Thing', name: 'IsLooselyEqual' },
          { '@type': 'Thing', name: 'SameValue' },
          { '@type': 'Thing', name: 'SameValueZero' },
          { '@type': 'Thing', name: 'Object.is' },
          { '@type': 'Thing', name: 'DOM input' },
          { '@type': 'Thing', name: 'URLSearchParams' },
          { '@type': 'Thing', name: 'form input' },
          { '@type': 'Thing', name: 'query params' },
          { '@type': 'Thing', name: 'localStorage' },
          { '@type': 'Thing', name: 'API payloads' },
          { '@type': 'Thing', name: 'boundary normalization' },
          { '@type': 'Thing', name: 'null' },
          { '@type': 'Thing', name: 'undefined' },
          { '@type': 'Thing', name: 'NaN' },
          { '@type': 'Thing', name: 'Number.isNaN' },
          { '@type': 'Thing', name: 'Map' },
          { '@type': 'Thing', name: 'Set' },
          { '@type': 'Thing', name: 'Array.prototype.includes' },
          { '@type': 'Thing', name: 'reference equality' },
          { '@type': 'Thing', name: 'FrontendAtlas review note' },
          { '@type': 'Thing', name: 'edge-case test' },
          { '@type': 'Thing', name: 'equality test checklist' },
          { '@type': 'Thing', name: 'senior interview answer' },
          { '@type': 'Thing', name: 'interactive equality predictor' },
          { '@type': 'Thing', name: 'coercion matrix' },
          { '@type': 'Thing', name: 'SameValueZero comparison' },
          { '@type': 'Thing', name: 'edge-case comparison drill' },
        ],
        hasPart: [
          { '@type': 'WebPageElement', name: 'Core idea' },
          { '@type': 'WebPageElement', name: 'Frontend coercion bug matrix' },
          { '@type': 'WebPageElement', name: 'Loose equality' },
          { '@type': 'WebPageElement', name: 'How == decides' },
          { '@type': 'WebPageElement', name: 'Strict equality' },
          { '@type': 'WebPageElement', name: 'Boundary normalization recipes' },
          { '@type': 'WebPageElement', name: 'Junior, mid, and senior interview answer' },
          { '@type': 'WebPageElement', name: 'Beyond ===: Object.is and SameValueZero' },
          { '@type': 'WebPageElement', name: 'Pitfalls' },
          { '@type': 'WebPageElement', name: 'Equality test checklist' },
          { '@type': 'WebPageElement', name: 'Practical rule' },
          { '@type': 'WebPageElement', name: 'FrontendAtlas review note' },
          { '@type': 'WebPageElement', name: 'Equality predictor' },
        ],
      };
    }

    if (q.id === 'js-async-race-conditions') {
      return {
        articleSection: 'JavaScript async concurrency',
        educationalLevel: 'Intermediate',
        learningResourceType: 'Interview answer',
        reviewedBy: { '@type': 'Organization', name: 'FrontendAtlas' },
        about: [
          { '@type': 'Thing', name: 'Async race conditions' },
          { '@type': 'Thing', name: 'Stale UI updates' },
          { '@type': 'Thing', name: 'Request cancellation' },
        ],
        mentions: [
          { '@type': 'Thing', name: 'AbortController' },
          { '@type': 'Thing', name: 'AbortSignal' },
          { '@type': 'Thing', name: 'React useEffect cleanup' },
          { '@type': 'Thing', name: 'AbortError' },
          { '@type': 'Thing', name: 'search-as-you-type' },
          { '@type': 'Thing', name: 'visual race timeline' },
          { '@type': 'Thing', name: 'request id guard' },
          { '@type': 'Thing', name: 'takeLatest' },
          { '@type': 'Thing', name: 'switchMap' },
          { '@type': 'Thing', name: 'Promise.race' },
          { '@type': 'Thing', name: 'debounce' },
          { '@type': 'Thing', name: 'IndexedDB' },
          { '@type': 'Thing', name: 'autosave' },
          { '@type': 'Thing', name: 'Fetch API' },
        ],
        hasPart: [
          { '@type': 'WebPageElement', name: 'The core issue' },
          { '@type': 'WebPageElement', name: 'How to prevent it' },
          { '@type': 'WebPageElement', name: 'Before / after: stale search UI' },
          { '@type': 'WebPageElement', name: 'React useEffect cleanup version' },
          { '@type': 'WebPageElement', name: 'Choosing the right guard' },
          { '@type': 'WebPageElement', name: 'When async work cannot be aborted' },
          { '@type': 'WebPageElement', name: 'Shared-controller follow-up' },
          { '@type': 'WebPageElement', name: 'Pitfalls' },
          { '@type': 'WebPageElement', name: 'Source check' },
          { '@type': 'WebPageElement', name: 'Testable proof' },
          { '@type': 'WebPageElement', name: 'FrontendAtlas review note' },
          { '@type': 'WebPageElement', name: 'Production debugging standard' },
          { '@type': 'WebPageElement', name: 'Async race visual timeline' },
          { '@type': 'WebPageElement', name: 'Async race simulator' },
        ],
        citation: [
          {
            '@type': 'WebPage',
            name: 'MDN AbortController',
            url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
          },
          {
            '@type': 'WebPage',
            name: 'MDN AbortSignal',
            url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal',
          },
          {
            '@type': 'WebPage',
            name: 'MDN Using the Fetch API',
            url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
          },
          {
            '@type': 'WebPage',
            name: 'React useEffect',
            url: 'https://react.dev/reference/react/useEffect',
          },
          {
            '@type': 'WebPage',
            name: 'RxJS switchMap',
            url: 'https://rxjs.dev/api/operators/switchMap',
          },
          {
            '@type': 'WebPage',
            name: 'FrontendAtlas Editorial Policy',
            url: this.seo.buildCanonicalUrl('/legal/editorial'),
          },
        ],
      };
    }

    if (q.id !== 'react-render-nothing-return-value') return {};

    return {
      articleSection: 'React rendering',
      about: [
        { '@type': 'Thing', name: 'React component return values' },
        { '@type': 'Thing', name: 'Conditional rendering' },
        { '@type': 'Thing', name: 'Rendering nothing' },
      ],
      mentions: [
        { '@type': 'Thing', name: 'null' },
        { '@type': 'Thing', name: 'false' },
        { '@type': 'Thing', name: 'undefined' },
        { '@type': 'Thing', name: 'Fragment' },
        { '@type': 'Thing', name: 'ReactNode' },
        { '@type': 'Thing', name: 'missing return' },
        { '@type': 'Thing', name: 'short-circuit rendering' },
        { '@type': 'Thing', name: 'parent conditional rendering' },
        { '@type': 'Thing', name: 'JSX holes' },
        { '@type': 'Thing', name: 'mounted component' },
        { '@type': 'Thing', name: 'effects' },
        { '@type': 'Thing', name: 'React Testing Library' },
        { '@type': 'Thing', name: 'DOM absence assertion' },
        { '@type': 'Thing', name: 'editorial review' },
        { '@type': 'Thing', name: 'interactive demo' },
        { '@type': 'Thing', name: 'DOM output' },
        { '@type': 'Thing', name: 'mounted state' },
      ],
      hasPart: [
        { '@type': 'WebPageElement', name: 'Quick answer' },
        { '@type': 'WebPageElement', name: 'Return value map' },
        { '@type': 'WebPageElement', name: 'Common render-nothing bugs' },
        { '@type': 'WebPageElement', name: 'Code examples' },
        { '@type': 'WebPageElement', name: 'Return value simulator' },
        { '@type': 'WebPageElement', name: 'Return null vs parent conditional rendering' },
        { '@type': 'WebPageElement', name: 'Return null lifecycle notes' },
        { '@type': 'WebPageElement', name: 'Component return vs JSX child semantics' },
        { '@type': 'WebPageElement', name: 'Testable proof' },
        { '@type': 'WebPageElement', name: 'FrontendAtlas review note' },
        { '@type': 'WebPageElement', name: 'Testing and accessibility notes' },
      ],
    };
  }

  private questionStructuredData(q: Question, canonical: string): Record<string, any> | null {
    if (q.id === 'ngrx-selectors-memoization-derived-state-performance') {
      return {
        '@type': 'Question',
        '@id': `${canonical}#question`,
        name: q.title,
        url: canonical,
        inLanguage: 'en',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'NgRx selectors are memoized, pure projection functions that turn store state into reusable derived state. They stay fast when reducers preserve immutable references, components select focused view-model selectors instead of rebuilding data locally, and projector unit tests prove the derived contract without Store setup.',
        },
      };
    }

    if (q.id === 'js-async-race-conditions') {
      return {
        '@type': 'Question',
        '@id': `${canonical}#question`,
        name: q.title,
        url: canonical,
        inLanguage: 'en',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Async race conditions happen when an older request or async task resolves after a newer one and overwrites fresh UI. Fix stale updates with AbortController cancellation, a latest request-id check, or takeLatest-style ownership so only the newest result can render.',
        },
      };
    }

    if (q.id !== 'js-equality-vs-strict-equality') return null;

    return {
      '@type': 'Question',
      '@id': `${canonical}#question`,
      name: q.title,
      url: canonical,
      inLanguage: 'en',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In JavaScript, == performs implicit coercion before comparing. === compares type and value without coercion. Use === by default, and explicitly convert boundary values before comparing.',
      },
    };
  }

  navigateSidebarQuestion(q: QuestionListEntry) {
    this.closeQnav();
    this.saveSidebarScrollPosition();
    this.ensurePracticeBuilt(q.id);
    const targetPath = `/${this.tech}/trivia/${q.id}`;
    const context = this.triviaAnalyticsContext();
    if (context) {
      this.analytics.track('trivia_internal_link_clicked', {
        ...context,
        location: 'sidebar',
        target_path: targetPath,
      });
    }
    this.router.navigate(['/', this.tech, 'trivia', q.id], {
      state: this.buildNavState(q.id),
    });
  }

  toggleQnav() {
    this.qnavOpen.update((v) => !v);
  }

  openQnav() {
    this.qnavOpen.set(true);
  }

  closeQnav() {
    this.qnavOpen.set(false);
  }

  similarNavState(q: QuestionListEntry) {
    return this.buildNavState(q.id);
  }

  // footer actions
  prev() { if (this.hasPrev()) this.navToPracticeIndex(this.practice!.index - 1); }
  next() { if (this.hasNext()) this.navToPracticeIndex(this.practice!.index + 1); }

  // ======= label helpers used by the template =======
  importanceLabel(n?: number): 'Low' | 'Medium' | 'High' {
    if (typeof n !== 'number') return 'Low';
    if (n >= 4) return 'High';
    if (n === 3) return 'Medium';
    return 'Low';
  }

  difficultyLabel(d?: string): 'Easy' | 'Intermediate' | 'Hard' {
    switch ((d || '').toLowerCase()) {
      case 'easy': return 'Easy';
      case 'intermediate': return 'Intermediate';
      case 'hard': return 'Hard';
      default: return 'Easy';
    }
  }

  frameworkPrepRoute(): any[] {
    const slug = this.frameworkPrepSlugForTech();
    return slug ? ['/guides/framework-prep', slug] : ['/guides/framework-prep'];
  }

  studyPlanRoute(): any[] {
    const tech = (this.tech || '').toLowerCase();
    if (tech === 'javascript') return ['/tracks', 'javascript-prep-path', 'mastery'];
    if (tech === 'html' || tech === 'css') return ['/tracks', 'crash-7d', 'preview'];
    return ['/tracks', 'foundations-30d', 'preview'];
  }

  interviewQuestionsHubRoute(): any[] {
    return [this.interviewQuestionsHubPath()];
  }

  interviewQuestionsHubLabel(): string {
    switch ((this.tech || '').toLowerCase()) {
      case 'javascript':
        return 'JavaScript interview questions';
      case 'react':
        return 'React interview questions';
      case 'angular':
        return 'Angular interview questions';
      case 'vue':
        return 'Vue.js interview questions';
      case 'html':
        return 'HTML interview questions';
      case 'css':
        return 'CSS interview questions';
      default:
        return 'Frontend interview questions';
    }
  }

  interviewQuestionsHubCtaLabel(): string {
    return `Practice more ${this.interviewQuestionsHubLabel()}`;
  }

  isHtmlCssTech(): boolean {
    const tech = (this.tech || '').toLowerCase();
    return tech === 'html' || tech === 'css';
  }

  interviewTopicUiLabel(): string {
    return this.interviewTopicLabel();
  }

  practiceFrameText(q?: Question | null): string {
    if (q?.id === 'js-async-race-conditions') {
      return 'Use this drill to explain why debounce alone fails, when AbortController is enough, and when a request-id guard is still required.';
    }
    return `Use this ${this.interviewTopicUiLabel()} interview question to rehearse a quick answer, common mistake, follow-up, and production pitfall.`;
  }

  frameworkPrepCtaLabel(): string {
    return `Open ${this.frameworkPrepLabel()} interview prep path`;
  }

  interviewFocusSummary(q?: Question | null): string {
    const configured = this.readInterviewFocus(q)?.summary;
    if (configured) return configured;

    const topic = this.interviewTopicLabel();
    const concept = this.questionFocusConcept(q);
    return `This ${topic} interview question tests whether you can explain ${concept}, connect it to production trade-offs, and handle common follow-up questions.`;
  }

  interviewFocusItems(q?: Question | null): string[] {
    const configured = this.readInterviewFocus(q)?.tests ?? [];
    const cleanConfigured = configured
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    if (cleanConfigured.length) return cleanConfigured;

    const topic = this.interviewTopicLabel();
    const concept = this.questionFocusConcept(q);
    const tags = q
      ? this.getQuestionTags(q)
        .filter((tag) => tag !== String(this.tech || '').toLowerCase())
        .map((tag) => this.tagToFocusLabel(tag))
        .slice(0, 2)
      : [];
    const tagFocus = tags.length ? `${tags.join(' and ')} reasoning` : `${topic} fundamentals`;

    return [
      `${concept} explanation without falling back to memorized definitions`,
      `${tagFocus}, edge cases, and production failure modes`,
      `How you would answer the most likely ${topic} interview follow-up`,
    ];
  }

  studyPlanLabel(): string {
    const tech = (this.tech || '').toLowerCase();
    if (tech === 'javascript') return 'JavaScript mastery study plan';
    if (tech === 'html' || tech === 'css') return '7-day crash study plan';
    return '30-day foundations study plan';
  }

  hasFrameworkPrepPath(): boolean {
    return this.frameworkPrepSlugForTech() !== null;
  }

  frameworkPrepLabel(): string {
    switch ((this.tech || '').toLowerCase()) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      default:
        return 'Framework';
    }
  }

  private frameworkPrepSlugForTech(): string | null {
    switch ((this.tech || '').toLowerCase()) {
      case 'javascript':
        return 'javascript-prep-path';
      case 'react':
        return 'react-prep-path';
      case 'angular':
        return 'angular-prep-path';
      case 'vue':
        return 'vue-prep-path';
      default:
        return null;
    }
  }

  private studyPlanPath(): string {
    const tech = (this.tech || '').toLowerCase();
    if (tech === 'javascript') return '/tracks/javascript-prep-path/mastery';
    if (tech === 'html' || tech === 'css') return '/tracks/crash-7d/preview';
    return '/tracks/foundations-30d/preview';
  }

  private interviewQuestionsHubPath(): string {
    switch ((this.tech || '').toLowerCase()) {
      case 'javascript':
      case 'react':
      case 'angular':
      case 'vue':
      case 'html':
      case 'css':
        return `/${this.tech}/interview-questions`;
      default:
        return '/interview-questions';
    }
  }

  private interviewQuestionsHubUrl(): string {
    return this.seo.buildCanonicalUrl(this.interviewQuestionsHubPath());
  }

  private interviewQuestionsHubTitleLabel(): string {
    return this.interviewQuestionsHubLabel()
      .replace(/\binterview\b/g, 'Interview')
      .replace(/\bquestions\b/g, 'Questions');
  }

  private interviewTopicLabel(): string {
    switch ((this.tech || '').toLowerCase()) {
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
        return 'Frontend';
    }
  }

  private readInterviewFocus(q?: Question | null): QuestionInterviewFocus | null {
    const focus = q?.interviewFocus;
    if (!focus || typeof focus !== 'object') return null;
    const summary = typeof focus.summary === 'string' ? focus.summary.trim() : '';
    const tests = Array.isArray(focus.tests)
      ? focus.tests.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    if (!summary && !tests.length) return null;
    return { summary, tests };
  }

  private questionFocusConcept(q?: Question | null): string {
    const raw = String(q?.seo?.title || q?.title || 'this concept').trim();
    const cleaned = raw
      .replace(/\binterview\s+question\b/ig, '')
      .replace(/\b(frontend|front-end|javascript|react|angular|vue|html|css)\s+interview\b/ig, '$1')
      .replace(/^(explain|understand|compare)\s+/i, '')
      .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do|actually)\s+/i, '')
      .replace(/^(what|why|how|when|where)\s+/i, '')
      .replace(/\?+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || 'this concept';
  }

  private tagToFocusLabel(tag: string): string {
    return String(tag || '')
      .replace(/-/g, ' ')
      .replace(/\bhttp\b/gi, 'HTTP')
      .replace(/\brxjs\b/gi, 'RxJS')
      .replace(/\bdom\b/gi, 'DOM')
      .replace(/\bapi\b/gi, 'API')
      .replace(/\bdi\b/gi, 'DI')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  /** ============== UI: interactions ============== */
  reportIssue() {
    const q = this.question();
    this.bugReport.open({
      source: 'trivia_detail',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: this.tech,
      questionId: q?.id,
      questionTitle: q?.title,
    });
  }

  reportAccessIssue() {
    const q = this.question();
    this.bugReport.open({
      source: 'trivia_locked',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: this.tech,
      questionId: q?.id,
      questionTitle: q?.title,
    });
  }

  async markComplete() {
    const q = this.question();
    if (!q) return;
    if (this.isCompletionPending()) return;
    if (!this.solved()) {
      const opened = await this.tryOpenIncidentPrompt(q);
      if (opened) return;
    }
    await this.applyCompletionState(q);
  }

  submitLabel(): string {
    if (this.isCompletionPending()) return 'Syncing completion...';
    return this.solved() ? 'Mark as incomplete' : 'Mark as complete';
  }

  isCompletionPending(): boolean {
    return this.activity.isCompletionPending('trivia', this.question()?.id ?? null);
  }

  incidentPromptTitle(): string {
    return this.incidentCard()?.title || 'Root Cause Check';
  }

  incidentPromptQuestion(): string {
    return this.incidentCard()?.scenario || '';
  }

  incidentPromptHint(): string {
    const msg = this.incidentPromptMessage();
    if (msg) return msg;
    return 'Not quite. Re-read the content and try one more time.';
  }

  incidentCanSubmit(): boolean {
    return !this.incidentSubmitBusy && !!this.incidentSelectedOptionId();
  }

  selectIncidentOption(optionId: string) {
    this.incidentSelectedOptionId.set(optionId);
    this.incidentOutcome.set(null);
    this.incidentPromptMessage.set('');
  }

  async submitIncidentChoice() {
    const q = this.question();
    const card = this.incidentCard();
    const selected = this.incidentSelectedOptionId();
    if (!q || !card || !selected) return;
    if (this.incidentPromptQuestionId !== q.id) return;

    this.incidentSubmitBusy = true;
    try {
      const result = await firstValueFrom(this.triviaIncident.answerIncident(this.tech, q.id, selected));
      const isCorrect = !!result?.correct;
      const feedback = String(result?.feedback || '').trim();

      this.analytics.track('trivia_incident_answered', {
        question_id: q.id,
        tech: this.tech,
        selected_option_id: selected,
        correct: isCorrect,
      });

      this.incidentOutcome.set(isCorrect ? 'correct' : 'wrong');
      this.incidentPromptMessage.set(feedback || (isCorrect
        ? 'Correct root cause. Marking this question as completed.'
        : 'Not quite. Re-read the content and try one more time.'));

      if (!isCorrect) return;

      this.incidentPromptOpen = false;
      await this.applyCompletionState(q);
      this.resetIncidentPrompt();
    } catch {
      this.analytics.track('trivia_incident_answer_failed', {
        question_id: q.id,
        tech: this.tech,
      });
      this.incidentOutcome.set('wrong');
      this.incidentPromptMessage.set('Could not validate answer right now. Please try again.');
    } finally {
      this.incidentSubmitBusy = false;
    }
  }

  rereadFromIncidentPrompt() {
    const q = this.question();
    this.analytics.track('trivia_incident_reread_clicked', {
      question_id: q?.id ?? null,
      tech: this.tech,
    });
    this.incidentPromptOpen = false;
    this.resetIncidentPrompt();
    this.scrollMainToTop();
  }

  closeIncidentPrompt() {
    this.incidentPromptOpen = false;
    this.resetIncidentPrompt();
  }

  private async tryOpenIncidentPrompt(q: Question): Promise<boolean> {
    const cached = this.readIncidentCache(q.id);
    if (cached !== undefined) {
      if (!cached) return false;
      this.incidentCard.set(cached);
      this.openIncidentPrompt(q.id, cached.options.length);
      return true;
    }

    if (this.incidentPromptLoading) return true;
    this.incidentPromptLoading = true;
    try {
      const loaded = await firstValueFrom(this.triviaIncident.getIncident(this.tech, q.id));
      const prompt = this.mapIncidentPrompt(loaded);
      this.incidentPromptCache.set(this.incidentCacheKey(q.id), prompt);
      if (!prompt) return false;

      this.incidentCard.set(prompt);
      this.openIncidentPrompt(q.id, prompt.options.length);
      return true;
    } catch {
      this.analytics.track('trivia_incident_load_failed', {
        question_id: q.id,
        tech: this.tech,
      });
      return false;
    } finally {
      this.incidentPromptLoading = false;
    }
  }

  private openIncidentPrompt(questionId: string, optionCount: number) {
    this.incidentPromptQuestionId = questionId;
    this.incidentSelectedOptionId.set(null);
    this.incidentOutcome.set(null);
    this.incidentPromptMessage.set('');
    this.incidentSubmitBusy = false;
    this.incidentPromptOpen = true;

    this.analytics.track('trivia_incident_shown', {
      question_id: questionId,
      tech: this.tech,
      option_count: optionCount,
    });
  }

  private resetIncidentPrompt() {
    this.incidentPromptQuestionId = null;
    this.incidentSelectedOptionId.set(null);
    this.incidentOutcome.set(null);
    this.incidentPromptMessage.set('');
    this.incidentCard.set(null);
    this.incidentSubmitBusy = false;
  }

  private mapIncidentPrompt(raw: TriviaIncidentPrompt | null): IncidentCardModel | null {
    if (!raw || typeof raw !== 'object') return null;
    const scenario = String(raw.scenario || '').trim();
    if (!scenario) return null;

    const options = Array.isArray(raw.options)
      ? raw.options
        .map((entry) => ({
          id: String(entry?.id || '').trim(),
          label: String(entry?.label || '').trim(),
        }))
        .filter((entry) => entry.id && entry.label)
      : [];

    if (options.length < 2 || options.length > 4) return null;
    return {
      title: String(raw.title || '').trim() || 'Root Cause Check',
      scenario,
      options,
    };
  }

  private incidentCacheKey(questionId: string): string {
    return `${this.tech || 'unknown'}:${questionId}`;
  }

  private readIncidentCache(questionId: string): IncidentCardModel | null | undefined {
    const key = this.incidentCacheKey(questionId);
    if (!this.incidentPromptCache.has(key)) return undefined;
    return this.incidentPromptCache.get(key) ?? null;
  }

  private async applyCompletionState(q: Question) {
    if (!this.auth.isLoggedIn()) {
      this.experiments.expose(
        'signup_prompt_copy_v1',
        this.signupPromptVariant,
        'trivia_mark_complete_prompt',
        'trivia_detail',
      );
      this.analytics.track('signup_prompt_shown', {
        context: 'trivia_mark_complete',
        question_id: q.id,
        tech: this.tech,
        variant: this.signupPromptVariant,
      });
      this.onboarding.markPending('save_prompt');
      this.loginPromptOpen = true;
      return;
    }

    const wasSolved = this.solved();
    if (wasSolved) {
      await firstValueFrom(this.activity.uncomplete({
        kind: 'trivia',
        tech: this.tech,
        itemId: q.id,
      }));
      this.solved.set(false);
      return;
    }

    try {
      const res: any = await firstValueFrom(this.activity.complete({
        kind: 'trivia',
        tech: this.tech,
        itemId: q.id,
        source: 'tech',
        durationMin: 3,
        difficulty: q.difficulty,
      }));
      if (res?.pending) {
        return;
      }
      if (res?.credited === false && !res?.stats) {
        return;
      }
      if (Array.isArray(res?.solvedQuestionIds)) {
        this.progress.setSolvedIds(res.solvedQuestionIds);
      } else {
        this.progress.markSolvedLocal(q.id);
      }
      this.solved.set(true);
      this.maybePromptLifecycle('trivia_mark_complete', q.id);
    } catch {
      return;
    }
  }

  goToLogin() {
    this.loginPromptOpen = false;
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: this.router.url || '/' },
    });
  }

  goToPricing() {
    const profile = this.onboarding.getProfile();
    this.analytics.track('premium_gate_path_clicked', {
      action: 'view_pricing',
      context: 'trivia_locked',
      question_id: this.question()?.id ?? null,
      tech: this.tech,
      kind: 'trivia',
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
    });
    this.router.navigate(['/pricing'], {
      queryParams: {
        src: `trivia_locked_${this.tech || 'javascript'}`,
        framework: profile?.framework ?? undefined,
        timeline: profile?.timeline ?? undefined,
      },
    });
  }

  lifecyclePromptTitle(): string {
    if (!this.lifecyclePromptMilestone) return 'Keep your momentum';
    const target = this.lifecyclePrompts.thresholdFor(this.lifecyclePromptMilestone);
    return `${target} solved. Keep your interview signal rising.`;
  }

  lifecyclePromptBody(): string {
    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile, this.tech);
    if (profile) {
      return `You selected ${frameworkLabel(framework)} with a ${timelineLabel(profile.timeline)}. Choose the next high-signal action now.`;
    }
    return 'Set your next focused action while this concept is still fresh.';
  }

  dismissLifecyclePrompt() {
    if (this.lifecyclePromptMilestone) {
      this.lifecyclePrompts.markDismissed(this.lifecyclePromptMilestone);
      this.analytics.track('lifecycle_prompt_dismissed', {
        milestone_id: this.lifecyclePromptMilestone,
        solved_total: this.lifecyclePromptSolvedTotal,
        question_id: this.lifecyclePromptQuestionId,
        tech: this.tech,
        kind: 'trivia',
      });
    }
    this.lifecyclePromptOpen = false;
  }

  openLifecycleOnboarding() {
    const profile = this.onboarding.getProfile();
    if (this.lifecyclePromptMilestone) {
      this.lifecyclePrompts.markAccepted(this.lifecyclePromptMilestone);
      this.analytics.track('lifecycle_prompt_cta_clicked', {
        action: 'next_actions',
        milestone_id: this.lifecyclePromptMilestone,
        solved_total: this.lifecyclePromptSolvedTotal,
        question_id: this.lifecyclePromptQuestionId,
        tech: this.tech,
        kind: 'trivia',
        framework: profile?.framework ?? null,
        timeline: profile?.timeline ?? null,
      });
    }
    this.lifecyclePromptOpen = false;
    this.router.navigate(['/onboarding/quick-start'], {
      queryParams: {
        src: 'lifecycle_prompt',
        trigger: 'save_prompt',
        tech: this.tech,
        view: profile ? 'next' : undefined,
      },
    });
  }

  openLifecyclePricing() {
    const profile = this.onboarding.getProfile();
    if (this.lifecyclePromptMilestone) {
      this.lifecyclePrompts.markAccepted(this.lifecyclePromptMilestone);
      this.analytics.track('lifecycle_prompt_cta_clicked', {
        action: 'view_pricing',
        milestone_id: this.lifecyclePromptMilestone,
        solved_total: this.lifecyclePromptSolvedTotal,
        question_id: this.lifecyclePromptQuestionId,
        tech: this.tech,
        kind: 'trivia',
        framework: profile?.framework ?? null,
        timeline: profile?.timeline ?? null,
      });
    }
    this.lifecyclePromptOpen = false;
    this.router.navigate(['/pricing'], {
      queryParams: {
        src: 'lifecycle_prompt',
        framework: profile?.framework ?? undefined,
        timeline: profile?.timeline ?? undefined,
      },
    });
  }

  trackLockedPathClick(pathId: string) {
    const profile = this.onboarding.getProfile();
    this.analytics.track('premium_unlock_path_clicked', {
      path_id: pathId,
      context: 'trivia_locked',
      question_id: this.question()?.id ?? null,
      tech: this.tech,
      kind: 'trivia',
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
    });
  }

  private applySignupPromptCopy() {
    if (this.signupPromptVariant === 'benefit') {
      this.loginPromptTitle = 'Save this streak and keep momentum';
      this.loginPromptBody = 'Create a free account to keep solved progress and continue with personalized next steps.';
      this.loginPromptCta = 'Save progress free';
      return;
    }

    this.loginPromptTitle = 'Sign in to save progress';
    this.loginPromptBody = 'To track completed questions and keep your progress synced, sign in or create a free account.';
    this.loginPromptCta = 'Go to login';
  }

  private personalizedMemberCopy(variant: 'control' | 'value'): string {
    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile, this.tech);
    if (profile) {
      if (variant === 'value') {
        return `You’re previewing premium depth for ${frameworkLabel(framework)} in a ${timelineLabel(profile.timeline)}. Upgrade to unlock full guided answers.`;
      }
      return `You’re on a ${frameworkLabel(framework)} ${timelineLabel(profile.timeline)}. Upgrade to view full premium answers for this path.`;
    }
    return variant === 'value'
      ? 'You’re viewing a premium preview. Upgrade to unlock the complete answer and guided reasoning.'
      : "You're on the free tier. Upgrade to view this answer.";
  }

  private personalizedGuestCopy(variant: 'control' | 'value'): string {
    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile, this.tech);
    if (profile) {
      return `This answer is premium for your ${frameworkLabel(framework)} path. Upgrade for full detail, or sign in if you already upgraded.`;
    }
    return variant === 'value'
      ? 'This answer is premium. Upgrade for full detail, or sign in if you already upgraded.'
      : 'Upgrade to FrontendAtlas Premium to view this answer. Already upgraded? Sign in to continue.';
  }

  private refreshLockedPersonalization() {
    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile, this.tech);
    const challenge = freeChallengeForFramework(framework);
    this.lockedPersonalizationLine = profile
      ? `Selected path: ${frameworkLabel(framework)} · ${timelineLabel(profile.timeline)}.`
      : '';
    this.lockedPaths = [
      {
        id: 'free_challenge',
        label: challenge.label,
        route: challenge.route,
        queryParams: { src: `trivia_locked_${this.tech || 'javascript'}` },
      },
      {
        id: 'tracks_preview',
        label: 'Open track previews',
        route: ['/tracks'],
        queryParams: { src: `trivia_locked_${this.tech || 'javascript'}` },
      },
      {
        id: 'companies_preview',
        label: 'Browse company previews',
        route: ['/companies'],
        queryParams: { src: `trivia_locked_${this.tech || 'javascript'}` },
      },
    ];
  }

  private maybePromptLifecycle(source: string, questionId: string) {
    if (!this.auth.isLoggedIn()) return;
    const solvedTotal = this.progress.solvedIds().length;
    const milestone = this.lifecyclePrompts.nextMilestone(solvedTotal);
    if (!milestone) return;

    this.lifecyclePrompts.markShown(milestone);
    this.lifecyclePromptMilestone = milestone;
    this.lifecyclePromptSolvedTotal = solvedTotal;
    this.lifecyclePromptQuestionId = questionId;
    this.lifecyclePromptOpen = true;

    const profile = this.onboarding.getProfile();
    this.analytics.track('lifecycle_prompt_shown', {
      source,
      milestone_id: milestone,
      solved_total: solvedTotal,
      question_id: questionId,
      tech: this.tech,
      kind: 'trivia',
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
    });
  }

  copy(code: string, idx: number) {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(code ?? '').catch(() => { });
    this.copiedIndex.set(idx);

    const el = document.getElementById('sr-announcer');
    if (el) el.textContent = 'Copied to clipboard';

    setTimeout(() => this.copiedIndex.set(null), 1200);
  }

  descText(desc: unknown): string {
    if (typeof desc === 'string') return desc;
    const obj = desc as any;
    if (obj && typeof obj.text === 'string') return obj.text;
    return '';
  }

  private buildNavState(targetId: string) {
    const session = this.practice ?? this.buildSessionFromList();
    const index = session
      ? Math.max(0, session.items.findIndex((item) => item.id === targetId))
      : 0;
    const normalizedSession = session ? { items: session.items, index } : undefined;

    return {
      session: normalizedSession,
      sessionSource: this.sessionSource ?? undefined,
      returnTo: this.returnTo ?? undefined,
      returnToUrl: this.returnToUrl ?? undefined,
      returnLabel: this.returnLabel() ?? undefined,
    };
  }

  private buildSessionFromList(): PracticeSession | null {
    if (!this.questionsList.length) return null;
    const items: PracticeItem[] = this.questionsList.map(q => ({
      tech: this.tech, kind: 'trivia', id: q.id
    }));
    const index = Math.max(0, items.findIndex((item) => item.id === this.question()?.id));
    return { items, index };
  }

  private refreshSidebarQuestions() {
    const sessionItems = (this.practice?.items ?? [])
      .filter((item) => item.kind === 'trivia' && item.tech === this.tech);

    if (!sessionItems.length) {
      this.sidebarQuestions = this.questionsList;
      this.sidebarTitle = 'All Questions';
      return;
    }

    const byId = new Map(this.questionsList.map((q) => [q.id, q] as const));
    const ordered: QuestionListEntry[] = [];
    const seen = new Set<string>();

    for (const item of sessionItems) {
      if (seen.has(item.id)) continue;
      const hit = byId.get(item.id);
      if (!hit) continue;
      seen.add(item.id);
      ordered.push(hit);
    }

    if (!ordered.length) {
      this.sidebarQuestions = this.questionsList;
      this.sidebarTitle = 'All Questions';
      return;
    }

    this.sidebarQuestions = ordered;
    this.sidebarTitle = this.sessionSource === 'mastery' ? 'Mastery Questions' : 'Practice Questions';
  }

  private normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) return [];
    const normalized = tags
      .map((tag) => String(tag || '').trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }

  private getQuestionTags(q: Question): string[] {
    const explicit = this.normalizeTags(q.tags);
    if (explicit.length) return explicit;
    return this.deriveTagsFromText(q);
  }

  private deriveTagsFromText(q: Question): string[] {
    const text = this.questionTextForTags(q);
    if (!text) return [];
    const matched: string[] = [];
    for (const matcher of TAG_MATCHERS) {
      if (matcher.re.test(text)) matched.push(matcher.tag);
    }
    return matched;
  }

  private questionTextForTags(q: Question): string {
    const description = this.descriptionTextForTags(q.description);
    return `${q.title || ''} ${description || ''}`
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private descriptionTextForTags(desc: unknown): string {
    if (typeof desc === 'string') return desc;
    const obj = desc as any;
    if (obj && typeof obj.summary === 'string') return obj.summary;
    if (obj && typeof obj.text === 'string') return obj.text;
    return '';
  }

  private decodeHtmlEntities(s: string): string {
    // Fast path for common entities (also fixes double-escaped cases like "&amp;lt;")
    return (s ?? '')
      .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&') // &amp;lt; -> &lt; (etc.)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private scrollMainToTop() {
    if (!this.isBrowser) return;
    const el = this.mainScroll?.nativeElement;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: 0 });
    });
  }

  private triviaAnalyticsContext() {
    const q = this.question();
    if (!this.isBrowser || !q || this.locked() || this.loadState() !== 'loaded') return null;
    return {
      tech: this.tech,
      question_id: q.id,
      question_title: q.title,
    };
  }

  private resetTriviaEngagementState() {
    this.maxTriviaDepthPercent = 0;
    this.trackedTriviaDepths = new Set<number>();
    this.triviaReadEngagedTracked = false;
    this.visibleTriviaMs = 0;
  }

  private startTriviaVisibilityTimer() {
    if (!this.isBrowser || this.triviaVisibleIntervalId !== null) return;
    this.ngZone.runOutsideAngular(() => {
      this.triviaVisibleIntervalId = window.setInterval(() => {
        if (document.hidden || !this.triviaAnalyticsContext()) return;
        this.visibleTriviaMs += 1000;
        this.maybeTrackTriviaReadEngaged();
      }, 1000);
    });
  }

  private updateTriviaScrollDepth() {
    const context = this.triviaAnalyticsContext();
    if (!context) return;

    const depthPercent = this.computeTriviaScrollDepth();
    if (depthPercent > this.maxTriviaDepthPercent) {
      this.maxTriviaDepthPercent = depthPercent;
      TRIVIA_SCROLL_THRESHOLDS.forEach((threshold) => {
        if (depthPercent < threshold || this.trackedTriviaDepths.has(threshold)) return;
        this.trackedTriviaDepths.add(threshold);
        this.analytics.track('trivia_scroll_depth', {
          ...context,
          depth_percent: threshold,
        });
      });
    }

    this.maybeTrackTriviaReadEngaged();
  }

  private computeTriviaScrollDepth(): number {
    const container = this.mainScroll?.nativeElement;
    if (!container) return 0;

    const scrollHeight = Math.max(container.scrollHeight, 1);
    const reached = Math.min(scrollHeight, container.scrollTop + container.clientHeight);
    return Math.max(0, Math.min(100, Math.round((reached / scrollHeight) * 100)));
  }

  private maybeTrackTriviaReadEngaged() {
    if (this.triviaReadEngagedTracked) return;
    const context = this.triviaAnalyticsContext();
    if (!context) return;
    if (this.maxTriviaDepthPercent < 50) return;
    if (this.visibleTriviaMs < 30_000) return;

    this.triviaReadEngagedTracked = true;
    this.analytics.track('trivia_read_engaged', {
      ...context,
      seconds_visible: Math.floor(this.visibleTriviaMs / 1000),
      max_depth_percent: this.maxTriviaDepthPercent,
    });
  }

  private normalizeTrackedInternalPath(anchor: HTMLAnchorElement): string | null {
    if (!this.isBrowser) return null;

    const rawHref = String(anchor.getAttribute('href') || anchor.href || '').trim();
    if (!rawHref || rawHref.startsWith('#')) return null;

    let targetUrl;
    try {
      targetUrl = new URL(rawHref, window.location.origin);
    } catch {
      return null;
    }

    if (targetUrl.origin !== window.location.origin) return null;

    const currentUrl = new URL(window.location.href);
    if (
      targetUrl.pathname === currentUrl.pathname
      && targetUrl.search === currentUrl.search
      && !!targetUrl.hash
    ) {
      return null;
    }

    return `${targetUrl.pathname}${targetUrl.search}`;
  }

  private classifyTriviaLinkLocation(anchor: HTMLAnchorElement): TriviaAnalyticsLocation | null {
    if (anchor.closest('.mobile-qnav__body')) return 'mobile_nav';
    if (anchor.closest('.side')) return 'sidebar';

    const explicitZone = anchor.closest('[data-trivia-link-zone]')?.getAttribute('data-trivia-link-zone');
    if (explicitZone === 'similar' || explicitZone === 'guides' || explicitZone === 'prep_bridge') {
      return explicitZone;
    }
    if (anchor.closest('.content')) return 'body';
    return null;
  }

  private sideScrollStorageKey(): string {
    return `${this.sideScrollStoragePrefix}${this.tech || 'unknown'}`;
  }

  private saveSidebarScrollPosition(scrollTop?: number) {
    if (!this.isBrowser) return;
    const current = typeof scrollTop === 'number' ? scrollTop : this.sideScroll?.nativeElement?.scrollTop;
    if (typeof current !== 'number' || !Number.isFinite(current)) return;
    const normalized = Math.max(0, Math.round(current));
    try {
      sessionStorage.setItem(this.sideScrollStorageKey(), String(normalized));
    } catch {
      return;
    }
  }

  private readSidebarScrollPosition(): number | null {
    if (!this.isBrowser) return null;
    try {
      const raw = sessionStorage.getItem(this.sideScrollStorageKey());
      if (raw == null) return null;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return null;
      return Math.max(0, parsed);
    } catch {
      return null;
    }
  }

  private syncSidebarAfterSelection() {
    if (!this.isBrowser) return;
    requestAnimationFrame(() => {
      const container = this.sideScroll?.nativeElement;
      if (!container) return;

      const storedTop = this.readSidebarScrollPosition();
      if (storedTop != null && Math.abs(container.scrollTop - storedTop) > 1) {
        container.scrollTop = storedTop;
      }

      const activeItem = container.querySelector<HTMLElement>('.side-item.is-active');
      if (activeItem) {
        this.ensureItemVisible(container, activeItem);
      }

      this.saveSidebarScrollPosition(container.scrollTop);
    });
  }

  private ensureItemVisible(container: HTMLElement, item: HTMLElement) {
    const padding = 10;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;

    if (itemTop >= containerTop + padding && itemBottom <= containerBottom - padding) {
      return;
    }

    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const centeredTop = itemTop - (container.clientHeight - item.offsetHeight) / 2;
    const targetTop = Math.max(0, Math.min(maxTop, centeredTop - padding));
    container.scrollTop = targetTop;
  }

  dedent(source: string = ''): string {
    const normalized = (source ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/^\n+|\n+$/g, '');
    const lines = normalized.split('\n');
    const indents = lines
      .filter((line) => line.trim().length > 0)
      .map((line) => (line.match(/^[^\S\r\n]*/)?.[0].length ?? 0));
    const pad = indents.length ? Math.min(...indents) : 0;
    return lines.map((line) => line.slice(pad)).join('\n');
  }

  // ================== Markdown -> HTML with a tiny HTML whitelist ==================
  // 2) Full, corrected md()
  md(src: unknown): string {
    let raw = typeof src === 'string'
      ? src
      : (src && (src as any).toString ? (src as any).toString() : '');

    // Fix legacy content that contains HTML entities like "&lt;div /&gt;"
    raw = this.decodeHtmlEntities(raw);

    // Normalize CRLF
    let text = raw.replace(/\r\n?/g, '\n');

    // Ensure list/heading/quote starters begin a new paragraph
    text = text.replace(
      /([^\n])\n(?=([ \t]{0,3}(?:\d+\.\s|[-*]\s|#{1,3}\s|>\s)))/g,
      '$1\n\n'
    );

    // -------- 1) Extract fenced code blocks into placeholders --------
    const blocks: string[] = [];
    text = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (_m: any, lang: string | undefined, body: string) => {
      const esc = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const langClass = lang ? ` class="language-${lang}"` : '';
      const html = `<pre class="md-pre"><code${langClass}>${esc}</code></pre>`;
      const token = `__FENCE_BLOCK_${blocks.length}__`;
      blocks.push(html);
      return `\n${token}\n`;
    });

    // -------- 2) Escape everything else --------
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Protect standalone HTML tag mentions so they stay visible as text.
    const literalTagTokens: string[] = [];
    const looksLikeInlineTagMention = (suffix: string): boolean =>
      /^\s*(?:,|\.|;|:|\(|\)|\]|\?|!|and\b|or\b|tags?\b|elements?\b|defines?\b|means?\b|does\b|is\b|stands?\b|used\b|for\b)/i
        .test(suffix);

    html = html.replace(
      /&lt;(\/?)(ol|ul|li|br|table|thead|tbody|tr|th|td|blockquote|h[1-6])&gt;/gi,
      (fullMatch: string, slash: string, rawTag: string, offset: number, full: string) => {
        const tag = rawTag.toLowerCase();
        const isClosing = slash === '/';
        const before = full.slice(0, offset);
        const after = full.slice(offset + fullMatch.length);
        const mentionByContext = looksLikeInlineTagMention(after);

        let shouldLiteralize = false;

        if (tag === 'br') {
          shouldLiteralize = mentionByContext;
        } else if (isClosing) {
          const openRe = new RegExp(`&lt;${tag}&gt;`, 'i');
          shouldLiteralize = !openRe.test(before);
        } else {
          const closeRe = new RegExp(`&lt;\\/${tag}&gt;`, 'i');
          shouldLiteralize = mentionByContext || !closeRe.test(after);
        }

        if (!shouldLiteralize) return fullMatch;

        const token = `__LIT_TAG_${literalTagTokens.length}__`;
        literalTagTokens.push(`<code class="inline-code">&lt;${isClosing ? '/' : ''}${tag}&gt;</code>`);
        return token;
      }
    );

    // -------- 3) Font Awesome <i class="..."></i> — handle first --------
    html = html.replace(
      /&lt;i\s+class=(?:"|')([^"'&]+)(?:"|')\s*&gt;(?:&lt;\/i&gt;|<\/i>)/g,
      (_m: any, cls: string) => {
        const classes = cls.split(/\s+/).filter(Boolean);
        const isAllowed = classes.every(c =>
          /^(fa|fa-solid|fa-regular|fa-brands)$/i.test(c) || /^fa-[a-z0-9-]+$/i.test(c)
        );
        return isAllowed ? `<i class="${classes.join(' ')}"></i>` : '';
      }
    );

    // -------- 4) Unescape a tiny whitelist of real tags (NO <i> here) --------
    html = html.replace(
      /&lt;(\/?)(strong|em|code|ul|li|ol|br|b|table|thead|tbody|tr|th|td|blockquote|h[1-6])&gt;/g,
      '<$1$2>'
    );

    // -------- 4b) Any remaining escaped tag *names* => show as literal code --------
    // (Happens in prose like: "Here, &lt;b&gt; is only used…")
    html = html.replace(
      /&lt;\/?(?:strong|b|em|i|u|small|mark|del|code|br|span|div|p|h[1-6])&gt;/g,
      (m: string) => `<code>${m}</code>`
    );

    // Inline backticks + **bold**
    html = this.renderRawAnchorLinks(html);
    html = this.renderMarkdownLinks(html);
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Allow <pre class="md-pre">…</pre> explicitly present in JSON
    html = html.replace(
      /&lt;pre\s+class=(?:"|')md-pre(?:"|')&gt;([\s\S]*?)&lt;\/pre&gt;/g,
      (_m: any, inner: string) => `<pre class="md-pre">${inner}</pre>`
    );

    // Headings
    html = html
      .replace(/^###\s?(.*)$/gm, '<h4 class="md-h md-h4">$1</h4>')
      .replace(/^##\s?(.*)$/gm, '<h3 class="md-h md-h3">$1</h3>')
      .replace(/^#\s?(.*)$/gm, '<h2 class="md-h md-h2">$1</h2>');

    // Lists
    html = this.renderMarkdownLists(html);

    // Blockquotes (already whitelisted above too)
    html = html.replace(/^\>\s?(.*)$/gm, '<blockquote class="md-quote">$1</blockquote>');

    // -------- 5) Restore fenced code blocks --------
    blocks.forEach((blockHtml, i) => {
      const token = new RegExp(`__FENCE_BLOCK_${i}__`, 'g');
      html = html.replace(token, blockHtml);
    });

    // -------- 6) Paragraph splitting --------
    html = html
      .split(/\n{2,}/)
      .map((chunk: string) =>
        /^\s*<(h\d|ul|ol|li|blockquote|pre)/.test(chunk)
          ? chunk
          : `<p>${chunk.replace(/\n/g, '<br/>')}</p>`
      )
      .join('');

    // Restore protected literal tag mentions after all markdown/html transforms.
    literalTagTokens.forEach((literalHtml, i) => {
      html = html.replace(new RegExp(`__LIT_TAG_${i}__`, 'g'), literalHtml);
    });

    return html;
  }

  private renderMarkdownLinks(source: string): string {
    return source.replace(
      /\[([^\]\n]+)\]\(([^)\s]+)\)/g,
      (match: string, label: string, rawHref: string) => {
        return this.buildSafeLink(rawHref, label) || match;
      }
    );
  }

  private renderRawAnchorLinks(source: string): string {
    return source.replace(
      /&lt;a\b([^<>]*?)&gt;([\s\S]*?)&lt;\/a&gt;/gi,
      (match: string, rawAttrs: string, labelHtml: string) => {
        const attrs = this.parseRawAnchorAttributes(rawAttrs);
        if (!attrs) return match;
        const href = attrs.get('href');
        if (!href) return match;

        return this.buildSafeLink(href, labelHtml, {
          target: attrs.get('target'),
          rel: attrs.get('rel'),
        }) || match;
      }
    );
  }

  private parseRawAnchorAttributes(rawAttrs: string): Map<string, string> | null {
    const allowed = new Set(['href', 'target', 'rel']);
    const attrs = new Map<string, string>();
    let index = 0;

    while (index < rawAttrs.length) {
      const rest = rawAttrs.slice(index);
      if (!rest.trim()) break;

      const match = rest.match(/^\s+([a-zA-Z][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/);
      if (!match) return null;

      const name = match[1].toLowerCase();
      if (!allowed.has(name)) return null;

      attrs.set(name, match[2] ?? match[3] ?? match[4] ?? '');
      index += match[0].length;
    }

    return rawAttrs.slice(index).trim() ? null : attrs;
  }

  private buildSafeLink(
    rawHref: string,
    labelHtml: string,
    options: { target?: string; rel?: string } = {}
  ): string | null {
    const href = this.safeLinkHref(rawHref);
    if (!href) return null;

    const target = this.safeLinkTarget(options.target, /^https?:\/\//i.test(href));
    const rel = this.safeLinkRel(options.rel, target);
    const targetAttr = target ? ` target="${this.escapeHtmlAttr(target)}"` : '';
    const relAttr = rel ? ` rel="${this.escapeHtmlAttr(rel)}"` : '';

    return `<a href="${this.escapeHtmlAttr(href)}"${targetAttr}${relAttr}>${labelHtml}</a>`;
  }

  private safeLinkHref(rawHref: string): string | null {
    const normalized = this.decodeHtmlEntities(rawHref).trim();
    if (/^(?:https?:\/\/|\/(?!\/)|#)[^\s"'<>]+$/i.test(normalized)) return normalized;
    return null;
  }

  private safeLinkTarget(rawTarget: string | undefined, isExternal: boolean): string {
    const normalized = this.decodeHtmlEntities(rawTarget || '').trim();
    if (!normalized) return isExternal ? '_blank' : '';
    if (/^_(?:blank|self|parent|top)$/i.test(normalized)) return normalized.toLowerCase();
    if (/^[a-z][\w-]*$/i.test(normalized)) return normalized;
    return isExternal ? '_blank' : '';
  }

  private safeLinkRel(rawRel: string | undefined, target: string): string {
    const values = this.decodeHtmlEntities(rawRel || '')
      .split(/\s+/)
      .map((value) => value.trim())
      .filter((value) => /^[a-z0-9-]+$/i.test(value));
    const rel = new Set(values);

    if (target.toLowerCase() === '_blank') {
      rel.add('noopener');
      rel.add('noreferrer');
    }

    return Array.from(rel).join(' ');
  }

  private escapeHtmlAttr(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private renderMarkdownLists(source: string): string {
    const orderedPattern = /^[ \t]{0,3}\d+\.\s+(.+)$/;
    const unorderedPattern = /^[ \t]{0,3}[-*]\s+(.+)$/;
    const lines = source.split('\n');
    const output: string[] = [];

    for (let index = 0; index < lines.length;) {
      const orderedMatch = lines[index].match(orderedPattern);
      const unorderedMatch = lines[index].match(unorderedPattern);

      if (!orderedMatch && !unorderedMatch) {
        output.push(lines[index]);
        index += 1;
        continue;
      }

      const isOrdered = Boolean(orderedMatch);
      const tagName = isOrdered ? 'ol' : 'ul';
      const className = isOrdered ? 'md-ol' : 'md-ul';
      const pattern = isOrdered ? orderedPattern : unorderedPattern;
      const items: string[] = [];

      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(`<li>${match[1]}</li>`);
        index += 1;
      }

      output.push(`<${tagName} class="${className}">${items.join('')}</${tagName}>`);
    }

    return output.join('\n');
  }

}
