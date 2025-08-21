import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-tech-layout',
  template: `
    <!-- Stretchy container; children (coding/trivia detail/list) handle their own padding -->
    <div class="flex flex-col flex-1 min-h-0 w-full px-4 py-4 bg-neutral-950 text-gray-200">
    <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      min-height: 0; /* allow inner scroll areas to work */
    }
  `]
})
export class TechLayoutComponent { }
