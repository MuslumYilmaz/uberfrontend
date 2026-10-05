import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { CommonModule } from '@angular/common';
import { publicEditorialAuthorSchema } from '../../../core/content/public-editorial-facts';
import { Component, DestroyRef, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoService } from '../../../core/services/seo.service';
import {
  TradeoffBattleAnswerExample,
  TradeoffBattleListItem,
  TradeoffBattleMatrixRow,
  TradeoffBattleOption,
  TradeoffBattleScenario,
} from '../../../core/models/tradeoff-battle.model';
import { TradeoffBattleDetailResolved } from '../../../core/resolvers/tradeoff-battle.resolver';
import { TradeoffBattleProgressService } from '../../../core/services/tradeoff-battle-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { buildLockedPreviewForTradeoff, LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';
import { frameworkFromTech, freeChallengeForFramework } from '../../../core/utils/onboarding-personalization.util';
import { isProActive } from '../../../core/utils/entitlements.util';
import {
  isContentAccessibleForFree,
  robotsForContentAccess,
} from '../../../core/utils/content-access-policy.util';

type LockedPath = {
  id: string;
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
};

function updatedLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

@Component({
    selector: 'app-tradeoff-detail',
    imports: [CommonModule, RouterModule, LockedPreviewComponent, LoginRequiredDialogComponent],
    templateUrl: './tradeoff-detail.component.html',
    styleUrls: ['./tradeoff-detail.component.css']
})
export class TradeoffDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  readonly auth = inject(AuthService);
  private readonly bugReport = inject(BugReportService);
  readonly progress = inject(TradeoffBattleProgressService);
  private readonly viewReady = signal(false);
  readonly renderedUser = computed(() => this.viewReady() ? this.auth.user() : null);
  private readonly sessionScope = computed(() => this.renderedUser()?._id ?? 'guest');
  private restoredScope: string | null = null;

  readonly battle = signal<TradeoffBattleScenario | null>(null);
  readonly battleList = signal<TradeoffBattleListItem[]>([]);
  readonly prevBattle = signal<TradeoffBattleListItem | null>(null);
  readonly nextBattle = signal<TradeoffBattleListItem | null>(null);
  readonly selectedOptionId = signal('');
  readonly analysisRevealed = signal(false);
  readonly completed = signal(false);
  loginPromptOpen = false;
  readonly loginPromptTitle = 'Save this tradeoff decision';
  readonly loginPromptBody = 'Create a free account to keep completed battles and continue with your decision history. Already have an account? Sign in.';
  readonly loginPromptSignupLabel = 'Create free account';
  readonly loginPromptLoginLabel = 'Sign in';

  readonly selectedOption = computed<TradeoffBattleOption | null>(() => {
    const scenario = this.battle();
    const optionId = this.selectedOptionId();
    if (!scenario || !optionId) return null;
    return scenario.options.find((option) => option.id === optionId) ?? null;
  });
  readonly locked = computed(() => {
    const scenario = this.battle();
    return scenario ? scenario.meta.access === 'premium' && !isProActive(this.renderedUser()) : false;
  });
  readonly lockedTitle = computed(() => this.battle()?.meta.title || 'Premium tradeoff battle');
  readonly lockedMemberCopy = computed(() => "You're on the free tier. Upgrade to access this premium tradeoff battle.");
  readonly lockedGuestCopy = computed(() => 'Upgrade to FrontendAtlas Premium to access this tradeoff battle. Already upgraded? Sign in to continue.');
  readonly lockedPreview = computed<LockedPreviewData | null>(() => {
    const scenario = this.battle();
    if (!scenario) return null;
    return buildLockedPreviewForTradeoff(scenario.meta, this.battleList());
  });
  readonly lockedPaths = computed<LockedPath[]>(() => {
    const tech = this.battle()?.meta.tech || 'javascript';
    const challenge = freeChallengeForFramework(frameworkFromTech(tech));
    return [
      {
        id: 'free_challenge',
        label: challenge.label,
        route: challenge.route,
        queryParams: { src: 'tradeoff_locked' },
      },
      {
        id: 'track_previews',
        label: 'Open track previews',
        route: ['/tracks'],
        queryParams: { src: 'tradeoff_locked' },
      },
      {
        id: 'company_previews',
        label: 'Browse company previews',
        route: ['/companies'],
        queryParams: { src: 'tradeoff_locked' },
      },
    ];
  });

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.hydrateFromResolved(data['tradeoffBattleDetail'] as TradeoffBattleDetailResolved | undefined));

    // Hydrate the same closed analysis as the prerender before reading browser progress.
    afterNextRender(() => this.viewReady.set(true));
    effect(() => {
      if (!this.viewReady()) return;
      const scope = this.sessionScope();
      if (scope !== this.restoredScope) {
        this.restoredScope = scope;
        this.loginPromptOpen = false;
      }
      const scenario = this.battle();
      if (!scenario || this.locked()) {
        this.resetProgressState();
        return;
      }
      // Restore on route/account/access changes; background sync must not replace a live choice.
      const record = untracked(() => this.progress.getRecord(scenario.meta.id));
      this.selectedOptionId.set(scenario.options.some((option) => option.id === record.selectedOptionId)
        ? record.selectedOptionId : '');
      this.analysisRevealed.set(record.analysisRevealed);
      this.completed.set(record.completed);
    });
  }

  selectOption(optionId: string): void {
    const battle = this.battle();
    if (!this.viewReady() || !battle || this.locked() || !battle.options.some((option) => option.id === optionId)) return;
    this.selectedOptionId.set(optionId);
    this.progress.saveDraft(battle.meta.id, {
      selectedOptionId: optionId,
    });
  }

  revealAnalysis(): void {
    const battle = this.battle();
    if (!this.viewReady() || !battle || this.locked() || !this.selectedOption()) return;
    const record = this.progress.revealAnalysis(battle.meta.id, {
      selectedOptionId: this.selectedOptionId(),
    });
    this.selectedOptionId.set(record.selectedOptionId);
    this.analysisRevealed.set(record.analysisRevealed);
  }

  markComplete(): void {
    const battle = this.battle();
    if (!this.viewReady() || !battle || this.locked() || !this.analysisRevealed() || this.completed()) return;
    if (!this.auth.isLoggedIn()) {
      this.loginPromptOpen = true;
      return;
    }

    const record = this.progress.markCompleted(battle.meta.id, {
      selectedOptionId: this.selectedOptionId(),
    });
    this.selectedOptionId.set(record.selectedOptionId);
    this.analysisRevealed.set(record.analysisRevealed);
    this.completed.set(record.completed);
  }

  completionLabel(): string {
    return this.completed() ? 'Completed' : 'Mark as completed';
  }

  trackByString(_: number, value: string): string {
    return value;
  }

  trackByLockedPath(_: number, path: LockedPath): string {
    return path.id;
  }

  updatedLabel(value: string | null | undefined): string | null {
    return updatedLabel(value);
  }

  goToPricingFromLocked(): void {
    this.router.navigate(['/pricing'], {
      queryParams: { src: 'tradeoff_locked' },
    });
  }

  goToLoginFromLocked(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: this.router.url || '/', src: 'tradeoff_complete' },
    });
  }

  reportAccessIssue(): void {
    const scenario = this.battle();
    this.bugReport.open({
      source: 'tradeoff_locked',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: scenario?.meta.tech,
      questionId: scenario?.meta.id,
      questionTitle: scenario?.meta.title,
    });
  }

  matrixCell(row: TradeoffBattleMatrixRow, optionId: string) {
    return row.cells.find((cell) => cell.optionId === optionId) ?? null;
  }

  verdictLabel(verdict: string): string {
    if (verdict === 'best-fit') return 'Best fit';
    if (verdict === 'reasonable') return 'Reasonable';
    return 'Stretch';
  }

  answerExampleTone(example: TradeoffBattleAnswerExample): string {
    return `is-${example.level}`;
  }

  private hydrateFromResolved(resolved: TradeoffBattleDetailResolved | undefined): void {
    const scenario = resolved?.battle ?? null;
    this.battle.set(scenario);
    this.battleList.set(resolved?.list ?? []);
    this.prevBattle.set(resolved?.prev ?? null);
    this.nextBattle.set(resolved?.next ?? null);
    this.resetProgressState();
    this.loginPromptOpen = false;

    if (scenario) this.updateSeo(scenario);
  }

  private resetProgressState(): void {
    this.selectedOptionId.set('');
    this.analysisRevealed.set(false);
    this.completed.set(false);
  }

  private updateSeo(scenario: TradeoffBattleScenario): void {
    const meta = scenario.meta;
    const techLabel = meta.tech === 'javascript'
      ? 'JavaScript'
      : meta.tech === 'react'
        ? 'React'
        : meta.tech === 'angular'
          ? 'Angular'
          : meta.tech === 'vue'
            ? 'Vue'
            : meta.tech === 'html'
              ? 'HTML'
              : meta.tech === 'css'
                ? 'CSS'
                : meta.tech === 'system-design'
                  ? 'System design'
                  : 'Frontend';
    const canonicalPath = `/tradeoffs/${meta.id}`;
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const dateModified = seoContentDateModified(canonicalUrl);
    const tradeoffHubUrl = this.seo.buildCanonicalUrl('/tradeoffs');
    const imageUrl = this.seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
    const accessibleForFree = isContentAccessibleForFree(meta.access);
    const description =
      `Practice this ${techLabel.toLowerCase()} tradeoff interview question. ${meta.summary} Learn how to compare the options and defend a balanced answer clearly.`;
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
          name: 'Tradeoff Battles',
          item: tradeoffHubUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: meta.title,
          item: canonicalUrl,
        },
      ],
    };
    const learningResource = {
      '@type': 'LearningResource',
      '@id': canonicalUrl,
      name: meta.title,
      headline: meta.title,
      description,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: 'en',
      learningResourceType: 'Tradeoff battle',
      educationalUse: 'Interview practice',
      timeRequired: `PT${meta.estimatedMinutes}M`,
      isAccessibleForFree: accessibleForFree,
      keywords: meta.tags.join(', '),
      ...(dateModified ? { dateModified } : {}),
      author: publicEditorialAuthorSchema(),
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
        '@id': tradeoffHubUrl,
        url: tradeoffHubUrl,
        name: 'Frontend Tradeoff Interview Questions and Architecture Decisions',
      },
      about: [
        { '@type': 'Thing', name: `${techLabel} tradeoff interview question` },
        { '@type': 'Thing', name: 'Frontend architecture tradeoffs' },
      ],
    };

    this.seo.updateTags({
      title: `${meta.title} - ${techLabel} Tradeoff Question`,
      description,
      canonical: canonicalPath,
      robots: robotsForContentAccess(meta.access),
      keywords: [
        ...meta.tags,
        'frontend tradeoff interview questions',
        `${techLabel.toLowerCase()} tradeoff question`,
        `${techLabel.toLowerCase()} architecture interview`,
      ],
      ogType: 'article',
      jsonLd: [breadcrumb, learningResource],
    });
  }
}
