import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';
import { MixedQuestion, QuestionService } from '../../core/services/question.service';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';
type FormatCounts = Record<CategoryKeyInternal, number>;

type Stats = {
  companyCounts: Record<string, number>;
  techCounts: Record<string, number>;
  formatCounts: FormatCounts;
  triviaTotal: number;
  systemDesignTotal: number;
};
type CategoryKeyInternal = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';

type Card = {
  title: string;
  subtitle?: string;
  icon?: IconKey;
  route?: any[];
  queryParams?: Params;     // pre-filters like /coding?tech=react
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
    'recursion', 'two-pointers', 'binary-search', 'heap', 'graph', 'bfs', 'dfs',
    'topological', 'trie', 'dynamic-programming', 'dp', 'sorting', 'greedy', 'backtracking'
  ]);

  private inferFormatCategory(q: MixedQuestion): CategoryKeyInternal {
    const tech = String((q as any).technology || q.tech || '').toLowerCase();

    if (tech === 'html' || tech === 'css') return 'html-css';
    if (['angular', 'react', 'vue'].includes(tech) || (q as any).sdk) return 'ui';

    const tags: string[] = ((q as any).tags || []).map((t: any) => String(t || '').toLowerCase());
    if (tags.some(t => this.ALGO_TAGS.has(t))) return 'algo';

    return 'js-fn';
  }

  piIcon(key?: IconKey) {
    const name = key ? (this.ICON_MAP[key] ?? 'question') : 'window';
    return ['pi', `pi-${name}`];
  }

  // ---- STATS: company + framework + formats counts ----
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

      // ✅ CODING → formats + techCounts + companyCounts
      for (const q of coding) {
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        const cat = this.inferFormatCategory(q);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;

        const companies: string[] =
          (q as any).companies ??
          (q as any).companyTags ??
          [];

        for (const c of companies) {
          companyCounts[c] = (companyCounts[c] ?? 0) + 1;
        }
      }

      // ✅ TRIVIA → formats + techCounts (şimdi buraya da ekledik) + companyCounts
      for (const q of trivia) {
        // frameworks için tech count
        const tech = (q as any).tech ?? (q as any).technology;
        if (tech) {
          techCounts[tech] = (techCounts[tech] ?? 0) + 1;
        }

        // formats için trivia’yı da say
        const cat = this.inferFormatCategory(q as MixedQuestion);
        formatCounts[cat] = (formatCounts[cat] ?? 0) + 1;

        const companies: string[] =
          (q as any).companies ??
          (q as any).companyTags ??
          [];

        for (const c of companies) {
          companyCounts[c] = (companyCounts[c] ?? 0) + 1;
        }
      }

      const systemDesignTotal = Array.isArray(system) ? system.length : 0;
      formatCounts.system = systemDesignTotal;

      const triviaTotal = trivia.length;

      return { companyCounts, techCounts, formatCounts, triviaTotal, systemDesignTotal };
    }),
    shareReplay(1)
  );

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'Front End Interview Playbook',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'book',
      route: ['/guides', 'playbook'],
    },
    {
      title: 'GFE 75',
      subtitle:
        'The 75 most important front end interview questions. Covers patterns & formats.',
      icon: 'book',
      disabled: true,
      badge: 'Coming soon',
    },
    {
      title: 'Front End System Design Playbook',
      subtitle: 'Core techniques and deep dives (guide).',
      icon: 'grid',
      route: ['/guides', 'system-design'],
    },
    // ✅ NEW: Behavioral Guide
    {
      title: 'Behavioral Interview Guide',
      subtitle: 'STAR method, stories, and high-signal answers.',
      icon: 'book',
      route: ['/guides', 'behavioral'],
    },
  ];

  /** ===== Study plans (route to guide for now) ===== */
  studyPlans: Card[] = [
    { title: '1 Week', subtitle: '51 questions · 2 hours daily', icon: 'bolt', route: ['/guides', 'playbook'] },
    { title: '1 Month', subtitle: '107 questions · 6 hours weekly', icon: 'clock', route: ['/guides', 'playbook'] },
    { title: '3 Months', subtitle: '280 questions · 3 hours weekly', icon: 'star', route: ['/guides', 'playbook'] },
  ];

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
  // These go to /coding; add queryParams when you want to pre-filter by tech
  focusAreas: Card[] = [
    { title: 'Accessibility', subtitle: '12 questions', icon: 'grid', route: ['/coding'] },
    { title: 'Async Operations', subtitle: '33 questions', icon: 'grid', route: ['/coding'] },
    { title: 'Design System Components', subtitle: '15 questions', icon: 'grid', route: ['/coding'] },
    { title: 'DOM Manipulation', subtitle: '10 questions', icon: 'grid', route: ['/coding'] },
    { title: 'Forms', subtitle: '10 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'angular' } },
    { title: 'JavaScript Polyfills', subtitle: '26 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'javascript' } },
    { title: 'Lodash Functions', subtitle: '28 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'javascript' } },
    { title: 'React Hooks', subtitle: '23 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'react' } },
    { title: 'State Management', subtitle: '17 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'react' } },
  ];

  /** ===== Practice: formats ===== */
  questionFormats: Card[] = [
    {
      title: 'User Interface Coding',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      // 🔽 kind çıkarıldı
      queryParams: { view: 'formats', category: 'ui' },
      formatKey: 'ui',
      kindKey: 'coding'
    },
    {
      title: 'JavaScript Functions',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      // 🔽 kind çıkarıldı
      queryParams: { view: 'formats', category: 'js-fn' },
      formatKey: 'js-fn',
      kindKey: 'coding'
    },
    {
      title: 'Front End System Design',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      // burada kind=coding bırakabilirsin, system design özel case
      queryParams: { view: 'formats', category: 'system', kind: 'coding' },
      formatKey: 'system',
      kindKey: 'system-design'
    },
    {
      title: 'Trivia',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      queryParams: { kind: 'trivia' },
      kindKey: 'trivia'
    },
    {
      title: 'Data Structures & Algorithms Coding',
      subtitle: '0 questions',
      icon: 'list',
      route: ['/coding'],
      // 🔽 kind çıkarıldı
      queryParams: { view: 'formats', category: 'algo' },
      formatKey: 'algo',
      kindKey: 'coding'
    },
    {
      title: 'Behavioral Interviews',
      subtitle: '0/8 articles',
      icon: 'list',
      route: ['/guides', 'behavioral'],
      kindKey: 'behavioral'
    },
  ];

  /** ===== Framework tiles → /coding?tech=<key> ===== */
  frameworks: Card[] = [
    { title: 'JavaScript', icon: 'grid', route: ['/coding'], queryParams: { tech: 'javascript' }, techKey: 'javascript' },
    { title: 'React', icon: 'grid', route: ['/coding'], queryParams: { tech: 'react' }, techKey: 'react' },
    { title: 'Angular', icon: 'grid', route: ['/coding'], queryParams: { tech: 'angular' }, techKey: 'angular' },
    { title: 'Vue', icon: 'grid', route: ['/coding'], queryParams: { tech: 'vue' }, techKey: 'vue' },
    { title: 'CSS', icon: 'grid', route: ['/coding'], queryParams: { tech: 'css' }, techKey: 'css' },
    { title: 'HTML', icon: 'grid', route: ['/coding'], queryParams: { tech: 'html' }, techKey: 'html' },
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
      // or '0/X quizzes' if you prefer
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
