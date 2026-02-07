import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { OfflineService } from '../../../core/services/offline';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="offline()" class="offline-banner" data-testid="offline-banner">
      <div class="offline-banner__inner">
        <i class="pi pi-wifi offline-banner__icon"></i>

        <span class="offline-banner__text">
          You are offline. Some features may not work.
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .offline-banner {
      position: fixed;
      inset-inline: 0;
      bottom: 16px;
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 50;
    }

    .offline-banner__inner {
      pointer-events: auto;
      max-width: 960px;
      width: calc(100% - 32px);
      padding: 10px 14px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 8px;

      background: var(--uf-status-danger-bg);
      border: 1px solid var(--uf-status-danger-border);
      color: var(--uf-status-danger-text);
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 18px 40px rgba(0,0,0,0.75);
      backdrop-filter: blur(12px);
    }

    .offline-banner__icon {
      font-size: 16px;
      opacity: 0.9;
    }

    .offline-banner__text {
      flex: 1;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    @media (max-width: 640px) {
      .offline-banner__text {
        font-size: 12px;
      }
    }
  `]
})
export class OfflineBannerComponent {
  offline = computed(() => !this.offlineService.isOnline());
  constructor(private offlineService: OfflineService) { }
}
