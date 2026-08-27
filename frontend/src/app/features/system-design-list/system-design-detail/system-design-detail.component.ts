import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PUBLIC_EDITORIAL_FACTS, publicEditorialAuthorSchema } from '../../../core/content/public-editorial-facts';
import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID,
  QueryList, ViewChild, ViewChildren, WritableSignal, computed, effect, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { ChipModule } from 'primeng/chip';
import { QuestionService } from '../../../core/services/question.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { FaDialogComponent } from '../../../shared/ui/dialog/fa-dialog.component';
import { SEO_SUPPRESS_TOKEN } from '../../../core/services/seo-context';
import { SeoService } from '../../../core/services/seo.service';
import { isQuestionLockedForTier } from '../../../core/models/question.model';
import { buildLockedPreviewForSystemDesign, LockedPreviewData } from '../../../core/utils/locked-preview.util';
import {
  isContentAccessibleForFree,
  robotsForContentAccess,
} from '../../../core/utils/content-access-policy.util';
import { SYSTEM } from '../../../shared/guides/guide.registry';
import {
  evaluationGuideAnchorForQuestion,
  performanceGuideAnchorForQuestion,
  pitfallsGuideAnchorForQuestion,
  pickSystemDesignGuideSlug,
  SystemDesignGuideSlug,
} from './system-design-guide-link.util';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { InterviewAvailabilityStore } from '../../../core/services/interview-availability.store';
import { interviewAvailabilityAllowsRole } from '../../../core/models/interview.model';
import {
  normalizeSystemDesignDetail,
  SystemDesignDetailResolved,
} from '../../../core/resolvers/question-detail.resolver';
import {
  freeChallengeForFramework,
  frameworkLabel,
  preferredFramework,
  timelineLabel,
} from '../../../core/utils/onboarding-personalization.util';
import {
  resolveSystemDesignPractice,
  SystemDesignContentBlock as Block,
  SystemDesignQuestion as SDQuestion,
  SystemDesignRadioSection as RadioSection,
} from '../../../core/models/system-design.model';

type RelatedItem = {
  id: string;
  title: string;
  access?: 'free' | 'premium';
};
type LockedPath = {
  id: string;
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
};
type BlueprintGuideLink = {
  slug: SystemDesignGuideSlug;
  title: string;
  route: string[];
};

const RADIO_GUIDE_SLUG: SystemDesignGuideSlug = 'radio-framework';
const DEFAULT_DETAIL_GUIDE_SLUGS: readonly SystemDesignGuideSlug[] = [
  'intro',
  'framework',
  'performance',
  'evaluation',
  'pitfalls',
  'state-data',
];

@Component({
  selector: 'app-system-design-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChipModule,
    FooterComponent,
    LockedPreviewComponent,
    FaButtonComponent,
    FaDialogComponent,
  ],
  templateUrl: './system-design-detail.component.html',
  styleUrls: ['./system-design-detail.component.css']
})
export class SystemDesignDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private qs = inject(QuestionService);
  private seo = inject(SeoService);
  private readonly suppressSeo = inject(SEO_SUPPRESS_TOKEN);
  readonly auth = inject(AuthService);
  private bugReport = inject(BugReportService);
  private onboarding = inject(OnboardingService);
  private analytics = inject(AnalyticsService);
  private readonly interviewAvailability = inject(InterviewAvailabilityStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly guideTitleBySlug = new Map(SYSTEM.map((entry) => [entry.slug, entry.title]));

  q: WritableSignal<SDQuestion | null> = signal(null);
  all: SDQuestion[] = [];
  idx = 0;
  private forceListRefreshTried = false;

  // content
  title = computed(() => this.q()?.title ?? '');
  description = computed(() => this.q()?.description ?? '');
  tags = computed(() => this.q()?.tags ?? []);
  practice = computed(() => resolveSystemDesignPractice(
    this.q() ?? { description: '', difficulty: 'intermediate', tags: [] },
  ));
  targetLevelLabel = computed(() => {
    const level = this.practice().targetLevel;
    return level === 'mid' ? 'Mid-level' : `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  });
  guidedMockQueryParams = computed<Record<string, string>>(() => ({
    format: 'system-design',
    level: this.practice().targetLevel,
    sourceQuestionId: this.q()?.id ?? '',
    src: 'system_design_detail',
  }));
  guidedMockAccess = signal<'hidden' | 'signin' | 'loading' | 'available' | 'unavailable'>('hidden');
  guidedMockLoginQueryParams = (): Record<string, string> => ({
    redirectTo: this.router.url,
  });
  private readonly syncGuidedMockAccess = effect((onCleanup) => {
    if (!this.practice().guidedMock) {
      this.guidedMockAccess.set('hidden');
      return;
    }
    const user = this.auth.user();
    if (!user) {
      this.guidedMockAccess.set('signin');
      return;
    }

    this.guidedMockAccess.set('loading');
    const subscription = this.interviewAvailability.resolve().subscribe({
      next: (availability) => {
        const systemDesign = availability.formatAvailability.find(
          (entry) => entry.format === 'system-design',
        );
        this.guidedMockAccess.set(
          interviewAvailabilityAllowsRole(availability, user.role)
          && systemDesign?.enabled === true
            ? 'available'
            : 'unavailable',
        );
      },
      error: () => this.guidedMockAccess.set('unavailable'),
    });
    onCleanup(() => subscription.unsubscribe());
  }, { allowSignalWrites: true });
  contentLoadState = computed<'ready' | 'error'>(() =>
    this.q()?.contentLoadState === 'error' ? 'error' : 'ready'
  );
  contentRetrying = signal(false);
  locked = computed(() => {
    const access = this.q()?.access ?? 'free';
    const user = this.auth.user();
    return isQuestionLockedForTier({ access }, user);
  });
  lockedTitle = computed(() => this.q()?.title ?? 'Premium question');
  lockedPersonalizationLine = computed(() => {
    const profile = this.onboarding.getProfile();
    if (!profile) return '';
    const framework = preferredFramework(profile);
    return `Selected path: ${frameworkLabel(framework)} · ${timelineLabel(profile.timeline)}.`;
  });
  lockedMemberCopy = computed(() => {
    const profile = this.onboarding.getProfile();
    if (!profile) return "You're on the free tier. Upgrade to access this system design scenario.";
    const framework = preferredFramework(profile);
    return `You’re on the ${frameworkLabel(framework)} ${timelineLabel(profile.timeline)}. Upgrade to access this premium system design scenario.`;
  });
  lockedGuestCopy = computed(() => {
    const profile = this.onboarding.getProfile();
    if (!profile) return 'Upgrade to FrontendAtlas Premium to access this system design scenario. Already upgraded? Sign in to continue.';
    const framework = preferredFramework(profile);
    return `This system design scenario is premium for your ${frameworkLabel(framework)} path. Upgrade, or sign in if you already upgraded.`;
  });
  lockedPaths = computed<LockedPath[]>(() => {
    const profile = this.onboarding.getProfile();
    const framework = preferredFramework(profile);
    const challenge = freeChallengeForFramework(framework);
    return [
      {
        id: 'free_challenge',
        label: challenge.label,
        route: challenge.route,
        queryParams: { src: 'system_design_locked' },
      },
      {
        id: 'track_previews',
        label: 'Open track previews',
        route: ['/tracks'],
        queryParams: { src: 'system_design_locked' },
      },
      {
        id: 'company_previews',
        label: 'Browse company previews',
        route: ['/companies'],
        queryParams: { src: 'system_design_locked' },
      },
    ];
  });
  lockedSummary = computed(() => {
    const q = this.q();
    if (!q) return '';
    const normalized = this.normalizePreviewText(this.sdDescription(q));
    return this.trimWords(normalized, 45);
  });
  lockedBullets = computed(() => {
    const sections = this.sections();
    return sections
      .map((s) => this.trimWords(this.normalizePreviewText(s.title), 8))
      .filter((item) => item.length > 0)
      .slice(0, 2);
  });
  lockedPreview = computed<LockedPreviewData | null>(() => {
    const q = this.q();
    if (!q) return null;
    return buildLockedPreviewForSystemDesign({
      id: q.id,
      title: q.title,
      description: this.sdDescription(q),
      tags: q.tags || [],
      sectionTitles: this.sections().map((s) => s.title),
      premiumPreview: q.premiumPreview,
    }, {
      candidates: this.all as any,
    });
  });
  readonly radioGuideRoute: string[] = ['/', 'guides', 'system-design-blueprint', RADIO_GUIDE_SLUG];
  recommendedBlueprintGuide = computed<BlueprintGuideLink>(() => {
    const slug = pickSystemDesignGuideSlug(this.q());
    return this.buildBlueprintGuideLink(slug);
  });
  guideLinks = computed<BlueprintGuideLink[]>(() => {
    const recommendedSlug = this.recommendedBlueprintGuide().slug;
    return this.buildUniqueBlueprintGuideLinks([
      RADIO_GUIDE_SLUG,
      recommendedSlug,
      ...DEFAULT_DETAIL_GUIDE_SLUGS,
    ]);
  });
  supportingGuideLinks = computed<BlueprintGuideLink[]>(() =>
    this.guideLinks().filter((link) => link.slug !== RADIO_GUIDE_SLUG)
  );

  sections = computed<Required<RadioSection>[]>(() => {
    const item = this.q(); if (!item) return [];
    const normalize = (s: RadioSection): Required<RadioSection> => ({
      key: s.key, title: s.title, content: s.content ?? '',
      blocks: this.normalizeDisplayBlocks(
        s.blocks?.length ? s.blocks : s.content ? [{ type: 'text', text: s.content }] : [],
      ),
    });

    return item.radio?.map(normalize) ?? [];
  });

  private normalizeDisplayBlocks(blocks: Block[]): Block[] {
    const normalized = blocks.map((block): Block => {
      if (block.type === 'columns') {
        return {
          ...block,
          columns: block.columns.map((column) => ({
            ...column,
            blocks: this.normalizeDisplayBlocks(column.blocks),
          })),
        };
      }
      if (block.type === 'steps') {
        return {
          ...block,
          steps: block.steps.map((step, index) => ({
            ...step,
            title: this.displayStepTitle(step.title, index),
          })),
        };
      }
      return { ...block };
    });

    return normalized.filter((block, index, all) => {
      if (block.type !== 'divider') return true;
      if (index === 0 || index === all.length - 1) return false;
      return all[index - 1]?.type !== 'divider';
    });
  }

  private displayStepTitle(title: string, index: number): string {
    const normalized = String(title || '').trim();
    const match = normalized.match(/^(\d+)[.)]\s+(.+)$/);
    if (!match || Number(match[1]) !== index + 1) return normalized;
    return match[2].trim();
  }

  /** Related system design questions based on shared tags (top 4). */
  relatedItems = computed<RelatedItem[]>(() => {
    const current = this.q();
    if (!current || !this.all.length) return [];
    const baseTags = Array.isArray(current.tags) ? current.tags.map(t => t.toLowerCase()) : [];
    if (!baseTags.length) return [];
    const baseSet = new Set(baseTags);

    const scored = this.all
      .filter((q) => q.id !== current.id)
      .map((q) => {
        const tags = Array.isArray(q.tags) ? q.tags.map(t => t.toLowerCase()) : [];
        let score = 0;
        for (const tag of tags) if (baseSet.has(tag)) score += 1;
        return score ? { q, score } : null;
      })
      .filter(Boolean) as Array<{ q: SDQuestion; score: number }>;

    scored.sort((a, b) =>
      b.score - a.score
      || ((a.q.access === 'free') === (b.q.access === 'free') ? 0 : (a.q.access === 'free' ? -1 : 1))
      || (a.q.title || '').localeCompare(b.q.title || '')
    );

    return scored.slice(0, 4).map(({ q }) => ({
      id: q.id,
      title: q.title,
      access: q.access ?? 'free',
    }));
  });

  /** Active TOC key (scroll spy) */
  activeKey = signal<string | null>(null);
  openSectionKeys = signal<ReadonlySet<string>>(new Set<string>());
  mobileOverviewOpen = signal(false);
  mobileTocOpen = signal(false);
  @ViewChildren('sectionHeading', { read: ElementRef }) heads!: QueryList<ElementRef<HTMLElement>>;
  private mobileOverviewTrigger: HTMLElement | null = null;
  private mobileTocTrigger: HTMLElement | null = null;
  trackByTagValue = (index: number, tag: string): string => tag || String(index);
  trackBySectionKey = (_: number, section: RadioSection): string => section.key;
  trackByBlock = (index: number, block: Block): string =>
    `${block.type}:${(block as any).key || (block as any).title || index}`;
  trackByStringValue = (index: number, value: string): string => value || String(index);
  trackByTableRow = (index: number, row: string[]): string => `${index}:${row.join('|')}`;
  trackByTableCell = (index: number, cell: string): string => `${index}:${cell}`;
  trackByColumnIndex = (index: number, _col: unknown): number => index;
  trackByInnerBlock = (index: number, block: Block): string => this.trackByBlock(index, block);
  trackByStatItem = (index: number, item: { label: string; value: string }): string =>
    `${item.label}:${item.value}:${index}`;
  trackByStepTitle = (index: number, step: { title: string }): string => `${step.title}:${index}`;
  trackByLinkItem = (index: number, item: { href: string; label: string }): string =>
    `${item.href}:${item.label}:${index}`;
  trackByRelatedId = (_: number, item: RelatedItem): string => item.id;
  trackByLockedPath = (_: number, path: LockedPath): string => path.id;
  trackByGuideSlug = (_: number, item: BlueprintGuideLink): string => item.slug;
  /** Center column for potential responsive image sizing */
  @ViewChild('centerEl', { read: ElementRef }) centerEl!: ElementRef<HTMLElement>;

  // programmatic scroll coordination
  private isProgrammaticScroll = false;
  private programScrollTarget: number | null = null;
  private settleWatcher: any = null;

  // rAF throttle for resize work
  private resizeRaf = 0;
  private pendingFragment: string | null = null;
  private answerHistoryActive = false;

  // ---- lifecycle ----
  ngOnInit(): void {
    this.pendingFragment = this.route.snapshot.fragment;
    this.route.fragment.subscribe((fragment) => {
      this.pendingFragment = fragment;
      this.applyFragment(fragment);
    });

    const initial = this.route.snapshot.data['systemDesignDetail'] as SystemDesignDetailResolved | undefined;
    if (initial) this.applyResolvedSystemDesign(initial);

    this.route.data.subscribe((data) => {
      const resolved = data['systemDesignDetail'] as SystemDesignDetailResolved | undefined;
      if (resolved) {
        this.applyResolvedSystemDesign(resolved);
        return;
      }

      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.setCurrentById(id, /*allowPending*/ true);
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.heads.changes.subscribe(() => setTimeout(() => {
      this.updateActiveFromPositions();
    }, 0));

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    setTimeout(() => {
      this.updateActiveFromPositions();
    }, 0);
  }

  ngOnDestroy(): void {
    this.closeMobilePanels();
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    }
    clearInterval(this.settleWatcher);
  }

  trackLockedPathClick(pathId: string): void {
    const profile = this.onboarding.getProfile();
    this.analytics.track('premium_unlock_path_clicked', {
      context: 'system_design_locked',
      path_id: pathId,
      question_id: this.q()?.id ?? null,
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
    });
  }

  goToPricingFromLocked(): void {
    const profile = this.onboarding.getProfile();
    this.analytics.track('premium_gate_path_clicked', {
      action: 'view_pricing',
      context: 'system_design_locked',
      question_id: this.q()?.id ?? null,
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
    });
    this.router.navigate(['/pricing'], {
      queryParams: {
        src: 'system_design_locked',
        framework: profile?.framework ?? undefined,
        timeline: profile?.timeline ?? undefined,
      },
    });
  }

  goToLoginFromLocked(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: this.router.url || '/' },
    });
  }

  reportIssue(): void {
    const q = this.q();
    this.bugReport.open({
      source: 'system_design_detail',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: 'system-design',
      questionId: q?.id,
      questionTitle: q?.title,
    });
  }

  reportAccessIssue(): void {
    const q = this.q();
    this.bugReport.open({
      source: 'system_design_locked',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: 'system-design',
      questionId: q?.id,
      questionTitle: q?.title,
    });
  }

  trackGuidedMockClick(): void {
    const question = this.q();
    if (!question || !this.practice().guidedMock) return;
    this.analytics.track('system_design_guided_mock_clicked', {
      question_id: question.id,
      target_level: this.practice().targetLevel,
      timebox_minutes: this.practice().timeboxMinutes,
    });
  }

  openReferenceAnswer(): void {
    if (this.locked()) return;
    const first = this.sections()[0];
    if (!first) return;

    this.openSectionKeys.set(new Set([first.key]));
    this.activeKey.set(first.key);
    this.answerHistoryActive = true;
    this.analytics.track('system_design_reference_opened', {
      question_id: this.q()?.id ?? null,
      target_level: this.practice().targetLevel,
      timebox_minutes: this.practice().timeboxMinutes,
    });

    if (this.pendingFragment === 'answer') {
      this.scrollToKey(first.key, true);
      return;
    }

    this.pendingFragment = 'answer';
    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: 'answer',
      queryParamsHandling: 'preserve',
    }).then(() => this.scrollToKey(first.key, true));
  }

  navigateToSection(key: string, focusSummary: boolean): void {
    if (this.locked() || !this.sections().some((section) => section.key === key)) return;
    this.setSectionOpen(key, true);
    this.activeKey.set(key);
    this.closeMobilePanels();
    this.pendingFragment = this.anchorId(key);

    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: this.anchorId(key),
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    }).then(() => this.scrollToKey(key, focusSummary));
  }

  isSectionOpen(key: string): boolean {
    return this.openSectionKeys().has(key);
  }

  onSectionToggle(key: string, event: Event): void {
    const details = event.currentTarget as HTMLDetailsElement | null;
    if (!details) return;
    this.setSectionOpen(key, details.open);
    if (details.open) this.activeKey.set(key);
  }

  private setSectionOpen(key: string, open: boolean): void {
    const next = new Set(this.openSectionKeys());
    if (open) next.add(key);
    else next.delete(key);
    this.openSectionKeys.set(next);
  }

  private applyFragment(fragment: string | null): void {
    if (!this.q() || this.locked()) return;

    const first = this.sections()[0];
    if (!fragment) {
      if (this.answerHistoryActive && first) {
        this.setSectionOpen(first.key, false);
        this.answerHistoryActive = false;
      }
      return;
    }

    if (fragment === 'answer') {
      if (!first) return;
      this.openSectionKeys.set(new Set([first.key]));
      this.activeKey.set(first.key);
      this.answerHistoryActive = true;
      setTimeout(() => this.scrollToKey(first.key), 0);
      return;
    }

    const section = this.sections().find((candidate) => this.anchorId(candidate.key) === fragment);
    if (!section) return;
    this.setSectionOpen(section.key, true);
    this.activeKey.set(section.key);
    setTimeout(() => this.scrollToKey(section.key), 0);
  }

  // ---- helpers ----
  asset(path: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `assets/${path.replace(/^\/+/, '')}`;
  }

  isExternalLink(href: string): boolean {
    return /^https?:\/\//i.test(String(href || '').trim());
  }

  /**
   * Set current item by id.
   * If list is loaded and id is unknown → navigate to /404 with the missing URL.
   */
  private setCurrentById(id: string, allowPending: boolean) {
    this.closeMobilePanels();
    if (!this.all.length) {
      // Liste henüz gelmediyse ve beklemeye izin yoksa çık
      if (!allowPending) return;
    }

    const pos = this.all.findIndex(x => x.id === id);

    if (pos >= 0) {
      this.idx = pos;
      this.activeKey.set(null);

      // Detay json'ı çek (meta + radio blokları)
      this.qs.loadSystemDesignQuestion(id, { transferState: false }).subscribe(detail => {
        if (!detail) {
          this.navTo404();
          return;
        }

        const merged = normalizeSystemDesignDetail(id, this.all, detail);
        if (!merged) {
          this.navTo404();
          return;
        }
        this.applyResolvedQuestion(merged as SDQuestion);
      });

      return;
    }

    // Cache can be stale: try a one-time refresh before 404
    if (!this.forceListRefreshTried) {
      this.forceListRefreshTried = true;
      this.qs.clearCache();
      this.qs.loadSystemDesign({ transferState: false }).subscribe((list) => {
        this.all = (list as SDQuestion[]) ?? [];
        this.setCurrentById(id, /*allowPending*/ false);
      });
      return;
    }

    // If the list is still missing the id, try loading detail directly
    this.qs.loadSystemDesignQuestion(id, { transferState: false }).subscribe(detail => {
      if (!detail) {
        if (this.all.length) this.navTo404();
        return;
      }

      const merged = normalizeSystemDesignDetail(id, this.all, detail);
      if (!merged) {
        if (this.all.length) this.navTo404();
        return;
      }
      this.applyResolvedQuestion(merged as SDQuestion);
    });
  }

  private applyResolvedSystemDesign(resolved: SystemDesignDetailResolved): void {
    const routeId = this.route.snapshot.paramMap.get('id') || resolved?.id || '';
    this.all = (resolved?.list || []) as SDQuestion[];
    this.forceListRefreshTried = false;

    if (resolved?.question) {
      this.idx = Math.max(0, this.all.findIndex((item) => item.id === resolved.question?.id));
      this.applyResolvedQuestion(resolved.question as SDQuestion);
      return;
    }

    if (routeId) {
      this.setCurrentById(routeId, /*allowPending*/ true);
    }
  }

  private applyResolvedQuestion(question: SDQuestion, preserveDisclosure = false): void {
    this.contentRetrying.set(false);
    if (!preserveDisclosure) {
      this.openSectionKeys.set(new Set<string>());
      this.answerHistoryActive = false;
    }
    this.activeKey.set(null);
    this.q.set(question);
    this.updateSeo(question);

    if (this.isBrowser) {
      try {
        localStorage.setItem(
          'fa:lastVisited',
          JSON.stringify({
            to: ['/system-design', question.id],
            label: question.title ?? 'System design',
          }),
        );
      } catch {
        // ignore localStorage errors
      }
    }

    const secs = this.sections();
    if (preserveDisclosure) {
      const availableKeys = new Set(secs.map((section) => section.key));
      this.openSectionKeys.set(new Set(
        [...this.openSectionKeys()].filter((key) => availableKeys.has(key)),
      ));
    }
    this.activeKey.set(secs[0]?.key ?? null);
    setTimeout(() => {
      this.applyFragment(this.pendingFragment);
      this.updateActiveFromPositions();
    }, 0);
  }

  retrySystemDesignContent(): void {
    const current = this.q();
    if (!current || this.contentRetrying()) return;

    this.contentRetrying.set(true);
    this.qs.loadSystemDesignQuestion(current.id, { transferState: false }).subscribe({
      next: (detail) => {
        const merged = normalizeSystemDesignDetail(current.id, this.all, detail);
        if (merged) {
          this.applyResolvedQuestion(merged as SDQuestion, true);
          return;
        }
        this.contentRetrying.set(false);
      },
      error: () => this.contentRetrying.set(false),
    });
  }

  /** Send the user to the NotFound page with the missing URL preserved. */
  private navTo404() {
    const missing = this.router.url;
    if (this.isBrowser) {
      try { sessionStorage.setItem('fa:lastMissing', missing); } catch { }
    }
    // replaceUrl so Back returns to the last valid page instead of the bad URL
    this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
  }

  private sdDescription(q: SDQuestion): string {
    const plain = (q.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain || `Front-end system design scenario: ${q.title}`;
  }

  private seoTitle(q: SDQuestion): string {
    return String(q.seo?.title || q.title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private seoDescription(q: SDQuestion): string {
    const explicit = String(q.seo?.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return explicit || this.sdDescription(q);
  }

  private normalizePreviewText(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/`+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private uniq(items: string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const val = this.normalizePreviewText(item);
      if (!val || seen.has(val.toLowerCase())) continue;
      seen.add(val.toLowerCase());
      out.push(val);
    }
    return out;
  }

  private buildBlueprintGuideLink(slug: SystemDesignGuideSlug): BlueprintGuideLink {
    const performanceAnchor = slug === 'performance'
      ? performanceGuideAnchorForQuestion(this.q())
      : null;
    const evaluationAnchor = slug === 'evaluation'
      ? evaluationGuideAnchorForQuestion(this.q())
      : null;
    const pitfallsAnchor = slug === 'pitfalls'
      ? pitfallsGuideAnchorForQuestion(this.q())
      : null;

    return {
      slug,
      title: performanceAnchor || evaluationAnchor || pitfallsAnchor || this.guideTitleBySlug.get(slug) || slug,
      route: ['/', 'guides', 'system-design-blueprint', slug],
    };
  }

  private buildUniqueBlueprintGuideLinks(slugs: readonly SystemDesignGuideSlug[]): BlueprintGuideLink[] {
    const links: BlueprintGuideLink[] = [];
    const seen = new Set<SystemDesignGuideSlug>();
    for (const slug of slugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      links.push(this.buildBlueprintGuideLink(slug));
    }
    return links;
  }

  private trimWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}…`;
  }

  private sdKeywords(q: SDQuestion): string[] {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const base = ['front end system design', 'ui architecture interview'];
    return Array.from(
      new Set([...base, ...tags].map(k => String(k || '').trim()).filter(Boolean))
    );
  }

  private buildLearningResourceSchema(question: SDQuestion, canonical: string): Record<string, any> {
    const practice = resolveSystemDesignPractice(question);
    const teaches = this.uniq([
      ...(question.tags || []),
      ...this.sections().map((s) => s.title),
    ]).slice(0, 8);

    return {
      '@type': 'LearningResource',
      '@id': `${canonical}#learning-resource`,
      name: question.title,
      description: this.sdDescription(question),
      url: canonical,
      inLanguage: 'en',
      learningResourceType: 'System design practice question',
      educationalLevel: practice.targetLevel,
      timeRequired: `PT${practice.timeboxMinutes}M`,
      teaches,
      isAccessibleForFree: isContentAccessibleForFree(question.access),
      author: publicEditorialAuthorSchema(),
    };
  }

  private resolveAuthor(_q: SDQuestion): string {
    return PUBLIC_EDITORIAL_FACTS.author.name;
  }

  private resolveDateIso(raw?: string): string | null {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  private resolveUpdatedIso(q: SDQuestion): string | null {
    return this.resolveDateIso(q.updatedAt);
  }

  private resolvePublishedIso(q: SDQuestion, dateModified: string | null): string {
    return this.resolveDateIso(q.publishedAt)
      || dateModified
      || '2025-01-01T00:00:00.000Z';
  }

  private structuredDataImageUrl(): string {
    return this.seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
  }

  authorLabel(q?: SDQuestion | null): string {
    if (!q) return PUBLIC_EDITORIAL_FACTS.author.name;
    return this.resolveAuthor(q);
  }

  updatedLabel(q?: SDQuestion | null): string | null {
    if (!q) return null;
    const iso = this.resolveUpdatedIso(q);
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private updateSeo(question: SDQuestion): void {
    if (this.suppressSeo) return;
    const canonical = this.seo.buildCanonicalUrl(`/system-design/${question.id}`);
    const seoTitle = this.seoTitle(question);
    const description = this.seoDescription(question);
    const keywords = this.sdKeywords(question);
    const dateModified = this.resolveUpdatedIso(question);
    const datePublished = this.resolvePublishedIso(question, dateModified);
    const imageUrl = this.structuredDataImageUrl();
    const accessibleForFree = isContentAccessibleForFree(question.access);
    const robots = robotsForContentAccess(question.access);

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
          name: 'System design',
          item: this.seo.buildCanonicalUrl('/system-design'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: question.title,
          item: canonical,
        },
      ],
    };

    const article = {
      '@type': 'Article',
      '@id': canonical,
      headline: question.title,
      description,
      url: canonical,
      image: [imageUrl],
      datePublished,
      mainEntityOfPage: canonical,
      inLanguage: 'en',
      author: publicEditorialAuthorSchema(),
      publisher: {
        '@type': 'Organization',
        name: 'FrontendAtlas',
        logo: {
          '@type': 'ImageObject',
          url: imageUrl,
        },
      },
      isAccessibleForFree: accessibleForFree,
      keywords: keywords.join(', '),
      dateModified: dateModified || datePublished,
    };

    const learningResource = this.buildLearningResourceSchema(question, canonical);
    const jsonLd = [breadcrumb, article, learningResource];

    this.seo.updateTags({
      title: seoTitle,
      description,
      keywords,
      robots,
      canonical,
      ogType: 'article',
      jsonLd,
    });
  }

  /** Height to keep clear for the fixed header + breathing room */
  private headerOffset(): number {
    if (!this.isBrowser) return 76;
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top').trim();
    const base = parseInt(raw || '64', 10);
    return (isNaN(base) ? 64 : base) + 12;
  }

  /** Switch a tad earlier than the header line to feel natural */
  private leadBeforeHeader(): number { return 96; }

  /** Choose the last heading whose absolute top is <= scroll line; force last when near bottom. */
  private updateActiveFromPositions = () => {
    if (!this.isBrowser || !this.heads) return;
    const nodes = this.heads.toArray().map(h => h.nativeElement);
    if (!nodes.length) return;

    // If we're very close to the bottom, force last section active
    const doc = document.documentElement;
    const bottomGap = doc.scrollHeight - (window.pageYOffset + window.innerHeight);
    if (bottomGap <= Math.max(48, this.leadBeforeHeader())) {
      const lastKey = nodes[nodes.length - 1].dataset['key'] || null;
      if (lastKey && this.activeKey() !== lastKey) this.activeKey.set(lastKey);
      return;
    }

    const line = window.pageYOffset + this.headerOffset() + this.leadBeforeHeader();
    let bestIdx = 0;

    for (let i = 0; i < nodes.length; i++) {
      const absTop = nodes[i].getBoundingClientRect().top + window.pageYOffset;
      if (absTop <= line) bestIdx = i;
      else break;
    }

    const key = nodes[bestIdx].dataset['key'] || null;
    if (key && this.activeKey() !== key) this.activeKey.set(key);
  };

  private onScroll = () => {
    if (this.isProgrammaticScroll) return;
    this.updateActiveFromPositions();
  };

  private onResize = () => {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => {
      this.updateActiveFromPositions();
    });
  };

  /** smooth scroll to section with offset and a “settle” guard */
  scrollToKey(key: string, focusSummary = false) {
    if (!this.isBrowser) return;
    const el = document.getElementById(this.anchorId(key));
    if (!el) return;

    this.closeMobilePanels();
    this.activeKey.set(key);

    const desired = el.getBoundingClientRect().top + window.pageYOffset - (this.headerOffset() + 8);
    const doc = document.documentElement;
    const maxTop = Math.max(0, doc.scrollHeight - window.innerHeight);
    this.programScrollTarget = Math.min(maxTop, Math.max(0, desired));
    this.isProgrammaticScroll = true;

    window.scrollTo({
      top: this.programScrollTarget,
      behavior: this.preferredScrollBehavior(),
    });
    if (focusSummary) this.focusSectionSummary(el);

    clearInterval(this.settleWatcher);
    let lastY = window.pageYOffset;
    let stableTicks = 0;
    const start = Date.now();
    const MAX_MS = 1800;

    this.settleWatcher = setInterval(() => {
      const y = window.pageYOffset;
      const nearTarget = this.programScrollTarget !== null && Math.abs(y - this.programScrollTarget) < 3;
      const delta = Math.abs(y - lastY);
      lastY = y;
      stableTicks = delta < 2 ? (stableTicks + 1) : 0;

      if (nearTarget || stableTicks >= 3 || (Date.now() - start) > MAX_MS) {
        clearInterval(this.settleWatcher);
        this.isProgrammaticScroll = false;
        this.programScrollTarget = null;
        this.updateActiveFromPositions();
      }
    }, 80);
  }

  private focusSectionSummary(section: HTMLElement): void {
    requestAnimationFrame(() => {
      const summary = section.querySelector('summary');
      if (summary instanceof HTMLElement) summary.focus({ preventScroll: true });
    });
  }

  scrollTop() {
    if (!this.isBrowser) return;
    this.isProgrammaticScroll = true;
    this.programScrollTarget = 0;
    window.scrollTo({ top: 0, behavior: this.preferredScrollBehavior() });

    clearInterval(this.settleWatcher);
    let lastY = window.pageYOffset;
    let stableTicks = 0;
    const start = Date.now();
    const MAX_MS = 1200;

    this.settleWatcher = setInterval(() => {
      const y = window.pageYOffset;
      const nearTop = y < 3;
      const delta = Math.abs(y - lastY);
      lastY = y;
      stableTicks = delta < 2 ? (stableTicks + 1) : 0;

      if (nearTop || stableTicks >= 3 || (Date.now() - start) > MAX_MS) {
        clearInterval(this.settleWatcher);
        this.isProgrammaticScroll = false;
        this.programScrollTarget = null;
        this.updateActiveFromPositions();
      }
    }, 80);
  }

  anchorId(key: string) { return `sec-${key}`; }

  get hasPrev(): boolean {
    return this.idx > 0;
  }

  get hasNext(): boolean {
    return this.idx < this.all.length - 1;
  }

  get progressText(): string {
    return this.all.length ? ` ${this.idx + 1} / ${this.all.length}` : '';
  }

  private navToIndex(index: number) {
    const target = this.all[index];
    if (!target) return;
    // Route resolver refreshes detail data before rendering the new question.
    this.router.navigate(['/system-design', target.id]);
  }

  onPrev() {
    if (!this.hasPrev) return;
    this.closeMobilePanels();
    this.navToIndex(this.idx - 1);
  }

  onNext() {
    if (!this.hasNext) return;
    this.closeMobilePanels();
    this.navToIndex(this.idx + 1);
  }

  toggleMobileOverview(trigger?: EventTarget | null) {
    if (trigger instanceof HTMLElement) this.mobileOverviewTrigger = trigger;
    if (this.mobileOverviewOpen()) {
      this.mobileOverviewOpen.set(false);
      this.restoreMobileFocus(this.mobileOverviewTrigger);
      return;
    }
    this.closeMobileToc(false);
    this.mobileOverviewOpen.set(true);
  }

  openMobileOverview(trigger?: EventTarget | null) {
    if (trigger instanceof HTMLElement) this.mobileOverviewTrigger = trigger;
    this.closeMobileToc(false);
    this.mobileOverviewOpen.set(true);
  }

  closeMobileOverview(restoreFocus = true) {
    const wasOpen = this.mobileOverviewOpen();
    this.mobileOverviewOpen.set(false);
    if (wasOpen && restoreFocus) this.restoreMobileFocus(this.mobileOverviewTrigger);
  }

  onMobileOverviewVisibleChange(visible: boolean): void {
    if (visible) {
      this.mobileOverviewOpen.set(true);
      return;
    }
    this.closeMobileOverview();
  }

  toggleMobileToc(trigger?: EventTarget | null) {
    if (trigger instanceof HTMLElement) this.mobileTocTrigger = trigger;
    if (this.mobileTocOpen()) {
      this.mobileTocOpen.set(false);
      this.restoreMobileFocus(this.mobileTocTrigger);
      return;
    }
    this.closeMobileOverview(false);
    this.mobileTocOpen.set(true);
  }

  openMobileToc(trigger?: EventTarget | null) {
    if (trigger instanceof HTMLElement) this.mobileTocTrigger = trigger;
    this.closeMobileOverview(false);
    this.mobileTocOpen.set(true);
  }

  closeMobileToc(restoreFocus = true) {
    const wasOpen = this.mobileTocOpen();
    this.mobileTocOpen.set(false);
    if (wasOpen && restoreFocus) this.restoreMobileFocus(this.mobileTocTrigger);
  }

  onMobileTocVisibleChange(visible: boolean): void {
    if (visible) {
      this.mobileTocOpen.set(true);
      return;
    }
    this.closeMobileToc();
  }

  closeMobilePanels() {
    if (this.mobileOverviewOpen()) {
      this.closeMobileOverview();
      return;
    }
    this.closeMobileToc();
  }

  private restoreMobileFocus(target: HTMLElement | null): void {
    if (!this.isBrowser || !target) return;
    requestAnimationFrame(() => {
      if (document.contains(target)) target.focus();
    });
  }

  private preferredScrollBehavior(): ScrollBehavior {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  }
}
