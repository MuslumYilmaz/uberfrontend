import { TestScheduler } from 'rxjs/testing';
import { concatMap, exhaustMap, mergeMap, switchMap } from 'rxjs';
import { OVERLAP_SCENARIOS } from './rxjs-overlap-playground.content';
import {
  AXIS_MS,
  OVERLAP_OPERATORS,
  OverlapRunInput,
  OverlapTrigger,
  simulateOverlap,
} from './rxjs-overlap-playground.model';
import { RXJS_VIRTUAL_TIME_ENGINE, runWithRealOperators } from './rxjs-overlap-playground.rxjs-engine';
import { randomStreams } from './rxjs-overlap-playground.test-streams';

function trigger(id: string, at: number, durationMs: number | null = null): OverlapTrigger {
  return { id, at, label: id, durationMs };
}

const NAMED_STREAMS: Array<{ name: string; triggers: OverlapTrigger[]; defaultDurationMs: number }> = [
  { name: 'seed', triggers: [trigger('A', 0), trigger('B', 100)], defaultDurationMs: 300 },
  { name: 'race', triggers: [trigger('A', 0, 500), trigger('B', 100, 200)], defaultDurationMs: 300 },
  { name: 'tie at completion', triggers: [trigger('A', 0), trigger('B', 300)], defaultDurationMs: 300 },
  { name: 'just before completion', triggers: [trigger('A', 0), trigger('B', 290)], defaultDurationMs: 300 },
  { name: 'six-trigger burst', triggers: [0, 80, 160, 240, 320, 400].map((at, index) => trigger(`T${index}`, at)), defaultDurationMs: 500 },
  { name: 'crossing the window', triggers: [trigger('A', 0, 900), trigger('B', 100, 900), trigger('C', 200, 900)], defaultDurationMs: 300 },
  { name: 'late single', triggers: [trigger('A', 1000)], defaultDurationMs: 300 },
  { name: 'same instant', triggers: [trigger('A', 0), trigger('B', 0), trigger('C', 0)], defaultDurationMs: 300 },
  ...OVERLAP_SCENARIOS.map((scenario) => ({
    name: scenario.id,
    triggers: scenario.preset.triggers.map((item, index) => ({ ...item, id: `s${index}` })),
    defaultDurationMs: scenario.preset.defaultDurationMs,
  })),
];

describe('rxjs overlap playground real engine', () => {
  it('matches the reference simulation for every named stream and operator', () => {
    for (const stream of NAMED_STREAMS) {
      for (const operator of OVERLAP_OPERATORS) {
        const input: OverlapRunInput = { operator, triggers: stream.triggers, defaultDurationMs: stream.defaultDurationMs, axisMs: AXIS_MS };
        expect(runWithRealOperators(input)).withContext(`${stream.name} ${operator}`).toEqual(simulateOverlap(input));
      }
    }
  });

  it('matches the reference simulation on a seeded random batch', () => {
    for (const stream of randomStreams(30, 23)) {
      for (const operator of OVERLAP_OPERATORS) {
        const input: OverlapRunInput = { operator, triggers: stream.triggers, defaultDurationMs: stream.defaultDurationMs, axisMs: AXIS_MS };
        expect(RXJS_VIRTUAL_TIME_ENGINE.run(input)).withContext(`${JSON.stringify(stream)} ${operator}`).toEqual(simulateOverlap(input));
      }
    }
  });

  it('documents the seed stream as marble diagrams', () => {
    const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    scheduler.run(({ hot, cold, expectObservable }) => {
      const triggers = hot('a 99ms b');
      const request = () => cold('300ms (r|)');

      expectObservable(triggers.pipe(switchMap(request))).toBe('400ms r');
      expectObservable(triggers.pipe(mergeMap(request))).toBe('300ms r 99ms r');
      expectObservable(triggers.pipe(concatMap(request))).toBe('300ms r 299ms r');
      expectObservable(triggers.pipe(exhaustMap(request))).toBe('300ms r');
    });
  });
});
