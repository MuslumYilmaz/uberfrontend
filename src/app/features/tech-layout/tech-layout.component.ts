// src/app/features/tech-layout/tech-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-tech-layout',
  template: `
    <div class="flex flex-col flex-1 w-full h-full px-4 py-6 bg-neutral-900 text-gray-200">
      <!-- show tabs only when we're on /:tech/coding or /:tech/trivia -->
      <nav *ngIf="showSubTabs$ | async" class="flex space-x-6 mb-6 border-b border-neutral-700 pb-2">
        <a routerLink="coding"
           routerLinkActive="text-white font-bold border-b-2 border-white pb-1"
           [routerLinkActiveOptions]="{ exact: true }"
           class="text-gray-400 hover:text-white">Coding</a>

        <a routerLink="trivia"
           routerLinkActive="text-white font-bold border-b-2 border-white pb-1"
           [routerLinkActiveOptions]="{ exact: true }"
           class="text-gray-400 hover:text-white">Trivia</a>
      </nav>

      <div class="flex-1 min-h-0 overflow-hidden">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1; min-height: 0; }
  `]
})
export class TechLayoutComponent {
  showSubTabs$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    startWith(null), // seed first run
    map(() => {
      // Normalize and split
      const parts = this.router.url
        .split('?')[0]
        .split('#')[0]
        .split('/')
        .filter(Boolean); // e.g. "/javascript/coding" -> ["javascript","coding"]

      // Hide tabs entirely on system-design (list or detail)
      if (parts[0] === 'system-design') return false;

      // Show tabs only on list pages "/:tech/coding" or "/:tech/trivia"
      return parts.length === 2 && (parts[1] === 'coding' || parts[1] === 'trivia');
    })
  );

  constructor(private router: Router) { }
}
