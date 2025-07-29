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
    <div class="flex flex-col flex-1 w-screen h-full px-4 py-6">
      <!-- only show on list pages -->
      <nav
        *ngIf="showSubTabs$ | async"
        class="flex space-x-6 mb-6 border-b pb-2"
      >
        <a
          routerLink="coding"
          routerLinkActive="text-blue-600 font-bold border-b-2 border-blue-600 pb-1"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-gray-600 hover:text-blue-600"
        >
          Coding
        </a>
        <a
          routerLink="trivia"
          routerLinkActive="text-blue-600 font-bold border-b-2 border-blue-600 pb-1"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-gray-600 hover:text-blue-600"
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
      class: 'h-full w-full'
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