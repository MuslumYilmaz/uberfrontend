import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AchievementNotificationService } from '../../../core/services/achievement-notification.service';
import { FaGlyphComponent } from '../../ui/icon/fa-glyph.component';

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  imports: [CommonModule, RouterLink, FaGlyphComponent],
  templateUrl: './achievement-toast.component.html',
  styleUrls: ['./achievement-toast.component.css'],
})
export class AchievementToastComponent {
  readonly notifications = inject(AchievementNotificationService);

  dismiss(): void {
    this.notifications.dismissCurrent();
  }
}
