import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

export type PrepRoadmapItem = {
  step: number;
  title: string;
  description: string;
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  badge?: string;
  meta?: string;
  tone?: 'recommended' | 'practice' | 'structured' | 'advanced';
};

@Component({
  selector: 'app-prep-roadmap',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prep-roadmap.component.html',
  styleUrls: ['./prep-roadmap.component.css'],
})
export class PrepRoadmapComponent {
  @Input() title = 'Recommended preparation';
  @Input() subtitle = 'Start with the smallest high-signal route, then expand only when you need more coverage.';
  @Input({ required: true }) items: PrepRoadmapItem[] = [];
  @Input() variant: 'hero' | 'compact' = 'compact';
  @Output() itemSelected = new EventEmitter<PrepRoadmapItem>();

  trackByStep(_index: number, item: PrepRoadmapItem): number {
    return item.step;
  }

  selectItem(item: PrepRoadmapItem): void {
    this.itemSelected.emit(item);
  }
}
