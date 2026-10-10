import {
  AXIS_MS,
  DEFAULT_DURATION_MS,
  MAX_TRIGGERS,
  OVERLAP_INTENTS,
  OVERLAP_OPERATORS,
  OverlapIntent,
  OverlapOperator,
  OverlapRunInput,
  OverlapRunResult,
  OverlapScenarioPreset,
  OverlapState,
  OverlapTrigger,
  RECOMMENDED_OPERATOR,
  buildPredictionChoices,
  createOverlapState,
  evaluateVerdict,
  overlapQualification,
  predictionNeeded,
  reduceOverlap,
  runAll,
  simulateOverlap,
} from './rxjs-overlap-playground.model';

import { randomStreams } from './rxjs-overlap-playground.test-streams';

function trigger(id: string, at: number, label = id, durationMs: number | null = null): OverlapTrigger {
  return { id, at, label, durationMs };
}

function input(operator: OverlapOperator, triggers: readonly OverlapTrigger[], defaultDurationMs = DEFAULT_DURATION_MS): OverlapRunInput {
  return { operator, triggers, defaultDurationMs, axisMs: AXIS_MS };
}

const SEED = [trigger('A', 0), trigger('B', 100)];
const RACE = [trigger('A', 0, 'A', 500), trigger('B', 100, 'B', 200)];

function deliveries(run: OverlapRunResult): string[] {
  return run.deliveries.map((delivery) => `${delivery.label}@${delivery.at}`);
}

function outcomes(run: OverlapRunResult): string[] {
  return run.requests.map((request) => `${request.label}:${request.outcome}`);
}

function visualExtent(run: OverlapRunResult, index: number): [number, number] {
  const request = run.requests[index];
  const start = request.outcome === 'queued' ? request.triggeredAt : Math.min(request.triggeredAt, request.startedAt ?? request.triggeredAt);
  const end = request.outcome === 'queued' ? AXIS_MS : Math.min(AXIS_MS, request.serverEndsAt ?? AXIS_MS);
  return [start, Math.max(end, start + 10)];
}

describe('rxjs overlap playground model', () => {
  it('reproduces the page table for the seed stream under all four operators', () => {
    const switched = simulateOverlap(input('switchMap', SEED));
    expect(outcomes(switched)).toEqual(['A:cancelled', 'B:completed']);
    expect(switched.requests[0]).toEqual(jasmine.objectContaining({ startedAt: 0, endedAt: 100, serverEndsAt: 300 }));
    expect(deliveries(switched)).toEqual(['B@400']);
    expect(switched.rowCount).toBe(2);

    const merged = simulateOverlap(input('mergeMap', SEED));
    expect(outcomes(merged)).toEqual(['A:completed', 'B:completed']);
    expect(deliveries(merged)).toEqual(['A@300', 'B@400']);

    const concatenated = simulateOverlap(input('concatMap', SEED));
    expect(outcomes(concatenated)).toEqual(['A:completed', 'B:completed']);
    expect(concatenated.requests[1]).toEqual(jasmine.objectContaining({ startedAt: 300, waitedMs: 200, endedAt: 600 }));
    expect(deliveries(concatenated)).toEqual(['A@300', 'B@600']);

    const exhausted = simulateOverlap(input('exhaustMap', SEED));
    expect(outcomes(exhausted)).toEqual(['A:completed', 'B:dropped']);
    expect(exhausted.requests[1]).toEqual(jasmine.objectContaining({ startedAt: null, endedAt: null, row: -1 }));
    expect(deliveries(exhausted)).toEqual(['A@300']);
    expect(exhausted.rowCount).toBe(1);
    expect(exhausted.eventTimes).toEqual([0, 100, 300, AXIS_MS]);
  });

  it('lets a slow older response overwrite a newer one under mergeMap and flags it for latest-only UIs', () => {
    const run = simulateOverlap(input('mergeMap', RACE));
    expect(deliveries(run)).toEqual(['B@300', 'A@500']);

    const latest = evaluateVerdict(run, 'latest-read');
    expect(latest.fits).toBeFalse();
    expect(latest.hazards.map((hazard) => `${hazard.code}:${hazard.severity}`)).toEqual([
      'stale-overwrite:danger',
      'stale-final-state:danger',
    ]);
    expect(latest.finalTriggerId).toBe('A');

    const parallel = evaluateVerdict(run, 'independent-parallel');
    expect(parallel.fits).toBeTrue();
    expect(parallel.hazards).toEqual([]);

    const fixed = simulateOverlap(input('switchMap', RACE));
    expect(deliveries(fixed)).toEqual(['B@300']);
    expect(evaluateVerdict(fixed, 'latest-read').fits).toBeTrue();
  });

  it('keeps concatMap ordered and lossless and switchMap single-flight on random streams', () => {
    for (const stream of randomStreams(40)) {
      const concatenated = simulateOverlap(input('concatMap', stream.triggers, stream.defaultDurationMs));
      expect(concatenated.requests.some((request) => request.outcome === 'cancelled' || request.outcome === 'dropped')).toBeFalse();
      const order = concatenated.deliveries.map((delivery) => delivery.triggerIndex);
      expect(order).toEqual([...order].sort((a, b) => a - b));
      concatenated.requests.forEach((request, index) => {
        const previous = concatenated.requests[index - 1];
        if (previous?.serverEndsAt !== null && previous?.serverEndsAt !== undefined && request.startedAt !== null) {
          expect(request.startedAt).toBeGreaterThanOrEqual(previous.serverEndsAt);
        }
      });

      const switched = simulateOverlap(input('switchMap', stream.triggers, stream.defaultDurationMs));
      const started = switched.requests.filter((request) => request.startedAt !== null);
      for (let i = 1; i < started.length; i += 1) {
        const previous = started[i - 1];
        expect(previous.endedAt ?? AXIS_MS).toBeLessThanOrEqual(started[i].startedAt ?? AXIS_MS);
      }
      expect(switched.deliveries.every((delivery) => switched.requests[delivery.triggerIndex].outcome === 'completed')).toBeTrue();
      expect(switched.deliveries.length).toBeLessThanOrEqual(started.length);
    }
  });

  it('processes a completion before a trigger that lands on the same millisecond', () => {
    const onTheDot = [trigger('A', 0), trigger('B', 300)];
    expect(outcomes(simulateOverlap(input('exhaustMap', onTheDot)))).toEqual(['A:completed', 'B:completed']);
    expect(outcomes(simulateOverlap(input('switchMap', onTheDot)))).toEqual(['A:completed', 'B:completed']);
    expect(deliveries(simulateOverlap(input('switchMap', onTheDot)))).toEqual(['A@300', 'B@600']);

    const justBefore = [trigger('A', 0), trigger('B', 290)];
    expect(outcomes(simulateOverlap(input('exhaustMap', justBefore)))).toEqual(['A:completed', 'B:dropped']);
    expect(outcomes(simulateOverlap(input('switchMap', justBefore)))).toEqual(['A:cancelled', 'B:completed']);
  });

  it('marks requests that cross the window as running or queued without a delivery', () => {
    const late = simulateOverlap(input('mergeMap', [trigger('A', 1000)]));
    expect(late.requests[0]).toEqual(jasmine.objectContaining({ outcome: 'running', endedAt: null, serverEndsAt: 1300 }));
    expect(late.deliveries).toEqual([]);

    const long = simulateOverlap(input('concatMap', [trigger('A', 0, 'A', 900), trigger('B', 100, 'B', 900), trigger('C', 200, 'C', 900)]));
    expect(outcomes(long)).toEqual(['A:completed', 'B:running', 'C:queued']);
    expect(long.requests[1]).toEqual(jasmine.objectContaining({ startedAt: 900, waitedMs: 800, endedAt: null }));
    expect(long.requests[2]).toEqual(jasmine.objectContaining({ startedAt: null, row: 2 }));
    expect(deliveries(long)).toEqual(['A@900']);
    expect(evaluateVerdict(long, 'ordered-write').hazards.map((hazard) => hazard.code)).toEqual(['queue-latency']);
  });

  it('packs bars so that no two requests in the same row overlap', () => {
    for (const stream of randomStreams(40, 11)) {
      for (const operator of OVERLAP_OPERATORS) {
        const run = simulateOverlap(input(operator, stream.triggers, stream.defaultDurationMs));
        const byRow = new Map<number, Array<[number, number]>>();
        run.requests.forEach((request, index) => {
          if (request.row < 0) {
            expect(request.outcome).toBe('dropped');
            return;
          }
          const extents = byRow.get(request.row) ?? [];
          extents.push(visualExtent(run, index));
          byRow.set(request.row, extents);
        });
        for (const extents of byRow.values()) {
          const sorted = [...extents].sort((a, b) => a[0] - b[0]);
          for (let i = 1; i < sorted.length; i += 1) {
            expect(sorted[i][0]).withContext(`${operator} ${JSON.stringify(sorted)}`).toBeGreaterThanOrEqual(sorted[i - 1][1]);
          }
        }
        expect(run.rowCount).toBe(Math.max(1, ...run.requests.map((request) => request.row + 1)));
      }
    }
  });

  it('derives prediction choices from the four real outcomes in a stable order', () => {
    const choices = buildPredictionChoices(runAll({ triggers: SEED, defaultDurationMs: DEFAULT_DURATION_MS, axisMs: AXIS_MS }));
    expect(choices.map((choice) => choice.key)).toEqual(['A@300', 'A@300|B@400', 'A@300|B@600', 'B@400']);
    expect(choices.map((choice) => choice.operators)).toEqual([['exhaustMap'], ['mergeMap'], ['concatMap'], ['switchMap']]);
    expect(predictionNeeded(choices)).toBeTrue();

    const single = buildPredictionChoices(runAll({ triggers: [trigger('A', 0)], defaultDurationMs: DEFAULT_DURATION_MS, axisMs: AXIS_MS }));
    expect(single.length).toBe(1);
    expect(single[0].operators).toEqual([...OVERLAP_OPERATORS]);
    expect(predictionNeeded(single)).toBeFalse();

    const empty = buildPredictionChoices(runAll({ triggers: [trigger('A', 1000)], defaultDurationMs: DEFAULT_DURATION_MS, axisMs: AXIS_MS }));
    expect(empty[0].key).toBe('none');
  });

  it('fits only the recommended operator for each intent on the seed stream', () => {
    const runs = runAll({ triggers: SEED, defaultDurationMs: DEFAULT_DURATION_MS, axisMs: AXIS_MS });
    for (const intent of OVERLAP_INTENTS) {
      for (const operator of OVERLAP_OPERATORS) {
        const verdict = evaluateVerdict(runs[operator], intent);
        expect(verdict.fits).withContext(`${intent} ${operator}`).toBe(operator === RECOMMENDED_OPERATOR[intent]);
      }
    }
    const codes = (intent: OverlapIntent, operator: OverlapOperator): string[] =>
      evaluateVerdict(runs[operator], intent).hazards.map((hazard) => `${hazard.code}:${hazard.severity}`);
    expect(codes('latest-read', 'switchMap')).toEqual(['server-continues:info']);
    expect(codes('latest-read', 'exhaustMap')).toEqual(['stale-final-state:danger', 'dropped-intent:danger']);
    expect(codes('latest-read', 'mergeMap')).toEqual(['intermediate-render:warn']);
    expect(codes('submit-once', 'switchMap')).toEqual(['duplicate-request:danger', 'server-continues:warn']);
    expect(codes('submit-once', 'exhaustMap')).toEqual([]);
    expect(codes('ordered-write', 'switchMap')).toEqual(['cancelled-write:danger', 'server-continues:warn']);
    expect(codes('ordered-write', 'concatMap')).toEqual(['queue-latency:info']);
    expect(codes('independent-parallel', 'concatMap')).toEqual(['queue-latency:warn']);
    expect(codes('independent-parallel', 'exhaustMap')).toEqual(['dropped-intent:warn']);
  });

  it('edits the trigger stream through the reducer with quantized, capped, relettered triggers', () => {
    let state = createOverlapState();
    expect(state.triggers.map((item) => `${item.label}@${item.at}`)).toEqual(['A@0', 'B@100']);
    expect(state.runs.switchMap.deliveries.map((delivery) => delivery.at)).toEqual([400]);

    state = reduceOverlap(state, { type: 'add-trigger' });
    expect(state.triggers.map((item) => `${item.label}@${item.at}`)).toEqual(['A@0', 'B@100', 'C@200']);

    state = reduceOverlap(state, { type: 'move-trigger', id: state.triggers[2].id, at: 47 });
    expect(state.triggers.map((item) => `${item.label}@${item.at}`)).toEqual(['A@0', 'B@50', 'C@100']);

    state = reduceOverlap(state, { type: 'move-trigger', id: state.triggers[0].id, at: 5000 });
    expect(state.triggers[2].at).toBe(1190);

    state = reduceOverlap(state, { type: 'set-trigger-duration', id: state.triggers[0].id, ms: 123 });
    expect(state.triggers[0].durationMs).toBe(100);
    state = reduceOverlap(state, { type: 'set-default-duration', ms: 2000 });
    expect(state.defaultDurationMs).toBe(900);

    for (let i = 0; i < 10; i += 1) state = reduceOverlap(state, { type: 'add-trigger' });
    expect(state.triggers.length).toBe(MAX_TRIGGERS);

    state = reduceOverlap(state, { type: 'apply-burst', pattern: 'fast-typing' });
    expect(state.triggers.map((item) => item.at)).toEqual([0, 80, 160, 240]);
    expect(state.triggers.map((item) => item.label)).toEqual(['A', 'B', 'C', 'D']);

    const only = reduceOverlap(createOverlapState(), { type: 'remove-trigger', id: 't1' });
    expect(only.triggers.length).toBe(1);
    expect(reduceOverlap(only, { type: 'remove-trigger', id: only.triggers[0].id })).toBe(only);
  });

  it('gates reveal behind a locked prediction and records scenario progress', () => {
    const preset: OverlapScenarioPreset = {
      id: 'stale-overwrite',
      intent: 'latest-read',
      operator: 'mergeMap',
      defaultDurationMs: 300,
      triggers: [{ at: 0, label: 'A', durationMs: 500 }, { at: 100, label: 'B', durationMs: 200 }],
    };
    let state = reduceOverlap(createOverlapState(), { type: 'select-scenario', preset });
    expect(state.scenario?.id).toBe('stale-overwrite');
    expect(state.scenarioDirty).toBeFalse();
    expect(state.operator).toBe('mergeMap');
    expect(state.triggers.map((item) => item.label)).toEqual(['A', 'B']);

    expect(reduceOverlap(state, { type: 'reveal' })).toBe(state);

    state = reduceOverlap(state, { type: 'select-prediction', key: 'B@300' });
    state = reduceOverlap(state, { type: 'reveal' });
    expect(state.stage).toBe('revealed');
    expect(state.prediction).toEqual({ choiceKey: 'B@300', submitted: true, correct: false });
    expect(state.predictionsSubmitted).toBe(1);
    expect(state.correctPredictions).toBe(0);
    expect(state.revealedScenarioIds).toEqual(['stale-overwrite']);
    expect(reduceOverlap(state, { type: 'select-prediction', key: 'B@300|A@500' })).toBe(state);

    const fixed = reduceOverlap(state, { type: 'apply-fix' });
    expect(fixed.operator).toBe('switchMap');
    expect(fixed.stage).toBe('revealed');
    expect(fixed.fixesApplied).toBe(1);
    expect(fixed.runs.switchMap.deliveries.map((delivery) => delivery.at)).toEqual([300]);

    const edited = reduceOverlap(fixed, { type: 'add-trigger' });
    expect(edited.scenarioDirty).toBeTrue();
    expect(edited.stage).toBe('ready');
    const revealedDirty = reduceOverlap(reduceOverlap(edited, { type: 'select-prediction', key: buildPredictionChoices(edited.runs)[0].key }), { type: 'reveal' });
    expect(revealedDirty.revealedScenarioIds).toEqual(['stale-overwrite']);

    const reset = reduceOverlap(revealedDirty, { type: 'reset' });
    expect(reset.triggers.map((item) => `${item.label}@${item.at}`)).toEqual(['A@0', 'B@100']);
    expect(reset.operator).toBe('mergeMap');
    expect(reset.stage).toBe('ready');
    expect(reset.scenarioDirty).toBeFalse();
    expect(reset.revealCount).toBe(revealedDirty.revealCount);
    expect(reset.fixesApplied).toBe(1);
  });

  it('reveals compare mode without a prediction and steps the cursor through event times', () => {
    let state = reduceOverlap(createOverlapState(), { type: 'set-view', view: 'compare' });
    state = reduceOverlap(state, { type: 'reveal' });
    expect(state.stage).toBe('revealed');
    expect(state.compareReveals).toBe(1);
    expect(state.predictionsSubmitted).toBe(0);

    state = reduceOverlap(state, { type: 'set-cursor', ms: 0 });
    const steps: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      state = reduceOverlap(state, { type: 'step-cursor', direction: 1 });
      steps.push(state.cursorMs);
    }
    expect(steps).toEqual([100, 300, 400, 600, AXIS_MS, AXIS_MS, AXIS_MS, AXIS_MS]);
    state = reduceOverlap(state, { type: 'step-cursor', direction: -1 });
    expect(state.cursorMs).toBe(600);

    const single = reduceOverlap(reduceOverlap(state, { type: 'set-view', view: 'single' }), { type: 'set-cursor', ms: 0 });
    const next = reduceOverlap(single, { type: 'step-cursor', direction: 1 });
    expect(next.cursorMs).toBe(100);
    expect(single.stage).toBe('ready');
  });

  it('qualifies after one correct prediction, three scenarios, or two compare reveals', () => {
    const base = createOverlapState();
    expect(overlapQualification(base)).toBeNull();

    const correct = reduceOverlap(reduceOverlap(base, { type: 'select-prediction', key: 'B@400' }), { type: 'reveal' });
    expect(correct.prediction.correct).toBeTrue();
    expect(overlapQualification(correct)).toBe('prediction');

    const scenarios: OverlapState = { ...base, revealedScenarioIds: ['typeahead-search', 'wizard-saves', 'parallel-loads'] };
    expect(overlapQualification(scenarios)).toBe('scenarios');

    const compared = { ...base, compareReveals: 2 };
    expect(overlapQualification(compared)).toBe('compare');
    expect(overlapQualification({ ...base, compareReveals: 1, revealedScenarioIds: ['stale-overwrite'] })).toBeNull();
  });

  it('never mutates the previous state', () => {
    const before = createOverlapState();
    const snapshot = JSON.stringify(before);

    reduceOverlap(before, { type: 'add-trigger' });
    reduceOverlap(before, { type: 'set-operator', operator: 'concatMap' });
    reduceOverlap(before, { type: 'select-prediction', key: 'B@400' });
    reduceOverlap(before, { type: 'apply-burst', pattern: 'spaced' });
    simulateOverlap(input('switchMap', before.triggers));

    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
