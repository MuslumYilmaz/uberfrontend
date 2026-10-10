import {
  Observable,
  OperatorFunction,
  VirtualTimeScheduler,
  concatMap,
  defer,
  exhaustMap,
  finalize,
  from,
  map,
  mergeMap,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import {
  OverlapEngine,
  OverlapOperator,
  OverlapRunInput,
  OverlapRunResult,
  RawRequest,
  finalizeRun,
  sortTriggers,
  triggerDuration,
} from './rxjs-overlap-playground.model';

function flattenWith(operator: OverlapOperator, inner: (index: number) => Observable<number>): OperatorFunction<number, number> {
  switch (operator) {
    case 'switchMap':
      return switchMap(inner);
    case 'mergeMap':
      return mergeMap(inner);
    case 'concatMap':
      return concatMap(inner);
    case 'exhaustMap':
      return exhaustMap(inner);
  }
}

/**
 * Runs the real RxJS flattening operator on a VirtualTimeScheduler and records
 * when each inner request started, completed, or was torn down. Trigger timers
 * are chained so that a completion due at the same frame as the next trigger is
 * processed first (the shared tie rule).
 */
export function runWithRealOperators(input: OverlapRunInput): OverlapRunResult {
  const scheduler = new VirtualTimeScheduler();
  const sorted = sortTriggers(input.triggers);
  const raw: RawRequest[] = sorted.map(() => ({ startedAt: null, endedAt: null, completed: false }));

  const triggers$ = from(sorted.map((_, index) => index)).pipe(
    concatMap((index) =>
      timer(sorted[index].at - (index > 0 ? sorted[index - 1].at : 0), scheduler).pipe(map(() => index)),
    ),
  );
  const inner = (index: number): Observable<number> =>
    defer(() => {
      raw[index].startedAt = scheduler.frame;
      return timer(triggerDuration(sorted[index], input.defaultDurationMs), scheduler).pipe(
        map(() => index),
        tap(() => {
          raw[index].completed = true;
        }),
        finalize(() => {
          raw[index].endedAt = scheduler.frame;
        }),
      );
    });

  const subscription = triggers$
    .pipe(flattenWith(input.operator, inner), takeUntil(timer(input.axisMs + 1, scheduler)))
    .subscribe();
  scheduler.flush();
  subscription.unsubscribe();

  return finalizeRun(input, sorted, raw);
}

export function createRxjsVirtualTimeEngine(): OverlapEngine {
  return { run: runWithRealOperators };
}

export const RXJS_VIRTUAL_TIME_ENGINE: OverlapEngine = createRxjsVirtualTimeEngine();
