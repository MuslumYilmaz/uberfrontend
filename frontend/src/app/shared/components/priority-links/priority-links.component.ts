import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { PriorityLink, PriorityLinkGroup } from '../../../core/content/priority-links';

@Component({
    selector: 'app-priority-links',
    imports: [CommonModule, RouterModule],
    templateUrl: './priority-links.component.html',
    styleUrls: ['./priority-links.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriorityLinksComponent {
  @Input({ required: true }) groups: readonly PriorityLinkGroup[] = [];
  @Input({ required: true }) testId = '';
  /** Omit when the host page renders its own heading and passes `labelledBy` instead. */
  @Input() heading = '';
  @Input() headingLevel: 2 | 3 = 2;
  @Input() kicker = '';
  @Input() description = '';
  @Input() labelledBy = '';

  get headingId(): string {
    return `${this.testId}-title`;
  }

  get labelId(): string | null {
    return this.labelledBy || (this.heading ? this.headingId : null);
  }

  trackByGroup(_index: number, group: PriorityLinkGroup): string {
    return group.id;
  }

  trackByLink(_index: number, link: PriorityLink): string {
    return link.route;
  }
}
