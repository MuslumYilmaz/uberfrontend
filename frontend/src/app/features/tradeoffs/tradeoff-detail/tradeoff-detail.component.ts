import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
import { LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';
import { frameworkFromTech, freeChallengeForFramework } from '../../../core/utils/onboarding-personalization.util';
import { isProActive } from '../../../core/utils/entitlements.util';

type LockedPath = {
  id: string;
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
};

function normalizePreviewText(value: string): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimWords(value: string, maxWords: number): string {
  const normalized = normalizePreviewText(value);
  if (!normalized) return '';
  const words = normalized.split(/\s+/);
  if (words.length <= maxWords) return normalized;
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function updatedLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTradeoffLockedPreview(
  scenario: TradeoffBattleScenario,
  candidates: TradeoffBattleListItem[],
): LockedPreviewData {
  const related = candidates
    .filter((item) => item.id !== scenario.meta.id && item.tech === scenario.meta.tech)
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      to: ['/tradeoffs', item.id],
      premium: item.access === 'premium',
    }));

  return {
    what: `This premium ${scenario.meta.tech} tradeoff battle focuses on ${scenario.meta.title}. Commit to a direction, justify it with the prompt constraints, and explain when the alternative wins.`,
    keyDecisions: [
      'Pick a direction for this exact prompt, not the universal winner.',
      'State the trade-off that matters most for this scenario.',
      'Name when another option becomes the better answer.',
      'Keep the explanation grounded in concrete constraints.',
    ],
    rubric: [
      'Strong answers tie the recommendation to the prompt.',
      'Good tradeoff reasoning explains downsides, not just upsides.',
      'The answer should show when the recommendation stops being right.',
      'Follow-up pressure should not break the argument.',
    ],
    learningGoals: scenario.evaluationDimensions
      .map((item) => trimWords(item.title, 10))
      .filter(Boolean)
      .slice(0, 4),
    constraints: [
      trimWords(scenario.prompt, 18),
      ...scenario.options.slice(0, 3).map((item) => trimWords(item.summary, 16)),
    ].filter(Boolean),
    snippet: {
      title: 'Options on the table',
      lines: scenario.options.slice(0, 4).map((option) => `${option.label}: ${trimWords(option.summary, 14)}`),
    },
    pitfalls: [
      'Arguing from preference instead of prompt constraints.',
      'Pretending one option is always the winner.',
      'Ignoring the main downside of the chosen direction.',
      'Failing to explain when the alternative becomes stronger.',
    ],
    related,
  };
}

@Component({
  standalone: true,
  selector: 'app-tradeoff-detail',
  imports: [CommonModule, RouterModule, LockedPreviewComponent, LoginRequiredDialogComponent],
  templateUrl: './tradeoff-detail.component.html',
  styleUrls: ['./tradeoff-detail.component.css'],
})
export class TradeoffDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  readonly auth = inject(AuthService);
  private readonly bugReport = inject(BugReportService);
  readonly progress = inject(TradeoffBattleProgressService);

  readonly battle = signal<TradeoffBattleScenario | null>(null);
  readonly battleList = signal<TradeoffBattleListItem[]>([]);
  readonly prevBattle = signal<TradeoffBattleListItem | null>(null);
  readonly nextBattle = signal<TradeoffBattleListItem | null>(null);
  readonly selectedOptionId = signal('');
  readonly analysisRevealed = signal(false);
  readonly completed = signal(false);
  loginPromptOpen = false;
  readonly loginPromptTitle = 'Sign in to save completed tradeoff battles';
  readonly loginPromptBody = 'To track completed tradeoff battles and keep your progress synced, sign in or create a free account.';
  readonly loginPromptCta = 'Go to login';

  readonly selectedOption = computed<TradeoffBattleOption | null>(() => {
    const scenario = this.battle();
    const optionId = this.selectedOptionId();
    if (!scenario || !optionId) return null;
    return scenario.options.find((option) => option.id === optionId) ?? null;
  });
  readonly locked = computed(() => {
    const scenario = this.battle();
    return scenario ? scenario.meta.access === 'premium' && !isProActive(this.auth.user()) : false;
  });
  readonly lockedTitle = computed(() => this.battle()?.meta.title || 'Premium tradeoff battle');
  readonly lockedMemberCopy = computed(() => "You're on the free tier. Upgrade to access this premium tradeoff battle.");
  readonly lockedGuestCopy = computed(() => 'Upgrade to FrontendAtlas Premium to access this tradeoff battle. Already upgraded? Sign in to continue.');
  readonly lockedSummary = computed(() => trimWords(this.battle()?.meta.summary || '', 45));
  readonly lockedBullets = computed(() =>
    (this.battle()?.options ?? [])
      .map((item) => trimWords(item.label, 12))
      .filter(Boolean)
      .slice(0, 2),
  );
  readonly lockedPreview = computed<LockedPreviewData | null>(() => {
    const scenario = this.battle();
    if (!scenario) return null;
    return buildTradeoffLockedPreview(scenario, this.battleList());
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
  }

  selectOption(optionId: string): void {
    this.selectedOptionId.set(optionId);
    const battle = this.battle();
    if (!battle) return;
    this.progress.saveDraft(battle.meta.id, {
      selectedOptionId: optionId,
    });
  }

  revealAnalysis(): void {
    const battle = this.battle();
    if (!battle) return;
    const record = this.progress.revealAnalysis(battle.meta.id, {
      selectedOptionId: this.selectedOptionId(),
    });
    this.selectedOptionId.set(record.selectedOptionId);
    this.analysisRevealed.set(record.analysisRevealed);
  }

  markComplete(): void {
    const battle = this.battle();
    if (!battle || this.completed()) return;
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

  goToAdjacentBattle(target: TradeoffBattleListItem | null): void {
    if (!target) return;
    void this.router.navigate(['/tradeoffs', target.id]);
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
      queryParams: { redirectTo: this.router.url || '/' },
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

    if (!scenario) return;

    const record = this.progress.getRecord(scenario.meta.id);
    this.updateSeo(scenario);
    if (scenario.meta.access === 'premium' && !isProActive(this.auth.user())) {
      this.selectedOptionId.set('');
      this.analysisRevealed.set(false);
      this.completed.set(false);
      return;
    }
    this.selectedOptionId.set(record.selectedOptionId);
    this.analysisRevealed.set(record.analysisRevealed);
    this.completed.set(record.completed);
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
    const tradeoffHubUrl = this.seo.buildCanonicalUrl('/tradeoffs');
    const imageUrl = this.seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
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
      isAccessibleForFree: meta.access !== 'premium',
      keywords: meta.tags.join(', '),
      dateModified: `${meta.updatedAt}T00:00:00Z`,
      author: { '@type': 'Organization', name: 'FrontendAtlas' },
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
