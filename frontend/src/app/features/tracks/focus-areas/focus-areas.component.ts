import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import {
  deriveTopicIdsFromTags,
  TopicDefinition,
  TopicsRegistry,
} from '../../../core/utils/topics.util';
import topicRegistryJson from '../../../../assets/questions/topic-registry.json';

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
  constructor(private readonly questions: QuestionService) {}

  private readonly topicsRegistry: TopicsRegistry = topicRegistryJson as TopicsRegistry;

  readonly stats$: Observable<FocusAreaStats> = forkJoin({
    coding: this.questions.loadAllQuestions('coding'),
    trivia: this.questions.loadAllQuestions('trivia'),
  }).pipe(
    map(({ coding, trivia }) => this.buildStats(coding, trivia, this.topicsRegistry.topics ?? [])),
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
}
