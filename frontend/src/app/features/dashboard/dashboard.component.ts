import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type IconKey = 'book' | 'grid' | 'list' | 'cap' | 'building' | 'bolt' | 'star' | 'clock';

type Card = {
  title: string;
  subtitle?: string;
  icon?: IconKey;
  route?: any[];
  disabled?: boolean;
  badge?: string | null;
  metaLeft?: string;
  metaRight?: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  /** ===== Continue learning (generic safe target) ===== */
  continueCard: Card | null = {
    title: 'Front End Interview Playbook',
    subtitle: 'Pick up where you left off',
    icon: 'book',
    // Safe route that exists in router (guides -> playbook index)
    route: ['/guides', 'playbook'],
  };

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'Front End Interview Playbook',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'book',
      route: ['/guides', 'playbook'], // ✅ real route
    },
    {
      title: 'GFE 75',
      subtitle:
        'The 75 most important front end interview questions. Covers patterns & formats.',
      icon: 'book',
      disabled: true,                 // no concrete route in router for now
      badge: 'Coming soon',
    },
    {
      title: 'Front End System Design Playbook',
      subtitle: 'Core techniques and deep dives (guide).',
      icon: 'grid',
      route: ['/guides', 'system-design'], // ✅ guide route (not the practice area)
    },
  ];

  /** ===== Study plans =====
   * There are no explicit /plans routes; send users to the playbook
   * (closest valid entry point) until plans exist.
   */
  studyPlans: Card[] = [
    { title: '1 Week', subtitle: '51 questions · 2 hours daily', icon: 'bolt', route: ['/guides', 'playbook'] },
    { title: '1 Month', subtitle: '107 questions · 6 hours weekly', icon: 'clock', route: ['/guides', 'playbook'] },
    { title: '3 Months', subtitle: '280 questions · 3 hours weekly', icon: 'star', route: ['/guides', 'playbook'] },
  ];

  /** ===== Company guides ===== */
  companyGuides: Card[] = [
    { title: 'OpenAI', subtitle: '15 questions', icon: 'building', route: ['/companies', 'openai'] },
    { title: 'Google', subtitle: '34 questions', icon: 'building', route: ['/companies', 'google'] },
    { title: 'Amazon', subtitle: '61 questions', icon: 'building', route: ['/companies', 'amazon'] },
    { title: 'TikTok', subtitle: '35 questions', icon: 'building', route: ['/companies', 'tiktok'] },
    { title: 'ByteDance', subtitle: '27 questions', icon: 'building', route: ['/companies', 'bytedance'] },
    { title: 'Apple', subtitle: '13 questions', icon: 'building', route: ['/companies', 'apple'] },
  ];
  // Tip: if you also want an entry to the index page, add one:
  // { title: 'All companies', subtitle: 'Browse all', icon: 'building', route: ['/companies'] }

  /** ===== Focus areas =====
   * No /focus routes in router. Point to a valid tech landing which redirects
   * to /:tech/coding (via matcher). Use /javascript for now.
   */
  focusAreas: Card[] = [
    { title: 'Accessibility', subtitle: '12 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'Async Operations', subtitle: '33 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'Design System Components', subtitle: '15 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'DOM Manipulation', subtitle: '10 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'Forms', subtitle: '10 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'JavaScript Polyfills', subtitle: '26 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'Lodash Functions', subtitle: '28 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'React Hooks', subtitle: '23 questions', icon: 'grid', route: ['/react'] },
    { title: 'State Management', subtitle: '17 questions', icon: 'grid', route: ['/react'] },
  ];

  /** ===== Practice: formats & frameworks =====
   * Map each to known, existing routes.
   */
  questionFormats: Card[] = [
    { title: 'User Interface Coding', subtitle: '0/59 questions', icon: 'list', route: ['/javascript', 'coding'] },
    { title: 'JavaScript Functions', subtitle: '0/140 questions', icon: 'list', route: ['/javascript', 'trivia'] },
    { title: 'Front End System Design', subtitle: '0/19 questions', icon: 'list', route: ['/system-design'] }, // ✅ practice area
    { title: 'Quiz', subtitle: '0/283 questions', icon: 'list', route: ['/javascript', 'trivia'] },
    { title: 'Data Structures & Algorithms Coding', subtitle: '0/92 questions', icon: 'list', route: ['/javascript', 'coding'] },
    { title: 'Behavioral', subtitle: '0/8 articles', icon: 'list', route: ['/guides', 'behavioral'] },
  ];

  /** Only include techs allowed by the matcher: javascript, angular, react, vue, html, css */
  frameworks: Card[] = [
    { title: 'JavaScript', subtitle: '0/483 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'React', subtitle: '0/91 questions', icon: 'grid', route: ['/react'] },
    { title: 'Angular', subtitle: '0/32 questions', icon: 'grid', route: ['/angular'] },
    { title: 'Vue', subtitle: '0/31 questions', icon: 'grid', route: ['/vue'] },
    { title: 'CSS', subtitle: '0/74 questions', icon: 'grid', route: ['/css'] },
    { title: 'HTML', subtitle: '0/90 questions', icon: 'grid', route: ['/html'] },
  ];

  trackByTitle = (_: number, it: Card) => it.title;
}
