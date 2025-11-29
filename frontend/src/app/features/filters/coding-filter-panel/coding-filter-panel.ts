import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';

import type { Difficulty } from '../../../core/models/question.model';

type ImportanceTier = 'low' | 'medium' | 'high';

type SortKey =
  | 'default'
  | 'title-asc' | 'title-desc'
  | 'difficulty-asc' | 'difficulty-desc'
  | 'importance-desc' | 'importance-asc'
  | 'created-desc' | 'created-asc';

@Component({
  selector: 'app-coding-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ChipModule, InputTextModule],
  templateUrl: './coding-filter-panel.component.html',
  styleUrls: ['./coding-filter-panel.css'],
})
export class CodingFilterPanelComponent {
  @Input() searchTerm = '';

  @Input() difficultySelection: Difficulty[] = [];
  @Input() importanceSelection: ImportanceTier[] = [];

  @Input() popularTags: string[] = [];
  @Input() selectedTags: string[] = [];
  @Input() tagMatchMode: 'all' | 'any' = 'all';

  @Input() sortOpen = false;
  @Input() sortOptions: Array<{ key: SortKey; label: string; hint?: string }> = [];
  @Input() currentSort: SortKey = 'default';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() difficultyChange = new EventEmitter<{ difficulty: Difficulty; checked: boolean }>();
  @Output() importanceChange = new EventEmitter<{ tier: ImportanceTier; checked: boolean }>();

  @Output() tagToggled = new EventEmitter<string>();
  @Output() clearAllTags = new EventEmitter<void>();
  @Output() tagMatchModeToggle = new EventEmitter<void>();

  @Output() sortToggle = new EventEmitter<void>();
  @Output() sortClose = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<SortKey>();

  // helpers for template
  isDiffChecked(d: Difficulty) {
    return this.difficultySelection.includes(d);
  }

  isImpChecked(t: ImportanceTier) {
    return this.importanceSelection.includes(t);
  }

  isTagSelected(tag: string) {
    return this.selectedTags.includes(tag);
  }

  onDifficultyInputChange(difficulty: Difficulty, ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    this.difficultyChange.emit({ difficulty, checked });
  }

  onImportanceInputChange(tier: ImportanceTier, ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    this.importanceChange.emit({ tier, checked });
  }
}