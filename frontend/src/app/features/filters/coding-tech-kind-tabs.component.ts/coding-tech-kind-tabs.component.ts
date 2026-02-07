import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

import type { Tech } from '../../../core/models/user.model';
import { FaChipComponent } from '../../../shared/components/chip/fa-chip.component';

// keep in sync with parent
type SelectedKind = 'coding' | 'trivia';
type Kind = SelectedKind | 'all';
type CategoryKey = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';
type ViewMode = 'tech' | 'formats';
type ListSource = 'tech' | 'company' | 'global-coding';

@Component({
  selector: 'app-coding-tech-kind-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, FaChipComponent],
  templateUrl: './coding-tech-kind-tabs.component.html',
  styleUrls: ['./coding-tech-kind-tabs.component.css'],
})
export class CodingTechKindTabsComponent {
  @Input() source!: ListSource;

  @Input() techTabs: Array<{ key: Tech; label: string; badge: string; cls: string }> = [];
  @Input() kindTabs: Array<{ key: SelectedKind; label: string }> = [];

  @Input() tech: Tech | null = null;        // current route tech (per-tech pages)
  @Input() kind: Kind = 'coding';

  @Input() viewMode: ViewMode = 'tech';
  @Input() selectedTech: Tech | null = null;
  @Input() selectedKind: SelectedKind | null = 'coding';
  @Input() selectedCategory: CategoryKey | null = null;

  @Input() isSystemCategoryActive = false;  // burada tipi netleştir, boolean | null yerine
  @Input() filteredCount = 0;
  @Input() navQueryParams: Record<string, any> | null = null;

  @Output() techSelected = new EventEmitter<Tech>();
  @Output() categoryToggled = new EventEmitter<CategoryKey>();
  @Output() kindSelected = new EventEmitter<SelectedKind>();

  categoryTabs: Array<{ key: CategoryKey; label: string }> = [
    { key: 'ui', label: 'User interface' },
    { key: 'js-fn', label: 'JavaScript functions' },
    { key: 'html-css', label: 'HTML & CSS' },
    { key: 'algo', label: 'Algorithmic coding' },
    { key: 'system', label: 'System design' },
  ];

  get showKindTabs(): boolean {
    if (this.source === 'global-coding') return !this.isSystemCategoryActive;
    return (this.kindTabs?.length ?? 0) > 0;
  }

  get activeSegmentKind(): SelectedKind {
    if (this.source === 'global-coding') return this.selectedKind ?? 'coding';
    return this.kind === 'trivia' ? 'trivia' : 'coding';
  }

  heading(): string {
    if (this.source === 'global-coding') {
      const k: SelectedKind = this.selectedKind ?? 'coding';
      const kindLabel =
        k === 'trivia' ? 'Quiz' : 'Coding';

      if (this.viewMode === 'formats') {
        const cat = this.selectedCategory;
        const catLabel =
          !cat ? '' :
            cat === 'ui' ? ' — User interface' :
              cat === 'js-fn' ? ' — JavaScript functions' :
                cat === 'html-css' ? ' — HTML & CSS' :
                  cat === 'algo' ? ' — Algorithmic coding' :
                    ' — System design';

        return `${kindLabel} questions${catLabel}`;
      }

      return `${kindLabel} questions`;
    }

    const t = this.tech ?? 'javascript';
    const what =
      this.kind === 'coding' ? 'Coding Challenges' : 'Trivia Questions';

    return `${this.capitalize(t)} ${what}`;
  }

  private capitalize(s: string | null | undefined) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
}
