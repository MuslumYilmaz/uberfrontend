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
<div class="container flex flex-col h-full mx-auto px-4 py-6">
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

  <router-outlet></router-outlet>
</div>
  `})
export class TechLayoutComponent {
  // Observable<boolean> that’s true only when we’re *not* on a detail page
  showSubTabs$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => {
      // split "/javascript/coding/xyz" => ["","javascript","coding","xyz"]
      const parts = this.router.url.split('/');
      // parts.length === 3 for list pages (["","javascript","coding"])
      // parts.length === 4 for detail pages
      return parts.length === 3;
    }),
    startWith(
      // initial value before any NavigationEnd fires
      this.router.url.split('/').length === 3
    )
  );

  tech$ = this.route.paramMap.pipe(map(pm => pm.get('tech')));

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }
}
