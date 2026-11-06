import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Injector, OnInit, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { from, map, switchMap } from 'rxjs';
import { CompanyPreviewQuestion, CompanyPreviewResolved } from '../../../core/models/company-public.model';
import { Difficulty } from '../../../core/models/question.model';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { Tech } from '../../../core/models/user.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeoService } from '../../../core/services/seo.service';
import { isPremiumRoute } from '../../../core/utils/premium-route.util';
import { hasPremium } from '../company-plan/company-plan-access';
import { cleanCompanyPlanAnswers } from '../company-plan/company-plan-draft';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from '../company-plan/company-plan-sets';
import type { CompanyPlanData } from '../company-plan/company-plan.engine';
import { LEVEL_LABELS, WHEN_LABELS, companySetLine, joinNames } from '../company-plan/company-plan.format';
import type { CompanyPlanService } from '../company-plan/company-plan.service';
import { companyBrandFor } from '../../../shared/company-branding';
import { SHOWCASE_STATS } from '../../../generated/content-metadata';
import type { AuthoredCompanyPreview, AuthoredSource } from '../../../shared/company-previews/authored-company-preview.model';
import { AUTHORED_COMPANY_PREVIEWS_TOKEN } from '../../../shared/company-previews/authored-company-previews';
import type { CompanyEditorialNotes } from '../../../shared/company-previews/company-editorial-notes.model';
import { COMPANY_EDITORIAL_NOTES, type CompanyEditorialNotesRegistry } from '../../../shared/company-previews/company-editorial-notes';
import { companyEvidence, evidenceFrom, fillAuthoredPreview, type CompanyEvidence, type CompanyEvidenceCounts } from './company-evidence';
// Not the plan's family helper: an import from shared/company-previews would date every guide by this component.
import { FRAMEWORK_FAMILY_BY_ID } from '../../../shared/framework-families';
import { COMPANY_OFFICIAL_GUIDES, type CompanyOfficialGuide } from '../../../shared/company-previews/company-official-guides';
import { isCompanyGuideGated } from './company-guide-gate';
import {
  COMPANY_INTERVIEW_PROCESSES,
  type CompanyInterviewProcess,
} from '../../../shared/company-previews/company-interview-processes';
import type { CompanyReportedItem } from '../../../core/models/company-public.model';
import { CompanyOfficialGuidesComponent } from '../../../shared/components/company-official-guides/company-official-guides.component';
import { CompanyInterviewProcessComponent } from '../../../shared/components/company-interview-process/company-interview-process.component';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import {
  FaQuestionRowComponent,
  FaQuestionRowMetaChip,
} from '../../../shared/ui/question-row/fa-question-row.component';
import { StripInlineMarkupPipe } from '../../../shared/ui/inline-code/strip-inline-markup.pipe';
import {
  GOOGLE_PRACTICE_PROMPTS,
  GOOGLE_PREP_SEQUENCE,
  GOOGLE_PREVIEW_CANONICAL_PATH,
  GOOGLE_PREVIEW_DESCRIPTION,
  GOOGLE_PREVIEW_FAQS,
  GOOGLE_PREVIEW_H1,
  GOOGLE_PREVIEW_TITLE,
  GOOGLE_PREVIEW_TRUST_NOTE,
  GOOGLE_PROCESS_NOTE,
  GOOGLE_GOOGLEYNESS_SPOTLIGHT,
  GOOGLE_RESOURCE_LINKS,
} from './google-preview-content';
import {
  NETFLIX_PRACTICE_PROMPTS,
  NETFLIX_PREP_SEQUENCE,
  NETFLIX_PREVIEW_CANONICAL_PATH,
  NETFLIX_PREVIEW_DESCRIPTION,
  NETFLIX_PREVIEW_FAQS,
  NETFLIX_PREVIEW_H1,
  NETFLIX_PREVIEW_TITLE,
  NETFLIX_PREVIEW_TRUST_NOTE,
  NETFLIX_RESOURCE_LINKS,
  NETFLIX_ROLE_LENSES,
  NETFLIX_SOURCES,
  NETFLIX_WALKTHROUGH_STEPS,
} from './netflix-preview-content';
import { InlineCodeComponent } from '../../../shared/ui/inline-code/inline-code.component';

type OpenAiPracticePrompt = {
  id: string;
  title: string;
  intent: string;
  rubric: string[];
};

type OpenAiPrepDay = {
  day: string;
  focus: string;
};

type OpenAiResourceLink = {
  label: string;
  route: string[];
  path: string;
};

const OPENAI_PREVIEW_TITLE = 'OpenAI Frontend Interview: 5 Practice Questions + Prep Guide';
const OPENAI_PREVIEW_H1 = 'OpenAI Frontend Interview Questions';
const OPENAI_PREVIEW_DESCRIPTION =
  'Practice for OpenAI frontend interviews: streaming chat UI, stale stream handling, optimistic React state, accessibility and conversation history design.';
type RelatedCompanyLink = {
  slug: string;
  label: string;
  link: string[];
};

/** A card that names what is locked for a visitor without Premium and leads into a plan, or to pricing without one. */
type LockGate = {
  testId: string;
  className: string;
  title: string;
  line: string;
  button: string;
  link: string;
  queryParams: Record<string, string>;
  /** A second, quieter way through the gate, such as signing in instead of signing up. */
  secondary?: { label: string; link: string; queryParams: Record<string, string> };
};

/** Where a followed link sits on a guide, most specific first; sent as `surface`. Anything else is `body`. */
const GUIDE_LINK_ZONES: readonly (readonly [selector: string, surface: string])[] = [
  ['.company-plan-entry', 'plan_card'],
  ['.company-plan-link', 'plan_link'],
  ['.company-set-entry', 'full_set'],
  ['.preview-breadcrumb', 'breadcrumb'],
  ['.company-guide-cta, .openai-cta, .cta-stack', 'closing_cta'],
  ['app-company-interview-process', 'process_table'],
  ['app-company-official-guides', 'official_guides'],
  ['.company-round-spotlight', 'round_spotlight'],
  ['.company-prompt, .openai-prompt', 'prompts'],
  ['.company-guide-links, .openai-links', 'free_practice'],
  ['.company-sample-gate', 'sample_gate'],
  ['.company-account-gate', 'account_gate'],
  ['.company-prompt-gate', 'prompt_gate'],
  ['.company-source-list', 'sources'],
  ['[data-testid="company-prep-steps"]', 'prep_steps'],
  ['[data-testid="company-public-reports"]', 'public_reports'],
  ['.company-related-guides', 'related_guides'],
];

/** The hero chip of an authored guide that tells a visitor the full set is locked. */
const LOCK_CHIP = 'Full practice set requires Premium';

/** Prompts every visitor reads in full. Past these, a prompt shows its title and opening lines until the visitor has Premium. */
const OPEN_PROMPTS = 3;

/**
 * Structured data access for a guide. What a visitor without Premium cannot read (prompt details, Premium question names)
 * stays in the page under a blur and carries `premium-locked`, so search engines read it as Premium content, not as
 * hidden text, and leave it out of snippets through `data-nosnippet`.
 */
function lockedAccess(locked: boolean): Record<string, unknown> {
  if (!locked) return { isAccessibleForFree: true };
  return {
    isAccessibleForFree: false,
    hasPart: [{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }],
  };
}

const premiumAccess = (item: { access?: string } | null | undefined) => item?.access === 'premium';

const OPENAI_PREVIEW_CANONICAL_PATH = '/companies/openai/preview';
const OPENAI_TRUST_NOTE =
  'These are not leaked or confirmed OpenAI interview questions; they are representative, role-relevant practice prompts.';

const OPENAI_RESOURCE_LINKS: OpenAiResourceLink[] = [
  {
    label: 'AI streaming data handling',
    route: ['/javascript', 'trivia', 'ai-streaming-data-handling'],
    path: '/javascript/trivia/ai-streaming-data-handling',
  },
  {
    label: 'Chat conversation state management',
    route: ['/javascript', 'trivia', 'chat-conversation-state-management'],
    path: '/javascript/trivia/chat-conversation-state-management',
  },
  {
    label: 'SSE vs WebSocket trade-offs',
    route: ['/javascript', 'trivia', 'sse-vs-websocket-real-time'],
    path: '/javascript/trivia/sse-vs-websocket-real-time',
  },
  {
    label: 'AI UX integration challenges',
    route: ['/javascript', 'trivia', 'ai-ux-integration-challenges'],
    path: '/javascript/trivia/ai-ux-integration-challenges',
  },
  {
    label: 'ReadableStream to text',
    route: ['/javascript', 'coding', 'js-stream-to-text'],
    path: '/javascript/coding/js-stream-to-text',
  },
  {
    label: 'takeLatest request handling',
    route: ['/javascript', 'coding', 'js-take-latest'],
    path: '/javascript/coding/js-take-latest',
  },
];

const OPENAI_PRACTICE_PROMPTS: OpenAiPracticePrompt[] = [
  {
    id: 'streaming-chat-composer',
    title: 'Streaming chat composer',
    intent:
      'Build a composer that accepts a user message, renders the user bubble immediately, and appends an assistant response as streamed chunks arrive.',
    rubric: [
      'Readable state shape for messages, draft input, pending request id, and stream status.',
      'Incremental text rendering without blocking typing, selection, or scroll position.',
      'Error and retry states that preserve the user prompt and partial assistant text.',
      'Clear separation between transport code and rendering logic.',
    ],
  },
  {
    id: 'stop-regenerate-stale-stream-handling',
    title: 'Stop/regenerate and stale stream handling',
    intent:
      'Add stop and regenerate controls while ensuring old chunks cannot mutate the latest assistant message after cancellation or a second request.',
    rubric: [
      'AbortController or equivalent cancellation path for active stream work.',
      'A request token, generation id, or takeLatest guard before every state write.',
      'Predictable UI states for stopping, stopped, regenerating, failed, and complete.',
      'Cleanup for readers, timers, event listeners, and pending promises.',
    ],
  },
  {
    id: 'react-state-optimistic-messages',
    title: 'React state + optimistic messages',
    intent:
      'Model optimistic user messages and assistant placeholders in React without duplicating messages or losing order when network responses resolve late.',
    rubric: [
      'Immutable message updates keyed by stable ids instead of array index assumptions.',
      'Optimistic user bubble creation before the network call completes.',
      'Rollback or retry behavior for failed sends without deleting the draft context.',
      'Derived rendering for pending, partial, and final assistant messages.',
    ],
  },
  {
    id: 'accessibility-keyboard-interaction',
    title: 'Accessibility/keyboard interaction',
    intent:
      'Make the chat input, send button, stop control, regenerate action, and message list usable from keyboard and assistive technology.',
    rubric: [
      'Correct textarea behavior for Enter, Shift+Enter, focus restoration, and disabled states.',
      'Accessible button names that change with send, stop, and regenerate modes.',
      'Live region strategy for streamed assistant output without excessive announcements.',
      'Visible focus states and logical tab order across composer and message actions.',
      'Respect for reduced motion and high-contrast reading needs.',
    ],
  },
  {
    id: 'frontend-system-design-conversation-history',
    title: 'Frontend system design/conversation history',
    intent:
      'Design the frontend architecture for conversation history, message virtualization, search, local recovery, and sync with server-side threads.',
    rubric: [
      'Data model for threads, messages, streaming drafts, attachments, and pagination cursors.',
      'Cache and persistence plan for recent conversations, offline recovery, and invalidation.',
      'Virtualized rendering and scroll anchoring for long conversations.',
      'Privacy, retention, and redaction considerations for sensitive chat content.',
      'Observability for latency, stream failures, and client-side rendering errors.',
    ],
  },
];

const OPENAI_PREP_SEQUENCE: OpenAiPrepDay[] = [
  {
    day: 'Day 1',
    focus: 'Review streaming fundamentals: ReadableStream, SSE/WebSocket trade-offs, cancellation, and how partial text becomes UI state.',
  },
  {
    day: 'Day 2',
    focus: 'Implement a small stream-to-text utility and write tests for chunk order, decoding, cancellation, and error paths.',
  },
  {
    day: 'Day 3',
    focus: 'Build the chat composer shell with draft state, optimistic user messages, assistant placeholders, loading states, and retry copy.',
  },
  {
    day: 'Day 4',
    focus: 'Add stop, regenerate, and stale-stream guards. Force slow responses locally and prove old chunks cannot update the newest request.',
  },
  {
    day: 'Day 5',
    focus: 'Audit accessibility: keyboard flow, button names, focus restoration, live announcements, visible focus, and reduced-motion behavior.',
  },
  {
    day: 'Day 6',
    focus: 'Design conversation history: thread model, pagination, virtualization, local recovery, privacy constraints, and cache invalidation.',
  },
  {
    day: 'Day 7',
    focus: 'Run a timed mock: explain trade-offs first, code the smallest reliable slice, then review edge cases and testing strategy aloud.',
  },
];

@Component({
    selector: 'app-company-preview',
    imports: [
      CommonModule,
      RouterModule,
      FaQuestionRowComponent,
      CompanyOfficialGuidesComponent,
      CompanyInterviewProcessComponent,
      FaButtonComponent,
      StripInlineMarkupPipe,
      InlineCodeComponent,
    ],
    templateUrl: './company-preview.component.html',
    styleUrls: ['./company-preview.component.css']
})
export class CompanyPreviewComponent implements OnInit {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;

  /** Keys of the sample rows that carry a public interview report for this company. */
  private reportedSampleKeys = new Set<string>();

  isReportedSample(item: CompanyPreviewQuestion): boolean {
    return this.reportedSampleKeys.has(`${item.kind}:${item.id}`);
  }

  reportKindLabel(kind: CompanyReportedItem['kind']): string {
    return kind === 'debug' ? 'Debug' : this.displayKind(kind);
  }

  /** Preparation pages the company publishes itself; empty for companies without one. */
  get officialGuides(): readonly CompanyOfficialGuide[] {
    return COMPANY_OFFICIAL_GUIDES[this.slug] ?? [];
  }

  get interviewProcess(): CompanyInterviewProcess | null {
    return COMPANY_INTERVIEW_PROCESSES[this.slug] ?? null;
  }

  /** The `src` a catalog guide's links carry, with underscores like the authored guides: `company_preview_booking_com`. */
  get previewSource(): string {
    return `company_preview_${this.slug.replace(/-/g, '_')}`;
  }
  slug = '';
  label = '';
  /** Navigation state for the guide's task links: a locked task page shows the way back here. */
  returnState: { returnToUrl: string; returnLabel: string } | undefined;
  isOpenAiPreview = false;
  isGooglePreview = false;
  isNetflixPreview = false;
  /** Set when the slug has a data-driven authored guide in the registry (see shared/company-previews). */
  authoredPreview: AuthoredCompanyPreview | null = null;
  /** The guide's sources and counts, the page's one set of numbers: an authored guide's, or Netflix's. */
  evidence: CompanyEvidence | null = null;
  /** The other guides' list is long; a phone shows the first few until asked. */
  readonly relatedExpanded = signal(false);

  /** The sources only the process table cites, after the guide's own list. */
  extraSources(): readonly AuthoredSource[] {
    const own = this.authoredPreview?.sources.items.length ?? (this.isNetflixPreview ? NETFLIX_SOURCES.length : 0);
    return this.evidence?.sources.slice(own) ?? [];
  }
  /** The other company guides; built from the generated metadata so no company page re-dates. */
  relatedCompanyLinks: RelatedCompanyLink[] = [];
  /** Imported directly, not injected: the SEO inventory scopes the registry per company that way. Specs override the field. */
  editorialNotesRegistry: CompanyEditorialNotesRegistry = COMPANY_EDITORIAL_NOTES;
  /** Set for catalog-driven companies with an editorial notes entry; null on authored and inline guides. */
  editorialNotes: CompanyEditorialNotes | null = null;
  readonly openAiTitle = OPENAI_PREVIEW_TITLE;
  readonly openAiH1 = OPENAI_PREVIEW_H1;
  readonly openAiTrustNote = OPENAI_TRUST_NOTE;
  readonly openAiPracticePrompts = OPENAI_PRACTICE_PROMPTS;
  readonly openAiPrepSequence = OPENAI_PREP_SEQUENCE;
  readonly openAiResourceLinks = OPENAI_RESOURCE_LINKS;
  readonly googleH1 = GOOGLE_PREVIEW_H1;
  readonly googleTrustNote = GOOGLE_PREVIEW_TRUST_NOTE;
  readonly googleProcessNote = GOOGLE_PROCESS_NOTE;
  readonly googlePracticePrompts = GOOGLE_PRACTICE_PROMPTS;
  readonly googlePrepSequence = GOOGLE_PREP_SEQUENCE;
  readonly googleFaqs = GOOGLE_PREVIEW_FAQS;
  readonly googleResourceLinks = GOOGLE_RESOURCE_LINKS;
  readonly googleGoogleyness = GOOGLE_GOOGLEYNESS_SPOTLIGHT;
  readonly netflixH1 = NETFLIX_PREVIEW_H1;
  readonly netflixTrustNote = NETFLIX_PREVIEW_TRUST_NOTE;
  readonly netflixRoleLenses = NETFLIX_ROLE_LENSES;
  readonly netflixPracticePrompts = NETFLIX_PRACTICE_PROMPTS;
  readonly netflixWalkthroughSteps = NETFLIX_WALKTHROUGH_STEPS;
  readonly netflixPrepSequence = NETFLIX_PREP_SEQUENCE;
  readonly netflixFaqs = NETFLIX_PREVIEW_FAQS;
  readonly netflixResourceLinks = NETFLIX_RESOURCE_LINKS;
  readonly netflixSources = NETFLIX_SOURCES;
  data: CompanyPreviewResolved = {
    slug: '',
    mode: 'catalog',
    counts: { all: 0, coding: 0, trivia: 0, system: 0 },
    samples: [],
  };
  readonly lockChip = LOCK_CHIP;
  private readonly destroyRef = inject(DestroyRef);
  private readonly authoredPreviews = inject(AUTHORED_COMPANY_PREVIEWS_TOKEN);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  /** The company on screen, as a signal, so the plan card follows a move to another guide. */
  private readonly guide = signal({ slug: '', label: '' });
  /** Set after the first render: the guide is prerendered for every visitor, so a member's view only shows after hydration. */
  private readonly rendered = signal(false);
  private readonly planProgress = signal<{ plans: CompanyPlanService; data: CompanyPlanData } | null>(null);
  private planProgressRequested = false;

  /** A Premium member already has the full set, so the guide drops its lock chips and its unlock and pricing calls. */
  readonly member = computed(() => this.rendered() && hasPremium(this.auth.user()));

  /** Who is reading: a visitor, a free account or a Premium member. The first render matches the prerendered page. */
  readonly tier = computed<'guest' | 'account' | 'member'>(() => {
    if (!this.rendered()) return 'guest';
    const user = this.auth.user();
    if (!user) return 'guest';
    return hasPremium(user) ? 'member' : 'account';
  });

  /** The account gate is on for this guide (see GATED_COMPANY_GUIDES). */
  readonly gated = computed(() => isCompanyGuideGated(this.guide().slug));

  /** What each round asks, the sources and the prompts past the first wait for a free account. */
  readonly detailLocked = computed(() => this.gated() && this.tier() === 'guest');

  /** How many prompts a viewer without Premium reads in full: one behind the gate, three elsewhere. */
  readonly openPrompts = computed(() => (this.gated() ? 1 : OPEN_PROMPTS));

  /** The member's plan on the account, as the header reads it, when it covers this company. */
  private readonly planHere = computed(() => {
    const answers = this.member() ? cleanCompanyPlanAnswers(this.auth.user()?.companyPlan) : null;
    return answers?.companies.some((company) => company.slug === this.guide().slug) ? answers : null;
  });

  /** The card above the guide: the way into a plan, or back to the member's plan when it covers this company. */
  readonly planEntry = computed(() => {
    const { slug, label } = this.guide();
    const answers = this.planHere();
    if (answers) {
      const names = joinNames(answers.companies.map((company) => companyBrandFor(company.slug)?.label ?? company.slug));
      const progress = this.planProgress();
      const plan = progress ? progress.plans.buildPlan(progress.data, answers) : null;
      const solved = plan ? ` · ${plan.tasks.filter((task) => task.solved).length} of ${plan.tasks.length} solved` : '';
      return {
        title: `Continue your ${names} plan`,
        line: `${WHEN_LABELS[answers.when]} · ${LEVEL_LABELS[answers.level]}${solved}`,
        button: 'Open my plan',
        link: '/companies/plan',
        queryParams: null,
      };
    }
    return {
      title: `Interviewing at ${label}?`,
      line: this.member()
        ? 'Pick your interview date and level. With Premium, your plan opens right away.'
        : 'Pick your interview date and level, then see the rounds candidates reported and try the first tasks for free.',
      button: `Build my ${label} plan`,
      link: '/companies',
      queryParams: { company: slug },
    };
  });

  /** A prompt past the open ones keeps its answer guide under the blur until the viewer has Premium. */
  promptLocked(index: number): boolean {
    return index >= this.openPrompts() && !this.member();
  }

  /** Behind the gate, a visitor without an account reads only the first prompt's statement. */
  statementLocked(index: number): boolean {
    return this.detailLocked() && index >= 1;
  }

  /**
   * The card after the open prompts. Behind the gate it offers the free account that opens the other prompts; otherwise
   * it names the prompts whose answer guides are in Premium. Null when nothing is locked for this viewer.
   */
  promptGate(total: number): LockGate | null {
    const open = this.openPrompts();
    const locked = total - open;
    if (locked < 1 || this.member()) return null;
    const range = this.lockedRange(total);
    const capital = range.charAt(0).toUpperCase() + range.slice(1);
    const guides = locked === 1 ? 'its answer guide' : 'their answer guides';
    if (this.detailLocked()) {
      return this.accountGate('company-prompt-gate', 'company-prompt-gate company-account-gate',
        `${capital} open${locked === 1 ? 's' : ''} with a free account`,
        `See what each one asks. Premium then opens ${guides} and the full ${this.label} practice set.`);
    }
    // The guides are what Premium holds; the practice pages a prompt links to may well be free.
    const title = locked === 1 ? `The answer guide for ${range} is in Premium` : `The answer guides for ${range} are in Premium`;
    return this.lockGate('company-prompt-gate', 'company-prompt-gate', title,
      `Premium opens ${guides} and the full ${this.label} practice set. Your plan shows what opens for your date, and the price.`);
  }

  /** The card under a catalog guide's sample list when some samples are Premium; null for a member or an open list. */
  sampleGate(): LockGate | null {
    if (this.member() || !this.data.samples.some(premiumAccess)) return null;
    const title = this.tier() === 'guest' ? 'The locked questions open with Premium' : 'The Premium questions open with Premium';
    return this.lockGate('company-sample-gate', 'company-prompt-gate company-sample-gate', title,
      `Premium opens them, and all ${PREMIUM_QUESTION_COUNT} Premium questions in the library.`);
  }

  /**
   * The card under the process table for a visitor without an account on a gated guide. It promises what the account
   * opens there, the links behind the evidence counts, and counts them the way the plan form does: the guide's own
   * sources and every source the table cites, reports and official pages alike.
   */
  processGate(): LockGate | null {
    if (!this.detailLocked()) return null;
    // A guide with its own sources list counts its whole evidence once; a catalog guide has only the table to count.
    const counts = this.evidence?.counts ?? (() => {
      const stages = (this.interviewProcess?.variants ?? []).flatMap((variant) => variant.stages);
      const urls = (kind: 'report' | 'official') => new Set(stages.flatMap((stage) => stage.sources.filter((source) => source.kind === kind).map((source) => source.url))).size;
      return { reports: urls('report'), official: urls('official') };
    })();
    // The guide's own pages sit in its sources list, not on a round, so the line names both places.
    const where = this.evidence ? 'linked on the rounds they describe and in the sources list' : 'each linked on the round it describes';
    return this.accountGate('company-process-gate', 'company-prompt-gate company-account-gate',
      'The sources behind each round open with a free account',
      `${this.countedSources(counts)}, ${where}. Premium adds the answer guides and the practice.`);
  }

  /** The card over a guide's sources list for a visitor without an account on a gated guide. */
  sourcesGate(counts: Pick<CompanyEvidenceCounts, 'reports' | 'official'> | null | undefined): LockGate | null {
    if (!this.detailLocked() || !counts) return null;
    return this.accountGate('company-sources-gate', 'company-prompt-gate company-account-gate',
      'The sources open with a free account',
      `${this.countedSources(counts)}, each with a note on what it can and cannot establish.`);
  }

  /** "7 public reports and 6 official pages", leaving out a kind the guide has none of. */
  private countedSources({ reports, official }: Pick<CompanyEvidenceCounts, 'reports' | 'official'>): string {
    return [
      reports ? `${reports} public ${reports === 1 ? 'report' : 'reports'}` : '',
      official ? `${official} official ${official === 1 ? 'page' : 'pages'}` : '',
    ].filter(Boolean).join(' and ');
  }

  /** The prompts past the open ones: "prompt 4", "prompts 4 and 5" or "prompts 2 to 7". */
  private lockedRange(total: number): string {
    const first = this.openPrompts() + 1;
    const locked = total - this.openPrompts();
    if (locked === 1) return `prompt ${first}`;
    return `prompts ${first} ${locked === 2 ? 'and' : 'to'} ${total}`;
  }

  private lockGate(testId: string, className: string, title: string, line: string): LockGate {
    return this.interviewProcess
      ? { testId, className, title, line, button: `Build my ${this.label} plan`, link: '/companies', queryParams: { company: this.slug } }
      : { testId, className, title, line, button: 'See Premium plans', link: '/pricing', queryParams: { src: this.previewSource } };
  }

  /** The free-account gate: sign up or sign in, and come back to this guide. */
  private accountGate(testId: string, className: string, title: string, line: string): LockGate {
    const redirectTo = this.router.url.split(/[?#]/)[0];
    return {
      testId, className, title, line,
      button: 'Create a free account', link: '/auth/signup', queryParams: { redirectTo },
      secondary: { label: 'Sign in', link: '/auth/login', queryParams: { redirectTo } },
    };
  }

  /** The closing call of an authored guide, which names no Premium task. */
  ctaCopy(total: number): string {
    const locked = total - this.openPrompts();
    const prompts = locked > 0 ? `${this.lockedRange(total)} with ${locked === 1 ? 'its answer guide' : 'their answer guides'}, ` : '';
    return `Premium opens ${prompts}every question in the ${this.label} set and all ${PREMIUM_QUESTION_COUNT} Premium questions in the library.`;
  }

  /** A link to a Premium practice page keeps its name under a blur for a visitor without an account. */
  linkLocked(path: string | readonly string[] | null | undefined): boolean {
    return this.tier() === 'guest' && isPremiumRoute(path);
  }

  /** A Premium item of a list keeps its name and description under a blur for a visitor without an account. */
  itemLocked(item: { access?: string } | null | undefined): boolean {
    return premiumAccess(item) && this.tier() === 'guest';
  }

  /** Whether a catalog guide shows a visitor any Premium name under a blur, for its structured data. */
  private catalogLocked(): boolean {
    const notes = this.editorialNotes;
    const stages = (this.interviewProcess?.variants ?? []).flatMap((variant) => variant.stages);
    return this.gated()
      || this.data.samples.some(premiumAccess)
      || (this.data.reports ?? []).some(premiumAccess)
      || (notes?.prepSteps?.steps ?? []).some(premiumAccess)
      || (notes?.roundSpotlights ?? []).some((round) => isPremiumRoute(round.practiceLink?.path))
      || (notes?.reportsDescribe?.bullets ?? []).some((bullet) => isPremiumRoute(bullet.link?.path))
      || stages.some((stage) => isPremiumRoute(stage.practice?.path));
  }

  /** Where a member finds every question of this company, in place of the call to unlock them. */
  readonly memberSet = computed(() => {
    if (!this.member()) return null;
    const { slug, label } = this.guide();
    const line = companySetLine([{ name: label, counts: COMPANY_SET_COUNTS[slug] }]);
    return line ? { line, label, link: `/companies/${slug}/all` } : null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
  ) {
    afterNextRender(() => this.rendered.set(true));
    effect(() => {
      if (this.planHere()) untracked(() => this.loadPlanProgress());
    });
  }

  /** The plan code and its data load only for a member whose plan covers the company on screen; other visitors download neither. */
  private loadPlanProgress(): void {
    if (this.planProgressRequested) return;
    this.planProgressRequested = true;
    from(import('../company-plan/company-plan.service'))
      .pipe(
        switchMap(({ CompanyPlanService }) => {
          const plans = this.injector.get(CompanyPlanService);
          return plans.loadData().pipe(map((data) => (data ? { plans, data } : null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((progress) => this.planProgress.set(progress));
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved = data['companyPreview'] as CompanyPreviewResolved | undefined;
      this.applyResolvedPreview(resolved);
    });
  }

  private applyResolvedPreview(resolved: CompanyPreviewResolved | undefined): void {
    this.slug = (resolved?.slug ?? this.route.snapshot.paramMap.get('slug') ?? '').trim().toLowerCase();
    const knownCompany = resolved?.mode === 'editorial'
      || this.slug in this.editorialNotesRegistry
      || this.slug in ((SHOWCASE_STATS as { companyCounts?: Record<string, unknown> }).companyCounts ?? {});
    if (!knownCompany) {
      this.router.navigateByUrl('/404', { replaceUrl: true }).catch(() => void 0);
      return;
    }

    this.label = this.prettyCompany(this.slug);
    this.returnState = { returnToUrl: `/companies/${this.slug}/preview`, returnLabel: `Back to the ${this.label} guide` };
    this.guide.set({ slug: this.slug, label: this.label });
    this.relatedCompanyLinks = Object.keys((SHOWCASE_STATS as { companyCounts?: Record<string, unknown> }).companyCounts || {})
      .filter((slug) => slug !== this.slug)
      .map((slug) => ({ slug, label: companyBrandFor(slug)?.label ?? slug, link: ['/companies', slug, 'preview'] }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.isOpenAiPreview = this.slug === 'openai';
    this.isGooglePreview = this.slug === 'google';
    this.isNetflixPreview = this.slug === 'netflix';
    // An authored guide counts its evidence once, and its text and metadata carry those counts.
    const authored = this.authoredPreviews[this.slug] ?? null;
    this.evidence = authored
      ? companyEvidence(authored, this.interviewProcess)
      : this.isNetflixPreview ? evidenceFrom(NETFLIX_SOURCES, NETFLIX_PRACTICE_PROMPTS.length, this.interviewProcess) : null;
    this.authoredPreview = authored && this.evidence ? fillAuthoredPreview(authored, this.evidence.counts) : null;
    this.editorialNotes = this.authoredPreview || this.isOpenAiPreview || this.isGooglePreview || this.isNetflixPreview
      ? null
      : this.editorialNotesRegistry[this.slug] ?? null;
    this.data = resolved ?? {
      slug: this.slug,
      mode: 'catalog',
      counts: { all: 0, coding: 0, trivia: 0, system: 0 },
      samples: [],
    };
    this.reportedSampleKeys = new Set((this.data.reports ?? []).map((item) => `${item.kind}:${item.id}`));

    if (this.isOpenAiPreview) {
      this.publishOpenAiSeo();
      return;
    }

    if (this.isGooglePreview) {
      this.publishGoogleSeo();
      return;
    }

    if (this.isNetflixPreview) {
      this.publishNetflixSeo();
      return;
    }

    if (this.authoredPreview) {
      this.publishAuthoredSeo(this.authoredPreview);
      return;
    }

    if (this.editorialNotes) {
      this.publishEditorialNotesSeo(this.editorialNotes);
      return;
    }

    this.seo.updateTags({
      title: `${this.label} Frontend Interview Questions Preview`,
      description: `Preview the FrontendAtlas editorial ${this.label} practice grouping across coding, concept prompts, and system design. It does not claim official question provenance or endorsement.`,
      canonical: `/companies/${this.slug}/preview`,
    });
  }

  freeCount(items: CompanyPreviewQuestion[]): number {
    return items.filter((item) => item.access === 'free').length;
  }

  /**
   * Premium items counted as exercises: a widget published in three frameworks is one, not three. The sample shows
   * one card per family of the same map (CompanyPublicDataService), so this matches the locked cards.
   */
  premiumCount(items: CompanyPreviewQuestion[]): number {
    return new Set(items.filter((item) => item.access === 'premium').map((item) => FRAMEWORK_FAMILY_BY_ID.get(item.id)?.key ?? `${item.kind}:${item.id}`)).size;
  }

  /** "Coding 8 · Concepts 14": a kind the set does not hold is left out rather than shown as zero. */
  countsLabel(counts: { coding: number; trivia: number; system: number }): string {
    return ([[counts.coding, 'Coding'], [counts.trivia, 'Concepts'], [counts.system, 'System']] as const)
      .filter(([count]) => count > 0)
      .map(([count, kind]) => `${kind} ${count}`)
      .join(' · ');
  }

  promptCountLabel(count: number): string {
    return `${count} editorial practice ${count === 1 ? 'prompt' : 'prompts'}`;
  }

  displayKind(kind: CompanyPreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Concept question';
  }

  sampleDescription(item: CompanyPreviewQuestion): string {
    if (item.access === 'free') return 'Available from the public Question Library.';
    return this.member() ? 'Included with your Premium access.' : 'Previewed here; the full practice set requires Premium.';
  }

  sampleMetaChips(item: CompanyPreviewQuestion): FaQuestionRowMetaChip[] {
    const chips: FaQuestionRowMetaChip[] = [
      // A member opens every sample, so no row says which ones are locked.
      ...(this.member() ? [] : [{
        label: item.access === 'free' ? 'Free now' : 'Premium',
        ariaLabel: item.access === 'free' ? 'Access: free now' : 'Access: premium in full set',
        tone: item.access === 'free' ? 'tier' as const : 'access' as const,
      }]),
      {
        label: this.displayKind(item.kind),
        ariaLabel: `Kind: ${this.displayKind(item.kind)}`,
        tone: 'neutral',
        priority: 'secondary',
      },
      {
        label: this.difficultyLabel(item.difficulty),
        ariaLabel: `Difficulty: ${this.difficultyLabel(item.difficulty)}`,
        tone: 'difficulty',
      },
    ];

    if (item.tech) {
      chips.push({
        label: this.techLabel(item.tech),
        ariaLabel: `Technology: ${this.techLabel(item.tech)}`,
        tone: 'tech',
      });
    }

    if (this.isReportedSample(item)) {
      chips.push({
        label: 'Public report',
        ariaLabel: 'Backed by a public interview report',
        tone: 'neutral',
      });
    }

    return chips;
  }

  difficultyLabel(difficulty: Difficulty): string {
    if (difficulty === 'easy') return 'Easy';
    if (difficulty === 'hard') return 'Hard';
    return 'Intermediate';
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
        return 'Frontend';
    }
  }

  private publishOpenAiSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(OPENAI_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);
    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: OPENAI_PREVIEW_TITLE,
      headline: OPENAI_PREVIEW_H1,
      description: OPENAI_PREVIEW_DESCRIPTION,
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.gated() || OPENAI_PRACTICE_PROMPTS.length > OPEN_PROMPTS),
      about: [
        { '@type': 'Thing', name: 'OpenAI frontend interview practice' },
        { '@type': 'Thing', name: 'Streaming chat frontend practice' },
        { '@type': 'Thing', name: 'Frontend system design for conversation history' },
      ],
      mentions: OPENAI_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: {
        '@type': 'ItemList',
        description: COMPANY_PRACTICE_DISCLAIMER,
        itemListElement: OPENAI_PRACTICE_PROMPTS.map((prompt, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: prompt.title,
          url: `${canonicalUrl}#${prompt.id}`,
        })),
      },
    };

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
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: OPENAI_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: OPENAI_PREVIEW_TITLE,
      description: OPENAI_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: OPENAI_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  private publishGoogleSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(GOOGLE_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);
    const itemListId = `${canonicalUrl}#practice-prompts`;
    const itemList = {
      '@type': 'ItemList',
      '@id': itemListId,
      name: 'Seven Google frontend interview practice questions',
      description: COMPANY_PRACTICE_DISCLAIMER,
      numberOfItems: GOOGLE_PRACTICE_PROMPTS.length,
      itemListElement: GOOGLE_PRACTICE_PROMPTS.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: prompt.title,
        url: `${canonicalUrl}#${prompt.id}`,
      })),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: GOOGLE_PREVIEW_TITLE,
      headline: GOOGLE_PREVIEW_H1,
      description: GOOGLE_PREVIEW_DESCRIPTION,
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.gated() || GOOGLE_PRACTICE_PROMPTS.length > OPEN_PROMPTS),
      about: [
        { '@type': 'Thing', name: 'Google frontend interview preparation' },
        { '@type': 'Thing', name: 'JavaScript and browser APIs' },
        { '@type': 'Thing', name: 'Accessible UI implementation' },
        { '@type': 'Thing', name: 'Frontend system design' },
      ],
      mentions: GOOGLE_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: { '@id': itemListId },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
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
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: GOOGLE_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: GOOGLE_PREVIEW_TITLE,
      description: GOOGLE_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: GOOGLE_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, itemList, breadcrumb],
    });
  }

  private publishNetflixSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(NETFLIX_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);
    const itemListId = `${canonicalUrl}#practice-prompts`;
    const itemList = {
      '@type': 'ItemList',
      '@id': itemListId,
      name: 'Six Netflix frontend interview practice prompts',
      description: COMPANY_PRACTICE_DISCLAIMER,
      numberOfItems: NETFLIX_PRACTICE_PROMPTS.length,
      itemListElement: NETFLIX_PRACTICE_PROMPTS.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: prompt.title,
        url: `${canonicalUrl}#${prompt.id}`,
      })),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: NETFLIX_PREVIEW_TITLE,
      headline: NETFLIX_PREVIEW_H1,
      description: NETFLIX_PREVIEW_DESCRIPTION,
      disambiguatingDescription: NETFLIX_PREVIEW_TRUST_NOTE,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.gated() || NETFLIX_PRACTICE_PROMPTS.length > OPEN_PROMPTS),
      about: [
        { '@type': 'Thing', name: 'Netflix frontend interview preparation' },
        { '@type': 'Thing', name: 'JavaScript and React user interfaces' },
        { '@type': 'Thing', name: 'Streaming UI performance and accessibility' },
        { '@type': 'Thing', name: 'Frontend system design' },
      ],
      mentions: NETFLIX_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: { '@id': itemListId },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
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
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: NETFLIX_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: NETFLIX_PREVIEW_TITLE,
      description: NETFLIX_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: NETFLIX_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, itemList, breadcrumb],
    });
  }

  /**
   * Counts a link that leaves the guide: where it sits, and the path it opens or the site it goes to. Jumps within
   * the page are not counted.
   */
  onGuideClick(event: Event): void {
    const anchor = (event.target as Element | null)?.closest?.('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href || href.startsWith('#')) return;
    let target: URL;
    try {
      target = new URL(href, window.location.href);
    } catch {
      return;
    }
    const internal = target.origin === window.location.origin;
    if (internal && target.pathname === window.location.pathname && target.hash) return;
    const surface = GUIDE_LINK_ZONES.find(([selector]) => anchor.closest(selector))?.[1] ?? 'body';
    this.analytics.track('company_guide_link_clicked', {
      surface,
      target_path: internal ? target.pathname : target.origin,
    });
  }

  breadcrumbLabel(): string {
    if (this.isOpenAiPreview) return this.openAiH1;
    if (this.isGooglePreview) return this.googleH1;
    if (this.isNetflixPreview) return this.netflixH1;
    if (this.authoredPreview) return this.authoredPreview.h1;
    if (this.editorialNotes) return this.editorialNotes.h1;
    return `${this.label} frontend interview questions preview`;
  }

  private publishEditorialNotesSeo(notes: CompanyEditorialNotes): void {
    const canonicalPath = `/companies/${this.slug}/preview`;
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const dateModified = seoContentDateModified(canonicalUrl);

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: notes.title,
      headline: notes.h1,
      description: notes.description,
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.catalogLocked()),
      ...(notes.about?.length ? { about: notes.about.map((name) => ({ '@type': 'Thing', name })) } : {}),
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FrontendAtlas', item: this.seo.buildCanonicalUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Company Frontend Interview Questions', item: this.seo.buildCanonicalUrl('/companies') },
        { '@type': 'ListItem', position: 3, name: notes.h1, item: canonicalUrl },
      ],
    };

    this.seo.updateTags({
      title: notes.title,
      description: notes.description,
      robots: 'index,follow',
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  sourceRel(source: AuthoredSource): string {
    return source.kind === 'report' ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
  }

  private publishAuthoredSeo(preview: AuthoredCompanyPreview): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(preview.canonicalPath);
    const dateModified = seoContentDateModified(canonicalUrl);
    const itemListId = `${canonicalUrl}#practice-prompts`;
    const itemList = {
      '@type': 'ItemList',
      '@id': itemListId,
      name: preview.prompts.itemListName,
      description: COMPANY_PRACTICE_DISCLAIMER,
      numberOfItems: preview.prompts.items.length,
      itemListElement: preview.prompts.items.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: prompt.title,
        url: `${canonicalUrl}#${prompt.id}`,
      })),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: preview.title,
      headline: preview.h1,
      description: preview.description,
      disambiguatingDescription: preview.trustNote,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.gated() || preview.prompts.items.length > OPEN_PROMPTS),
      about: preview.about.map((name) => ({ '@type': 'Thing', name })),
      mentions: preview.resourceLinks.items.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: { '@id': itemListId },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
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
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: preview.h1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: preview.title,
      description: preview.description,
      robots: 'index,follow',
      canonical: preview.canonicalPath,
      jsonLd: [collectionPage, itemList, breadcrumb],
    });
  }

  private prettyCompany(slug: string): string {
    return companyBrandFor(slug)?.label ?? slug;
  }
}
