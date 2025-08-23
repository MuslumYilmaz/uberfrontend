import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type Icon = 'book' | 'grid' | 'list' | 'cap';

type DashItem = {
  title: string;
  subtitle: string;
  icon: Icon;
  route?: any[];
  disabled?: boolean;
  badge?: string | null;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  items: DashItem[] = [
    {
      title: 'Front End Interview Playbook',
      subtitle: 'A starter guide to preparing for front end interviews',
      icon: 'book',
      disabled: true,
      badge: 'Coming soon',
    },
    {
      title: 'GFE 75',
      subtitle: 'The 75 most important front end interview questions.',
      icon: 'book',
      disabled: true,
      badge: 'Coming soon',
    },
    {
      title: 'Front End System Design Playbook',
      subtitle:
        'Core System Design techniques and deep dives into common questions like social feeds, autocomplete, e-commerce, and more.',
      icon: 'grid',
      route: ['/system-design'],
    },
    {
      title: 'Free Practice',
      subtitle:
        'Jump into coding & trivia practice. Choose JavaScript or Angular and start solving.',
      icon: 'list',
      route: ['/javascript'],
    },
    {
      title: 'Courses',
      subtitle: 'Structured, paced lessons with progress tracking.',
      icon: 'cap',
      route: ['/courses'],
    },
  ];

  trackByTitle = (_: number, it: DashItem) => it.title;
}
