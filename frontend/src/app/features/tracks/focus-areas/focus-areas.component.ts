import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, map, Observable, shareReplay, tap } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import {
  deriveTopicIdsFromTags,
  TopicDefinition,
  TopicsRegistry,
} from '../../../core/utils/topics.util';
import { TOPIC_REGISTRY } from '../../../generated/content-metadata';

const FOCUS_AREAS_TITLE = 'Frontend Interview Focus Areas';
const FOCUS_AREAS_DESCRIPTION =
  'Use focus areas to diagnose weak spots, then move into the interview questions hub, study plans, and company-specific practice with the right topic context.';

type FocusAreaRow = {
  id: string;
  title: string;
  questionCount: number;
};

type FocusAreaStats = {
  rows: FocusAreaRow[];
  totalQuestions: number;
};

@Component({
  selector: 'app-focus-areas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './focus-areas.component.html',
  styleUrls: ['./focus-areas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusAreasComponent {
  constructor(
    private readonly questions: QuestionService,
    private readonly seo: SeoService,
  ) {}

  private readonly topicsRegistry: TopicsRegistry = TOPIC_REGISTRY as TopicsRegistry;

  readonly stats$: Observable<FocusAreaStats> = forkJoin({
    coding: this.questions.loadAllQuestionSummaries('coding', { transferState: false }),
    trivia: this.questions.loadAllQuestionSummaries('trivia', { transferState: false }),
  }).pipe(
    map(({ coding, trivia }) => this.buildStats(coding, trivia, this.topicsRegistry.topics ?? [])),
    tap((stats) => this.publishSeo(stats)),
    shareReplay(1),
  );

  private buildStats(coding: any[], trivia: any[], topics: TopicDefinition[]): FocusAreaStats {
    const topicCounts: Record<string, number> = {};
    for (const topic of topics) {
      if (topic?.id) topicCounts[topic.id] = 0;
    }

    const allQuestions = [...(coding ?? []), ...(trivia ?? [])];
    for (const question of allQuestions) {
      const tags: string[] = ((question as any)?.tags ?? []).map((t: any) =>
        String(t || '').toLowerCase(),
      );
      for (const id of deriveTopicIdsFromTags(tags, { schemaVersion: 1, topics })) {
        topicCounts[id] = (topicCounts[id] ?? 0) + 1;
      }
    }

    const rows = topics
      .map((topic) => ({
        id: topic.id,
        title: topic.title,
        questionCount: topicCounts[topic.id] ?? 0,
      }))
      .sort((a, b) => {
        if (b.questionCount !== a.questionCount) return b.questionCount - a.questionCount;
        return a.title.localeCompare(b.title);
      });

    return {
      rows,
      totalQuestions: allQuestions.length,
    };
  }

  private publishSeo(stats: FocusAreaStats): void {
    const canonicalPath = '/focus-areas';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: FOCUS_AREAS_TITLE,
      description: FOCUS_AREAS_DESCRIPTION,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Frontend interview focus areas' },
        { '@type': 'Thing', name: 'Frontend interview study plans' },
      ],
      mentions: [
        { '@type': 'WebPage', name: 'Frontend interview questions hub', url: this.seo.buildCanonicalUrl('/interview-questions') },
        { '@type': 'WebPage', name: 'Foundations Track (30 days)', url: this.seo.buildCanonicalUrl('/tracks/foundations-30d/preview') },
        { '@type': 'WebPage', name: 'Company frontend interview sets', url: this.seo.buildCanonicalUrl('/companies') },
      ],
    };

    if (stats.rows.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement: stats.rows.slice(0, 24).map((row, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: row.title,
        })),
      };
    }

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
          name: FOCUS_AREAS_TITLE,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: FOCUS_AREAS_TITLE,
      description: FOCUS_AREAS_DESCRIPTION,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb],
    });
  }
}
