// src/app/features/tech-layout/tech-layout.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-tech-layout',
  template: `
    <div class="flex flex-col flex-1 w-full h-full px-4 py-6 bg-neutral-900 text-gray-200">
      <!-- only show on list pages -->
      <nav
        *ngIf="showSubTabs$ | async"
        class="flex space-x-6 mb-6 border-b border-neutral-700 pb-2"
      >
        <a
          routerLink="coding"
          routerLinkActive="text-white font-bold border-b-2 border-white pb-1"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-gray-400 hover:text-white"
        >
          Coding
        </a>
        <a
          routerLink="trivia"
          routerLinkActive="text-white font-bold border-b-2 border-white pb-1"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-gray-400 hover:text-white"
        >
          Trivia
        </a>
      </nav>

      <div class="flex-1 overflow-auto">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0; /* allow internal scroll container to work properly */
      }
    `
  ]
})
export class TechLayoutComponent {
  showSubTabs$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => this.router.url.split('/').length === 3),
    startWith(this.router.url.split('/').length === 3)
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }
}
