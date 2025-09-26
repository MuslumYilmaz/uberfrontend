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

  /** ===== Continue learning (single card, optional if no “resume”) ===== */
  continueCard: Card | null = {
    title: 'GFE 75',
    subtitle: '0/73 questions',
    icon: 'book',
    route: ['/guides', 'gfe-75'],
  };

  /** ===== Recommended preparation ===== */
  recommended: Card[] = [
    {
      title: 'Front End Interview Playbook',
      subtitle: 'A starter guide to preparing for front end interviews.',
      icon: 'book',
      route: ['/guides'],
    },
    {
      title: 'GFE 75',
      subtitle:
        'The 75 most important front end interview questions. Covers patterns & formats.',
      icon: 'book',
      disabled: true,
      badge: 'Coming soon',
    },
  ];

  /** ===== Study plans ===== */
  studyPlans: Card[] = [
    { title: '1 Week', subtitle: '51 questions · 2 hours daily', icon: 'bolt', route: ['/plans', '1-week'] },
    { title: '1 Month', subtitle: '107 questions · 6 hours weekly', icon: 'clock', route: ['/plans', '1-month'] },
    { title: '3 Months', subtitle: '280 questions · 3 hours weekly', icon: 'star', route: ['/plans', '3-months'] },
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

  /** ===== Focus areas ===== */
  focusAreas: Card[] = [
    { title: 'Accessibility', subtitle: '12 questions', icon: 'grid', route: ['/focus', 'a11y'] },
    { title: 'Async Operations', subtitle: '33 questions', icon: 'grid', route: ['/focus', 'async'] },
    { title: 'Design System Components', subtitle: '15 questions', icon: 'grid', route: ['/focus', 'design-system'] },
    { title: 'DOM Manipulation', subtitle: '10 questions', icon: 'grid', route: ['/focus', 'dom'] },
    { title: 'Forms', subtitle: '10 questions', icon: 'grid', route: ['/focus', 'forms'] },
    { title: 'JavaScript Polyfills', subtitle: '26 questions', icon: 'grid', route: ['/focus', 'polyfills'] },
    { title: 'Lodash Functions', subtitle: '28 questions', icon: 'grid', route: ['/focus', 'lodash'] },
    { title: 'React Hooks', subtitle: '23 questions', icon: 'grid', route: ['/focus', 'react-hooks'] },
    { title: 'State Management', subtitle: '17 questions', icon: 'grid', route: ['/focus', 'state'] },
  ];

  /** ===== Practice: formats & frameworks ===== */
  questionFormats: Card[] = [
    { title: 'User Interface Coding', subtitle: '0/59 questions', icon: 'list', route: ['/formats', 'ui-coding'] },
    { title: 'JavaScript Functions', subtitle: '0/140 questions', icon: 'list', route: ['/formats', 'js-functions'] },
    { title: 'Front End System Design', subtitle: '0/19 questions', icon: 'list', route: ['/formats', 'fe-sd'] },
    { title: 'Quiz', subtitle: '0/283 questions', icon: 'list', route: ['/formats', 'quiz'] },
    { title: 'Data Structures & Algorithms Coding', subtitle: '0/92 questions', icon: 'list', route: ['/formats', 'dsa'] },
    { title: 'Behavioral', subtitle: '0/8 articles', icon: 'list', route: ['/formats', 'behavioral'] },
  ];

  frameworks: Card[] = [
    { title: 'JavaScript', subtitle: '0/483 questions', icon: 'grid', route: ['/javascript'] },
    { title: 'React', subtitle: '0/91 questions', icon: 'grid', route: ['/react'] },
    { title: 'Angular', subtitle: '0/32 questions', icon: 'grid', route: ['/angular'] },
    { title: 'Vue', subtitle: '0/31 questions', icon: 'grid', route: ['/vue'] },
    { title: 'CSS', subtitle: '0/74 questions', icon: 'grid', route: ['/css'] },
    { title: 'TypeScript', subtitle: '0/232 questions', icon: 'grid', route: ['/typescript'] },
    { title: 'HTML', subtitle: '0/90 questions', icon: 'grid', route: ['/html'] },
    { title: 'Svelte', subtitle: '0/28 questions', icon: 'grid', route: ['/svelte'] },
  ];

  trackByTitle = (_: number, it: Card) => it.title;
}
