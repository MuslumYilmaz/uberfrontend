import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-restore-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
	    <div *ngIf="isVisible" class="restore-banner" data-testid="restore-banner">
	      <span class="msg" data-testid="restore-banner-message">
	      {{ isSolution ? "You’re viewing the solution code." : "Your code was restored from saved draft." }}
	      </span>

	    <div class="actions">
	      <button class="reset" data-testid="restore-banner-reset" (click)="reset.emit()">
	        {{ isSolution ? 'Revert to your code' : 'Reset to default' }}
	      </button>
	      <button class="close" data-testid="restore-banner-dismiss" (click)="dismiss.emit()">✕</button>
	    </div>
	  </div>
	  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      z-index: 20;
    }

    .restore-banner {
      position: relative;
      padding: .375rem .75rem;
      text-align: center;
      background: #fde68a; /* yellow-200 */
      color: #000;
      font-size: .75rem;
      line-height: 1.3;
      border-bottom: 1px solid #fcd34d; /* yellow-300 */
      animation: fadeIn .2s ease;
    }

    .msg {
      font-weight: 500;
    }

    .actions {
      position: absolute;
      right: .5rem;
      inset-block: 0;
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .reset {
      text-decoration: underline;
      font-weight: 500;
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      cursor: pointer;
    }

    .close {
      opacity: .7;
      background: transparent;
      border: none;
      color: inherit;
      font-size: .85rem;
      cursor: pointer;
      transition: opacity .15s ease;
    }

    .close:hover {
      opacity: 1;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RestoreBannerComponent {
  @Input() isVisible = false;
  @Input() isSolution = false;

  @Output() reset = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
}
