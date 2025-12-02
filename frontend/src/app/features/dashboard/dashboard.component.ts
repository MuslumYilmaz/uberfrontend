import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
import { OfflineBannerComponent } from '../../shared/components/offline-banner/offline-banner';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';

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

  piIcon(key?: IconKey) {
    const name = key ? (this.ICON_MAP[key] ?? 'question') : 'window';
    return ['pi', `pi-${name}`];
  }

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
    { title: 'Google', subtitle: '34 questions', icon: 'building', route: ['/companies', 'google'] },
    { title: 'Amazon', subtitle: '61 questions', icon: 'building', route: ['/companies', 'amazon'] },
    { title: 'Netflix', subtitle: '35 questions', icon: 'building', route: ['/companies', 'netflix'] },
    { title: 'ByteDance', subtitle: '27 questions', icon: 'building', route: ['/companies', 'bytedance'] },
    { title: 'Apple', subtitle: '13 questions', icon: 'building', route: ['/companies', 'apple'] },
    { title: 'OpenAI', subtitle: '15 questions', icon: 'building', route: ['/companies', 'openai'] },
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
    { title: 'User Interface Coding', subtitle: '0/59 questions', icon: 'list', route: ['/coding'] },
    { title: 'JavaScript Functions', subtitle: '0/140 questions', icon: 'list', route: ['/coding'], queryParams: { tech: 'javascript' } },
    { title: 'Front End System Design', subtitle: '0/19 questions', icon: 'list', route: ['/system-design'] },
    { title: 'Quiz', subtitle: '0/283 questions', icon: 'list', route: ['/coding'] },
    { title: 'Data Structures & Algorithms Coding', subtitle: '0/92 questions', icon: 'list', route: ['/coding'] },
    { title: 'Behavioral', subtitle: '0/8 articles', icon: 'list', route: ['/guides', 'behavioral'] },
  ];

  /** ===== Framework tiles → /coding?tech=<key> ===== */
  frameworks: Card[] = [
    { title: 'JavaScript', subtitle: '0/483 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'javascript' } },
    { title: 'React', subtitle: '0/91 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'react' } },
    { title: 'Angular', subtitle: '0/32 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'angular' } },
    { title: 'Vue', subtitle: '0/31 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'vue' } },
    { title: 'CSS', subtitle: '0/74 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'css' } },
    { title: 'HTML', subtitle: '0/90 questions', icon: 'grid', route: ['/coding'], queryParams: { tech: 'html' } },
  ];

  trackByTitle = (_: number, it: Card) => it.title;
}
