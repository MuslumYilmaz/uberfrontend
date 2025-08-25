import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { defaultPrefs } from '../../../core/models/user.model';
import { DailyService } from '../../../core/services/daily.service';

@Component({
  selector: 'app-daily-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./daily-widget.component.css'],
  template: `
  <div class="dw-card" *ngIf="daily(); else loading">
    <div class="dw-head">
      <div class="dw-title">Today’s set</div>
      <div class="dw-streak">🔥 {{ streak().current || 0 }} <span class="dw-sub">streak</span></div>
      <div class="dw-xp">⭐ {{ xp().total || 0 }} XP</div>
    </div>

    <div class="dw-progress">
      <div class="dw-bar"><div class="dw-fill" [style.width.%]="progress()*100"></div></div>
      <div class="dw-progress-text">{{ completedCount() }}/{{ totalCount() }} done</div>
    </div>

    <ul class="dw-list">
      <li *ngFor="let it of daily()!.items">
        <!-- Row is a link; checkbox is display-only -->
        <a class="dw-row" [routerLink]="it.to" [title]="'Open ' + it.label">
          <input type="checkbox"
                 [checked]="!!it.state?.completedAt"
                 disabled
                 aria-readonly="true"
                 [attr.aria-label]="it.label + (it.state?.completedAt ? ' (completed)' : '')">
          <span class="dw-kind" [attr.data-kind]="it.kind">{{ it.kind }}</span>
          <span class="dw-label">{{ it.label }}</span>
          <span class="dw-time">{{ it.durationMin }}m</span>
        </a>
      </li>
    </ul>

    <div class="dw-hint" aria-hidden="true">Progress is marked automatically when you submit/complete.</div>
  </div>

  <ng-template #loading>
    <div class="dw-card">
      <div class="dw-title">Today’s set</div>
      <div class="dw-skel"></div>
    </div>
  </ng-template>
  `
})
export class DailyWidgetComponent implements OnInit {
  private svc = inject(DailyService);

  daily = this.svc.daily;
  xp = this.svc.xp;
  streak = this.svc.streak;

  completedCount = computed(() =>
    this.daily()?.items.filter(i => !!i.state?.completedAt).length ?? 0
  );
  totalCount = computed(() => this.daily()?.items.length ?? 0);
  progress = computed(() => {
    const t = this.totalCount();
    const d = this.completedCount();
    return t > 0 ? d / t : 0;
  });

  ngOnInit(): void {
    this.svc.ensureTodaySet(defaultPrefs().defaultTech || 'javascript');
  }
}