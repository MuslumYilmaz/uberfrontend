import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TradeoffBattleListItem, TradeoffBattleScenario } from '../models/tradeoff-battle.model';
import { TradeoffBattleService } from '../services/tradeoff-battle.service';

export interface TradeoffBattleListResolved {
  items: TradeoffBattleListItem[];
}

export interface TradeoffBattleDetailResolved {
  id: string;
  list: TradeoffBattleListItem[];
  battle: TradeoffBattleScenario | null;
  prev: TradeoffBattleListItem | null;
  next: TradeoffBattleListItem | null;
}

export const tradeoffBattleListResolver: ResolveFn<TradeoffBattleListResolved> = () => {
  const tradeoffs = inject(TradeoffBattleService);
  return tradeoffs.loadIndex({ transferState: false }).pipe(
    map((items) => ({ items })),
  );
};

export const tradeoffBattleDetailResolver: ResolveFn<TradeoffBattleDetailResolved> = (route) => {
  const tradeoffs = inject(TradeoffBattleService);
  const id = route.paramMap.get('id') || '';

  return forkJoin({
    list: tradeoffs.loadIndex({ transferState: false }),
    battle: tradeoffs.loadScenario(id, { transferState: false }),
  }).pipe(
    map(({ list, battle }) => {
      const currentIndex = list.findIndex((item) => item.id === id);
      return {
        id,
        list,
        battle,
        prev: currentIndex > 0 ? list[currentIndex - 1] ?? null : null,
        next: currentIndex >= 0 ? list[currentIndex + 1] ?? null : null,
      };
    }),
    catchError(() =>
      of({
        id,
        list: [],
        battle: null,
        prev: null,
        next: null,
      }),
    ),
  );
};
