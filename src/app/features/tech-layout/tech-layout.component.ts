// src/app/features/tech-layout/tech-layout.component.ts
import { Component } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-tech-layout',
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Sub‑tabs -->
      <nav class="flex space-x-6 mb-6 border-b pb-2">
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

      <!-- Render whichever child matches -->
      <router-outlet></router-outlet>
    </div>
  `
})
export class TechLayoutComponent {
  // if you need the tech param inside the layout, you can grab it:
  tech$ = this.route.paramMap.pipe(map(pm => pm.get('tech')));
  constructor(private route: ActivatedRoute) {}
}
