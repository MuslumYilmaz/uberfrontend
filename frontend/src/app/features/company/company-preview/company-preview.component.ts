import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Component, DestroyRef, Injector, OnInit, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { from, map, switchMap } from 'rxjs';
import { CompanyPreviewQuestion, CompanyPreviewResolved } from '../../../core/models/company-public.model';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import { isPremiumRoute } from '../../../core/utils/premium-route.util';
import { BillingCheckoutService, type RegionalPricing } from '../../../core/services/billing-checkout.service';
import { formatPlanDollars, premiumPlanPrices } from '../../../core/utils/plan-price.util';
import { PRERENDER_PLAN_DETAILS } from '../../../generated/pricing-defaults';
import { hasPremium } from '../company-plan/company-plan-access';
import { cleanCompanyPlanAnswers } from '../company-plan/company-plan-draft';
import { COMPANY_SET_COUNTS, PREMIUM_QUESTION_COUNT } from '../company-plan/company-plan-sets';
import type { CompanyPlanData } from '../company-plan/company-plan.engine';
import { LEVEL_LABELS, WHEN_LABELS, companySetLine, joinNames } from '../company-plan/company-plan.format';
import type { CompanyPlanService } from '../company-plan/company-plan.service';
import { companyBrandFor } from '../../../shared/company-branding';
import { SHOWCASE_STATS } from '../../../generated/content-metadata';
import type { AuthoredCompanyPreview, AuthoredPracticePrompt, AuthoredSectionCopy, AuthoredSource } from '../../../shared/company-previews/authored-company-preview.model';
import { AUTHORED_COMPANY_PREVIEWS_TOKEN } from '../../../shared/company-previews/authored-company-previews';
import type { CompanyEditorialNotes } from '../../../shared/company-previews/company-editorial-notes.model';
import { COMPANY_EDITORIAL_NOTES, type CompanyEditorialNotesRegistry } from '../../../shared/company-previews/company-editorial-notes';
import { UNCITED_SOURCE, companyEvidence, evidenceFrom, fillAuthoredPreview, fillCompanyCounts, type CompanyEvidence, type CompanyEvidenceCounts } from './company-evidence';
import { COMPANY_OFFICIAL_GUIDES, type CompanyOfficialGuide } from '../../../shared/company-previews/company-official-guides';
import {
  COMPANY_INTERVIEW_PROCESSES,
  type CompanyInterviewProcess,
  type InterviewProcessSource,
} from '../../../shared/company-previews/company-interview-processes';
// The redesign's counting and reporter helpers sit beside the process data; every guide changes with them in one release.
import { summariseQuestionList } from '../../../shared/company-previews/company-question-list';
import { describeReporter } from '../../../shared/company-previews/company-source-reporter';
import { COMPANY_GUIDE_FEATURES } from './company-guide-features';
import { CompanyQuestionListComponent, type CompanyQuestionOffer, type FreeUnlockState } from './company-question-list/company-question-list.component';
import { FreeUnlockService } from './free-unlock.service';
import { CompanyGuideSourcesComponent, type GuideSourceRow } from './company-guide-sources/company-guide-sources.component';
import type { InterviewProcessTryNow } from '../../../shared/components/company-interview-process/company-interview-process.component';
import type { CompanyReportedItem } from '../../../core/models/company-public.model';
import { CompanyOfficialGuidesComponent } from '../../../shared/components/company-official-guides/company-official-guides.component';
import { CompanyInterviewProcessComponent } from '../../../shared/components/company-interview-process/company-interview-process.component';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { StripInlineMarkupPipe } from '../../../shared/ui/inline-code/strip-inline-markup.pipe';
import {
  GOOGLE_COPY,
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
  NETFLIX_COPY,
  NETFLIX_PRACTICE_PROMPTS,
  NETFLIX_PREP_SEQUENCE,
  NETFLIX_PREVIEW_CANONICAL_PATH,
  NETFLIX_PREVIEW_DESCRIPTION,
  NETFLIX_PREVIEW_FAQS,
  NETFLIX_PREVIEW_H1,
  NETFLIX_PREVIEW_TITLE,
  NETFLIX_PREVIEW_TRUST_NOTE,
  NETFLIX_RESOURCE_LINKS,
  NETFLIX_CULTURE_SPOTLIGHT,
  NETFLIX_ROLE_LENSES,
  NETFLIX_SOURCES,
  NETFLIX_SOURCE_BOUNDARY,
  NETFLIX_WALKTHROUGH_STEPS,
} from './netflix-preview-content';
import { InlineCodeComponent } from '../../../shared/ui/inline-code/inline-code.component';
import { BehavioralDrillComponent } from './behavioral-drill/behavioral-drill.component';
import {
  OPENAI_COPY,
  OPENAI_PRACTICE_PROMPTS,
  OPENAI_PREVIEW_FAQS,
  OPENAI_PREP_SEQUENCE,
  OPENAI_PREVIEW_CANONICAL_PATH,
  OPENAI_PREVIEW_DESCRIPTION,
  OPENAI_PREVIEW_H1,
  OPENAI_PREVIEW_TITLE,
  OPENAI_RESOURCE_LINKS,
  OPENAI_SOURCE_BOUNDARY,
  OPENAI_TRUST_NOTE,
} from './openai-preview-content';

type RelatedCompanyLink = {
  slug: string;
  label: string;
  link: string[];
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
  ['app-company-question-list', 'question_list'],
  ['app-company-guide-sources', 'sources'],
  ['.company-guide-links, .openai-links', 'free_practice'],
  ['.company-source-list', 'sources'],
  ['[data-testid="company-prep-steps"]', 'prep_steps'],
  ['[data-testid="company-public-reports"]', 'public_reports'],
  ['.company-related-guides', 'related_guides'],
];

/** The hero chip of an authored guide that tells a visitor the full set is locked. */
const LOCK_CHIP = 'Full practice set requires Premium';

/**
 * Structured data access for a guide. What a visitor without Premium cannot read (locked questions and their answer
 * guides, Premium task names) stays in the page under a blur and carries `premium-locked`, so search engines read it
 * as Premium content, not as hidden text, and leave it out of snippets through `data-nosnippet`.
 */
function lockedAccess(locked: boolean): Record<string, unknown> {
  if (!locked) return { isAccessibleForFree: true };
  return {
    isAccessibleForFree: false,
    hasPart: [{ '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.premium-locked' }],
  };
}

const premiumAccess = (item: { access?: string } | null | undefined) => item?.access === 'premium';

@Component({
    selector: 'app-company-preview',
    imports: [
      CommonModule,
      RouterModule,
      CompanyOfficialGuidesComponent,
      CompanyInterviewProcessComponent,
      FaButtonComponent,
      StripInlineMarkupPipe,
      InlineCodeComponent,
      BehavioralDrillComponent,
      CompanyQuestionListComponent,
      CompanyGuideSourcesComponent,
    ],
    templateUrl: './company-preview.component.html',
    styleUrls: ['./company-preview.component.css']
})
export class CompanyPreviewComponent implements OnInit {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;

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
  readonly openAiFaqs = OPENAI_PREVIEW_FAQS;
  readonly openAiPrepSequence = OPENAI_PREP_SEQUENCE;
  readonly openAiResourceLinks = OPENAI_RESOURCE_LINKS;
  readonly openAiCopy = OPENAI_COPY;
  readonly googleH1 = GOOGLE_PREVIEW_H1;
  readonly googleTrustNote = GOOGLE_PREVIEW_TRUST_NOTE;
  readonly googleProcessNote = GOOGLE_PROCESS_NOTE;
  readonly googlePrepSequence = GOOGLE_PREP_SEQUENCE;
  readonly googleFaqs = GOOGLE_PREVIEW_FAQS;
  readonly googleResourceLinks = GOOGLE_RESOURCE_LINKS;
  readonly googleGoogleyness = GOOGLE_GOOGLEYNESS_SPOTLIGHT;
  readonly googleCopy = GOOGLE_COPY;
  readonly netflixH1 = NETFLIX_PREVIEW_H1;
  readonly netflixTrustNote = NETFLIX_PREVIEW_TRUST_NOTE;
  readonly netflixRoleLenses = NETFLIX_ROLE_LENSES;
  readonly netflixWalkthroughSteps = NETFLIX_WALKTHROUGH_STEPS;
  readonly netflixPrepSequence = NETFLIX_PREP_SEQUENCE;
  readonly netflixFaqs = NETFLIX_PREVIEW_FAQS;
  readonly netflixResourceLinks = NETFLIX_RESOURCE_LINKS;
  readonly netflixSources = NETFLIX_SOURCES;
  readonly netflixCulture = NETFLIX_CULTURE_SPOTLIGHT;
  readonly netflixCopy = NETFLIX_COPY;
  data: CompanyPreviewResolved = {
    slug: '',
    mode: 'catalog',
    counts: { all: 0, coding: 0, trivia: 0, system: 0, debug: 0 },
    samples: [],
  };
  readonly lockChip = LOCK_CHIP;
  private readonly destroyRef = inject(DestroyRef);
  private readonly authoredPreviews = inject(AUTHORED_COMPANY_PREVIEWS_TOKEN);
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly progress = inject(UserProgressService);
  private readonly injector = inject(Injector);
  /** The company on screen, as a signal, so the plan card follows a move to another guide. */
  private readonly guide = signal({ slug: '', label: '' });
  /** Set after the first render: the guide is prerendered for every visitor, so a member's view only shows after hydration. */
  private readonly rendered = signal(false);
  private readonly planProgress = signal<{ plans: CompanyPlanService; data: CompanyPlanData } | null>(null);
  private planProgressRequested = false;

  /**
   * The practice tasks a reader with an account has solved, with those marked done in a saved plan. The plan counts
   * the same list, so a task done there shows as solved here. A visitor and the prerendered page have none.
   */
  readonly practised = computed<ReadonlySet<string> | null>(() => {
    if (this.tier() === 'guest') return null;
    return new Set([...this.progress.solvedIds(), ...(this.auth.user()?.companyPlan?.markedDone ?? [])]);
  });

  /** A Premium member already has the full set, so the guide drops its lock chips and its unlock and pricing calls. */
  readonly member = computed(() => this.rendered() && hasPremium(this.auth.user()));

  /** Who is reading: a visitor, a free account or a Premium member. The first render matches the prerendered page. */
  readonly tier = computed<'guest' | 'account' | 'member'>(() => {
    if (!this.rendered()) return 'guest';
    const user = this.auth.user();
    if (!user) return 'guest';
    return hasPremium(user) ? 'member' : 'account';
  });

  readonly features = COMPANY_GUIDE_FEATURES;

  /**
   * The guide's reported-question list, read from its process. Every prerendered guide has one, which a spec checks;
   * a slug without a process has none.
   */
  readonly questionSummary = computed(() => {
    const process = COMPANY_INTERVIEW_PROCESSES[this.guide().slug];
    return process ? summariseQuestionList(process) : null;
  });

  /** Study priorities, role lenses and the walkthrough are Premium once the list locks. */
  readonly prepLocked = computed(() => this.features.lockedQuestions && this.tier() !== 'member');

  /** The 7-day plan shows its day titles to everyone; what each day holds opens with a free account. */
  readonly planLocked = computed(() => this.features.lockedQuestions && this.tier() === 'guest');

  /** Reported questions per round, for the stage table. */
  readonly questionCounts = computed(() => {
    const summary = this.questionSummary();
    if (!summary || !this.features.premiumPull) return null;
    return Object.fromEntries(summary.rounds.map((round) => [round.stage, round.count]));
  });

  /** The first technical round's first free task, to try the round's shape at once; none when no round has one. */
  readonly tryNow = computed<InterviewProcessTryNow | null>(() => {
    const process = COMPANY_INTERVIEW_PROCESSES[this.guide().slug];
    if (!process) return null;
    for (const stage of process.variants[0]?.stages ?? []) {
      const practice = stage.practice;
      if (practice && !practice.fragment && !isPremiumRoute(practice.path)) return { stage: stage.stage, label: practice.label, path: practice.path };
    }
    return null;
  });

  /** The guide's practice prompts by id: a question's answer guide is one of them. */
  answerGuides: Readonly<Record<string, AuthoredPracticePrompt>> = {};
  /** The counts an inline guide (Google, Netflix, OpenAI) fills its tokens with. */
  inlineCounts: CompanyEvidenceCounts | null = null;
  /** Every source once, with who reported it and when, for the list at the end of the page. */
  guideSourceRows: readonly GuideSourceRow[] = [];

  /** Premium's monthly price in the list's offer: the prerendered list price, then the visitor's regional one. */
  private readonly offerPlanDetails = signal<Partial<Record<'monthly' | 'annual', { amountCents?: number }>>>(PRERENDER_PLAN_DETAILS);
  private readonly offerRegional = signal<RegionalPricing | null>(null);
  private offerPricingRequested = false;
  private readonly billingCheckout = inject(BillingCheckoutService);
  private readonly appRef = inject(ApplicationRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly freeUnlocks = inject(FreeUnlockService);
  /** The account's free unlock, wherever it was spent. A visitor and a member have none to show. */
  readonly freeUnlock = computed(() => (this.tier() === 'account' ? this.auth.user()?.freeUnlock ?? null : null));
  readonly unlockState = signal<FreeUnlockState | null>(null);
  /** The guide whose remembered choice was looked at, so a visitor's choice is spent once, on arrival with an account. */
  private intentCheckedFor: string | null = null;

  readonly offer = computed<CompanyQuestionOffer | null>(() => {
    const monthly = premiumPlanPrices(this.offerPlanDetails(), this.offerRegional())?.monthly
      ?? this.offerPlanDetails().monthly?.amountCents;
    if (!monthly) return null;
    const regional = this.offerRegional();
    // Checkout charges US dollars everywhere; a bare "$24" reads as local dollars in Singapore, Canada or Australia.
    return { price: `US${formatPlanDollars(monthly)}`, priceNote: regional ? `prices for ${regional.countryName}` : 'lower prices in many countries' };
  });

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
        : 'Pick your interview date, or no date yet, and your level, then see the rounds candidates reported and try the first tasks for free.',
      button: `Build my ${label} plan`,
      link: '/companies',
      queryParams: { company: slug },
    };
  });

  /** The closing call of a guide, which names no Premium task. With `lockedQuestions` off the list is open, so it names none. */
  ctaCopy(): string {
    const summary = this.questionSummary();
    // The first question is open, and a question this reader opened with the free unlock is theirs: neither is counted.
    const locked = summary ? summary.total - 1 - (this.freeUnlock()?.company === this.slug ? 1 : 0) : 0;
    const reported = this.features.lockedQuestions && locked > 0 ? `the other ${locked} reported ${this.label} questions, ` : '';
    return `Premium opens ${reported}every question in the ${this.label} set and all ${PREMIUM_QUESTION_COUNT} Premium questions in the library.`;
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
    return this.features.lockedQuestions
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
    // A visitor who chose the free unlock before signing up comes back with an account: the question opens on arrival.
    // A member's remembered choice is dropped: Premium already opens the question.
    effect(() => {
      const slug = this.guide().slug;
      const tier = this.tier();
      if (tier === 'guest' || !this.questionSummary() || this.intentCheckedFor === slug) return;
      this.intentCheckedFor = slug;
      untracked(() => {
        const questionId = this.freeUnlocks.takeIntent(slug);
        if (tier === 'account' && questionId && !this.freeUnlock()) this.spendFreeUnlock(questionId, 'after_signup');
      });
    });
    // The offer names Premium's price; the checkout config then brings the visitor's regional one. The request waits
    // for the app to settle: an HTTP request counts as pending work, the router skips its scroll reset while hydration
    // is unfinished, and a click on the guide's lower links would then open the next page scrolled down.
    effect(() => {
      if (!this.isBrowser || !this.rendered() || this.offerPricingRequested) return;
      if (!this.questionSummary() || !this.features.premiumPull || this.tier() === 'member') return;
      this.offerPricingRequested = true;
      void this.appRef.whenStable()
        .then(() => this.billingCheckout.getCheckoutConfig())
        .then((config) => {
          if (config?.planDetails) this.offerPlanDetails.set(config.planDetails);
          this.offerRegional.set(config?.pricing?.regional ?? null);
        })
        .catch(() => undefined);
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
    // The inline guides keep their prompts beside the component; they are the answer guides of the question list.
    // OpenAI's prompts carry an intent and a rubric, which read as the statement and the strong answer.
    const prompts: readonly AuthoredPracticePrompt[] = this.authoredPreview?.prompts.items
      ?? (this.isGooglePreview ? GOOGLE_PRACTICE_PROMPTS
        : this.isNetflixPreview ? NETFLIX_PRACTICE_PROMPTS
          : this.isOpenAiPreview ? OPENAI_PRACTICE_PROMPTS.map((prompt) => ({
            id: prompt.id, title: prompt.title, statement: prompt.intent, whatThisMeasures: '', clarifyFirst: [],
            strongAnswer: prompt.rubric, commonMiss: '', resourceLabel: '', resourcePath: '',
          })) : []);
    this.answerGuides = Object.fromEntries(prompts.map((prompt) => [prompt.id, prompt]));
    // An inline guide fills its count tokens from the same evidence its sources list shows.
    this.inlineCounts = this.evidence?.counts
      ?? (this.isGooglePreview || this.isOpenAiPreview ? evidenceFrom([], prompts.length, this.interviewProcess).counts : null);
    // A catalog guide has no list of its own: the table's and the questions' sources come first, each with a note on
    // where the page uses it, then the accounts only its reported items rest on. Google and OpenAI show no reported
    // items, so their table and questions make it up.
    const inline = this.isGooglePreview || this.isOpenAiPreview;
    const cited = evidenceFrom([], 0, this.interviewProcess).sources;
    const seen = new Set(cited.map((source) => source.url));
    this.guideSourceRows = this.sourceRows(
      this.evidence?.sources
        ?? [...cited, ...(inline ? [] : this.reportedItemSources(resolved?.reports ?? []).filter((source) => !seen.has(source.url)))],
    );
    this.editorialNotes = this.authoredPreview || this.isOpenAiPreview || this.isGooglePreview || this.isNetflixPreview
      ? null
      : this.editorialNotesRegistry[this.slug] ?? null;
    this.data = resolved ?? {
      slug: this.slug,
      mode: 'catalog',
      counts: { all: 0, coding: 0, trivia: 0, system: 0, debug: 0 },
      samples: [],
    };

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

  /** "Coding 8 · Concepts 14": a kind the set does not hold is left out rather than shown as zero. */
  countsLabel(counts: { coding: number; trivia: number; system: number; debug?: number }): string {
    return ([[counts.coding, 'Coding'], [counts.debug ?? 0, 'Debugging'], [counts.trivia, 'Concepts'], [counts.system, 'System']] as const)
      .filter(([count]) => count > 0)
      .map(([count, kind]) => `${kind} ${count}`)
      .join(' · ');
  }

  /** An inline guide's text with its count tokens filled. */
  fillInline(text: string): string {
    return this.inlineCounts ? fillCompanyCounts(text, this.inlineCounts) : text;
  }

  /** The source boundary shown with the sources at the end of the page. */
  get sourceBoundary(): AuthoredSectionCopy | null {
    return this.authoredPreview?.sourceBoundary
      ?? (this.isOpenAiPreview ? OPENAI_SOURCE_BOUNDARY : this.isNetflixPreview ? NETFLIX_SOURCE_BOUNDARY : null);
  }

  /** "19 reported questions", for a guide's hero. */
  reportedQuestionsChip(): string {
    const total = this.questionSummary()?.total ?? 0;
    return `${total} reported ${total === 1 ? 'question' : 'questions'}`;
  }

  displayKind(kind: CompanyPreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Concept question';
  }

  private publishOpenAiSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(OPENAI_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);
    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: this.fillInline(OPENAI_PREVIEW_TITLE),
      headline: OPENAI_PREVIEW_H1,
      description: this.fillInline(OPENAI_PREVIEW_DESCRIPTION),
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      // The locked rows of the question list are the Premium part; no ItemList names what a visitor cannot read.
      ...lockedAccess(this.features.lockedQuestions),
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
      title: this.fillInline(OPENAI_PREVIEW_TITLE),
      description: this.fillInline(OPENAI_PREVIEW_DESCRIPTION),
      robots: 'index,follow',
      canonical: OPENAI_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  private publishGoogleSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(GOOGLE_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: this.fillInline(GOOGLE_PREVIEW_TITLE),
      headline: GOOGLE_PREVIEW_H1,
      description: this.fillInline(GOOGLE_PREVIEW_DESCRIPTION),
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.features.lockedQuestions),
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
      title: this.fillInline(GOOGLE_PREVIEW_TITLE),
      description: this.fillInline(GOOGLE_PREVIEW_DESCRIPTION),
      robots: 'index,follow',
      canonical: GOOGLE_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  private publishNetflixSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(NETFLIX_PREVIEW_CANONICAL_PATH);
    const dateModified = seoContentDateModified(canonicalUrl);

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: this.fillInline(NETFLIX_PREVIEW_TITLE),
      headline: NETFLIX_PREVIEW_H1,
      description: this.fillInline(NETFLIX_PREVIEW_DESCRIPTION),
      disambiguatingDescription: NETFLIX_PREVIEW_TRUST_NOTE,
      inLanguage: 'en',
      ...(dateModified ? { dateModified } : {}),
      ...lockedAccess(this.features.lockedQuestions),
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
      title: this.fillInline(NETFLIX_PREVIEW_TITLE),
      description: this.fillInline(NETFLIX_PREVIEW_DESCRIPTION),
      robots: 'index,follow',
      canonical: NETFLIX_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, breadcrumb],
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

  /** The reader chose the free unlock for a question: an account spends it, a visitor's choice waits for an account. */
  onFreeUnlock(questionId: string): void {
    if (this.tier() === 'guest') this.freeUnlocks.rememberIntent(this.slug, questionId);
    else if (this.tier() === 'account') this.spendFreeUnlock(questionId, 'direct');
  }

  private spendFreeUnlock(questionId: string, via: 'direct' | 'after_signup'): void {
    const company = this.slug;
    this.unlockState.set({ questionId, status: 'pending' });
    this.freeUnlocks.claim(company, questionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result.status === 'error') {
        this.unlockState.set({ questionId, status: 'error' });
        this.analytics.track('company_question_unlock_failed', { company, question_id: questionId, via });
        return;
      }
      this.unlockState.set(result.status === 'used' ? { questionId, status: 'used' } : null);
      if (result.status === 'opened') {
        this.analytics.track('company_question_unlocked', { company, question_id: questionId, via });
        // The reader lands on the question they opened, wherever the page was.
        if (this.isBrowser) setTimeout(() => document.getElementById(`${company}-question-${questionId}`)?.scrollIntoView({ block: 'start' }));
      }
    });
  }

  /** A plan day's title: its focus up to the first colon, "Media timing" from "Media timing: requestAnimationFrame loops…". */
  dayTitle(focus: string): string {
    const colon = focus.indexOf(':');
    return colon > 0 ? focus.slice(0, colon) : focus;
  }

  /** What a plan day holds after its title; empty when the focus has no colon. */
  dayDetail(focus: string): string {
    const colon = focus.indexOf(':');
    if (colon <= 0) return '';
    const detail = focus.slice(colon + 1).trim();
    return detail.charAt(0).toUpperCase() + detail.slice(1);
  }

  /** The accounts behind a catalog guide's reported practice items, once each, as sources rows. */
  private reportedItemSources(reports: readonly CompanyReportedItem[]): AuthoredSource[] {
    const byUrl = new Map<string, AuthoredSource>();
    for (const item of reports) {
      for (const source of item.sources ?? []) {
        if (UNCITED_SOURCE.test(source.url)) continue;
        if (!byUrl.has(source.url)) {
          byUrl.set(source.url, { label: source.label, url: source.url, kind: 'report', note: 'A public account behind one of the practice tasks tagged for this company.' });
        }
      }
    }
    return [...byUrl.values()];
  }

  /** The guide's sources with who reported each one and when, read from the process data that cites them. */
  private sourceRows(sources: readonly AuthoredSource[]): GuideSourceRow[] {
    const process = this.interviewProcess;
    const byUrl = new Map<string, InterviewProcessSource>();
    // The first citation wins: a thread a stage cites for its poster's loop keeps that date when a question cites a
    // later comment in the same thread.
    const cite = (source: InterviewProcessSource) => byUrl.has(source.url) || byUrl.set(source.url, source);
    for (const variant of process?.variants ?? []) for (const stage of variant.stages) stage.sources.forEach(cite);
    for (const question of [...(process?.questions ?? []), ...(process?.behaviouralQuestions ?? [])]) question.sources.forEach(cite);
    return sources.map((source) => {
      const cited = byUrl.get(source.url);
      const account = cited?.kind === 'report' && !cited.reportForm;
      return {
        label: source.label,
        url: source.url,
        kind: source.kind,
        note: source.note,
        who: cited ? describeReporter(cited) : null,
        date: account ? cited.date : null,
      };
    });
  }

  sourceRel(source: AuthoredSource): string {
    return source.kind === 'report' ? 'noopener noreferrer nofollow' : 'noopener noreferrer';
  }

  private publishAuthoredSeo(preview: AuthoredCompanyPreview): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(preview.canonicalPath);
    const dateModified = seoContentDateModified(canonicalUrl);

    // The locked rows of the question list are the Premium part. Their questions are not listed as an ItemList:
    // structured data would name what a visitor cannot read.
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
      ...lockedAccess(this.features.lockedQuestions),
      about: preview.about.map((name) => ({ '@type': 'Thing', name })),
      mentions: preview.resourceLinks.items.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
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
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  private prettyCompany(slug: string): string {
    return companyBrandFor(slug)?.label ?? slug;
  }
}
