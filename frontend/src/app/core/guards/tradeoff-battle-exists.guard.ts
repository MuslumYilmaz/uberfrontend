import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { TradeoffBattleService } from '../services/tradeoff-battle.service';

export const tradeoffBattleExistsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const tradeoffs = inject(TradeoffBattleService);
  const id = route.paramMap.get('id') || '';

  return tradeoffs.loadIndex({ transferState: false }).pipe(
    take(1),
    map((list) => (list.some((item) => item.id === id) ? true : router.parseUrl('/404'))),
  );
};
