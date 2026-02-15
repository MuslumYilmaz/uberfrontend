import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Params, RouterModule } from '@angular/router';

export type PrepSignalItem =
  | string
  | {
    text: string;
    route?: any[];
    queryParams?: Params;
    href?: string;
    external?: boolean;
  };

@Component({
  selector: 'app-prep-signal-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prep-signal-grid.component.html',
  styleUrls: ['./prep-signal-grid.component.css'],
})
export class PrepSignalGridComponent {
  @Input() outcomesTitle = 'Outcomes';
  @Input() mistakesTitle = 'Common mistakes';
  @Input() sequenceTitle = 'Suggested sequence';

  @Input() outcomes: PrepSignalItem[] = [];
  @Input() mistakes: PrepSignalItem[] = [];
  @Input() sequence: PrepSignalItem[] = [];

  labelOf(item: PrepSignalItem): string {
    return typeof item === 'string' ? item : item.text;
  }

  routeOf(item: PrepSignalItem): any[] | null {
    return this.isObjectItem(item) && Array.isArray(item.route) ? item.route : null;
  }

  queryParamsOf(item: PrepSignalItem): Params | null {
    return this.isObjectItem(item) && item.queryParams ? item.queryParams : null;
  }

  hrefOf(item: PrepSignalItem): string | null {
    return this.isObjectItem(item) && typeof item.href === 'string' ? item.href : null;
  }

  isExternalHref(item: PrepSignalItem): boolean {
    return this.isObjectItem(item) && item.external === true;
  }

  private isObjectItem(item: PrepSignalItem): item is Exclude<PrepSignalItem, string> {
    return typeof item === 'object' && item !== null;
  }
}

