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
  | 'created-desc' | 'created-asc'
  | 'diff-asc' | 'diff-desc';

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

export interface GlobalCodingViewState {
  tech: CodingListFilterState | null;
  formats: CodingListFilterState | null;
}

@Injectable({ providedIn: 'root' })
export class CodingListStateService {
  // 1) 🔹 Instance sayacı (debug için)
  private static _counter = 0;
  readonly instanceId = ++CodingListStateService._counter;

  // 2) 🔹 Asıl state aynen kalsın
  private _globalCodingState: GlobalCodingViewState = {
    tech: null,
    formats: null,
  };

  get globalCodingState(): GlobalCodingViewState {
    return this._globalCodingState;
  }

  set globalCodingState(val: GlobalCodingViewState) {
    this._globalCodingState = val;
  }
}
