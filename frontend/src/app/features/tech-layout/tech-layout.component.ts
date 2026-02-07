import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OfflineBannerComponent } from "../../shared/components/offline-banner/offline-banner";

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  selector: 'app-tech-layout',
  template: `
    <!-- Stretchy container; children (coding/trivia detail/list) handle their own padding -->
    <div class="fa-tech-layout">
      <router-outlet></router-outlet>
      <app-offline-banner></app-offline-banner>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      min-height: 0; /* allow inner scroll areas to work */
    }

    .fa-tech-layout {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      padding-inline: 16px;
      background: transparent;
      color: var(--uf-text-primary);
    }

    @media (max-width: 768px) {
      .fa-tech-layout {
        padding-inline: 10px;
      }
    }
  `]
})
export class TechLayoutComponent { }
