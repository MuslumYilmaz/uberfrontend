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

@Component({
  standalone: true,
  selector: 'app-tradeoff-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './tradeoff-detail.component.html',
  styleUrls: ['./tradeoff-detail.component.css'],
})
export class TradeoffDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  readonly progress = inject(TradeoffBattleProgressService);

  readonly battle = signal<TradeoffBattleScenario | null>(null);
  readonly battleList = signal<TradeoffBattleListItem[]>([]);
  readonly prevBattle = signal<TradeoffBattleListItem | null>(null);
  readonly nextBattle = signal<TradeoffBattleListItem | null>(null);
  readonly selectedOptionId = signal('');
  readonly analysisRevealed = signal(false);

  readonly selectedOption = computed<TradeoffBattleOption | null>(() => {
    const scenario = this.battle();
    const optionId = this.selectedOptionId();
    if (!scenario || !optionId) return null;
    return scenario.options.find((option) => option.id === optionId) ?? null;
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
    this.analysisRevealed.set(true);
    this.progress.markCompleted(battle.meta.id, {
      selectedOptionId: this.selectedOptionId(),
    });
  }

  goToAdjacentBattle(target: TradeoffBattleListItem | null): void {
    if (!target) return;
    void this.router.navigate(['/tradeoffs', target.id]);
  }

  trackByString(_: number, value: string): string {
    return value;
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
    this.selectedOptionId.set(record.selectedOptionId);
    this.analysisRevealed.set(record.completed);
    this.updateSeo(scenario);
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
