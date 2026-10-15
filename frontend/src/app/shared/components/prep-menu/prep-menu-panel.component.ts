import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PREP_MENU_SECTIONS,
  type PrepMenuChip,
  type PrepMenuItem,
  type PrepMenuSection,
} from '../../../core/content/prep-menu';

export type PrepMenuSelection = {
  key: string;
  chip: string | null;
  section: string;
  route: string;
};

export const PREP_MENU_PANEL_MAX_WIDTH = 860;
const PANEL_VIEWPORT_RATIO = 0.92;
const PANEL_EDGE_PADDING = 12;

/** Horizontal center of the fixed panel: as close to the trigger as the viewport allows. */
export function prepMenuPanelCenter(viewportWidth: number, triggerCenter: number | null): number {
  const panelWidth = Math.min(viewportWidth * PANEL_VIEWPORT_RATIO, PREP_MENU_PANEL_MAX_WIDTH);
  const minCenter = PANEL_EDGE_PADDING + panelWidth / 2;
  const maxCenter = viewportWidth - PANEL_EDGE_PADDING - panelWidth / 2;
  const desired = triggerCenter ?? viewportWidth / 2;
  const center = minCenter <= maxCenter ? Math.min(maxCenter, Math.max(minCenter, desired)) : viewportWidth / 2;
  return Math.round(center);
}

/**
 * Shared header menu. Every section, card and chip is always rendered so that all links
 * exist in the prerendered HTML; opening, closing and switching sections only toggle `hidden`.
 * The markup ships on every page, so encapsulation attributes are skipped: every selector in
 * the stylesheet is scoped by the `pm` prefix instead.
 */
@Component({
  selector: 'app-prep-menu-panel',
  imports: [RouterLink],
  templateUrl: './prep-menu-panel.component.html',
  styleUrls: ['./prep-menu-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PrepMenuPanelComponent {
  readonly sections: readonly PrepMenuSection[] = PREP_MENU_SECTIONS;

  readonly panelId = input.required<string>();
  readonly testIdPrefix = input.required<string>();
  readonly open = input(false);
  readonly currentPath = input('/');
  readonly anchorX = input<number | null>(null);
  readonly searching = input(false);
  readonly highlightKey = input<string | null>(null);
  readonly activeSection = model<string>(PREP_MENU_SECTIONS[0]?.id ?? '');

  readonly itemSelected = output<PrepMenuSelection>();

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  isActive(section: PrepMenuSection): boolean {
    return this.activeSection() === section.id;
  }

  isCurrent(route: string): boolean {
    return this.currentPath() === route;
  }

  selectSection(section: PrepMenuSection): void {
    this.activeSection.set(section.id);
  }

  onTabPointerEnter(event: PointerEvent, section: PrepMenuSection): void {
    if (event.pointerType === 'mouse') this.activeSection.set(section.id);
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    const count = this.sections.length;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.activeSection.set(this.sections[next].id);
    this.tabButtons()[next]?.nativeElement.focus();
  }

  select(section: PrepMenuSection, item: PrepMenuItem, chip?: PrepMenuChip): void {
    this.itemSelected.emit({
      key: item.key,
      chip: chip?.key ?? null,
      section: section.id,
      route: chip?.route ?? item.route,
    });
  }
}
