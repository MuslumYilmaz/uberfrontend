/**
 * Pure model for the RxJS overlap playground.
 *
 * A trigger stream (clicks, keystrokes) is mapped to inner requests under one
 * of the four flattening operators on a discrete millisecond axis. The
 * reference simulation here mirrors the real RxJS behaviour and is checked
 * against the real operators running on a VirtualTimeScheduler in
 * `rxjs-overlap-playground.rxjs-engine.spec.ts`.
 *
 * Tie rule (shared by the simulation, the real engine, and the copy): when a
 * request completes at the same millisecond a new trigger fires, the
 * completion is processed first, so the new trigger sees an idle operator.
 */

export const AXIS_MS = 1200;
export const TIME_STEP_MS = 10;
export const MIN_DURATION_MS = 50;
export const MAX_DURATION_MS = 900;
export const DURATION_STEP_MS = 50;
export const DEFAULT_DURATION_MS = 300;
export const MAX_TRIGGERS = 6;
export const DEFAULT_GAP_MS = 100;
export const MAX_TRIGGER_AT = AXIS_MS - TIME_STEP_MS;

export type OverlapOperator = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';
export const OVERLAP_OPERATORS: readonly OverlapOperator[] = ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'];

/** What the UI promises the user. Decides which operator fits and which outcomes are hazards. */
export type OverlapIntent = 'latest-read' | 'submit-once' | 'ordered-write' | 'independent-parallel';
export const OVERLAP_INTENTS: readonly OverlapIntent[] = ['latest-read', 'submit-once', 'ordered-write', 'independent-parallel'];
export const RECOMMENDED_OPERATOR: Readonly<Record<OverlapIntent, OverlapOperator>> = {
  'latest-read': 'switchMap',
  'submit-once': 'exhaustMap',
  'ordered-write': 'concatMap',
  'independent-parallel': 'mergeMap',
};

export type OverlapView = 'single' | 'compare';
export type OverlapStage = 'ready' | 'revealed';
export type BurstPattern = 'double-click' | 'fast-typing' | 'spaced';
export type RequestOutcome = 'completed' | 'cancelled' | 'dropped' | 'running' | 'queued';

export interface OverlapTrigger {
  readonly id: string;
  /** Integer ms, 0..MAX_TRIGGER_AT, multiple of TIME_STEP_MS. */
  readonly at: number;
  readonly label: string;
  /** Per-request duration override; null uses the default duration. */
  readonly durationMs: number | null;
}

export interface OverlapRunInput {
  readonly operator: OverlapOperator;
  readonly triggers: readonly OverlapTrigger[];
  readonly defaultDurationMs: number;
  readonly axisMs: number;
}

export interface InnerRequest {
  readonly triggerId: string;
  readonly triggerIndex: number;
  readonly label: string;
  readonly triggeredAt: number;
  readonly durationMs: number;
  readonly startedAt: number | null;
  readonly waitedMs: number;
  readonly endedAt: number | null;
  readonly outcome: RequestOutcome;
  /** When the server would finish even if the client cancelled. */
  readonly serverEndsAt: number | null;
  /** Packed row inside the lane; -1 for dropped triggers. */
  readonly row: number;
}

export interface UiDelivery {
  readonly triggerId: string;
  readonly triggerIndex: number;
  readonly label: string;
  readonly at: number;
}

export interface OverlapRunResult {
  readonly operator: OverlapOperator;
  readonly requests: readonly InnerRequest[];
  readonly deliveries: readonly UiDelivery[];
  readonly rowCount: number;
  readonly eventTimes: readonly number[];
}

export interface OverlapEngine {
  run(input: OverlapRunInput): OverlapRunResult;
}

export type OverlapRuns = Readonly<Record<OverlapOperator, OverlapRunResult>>;

/** Raw lifecycle facts an engine records per trigger, in time order. */
export interface RawRequest {
  startedAt: number | null;
  endedAt: number | null;
  completed: boolean;
}

export function triggerDuration(trigger: OverlapTrigger, defaultDurationMs: number): number {
  return trigger.durationMs ?? defaultDurationMs;
}

export function sortTriggers(triggers: readonly OverlapTrigger[]): OverlapTrigger[] {
  return [...triggers]
    .map((trigger, index) => ({ trigger, index }))
    .sort((a, b) => a.trigger.at - b.trigger.at || a.index - b.index)
    .map(({ trigger }) => trigger);
}

export function quantizeTime(value: number): number {
  const clamped = Math.min(MAX_TRIGGER_AT, Math.max(0, Number.isFinite(value) ? value : 0));
  return Math.round(clamped / TIME_STEP_MS) * TIME_STEP_MS;
}

export function quantizeDuration(value: number): number {
  const clamped = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, Number.isFinite(value) ? value : DEFAULT_DURATION_MS));
  return Math.round(clamped / DURATION_STEP_MS) * DURATION_STEP_MS;
}

export function simulateRaw(
  operator: OverlapOperator,
  sorted: readonly OverlapTrigger[],
  defaultDurationMs: number,
): RawRequest[] {
  const raw: RawRequest[] = sorted.map(() => ({ startedAt: null, endedAt: null, completed: false }));
  const duration = (index: number): number => triggerDuration(sorted[index], defaultDurationMs);

  switch (operator) {
    case 'switchMap': {
      let active = -1;
      sorted.forEach((trigger, index) => {
        if (active >= 0 && (raw[active].startedAt ?? 0) + duration(active) > trigger.at) {
          raw[active].endedAt = trigger.at;
        } else if (active >= 0) {
          raw[active].endedAt = (raw[active].startedAt ?? 0) + duration(active);
          raw[active].completed = true;
        }
        raw[index].startedAt = trigger.at;
        active = index;
      });
      if (active >= 0) {
        raw[active].endedAt = (raw[active].startedAt ?? 0) + duration(active);
        raw[active].completed = true;
      }
      break;
    }
    case 'mergeMap':
      sorted.forEach((trigger, index) => {
        raw[index] = { startedAt: trigger.at, endedAt: trigger.at + duration(index), completed: true };
      });
      break;
    case 'concatMap': {
      let previousEnd = 0;
      sorted.forEach((trigger, index) => {
        const start = Math.max(trigger.at, previousEnd);
        raw[index] = { startedAt: start, endedAt: start + duration(index), completed: true };
        previousEnd = start + duration(index);
      });
      break;
    }
    case 'exhaustMap': {
      let busyUntil = -1;
      sorted.forEach((trigger, index) => {
        if (busyUntil > trigger.at) return;
        raw[index] = { startedAt: trigger.at, endedAt: trigger.at + duration(index), completed: true };
        busyUntil = trigger.at + duration(index);
      });
      break;
    }
  }
  return raw;
}

interface PackedRequest {
  readonly index: number;
  readonly start: number;
  readonly end: number;
}

function packRows(items: readonly PackedRequest[]): Map<number, number> {
  const rows = new Map<number, number>();
  const rowEnds: number[] = [];
  const ordered = [...items].sort((a, b) => a.start - b.start || a.index - b.index);
  for (const item of ordered) {
    let row = rowEnds.findIndex((end) => end <= item.start);
    if (row < 0) {
      row = rowEnds.length;
      rowEnds.push(item.end);
    } else {
      rowEnds[row] = item.end;
    }
    rows.set(item.index, row);
  }
  return rows;
}

/** Turns raw lifecycle facts into the shared run result (outcomes, deliveries, rows, event times). */
export function finalizeRun(
  input: OverlapRunInput,
  sorted: readonly OverlapTrigger[],
  raw: readonly RawRequest[],
): OverlapRunResult {
  const { axisMs, operator } = input;
  const packable: PackedRequest[] = [];
  const partial = sorted.map((trigger, index): Omit<InnerRequest, 'row'> => {
    const facts = raw[index];
    const durationMs = triggerDuration(trigger, input.defaultDurationMs);
    const started = facts.startedAt !== null && facts.startedAt < axisMs ? facts.startedAt : null;
    let outcome: RequestOutcome;
    let endedAt: number | null = null;
    let serverEndsAt: number | null = null;
    if (started === null) {
      outcome = operator === 'concatMap' ? 'queued' : 'dropped';
    } else if (facts.completed && facts.endedAt !== null && facts.endedAt <= axisMs) {
      outcome = 'completed';
      endedAt = facts.endedAt;
      serverEndsAt = facts.endedAt;
    } else if (!facts.completed && facts.endedAt !== null && facts.endedAt <= axisMs) {
      outcome = 'cancelled';
      endedAt = facts.endedAt;
      serverEndsAt = started + durationMs;
    } else {
      outcome = 'running';
      serverEndsAt = started + durationMs;
    }
    if (outcome !== 'dropped') {
      const visualStart = outcome === 'queued' ? trigger.at : Math.min(trigger.at, started ?? trigger.at);
      const visualEnd = outcome === 'queued' ? axisMs : Math.min(axisMs, serverEndsAt ?? axisMs);
      packable.push({ index, start: visualStart, end: Math.max(visualEnd, visualStart + TIME_STEP_MS) });
    }
    return {
      triggerId: trigger.id,
      triggerIndex: index,
      label: trigger.label,
      triggeredAt: trigger.at,
      durationMs,
      startedAt: started,
      waitedMs: started === null ? 0 : started - trigger.at,
      endedAt,
      outcome,
      serverEndsAt,
    };
  });

  const rows = packRows(packable);
  const requests: InnerRequest[] = partial.map((request) => ({ ...request, row: rows.get(request.triggerIndex) ?? -1 }));
  const deliveries: UiDelivery[] = requests
    .filter((request) => request.outcome === 'completed' && request.endedAt !== null)
    .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0) || a.triggerIndex - b.triggerIndex)
    .map((request) => ({ triggerId: request.triggerId, triggerIndex: request.triggerIndex, label: request.label, at: request.endedAt ?? 0 }));
  const times = new Set<number>([0]);
  for (const request of requests) {
    times.add(request.triggeredAt);
    if (request.startedAt !== null) times.add(request.startedAt);
    if (request.endedAt !== null) times.add(request.endedAt);
    if (request.serverEndsAt !== null && request.serverEndsAt <= axisMs) times.add(request.serverEndsAt);
  }
  times.add(axisMs);
  return {
    operator,
    requests,
    deliveries,
    rowCount: Math.max(1, rows.size ? Math.max(...rows.values()) + 1 : 1),
    eventTimes: [...times].filter((time) => time >= 0 && time <= axisMs).sort((a, b) => a - b),
  };
}

export function simulateOverlap(input: OverlapRunInput): OverlapRunResult {
  const sorted = sortTriggers(input.triggers);
  return finalizeRun(input, sorted, simulateRaw(input.operator, sorted, input.defaultDurationMs));
}

export const SIMULATED_ENGINE: OverlapEngine = { run: simulateOverlap };

export function runAll(
  input: Omit<OverlapRunInput, 'operator'>,
  engine: OverlapEngine = SIMULATED_ENGINE,
): OverlapRuns {
  const runs = {} as Record<OverlapOperator, OverlapRunResult>;
  for (const operator of OVERLAP_OPERATORS) runs[operator] = engine.run({ ...input, operator });
  return runs;
}

// ---------------------------------------------------------------------------
// Verdict and hazards
// ---------------------------------------------------------------------------

export type HazardCode =
  | 'stale-overwrite'
  | 'stale-final-state'
  | 'duplicate-request'
  | 'dropped-intent'
  | 'cancelled-write'
  | 'out-of-order'
  | 'queue-latency'
  | 'intermediate-render'
  | 'server-continues';

export type HazardSeverity = 'danger' | 'warn' | 'info';

export interface Hazard {
  readonly code: HazardCode;
  readonly severity: HazardSeverity;
  readonly triggerIds: readonly string[];
  readonly ms: number | null;
}

export interface OverlapVerdict {
  readonly operator: OverlapOperator;
  readonly intent: OverlapIntent;
  readonly recommended: OverlapOperator;
  readonly fits: boolean;
  readonly hazards: readonly Hazard[];
  readonly finalTriggerId: string | null;
  readonly completedCount: number;
  readonly cancelledCount: number;
  readonly droppedCount: number;
  readonly lastDeliveryAt: number | null;
}

type ConditionCode = Exclude<HazardCode, 'stale-overwrite'> | 'disorder';

const SEVERITY_MATRIX: Readonly<Record<OverlapIntent, Partial<Record<ConditionCode, HazardSeverity>>>> = {
  'latest-read': { disorder: 'danger', 'stale-final-state': 'danger', 'dropped-intent': 'danger', 'queue-latency': 'warn', 'intermediate-render': 'warn', 'server-continues': 'info' },
  'submit-once': { 'duplicate-request': 'danger', 'server-continues': 'warn' },
  'ordered-write': { 'dropped-intent': 'danger', 'cancelled-write': 'danger', disorder: 'danger', 'queue-latency': 'info', 'server-continues': 'warn' },
  'independent-parallel': { 'dropped-intent': 'warn', 'cancelled-write': 'warn', 'queue-latency': 'warn', 'server-continues': 'info' },
};

const SEVERITY_ORDER: Readonly<Record<HazardSeverity, number>> = { danger: 0, warn: 1, info: 2 };

export function evaluateVerdict(run: OverlapRunResult, intent: OverlapIntent): OverlapVerdict {
  const { requests, deliveries } = run;
  const matrix = SEVERITY_MATRIX[intent];
  const hazards: Hazard[] = [];
  const add = (condition: ConditionCode, triggerIds: readonly string[], ms: number | null): void => {
    const severity = matrix[condition];
    if (!severity) return;
    const code: HazardCode = condition === 'disorder'
      ? (intent === 'ordered-write' ? 'out-of-order' : 'stale-overwrite')
      : condition;
    hazards.push({ code, severity, triggerIds, ms });
  };

  const disordered = deliveries.filter((delivery, index) =>
    deliveries.slice(0, index).some((earlier) => earlier.triggerIndex > delivery.triggerIndex));
  if (disordered.length) add('disorder', disordered.map((delivery) => delivery.triggerId), disordered[0].at);

  const latest = requests[requests.length - 1];
  const lastDelivery = deliveries[deliveries.length - 1] ?? null;
  if (latest && (latest.outcome === 'cancelled' || latest.outcome === 'dropped' || latest.outcome === 'completed')) {
    if (!lastDelivery || lastDelivery.triggerIndex !== latest.triggerIndex) {
      add('stale-final-state', [latest.triggerId], lastDelivery?.at ?? null);
    }
  }

  const started = requests.filter((request) => request.startedAt !== null);
  if (started.length > 1) add('duplicate-request', started.map((request) => request.triggerId), started[1].startedAt);

  const dropped = requests.filter((request) => request.outcome === 'dropped');
  if (dropped.length) add('dropped-intent', dropped.map((request) => request.triggerId), dropped[0].triggeredAt);

  const cancelled = requests.filter((request) => request.outcome === 'cancelled');
  if (cancelled.length) add('cancelled-write', cancelled.map((request) => request.triggerId), cancelled[0].endedAt);

  const waited = requests.filter((request) => request.waitedMs > 0 || request.outcome === 'queued');
  if (waited.length) {
    const longest = Math.max(...waited.map((request) => request.outcome === 'queued' ? run.eventTimes[run.eventTimes.length - 1] - request.triggeredAt : request.waitedMs));
    add('queue-latency', waited.map((request) => request.triggerId), longest);
  }

  // A delivery is intermediate when a newer trigger had already fired before it
  // rendered and that newer trigger's own delivery lands later, replacing it.
  const intermediate = deliveries.filter((delivery) =>
    deliveries.some((later) => later.triggerIndex > delivery.triggerIndex
      && later.at > delivery.at
      && requests[later.triggerIndex].triggeredAt < delivery.at));
  const onlyIntermediate = intermediate.filter((delivery) => !disordered.includes(delivery));
  if (onlyIntermediate.length) add('intermediate-render', onlyIntermediate.map((delivery) => delivery.triggerId), onlyIntermediate[0].at);

  const serverContinues = cancelled.filter((request) => request.serverEndsAt !== null && request.endedAt !== null && request.serverEndsAt > request.endedAt);
  if (serverContinues.length) add('server-continues', serverContinues.map((request) => request.triggerId), serverContinues[0].serverEndsAt);

  hazards.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const recommended = RECOMMENDED_OPERATOR[intent];
  return {
    operator: run.operator,
    intent,
    recommended,
    fits: run.operator === recommended && !hazards.some((hazard) => hazard.severity === 'danger'),
    hazards,
    finalTriggerId: lastDelivery?.triggerId ?? null,
    completedCount: requests.filter((request) => request.outcome === 'completed').length,
    cancelledCount: cancelled.length,
    droppedCount: dropped.length,
    lastDeliveryAt: lastDelivery?.at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Prediction choices
// ---------------------------------------------------------------------------

export interface PredictionChoice {
  readonly key: string;
  readonly deliveries: readonly UiDelivery[];
  readonly operators: readonly OverlapOperator[];
}

export function deliveryKey(deliveries: readonly UiDelivery[]): string {
  return deliveries.length ? deliveries.map((delivery) => `${delivery.label}@${delivery.at}`).join('|') : 'none';
}

export function buildPredictionChoices(runs: OverlapRuns): readonly PredictionChoice[] {
  const byKey = new Map<string, { deliveries: readonly UiDelivery[]; operators: OverlapOperator[] }>();
  for (const operator of OVERLAP_OPERATORS) {
    const deliveries = runs[operator].deliveries;
    const key = deliveryKey(deliveries);
    const entry = byKey.get(key);
    if (entry) entry.operators.push(operator);
    else byKey.set(key, { deliveries, operators: [operator] });
  }
  return [...byKey.entries()]
    .map(([key, entry]) => ({ key, deliveries: entry.deliveries, operators: entry.operators }))
    .sort((a, b) => (a.deliveries[0]?.at ?? Number.MAX_SAFE_INTEGER) - (b.deliveries[0]?.at ?? Number.MAX_SAFE_INTEGER) || a.key.localeCompare(b.key));
}

export function predictionNeeded(choices: readonly PredictionChoice[]): boolean {
  return choices.length >= 2;
}

// ---------------------------------------------------------------------------
// State and reducer
// ---------------------------------------------------------------------------

export type OverlapScenarioId =
  | 'typeahead-search'
  | 'save-double-click'
  | 'parallel-loads'
  | 'wizard-saves'
  | 'stale-overwrite'
  | 'dropped-click'
  | 'cancel-not-server';

export interface OverlapScenarioPreset {
  readonly id: OverlapScenarioId;
  readonly intent: OverlapIntent;
  /** The tempting operator the scenario starts with. */
  readonly operator: OverlapOperator;
  readonly defaultDurationMs: number;
  readonly triggers: readonly Omit<OverlapTrigger, 'id'>[];
}

export interface OverlapPrediction {
  readonly choiceKey: string | null;
  readonly submitted: boolean;
  readonly correct: boolean | null;
}

export interface OverlapState {
  readonly triggers: readonly OverlapTrigger[];
  readonly nextTriggerSeq: number;
  readonly defaultDurationMs: number;
  readonly operator: OverlapOperator;
  readonly intent: OverlapIntent;
  readonly view: OverlapView;
  readonly stage: OverlapStage;
  readonly scenario: OverlapScenarioPreset | null;
  readonly scenarioDirty: boolean;
  readonly runs: OverlapRuns;
  readonly prediction: OverlapPrediction;
  readonly cursorMs: number;
  readonly revealCount: number;
  readonly predictionsSubmitted: number;
  readonly correctPredictions: number;
  readonly revealedScenarioIds: readonly OverlapScenarioId[];
  readonly compareReveals: number;
  readonly fixesApplied: number;
}

export type OverlapAction =
  | { readonly type: 'select-scenario'; readonly preset: OverlapScenarioPreset }
  | { readonly type: 'set-operator'; readonly operator: OverlapOperator }
  | { readonly type: 'set-intent'; readonly intent: OverlapIntent }
  | { readonly type: 'set-view'; readonly view: OverlapView }
  | { readonly type: 'set-default-duration'; readonly ms: number }
  | { readonly type: 'add-trigger'; readonly at?: number }
  | { readonly type: 'move-trigger'; readonly id: string; readonly at: number }
  | { readonly type: 'set-trigger-duration'; readonly id: string; readonly ms: number | null }
  | { readonly type: 'remove-trigger'; readonly id: string }
  | { readonly type: 'apply-burst'; readonly pattern: BurstPattern }
  | { readonly type: 'select-prediction'; readonly key: string }
  | { readonly type: 'reveal' }
  | { readonly type: 'apply-fix' }
  | { readonly type: 'set-cursor'; readonly ms: number }
  | { readonly type: 'step-cursor'; readonly direction: 1 | -1 }
  | { readonly type: 'reset' };

export const SEED_TRIGGERS: readonly Omit<OverlapTrigger, 'id'>[] = [
  { at: 0, label: 'A', durationMs: null },
  { at: 100, label: 'B', durationMs: null },
];

export const BURST_PATTERNS: Readonly<Record<BurstPattern, readonly number[]>> = {
  'double-click': [0, 100],
  'fast-typing': [0, 80, 160, 240],
  spaced: [0, 400, 800],
};

const EMPTY_PREDICTION: OverlapPrediction = { choiceKey: null, submitted: false, correct: null };

function letterLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

function withIds(triggers: readonly Omit<OverlapTrigger, 'id'>[], startSeq: number): { triggers: OverlapTrigger[]; nextSeq: number } {
  let seq = startSeq;
  const withId = triggers.map((trigger) => ({ ...trigger, id: `t${seq++}` }));
  return { triggers: sortTriggers(withId), nextSeq: seq };
}

function relabel(triggers: readonly OverlapTrigger[], preset: OverlapScenarioPreset | null): OverlapTrigger[] {
  const sorted = sortTriggers(triggers);
  if (!preset) return sorted.map((trigger, index) => ({ ...trigger, label: letterLabel(index) }));
  const used = new Set(sorted.map((trigger) => trigger.label));
  let next = 0;
  return sorted.map((trigger) => {
    if (trigger.label) return trigger;
    while (used.has(letterLabel(next))) next += 1;
    const label = letterLabel(next);
    used.add(label);
    return { ...trigger, label };
  });
}

function recompute(
  state: OverlapState,
  patch: Partial<OverlapState>,
  engine: OverlapEngine,
): OverlapState {
  const next: OverlapState = { ...state, ...patch };
  const triggers = relabel(next.triggers, next.scenario);
  return {
    ...next,
    triggers,
    runs: runAll({ triggers, defaultDurationMs: next.defaultDurationMs, axisMs: AXIS_MS }, engine),
    stage: 'ready',
    prediction: EMPTY_PREDICTION,
    cursorMs: AXIS_MS,
  };
}

export function createOverlapState(engine: OverlapEngine = SIMULATED_ENGINE): OverlapState {
  const seeded = withIds(SEED_TRIGGERS, 1);
  const base: OverlapState = {
    triggers: seeded.triggers,
    nextTriggerSeq: seeded.nextSeq,
    defaultDurationMs: DEFAULT_DURATION_MS,
    operator: 'switchMap',
    intent: 'latest-read',
    view: 'single',
    stage: 'ready',
    scenario: null,
    scenarioDirty: false,
    runs: {} as OverlapRuns,
    prediction: EMPTY_PREDICTION,
    cursorMs: AXIS_MS,
    revealCount: 0,
    predictionsSubmitted: 0,
    correctPredictions: 0,
    revealedScenarioIds: [],
    compareReveals: 0,
    fixesApplied: 0,
  };
  return recompute(base, {}, engine);
}

export function applyPreset(state: OverlapState, preset: OverlapScenarioPreset, engine: OverlapEngine = SIMULATED_ENGINE): OverlapState {
  const seeded = withIds(preset.triggers, state.nextTriggerSeq);
  return recompute(state, {
    triggers: seeded.triggers,
    nextTriggerSeq: seeded.nextSeq,
    defaultDurationMs: preset.defaultDurationMs,
    operator: preset.operator,
    intent: preset.intent,
    view: 'single',
    scenario: preset,
    scenarioDirty: false,
  }, engine);
}

export function reduceOverlap(
  state: OverlapState,
  action: OverlapAction,
  engine: OverlapEngine = SIMULATED_ENGINE,
): OverlapState {
  switch (action.type) {
    case 'select-scenario':
      return applyPreset(state, action.preset, engine);
    case 'set-operator':
      return state.operator === action.operator ? state : recompute(state, { operator: action.operator }, engine);
    case 'set-intent':
      return state.intent === action.intent ? state : recompute(state, { intent: action.intent, scenarioDirty: Boolean(state.scenario) }, engine);
    case 'set-view':
      return state.view === action.view ? state : recompute(state, { view: action.view }, engine);
    case 'set-default-duration': {
      const ms = quantizeDuration(action.ms);
      return state.defaultDurationMs === ms ? state : recompute(state, { defaultDurationMs: ms, scenarioDirty: Boolean(state.scenario) }, engine);
    }
    case 'add-trigger': {
      if (state.triggers.length >= MAX_TRIGGERS) return state;
      const last = state.triggers[state.triggers.length - 1];
      const at = quantizeTime(action.at ?? (last ? last.at + DEFAULT_GAP_MS : 0));
      const trigger: OverlapTrigger = { id: `t${state.nextTriggerSeq}`, at, label: '', durationMs: null };
      return recompute(state, {
        triggers: [...state.triggers, trigger],
        nextTriggerSeq: state.nextTriggerSeq + 1,
        scenarioDirty: Boolean(state.scenario),
      }, engine);
    }
    case 'move-trigger': {
      const at = quantizeTime(action.at);
      const target = state.triggers.find((trigger) => trigger.id === action.id);
      if (!target || target.at === at) return state;
      return recompute(state, {
        triggers: state.triggers.map((trigger) => (trigger.id === action.id ? { ...trigger, at } : trigger)),
        scenarioDirty: Boolean(state.scenario),
      }, engine);
    }
    case 'set-trigger-duration': {
      const target = state.triggers.find((trigger) => trigger.id === action.id);
      if (!target) return state;
      const ms = action.ms === null ? null : quantizeDuration(action.ms);
      if (target.durationMs === ms) return state;
      return recompute(state, {
        triggers: state.triggers.map((trigger) => (trigger.id === action.id ? { ...trigger, durationMs: ms } : trigger)),
        scenarioDirty: Boolean(state.scenario),
      }, engine);
    }
    case 'remove-trigger': {
      if (!state.triggers.some((trigger) => trigger.id === action.id) || state.triggers.length <= 1) return state;
      return recompute(state, {
        triggers: state.triggers.filter((trigger) => trigger.id !== action.id),
        scenarioDirty: Boolean(state.scenario),
      }, engine);
    }
    case 'apply-burst': {
      const seeded = withIds(BURST_PATTERNS[action.pattern].map((at) => ({ at, label: '', durationMs: null })), state.nextTriggerSeq);
      return recompute(state, {
        triggers: seeded.triggers,
        nextTriggerSeq: seeded.nextSeq,
        scenarioDirty: Boolean(state.scenario),
      }, engine);
    }
    case 'select-prediction':
      if (state.stage !== 'ready' || state.prediction.submitted) return state;
      return { ...state, prediction: { ...state.prediction, choiceKey: action.key } };
    case 'reveal': {
      if (state.stage !== 'ready') return state;
      if (state.view === 'compare') {
        return { ...state, stage: 'revealed', revealCount: state.revealCount + 1, compareReveals: state.compareReveals + 1, cursorMs: AXIS_MS };
      }
      const choices = buildPredictionChoices(state.runs);
      const needed = predictionNeeded(choices);
      if (needed && !state.prediction.choiceKey) return state;
      const correct = needed
        ? (choices.find((choice) => choice.key === state.prediction.choiceKey)?.operators.includes(state.operator) ?? false)
        : null;
      const scenarioId = state.scenario && !state.scenarioDirty ? state.scenario.id : null;
      return {
        ...state,
        stage: 'revealed',
        cursorMs: AXIS_MS,
        prediction: { choiceKey: state.prediction.choiceKey, submitted: needed, correct },
        revealCount: state.revealCount + 1,
        predictionsSubmitted: state.predictionsSubmitted + (needed ? 1 : 0),
        correctPredictions: state.correctPredictions + (correct ? 1 : 0),
        revealedScenarioIds: scenarioId && !state.revealedScenarioIds.includes(scenarioId)
          ? [...state.revealedScenarioIds, scenarioId]
          : state.revealedScenarioIds,
      };
    }
    case 'apply-fix': {
      const recommended = RECOMMENDED_OPERATOR[state.intent];
      const switched = state.operator === recommended ? state : recompute(state, { operator: recommended }, engine);
      return {
        ...switched,
        stage: 'revealed',
        cursorMs: AXIS_MS,
        prediction: EMPTY_PREDICTION,
        revealCount: switched.revealCount + 1,
        fixesApplied: switched.fixesApplied + 1,
      };
    }
    case 'set-cursor': {
      const ms = Math.min(AXIS_MS, Math.max(0, Math.round(action.ms / TIME_STEP_MS) * TIME_STEP_MS));
      return state.cursorMs === ms ? state : { ...state, cursorMs: ms };
    }
    case 'step-cursor': {
      const times = state.view === 'compare'
        ? [...new Set(OVERLAP_OPERATORS.flatMap((operator) => state.runs[operator].eventTimes))].sort((a, b) => a - b)
        : state.runs[state.operator].eventTimes;
      const next = action.direction > 0
        ? times.find((time) => time > state.cursorMs)
        : [...times].reverse().find((time) => time < state.cursorMs);
      return next === undefined ? state : { ...state, cursorMs: next };
    }
    case 'reset': {
      const progress = {
        revealCount: state.revealCount,
        predictionsSubmitted: state.predictionsSubmitted,
        correctPredictions: state.correctPredictions,
        revealedScenarioIds: state.revealedScenarioIds,
        compareReveals: state.compareReveals,
        fixesApplied: state.fixesApplied,
        nextTriggerSeq: state.nextTriggerSeq,
      };
      return state.scenario
        ? applyPreset({ ...createOverlapState(engine), ...progress }, state.scenario, engine)
        : recompute({ ...createOverlapState(engine), ...progress }, {}, engine);
    }
  }
}

// ---------------------------------------------------------------------------
// Qualification
// ---------------------------------------------------------------------------

export const QUALIFYING_SCENARIO_COUNT = 3;
export const QUALIFYING_COMPARE_REVEALS = 2;
export type QualificationMethod = 'prediction' | 'scenarios' | 'compare';

/** One correct prediction, three distinct presets revealed, or two compare reveals. */
export function overlapQualification(state: OverlapState): QualificationMethod | null {
  if (state.correctPredictions >= 1) return 'prediction';
  if (state.revealedScenarioIds.length >= QUALIFYING_SCENARIO_COUNT) return 'scenarios';
  if (state.compareReveals >= QUALIFYING_COMPARE_REVEALS) return 'compare';
  return null;
}
