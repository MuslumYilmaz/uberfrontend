import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TradeoffBattleListItem, TradeoffBattleScenario } from '../models/tradeoff-battle.model';
import { SeoMeta, SeoService } from '../services/seo.service';
import { TradeoffBattleService } from '../services/tradeoff-battle.service';
import { buildTradeoffSeoMeta, TRADEOFF_DETAIL_FALLBACK_SEO } from '../utils/tradeoff-seo.util';

export interface TradeoffBattleListResolved {
  items: TradeoffBattleListItem[];
}

export interface TradeoffBattleDetailResolved {
  id: string;
  list: TradeoffBattleListItem[];
  battle: TradeoffBattleScenario | null;
  prev: TradeoffBattleListItem | null;
  next: TradeoffBattleListItem | null;
  seo: SeoMeta;
}

export const tradeoffBattleListResolver: ResolveFn<TradeoffBattleListResolved> = () => {
  const tradeoffs = inject(TradeoffBattleService);
  return tradeoffs.loadIndex({ transferState: false }).pipe(
    map((items) => ({ items })),
  );
};

export const tradeoffBattleDetailResolver: ResolveFn<TradeoffBattleDetailResolved> = (route) => {
  const tradeoffs = inject(TradeoffBattleService);
  const seo = inject(SeoService);
  const id = route.paramMap.get('id') || '';
  const fallbackSeo = (): SeoMeta => ({
    ...TRADEOFF_DETAIL_FALLBACK_SEO,
    canonical: id ? `/tradeoffs/${id}` : '/tradeoffs',
  });

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
        seo: battle
          ? buildTradeoffSeoMeta(battle.meta, (value) => seo.buildCanonicalUrl(value))
          : fallbackSeo(),
      };
    }),
    catchError(() =>
      of({
        id,
        list: [],
        battle: null,
        prev: null,
        next: null,
        seo: fallbackSeo(),
      }),
    ),
  );
};
