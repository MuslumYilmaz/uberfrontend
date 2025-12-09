import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';
import { MixedQuestion, QuestionService } from '../../core/services/question.service';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';
import { TRACKS } from '../tracks/track.data';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';

type FormatCounts = Record<CategoryKeyInternal, number>;
type FocusCounts = Record<FocusKey, number>;

type Stats = {
  companyCounts: Record<string, number>;
  techCounts: Record<string, number>;
  formatCounts: FormatCounts;
  triviaTotal: number;
  systemDesignTotal: number;
  focusCounts: FocusCounts;
};
type CategoryKeyInternal = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';

type FocusKey =
  | 'accessibility'
  | 'async'
  | 'design-system'
  | 'dom'
  | 'forms'
  | 'polyfills'
  | 'lodash'
  | 'react-hooks'
  | 'promise'
  | 'state-management';

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
  focusKey?: FocusKey;
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

  // ---- STATS: company + framework + formats + focus counts ----
  stats$: Observable<Stats> = forkJoin({
    coding: this.questions.loadAllQuestions('coding'),
    trivia: this.questions.loadAllQuestions('trivia'),
    system: this.questions.loadSystemDesign(),
  }).pipe(
    map(({ coding, trivia, system }) => {
      const companyCounts: Record<string, number> = {};
      const techCounts: Record<string, number> = {};
      const formatCounts: FormatCounts = {
        ui: 0,
        'js-fn': 0,
        'html-css': 0,
        algo: 0,
        system: 0,
      };

      const focusCounts: FocusCounts = {
        accessibility: 0,
        async: 0,
        'design-system': 0,
        dom: 0,
        forms: 0,
        polyfills: 0,
        lodash: 0,
        'react-hooks': 0,
        promise: 0,
        'state-management': 0,
      };

      const bumpFocus = (q: MixedQuestion) => {
        for (const key of this.focusBucketsForQuestion(q)) {
          focusCounts[key] = (focusCounts[key] ?? 0) + 1;
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

        const companies: string[] =
          (q as any).companies ?? (q as any).companyTags ?? [];

        for (const c of companies) {
          companyCounts[c] = (companyCounts[c] ?? 0) + 1;
        }

        bumpFocus(q);
      }

      // TRIVIA
      for (const q of trivia) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q as MixedQuestion);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;

        const companies: string[] =
          (q as any).companies ?? (q as any).companyTags ?? [];

        for (const c of companies) {
          companyCounts[c] = (companyCounts[c] ?? 0) + 1;
        }

        bumpFocus(q);
      }

      const systemDesignTotal = Array.isArray(system) ? system.length : 0;
      formatCounts.system = systemDesignTotal;

      const triviaTotal = trivia.length;

      return {
        companyCounts,
        techCounts,
        formatCounts,
        triviaTotal,
        systemDesignTotal,
        focusCounts,
      };
    }),
    shareReplay(1)
  );

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'FrontendAtlas Interview Blueprint',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'book',
      route: ['/guides', 'interview-blueprint'],
    },
    {
      title: 'FA Core 75',
      subtitle:
        'The 75 most important front end interview questions. Covers patterns & formats.',
      icon: 'book',
      disabled: true,
      badge: 'Coming soon',
    },
    {
      title: 'Frontend System Design Blueprint',
      subtitle: 'Core techniques and deep dives (guide).',
      icon: 'grid',
      route: ['/guides', 'system-design-blueprint'],
    },
    {
      title: 'Behavioral Interview Handbook',
      subtitle: 'STAR method, stories, and high-signal answers.',
      icon: 'book',
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
      route: ['/tracks', t.slug],
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

  /** ===== Focus areas ===== */
  focusAreas: Card[] = [
    {
      title: 'Accessibility',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { focus: 'accessibility', reset: 1 },   // 👈
      focusKey: 'accessibility',
    },
    {
      title: 'Async Operations',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { focus: 'async', reset: 1 },           // 👈
      focusKey: 'async',
    },
    {
      title: 'DOM Manipulation',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { focus: 'dom', reset: 1 },             // 👈
      focusKey: 'dom',
    },
    {
      title: 'Forms',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { focus: 'forms', reset: 1 },           // 👈
      focusKey: 'forms',
    },
    {
      title: 'JavaScript Promises',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'javascript', focus: 'promise', reset: 1 }, // 👈
      focusKey: 'promise',
    },
    {
      title: 'JavaScript Polyfills',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'javascript', focus: 'polyfills', reset: 1 }, // 👈
      focusKey: 'polyfills',
    },
    {
      title: 'State Management',
      subtitle: '0 questions',
      icon: 'grid',
      route: ['/coding'],
      queryParams: { tech: 'react', focus: 'state-management', reset: 1 }, // 👈
      focusKey: 'state-management',
    },
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

  private focusBucketsForQuestion(q: MixedQuestion): FocusKey[] {
    const keys: FocusKey[] = [];

    const tech = String(
      (q as any).tech ?? (q as any).technology ?? ''
    ).toLowerCase();
    const title = String((q as any).title ?? '').toLowerCase();
    const tags: string[] = ((q as any).tags ?? []).map((t: any) =>
      String(t || '').toLowerCase()
    );

    const hasTag = (...candidates: string[]) =>
      tags.some(t => candidates.includes(t));

    if (hasTag('accessibility', 'a11y')) {
      keys.push('accessibility');
    }

    if (hasTag('async', 'promise', 'async-await', 'concurrency', 'xhr', 'fetch')) {
      keys.push('async');
    }

    if (hasTag('design-system', 'design-system-components', 'component-library')) {
      keys.push('design-system');
    }

    if (hasTag('dom', 'dom-manipulation', 'events')) {
      keys.push('dom');
    }

    if (
      tech === 'angular' &&
      (hasTag('forms', 'reactive-forms', 'template-forms') || title.includes('form'))
    ) {
      keys.push('forms');
    }

    if (hasTag('polyfill', 'polyfills')) {
      keys.push('polyfills');
    }

    if (hasTag('lodash') || title.includes('lodash')) {
      keys.push('lodash');
    }

    if (tech === 'react' && (hasTag('hooks', 'react-hooks') || title.includes('hook'))) {
      keys.push('react-hooks');
    }

    if (hasTag('promise', 'promises', 'async-await')) {
      keys.push('promise');
    }

    if (hasTag('state-management', 'redux', 'context', 'zustand', 'mobx')) {
      keys.push('state-management');
    }

    return keys;
  }

  getFocusSubtitle(card: Card, focusCounts: FocusCounts | null | undefined): string {
    if (!card.focusKey || !focusCounts) {
      return card.subtitle ?? '';
    }
    const total = focusCounts[card.focusKey] ?? 0;
    return `${total} questions`;
  }
}
