import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { forkJoin, from, map, Observable, shareReplay } from 'rxjs';
import { MixedQuestion, QuestionService } from '../../core/services/question.service';
import { deriveTopicIdsFromTags, loadTopics, TopicDefinition } from '../../core/utils/topics.util';
import { collectCompanyCounts } from '../../shared/company-counts.util';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';
import { TRACKS } from '../tracks/track.data';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';

type FormatCounts = Record<CategoryKeyInternal, number>;
type TopicCounts = Record<string, number>;

type Stats = {
  companyCounts: Record<string, number>;
  techCounts: Record<string, number>;
  formatCounts: FormatCounts;
  triviaTotal: number;
  systemDesignTotal: number;
  topics: TopicDefinition[];
  topicCounts: TopicCounts;
};
type CategoryKeyInternal = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';

type Card = {
  title: string;
  subtitle?: string;
  icon?: IconKey;
  route?: any[];
  queryParams?: Params;
  disabled?: boolean;
  badge?: string | null;
  metaLeft?: string;
  metaRight?: string;
  companyKey?: string;
  techKey?: 'javascript' | 'react' | 'angular' | 'vue' | 'css' | 'html';
  formatKey?: CategoryKeyInternal;
  kindKey?: 'coding' | 'trivia' | 'system-design' | 'behavioral';
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  constructor(private questions: QuestionService) { }

  private readonly ICON_MAP: Record<IconKey, string> = {
    book: 'book',
    grid: 'th-large',
    list: 'list',
    cap: 'bookmark',
    building: 'briefcase',
    bolt: 'bolt',
    star: 'star',
    clock: 'clock',
  };

  private readonly ALGO_TAGS = new Set<string>([
    'recursion',
    'two-pointers',
    'binary-search',
    'heap',
    'graph',
    'bfs',
    'dfs',
    'topological',
    'trie',
    'dynamic-programming',
    'dp',
    'sorting',
    'greedy',
    'backtracking',
  ]);

  private inferFormatCategory(q: MixedQuestion): CategoryKeyInternal {
    const tech = String((q as any).technology || q.tech || '').toLowerCase();

    if (tech === 'html' || tech === 'css') return 'html-css';
    if (['angular', 'react', 'vue'].includes(tech) || (q as any).sdk) return 'ui';

    const tags: string[] = ((q as any).tags || []).map((t: any) =>
      String(t || '').toLowerCase()
    );
    if (tags.some(t => this.ALGO_TAGS.has(t))) return 'algo';

    return 'js-fn';
  }

  piIcon(key?: IconKey) {
    const name = key ? this.ICON_MAP[key] ?? 'question' : 'window';
    return ['pi', `pi-${name}`];
  }

  // ---- STATS: company + framework + formats + topic counts ----
  stats$: Observable<Stats> = forkJoin({
    coding: this.questions.loadAllQuestions('coding'),
    trivia: this.questions.loadAllQuestions('trivia'),
    system: this.questions.loadSystemDesign(),
    topics: from(loadTopics()),
  }).pipe(
    map(({ coding, trivia, system, topics }) => {
      const companyCounts: Record<string, number> = {};
      const techCounts: Record<string, number> = {};
      const formatCounts: FormatCounts = {
        ui: 0,
        'js-fn': 0,
        'html-css': 0,
        algo: 0,
        system: 0,
      };

      const topicCounts: TopicCounts = {};
      for (const t of topics.topics ?? []) {
        if (t?.id) topicCounts[t.id] = 0;
      }

      const bumpTopics = (q: MixedQuestion) => {
        const tags: string[] = ((q as any).tags ?? []).map((t: any) =>
          String(t || '').toLowerCase()
        );
        for (const id of deriveTopicIdsFromTags(tags, topics)) {
          topicCounts[id] = (topicCounts[id] ?? 0) + 1;
        }
      };

      // CODING
      for (const q of coding) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;

        bumpTopics(q);
      }

      // TRIVIA
      for (const q of trivia) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q as MixedQuestion);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;

        bumpTopics(q);
      }

      const systemDesignTotal = Array.isArray(system) ? system.length : 0;
      formatCounts.system = systemDesignTotal;

      const triviaTotal = trivia.length;

      const companyBuckets = collectCompanyCounts({ coding, trivia, system });
      Object.entries(companyBuckets).forEach(([slug, bucket]) => {
        companyCounts[slug] = bucket.all;
      });

      return {
        companyCounts,
        techCounts,
        formatCounts,
        triviaTotal,
        systemDesignTotal,
        topics: topics.topics ?? [],
        topicCounts,
      };
    }),
    shareReplay(1)
  );

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'FrontendAtlas Interview Blueprint',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'cap',
      route: ['/guides', 'interview-blueprint'],
    },
    {
      title: 'Frontend System Design Blueprint',
      subtitle: 'Core techniques and deep dives (guide).',
      icon: 'grid',
      route: ['/guides', 'system-design-blueprint'],
    },
    {
      title: 'Behavioral Interview Blueprint',
      subtitle: 'STAR method, stories, and high-signal answers.',
      icon: 'star',
      route: ['/guides', 'behavioral'],
    },
  ];

  /** ===== Learning tracks (new) ===== */
  tracks: Card[] = TRACKS
    .filter((t) => !t.hidden)
    .map((t) => ({
      title: t.title,
      subtitle: t.subtitle,
      icon: t.slug === 'crash-7d' ? 'clock' : 'book',
      route: ['/track', t.slug],
    }));

  /** ===== Company guides ===== */
  companyGuides: Card[] = [
    { title: 'Google', icon: 'building', route: ['/companies', 'google'], companyKey: 'google' },
    { title: 'Amazon', icon: 'building', route: ['/companies', 'amazon'], companyKey: 'amazon' },
    { title: 'Netflix', icon: 'building', route: ['/companies', 'netflix'], companyKey: 'netflix' },
    { title: 'ByteDance', icon: 'building', route: ['/companies', 'bytedance'], companyKey: 'bytedance' },
    { title: 'Apple', icon: 'building', route: ['/companies', 'apple'], companyKey: 'apple' },
    { title: 'OpenAI', icon: 'building', route: ['/companies', 'openai'], companyKey: 'openai' },
  ];


  /** ===== Practice: formats ===== */
  questionFormats: Card[] = [
    {
      title: 'User Interface',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'ui', reset: 1 },       // 👈
      formatKey: 'ui',
      kindKey: 'coding',
    },
    {
      title: 'JavaScript / Typescript',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'js-fn', reset: 1 },    // 👈
      formatKey: 'js-fn',
      kindKey: 'coding',
    },
    {
      title: 'Front End System Design',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'system', kind: 'coding', reset: 1 }, // 👈
      formatKey: 'system',
      kindKey: 'system-design',
    },
    {
      title: 'Trivia',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { kind: 'trivia', reset: 1 },       // 👈
      kindKey: 'trivia',
    },
    {
      title: 'Data Structures & Algorithms',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'algo', reset: 1 },     // 👈
      formatKey: 'algo',
      kindKey: 'coding',
    },
    {
      title: 'Behavioral Interviews',
      subtitle: '0/8 articles',
      icon: 'list',
      route: ['/guides', 'behavioral'],
      kindKey: 'behavioral',
    },
  ];


  /** ===== Framework tiles → /coding?tech=<key> ===== */
  frameworks: Card[] = [
    {
      title: 'JavaScript',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'javascript', reset: 1 },   // 👈
      techKey: 'javascript',
    },
    {
      title: 'React',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'react', reset: 1 },        // 👈
      techKey: 'react',
    },
    {
      title: 'Angular',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'angular', reset: 1 },      // 👈
      techKey: 'angular',
    },
    {
      title: 'Vue',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'vue', reset: 1 },          // 👈
      techKey: 'vue',
    },
    {
      title: 'CSS',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'css', reset: 1 },          // 👈
      techKey: 'css',
    },
    {
      title: 'HTML',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'html', reset: 1 },         // 👈
      techKey: 'html',
    },
  ];

  trackByTitle = (_: number, it: Card) => it.title;
  trackByTopicId = (_: number, it: TopicDefinition) => it.id;

  getCompanySubtitle(card: Card, counts: Record<string, number> | null | undefined): string {
    if (!card.companyKey || !counts) {
      return card.subtitle ?? '';
    }
    const count = counts[card.companyKey] ?? 0;
    return `${count} questions`;
  }

  getFrameworkSubtitle(card: Card, counts: Record<string, number> | null | undefined): string {
    if (!card.techKey || !counts) {
      return card.subtitle ?? '';
    }
    const count = counts[card.techKey] ?? 0;
    return `${count} questions`;
  }

  getFormatSubtitle(card: Card, stats: Stats | null | undefined): string {
    if (!stats) {
      return card.subtitle ?? '';
    }

    if (card.kindKey === 'behavioral') {
      return card.subtitle ?? '';
    }

    if (card.kindKey === 'trivia') {
      const total = stats.triviaTotal ?? 0;
      return `0/${total} questions`;
    }

    if (card.kindKey === 'system-design') {
      const total = stats.systemDesignTotal ?? 0;
      return `0/${total} questions`;
    }

    if (card.formatKey) {
      const total = stats.formatCounts[card.formatKey] ?? 0;
      return `0/${total} questions`;
    }

    return card.subtitle ?? '';
  }

}
