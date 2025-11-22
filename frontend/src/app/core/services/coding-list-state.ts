import { Injectable } from '@angular/core';
import { Difficulty } from '../models/question.model';
import { Tech } from '../models/user.model';

export type ListSource = 'tech' | 'company' | 'global-coding';
export type Kind = 'coding' | 'trivia' | 'all';

export type CategoryKey = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';
export type ViewMode = 'tech' | 'formats';

export type ImportanceTier = 'low' | 'medium' | 'high';

export type SortKey =
  | 'default'
  | 'title-asc' | 'title-desc'
  | 'difficulty-asc' | 'difficulty-desc'
  | 'importance-desc' | 'importance-asc'
  | 'created-desc' | 'created-asc';

export interface CodingListFilterState {
  searchTerm: string;
  sliderValue: number;
  diffs: Difficulty[];
  impTiers: ImportanceTier[];
  selectedTech: Tech | null;
  selectedKind: Kind;
  selectedCategory: CategoryKey | null;
  selectedTags: string[];
  sort: SortKey;
  tagMatchMode: 'all' | 'any';
}

@Injectable({ providedIn: 'root' })
export class CodingListStateService {
  private _globalCodingState: CodingListFilterState | null = null;

  get globalCodingState(): CodingListFilterState | null {
    return this._globalCodingState;
  }

  set globalCodingState(val: CodingListFilterState | null) {
    this._globalCodingState = val;
  }
}
