/**
 * Deterministic model of Angular change detection for the visualizer lab.
 *
 * The model applies Angular's documented trigger rules to a fixed seven-node
 * component tree. It never executes application code: every outcome comes
 * from the strategy of each view, the dirty/refresh flags a trigger sets, and
 * the scheduling mode (Zone.js or zoneless). `CdEngine` is the seam a later
 * iteration can use to swap in measurements from a real component tree.
 */

export type CdNodeId = 'app' | 'header' | 'list' | 'item-1' | 'item-2' | 'item-3' | 'footer';
export type CdStrategy = 'default' | 'onpush';
export type CdMode = 'zone' | 'zoneless';
export type CdSchedule = 'tick' | 'subtree' | 'none';
export type CdDirtySource = 'event' | 'markForCheck' | 'asyncPipe';

export type CdTriggerType =
  | 'click'
  | 'inputReferenceChange'
  | 'inputMutation'
  | 'timerInService'
  | 'httpAsyncPipe'
  | 'manualSubscribeAssign'
  | 'signalSet'
  | 'markForCheck'
  | 'detectChanges'
  | 'runOutsideAngular';

export interface CdTrigger {
  readonly type: CdTriggerType;
  readonly nodeId: CdNodeId;
}

export type CdNodeOutcome = 'idle' | 'checked' | 'updated' | 'skipped' | 'traversed' | 'not-scheduled';

export type CdOutcomeReason =
  | 'default-always-checked'
  | 'input-reference-changed'
  | 'marked-dirty-event'
  | 'marked-dirty-mark-for-check'
  | 'marked-dirty-async-pipe'
  | 'signal-refresh'
  | 'detect-changes-root'
  | 'onpush-no-trigger'
  | 'parent-subtree-skipped'
  | 'outside-detect-changes-subtree'
  | 'ancestor-of-signal-refresh'
  | 'no-tick-zoneless'
  | 'no-tick-outside-zone';

export type CdDiagnosisCode =
  | 'mutation-same-reference'
  | 'manual-subscribe-no-mark'
  | 'onpush-no-trigger'
  | 'parent-onpush-skipped'
  | 'outside-detect-changes-subtree'
  | 'no-tick-scheduled-zoneless'
  | 'no-tick-outside-zone';

export type CdFixId = 'immutable-update' | 'mark-for-check' | 'async-pipe' | 'signal';

export type CdScenarioId =
  | 'push-mutation'
  | 'timer-in-service'
  | 'manual-subscribe'
  | 'signal-in-onpush'
  | 'zoneless-timer';

export type CdScenarioStage = 'ready' | 'ran' | 'fixed' | 'custom';

export interface CdNodeState {
  readonly id: CdNodeId;
  readonly strategy: CdStrategy;
  /** Version of the object reference the parent currently binds to this input. */
  readonly inputVersion: number;
  /** Input reference version seen during the last check. */
  readonly renderedInputVersion: number;
  /** Version of the data the component actually holds. */
  readonly dataVersion: number;
  /** Data version currently painted in the DOM. */
  readonly renderedDataVersion: number;
  readonly dirty: boolean;
  readonly dirtySource: CdDirtySource | null;
  /** A signal read by this template changed (Angular's RefreshView flag). */
  readonly refreshRequested: boolean;
  readonly mutatedInPlace: boolean;
  readonly manualSubscribe: boolean;
  readonly outcome: CdNodeOutcome;
  readonly reason: CdOutcomeReason | null;
  readonly checkCount: number;
}

export interface CdTraceStep {
  readonly index: number;
  readonly nodeId: CdNodeId | null;
  readonly outcome: CdNodeOutcome;
  readonly reason: CdOutcomeReason;
  readonly domUpdated: boolean;
}

export interface CdDiagnosis {
  readonly code: CdDiagnosisCode;
  readonly nodeId: CdNodeId;
  readonly parentId: CdNodeId | null;
  readonly subtreeRootId: CdNodeId | null;
  readonly fix: CdFixId;
  readonly fixTrigger: CdTrigger;
}

export interface CdRunResult {
  readonly trigger: CdTrigger;
  readonly mode: CdMode;
  readonly schedule: CdSchedule;
  readonly steps: readonly CdTraceStep[];
  readonly checkedCount: number;
  readonly staleNodeIds: readonly CdNodeId[];
  readonly diagnosis: CdDiagnosis | null;
}

export interface CdRunOutput {
  readonly nodes: Readonly<Record<CdNodeId, CdNodeState>>;
  readonly result: CdRunResult;
}

export interface CdScenarioPreset {
  readonly id: CdScenarioId;
  readonly mode: CdMode;
  readonly strategies: Readonly<Partial<Record<CdNodeId, CdStrategy>>>;
  readonly trigger: CdTrigger;
}

export interface CdVisualizerState {
  readonly mode: CdMode;
  readonly nodes: Readonly<Record<CdNodeId, CdNodeState>>;
  readonly selectedNodeId: CdNodeId;
  readonly scenario: CdScenarioPreset | null;
  readonly stage: CdScenarioStage;
  readonly lastRun: CdRunResult | null;
  readonly runCount: number;
  readonly scenariosRun: readonly CdScenarioId[];
  readonly fixesApplied: number;
}

export type CdVisualizerAction =
  | { readonly type: 'select-scenario'; readonly preset: CdScenarioPreset }
  | { readonly type: 'run-scenario' }
  | { readonly type: 'apply-fix' }
  | { readonly type: 'run-trigger'; readonly trigger: CdTrigger }
  | { readonly type: 'set-strategy'; readonly nodeId: CdNodeId; readonly strategy: CdStrategy }
  | { readonly type: 'set-mode'; readonly mode: CdMode }
  | { readonly type: 'select-node'; readonly nodeId: CdNodeId }
  | { readonly type: 'reset' };

/** Seam for a later real-component iteration. */
export interface CdEngine {
  run(state: CdVisualizerState, trigger: CdTrigger): CdRunOutput;
}

/** A real demo reports how often each component actually rendered. */
export interface RenderCountProbe {
  renderCount(nodeId: CdNodeId): number;
}

/** Depth-first order Angular walks the tree in. */
export const CD_NODE_ORDER: readonly CdNodeId[] = ['app', 'header', 'list', 'item-1', 'item-2', 'item-3', 'footer'];

export const CD_PARENT: Readonly<Record<CdNodeId, CdNodeId | null>> = {
  app: null,
  header: 'app',
  list: 'app',
  'item-1': 'list',
  'item-2': 'list',
  'item-3': 'list',
  footer: 'app',
};

export const CD_DEPTH: Readonly<Record<CdNodeId, number>> = {
  app: 0,
  header: 1,
  list: 1,
  'item-1': 2,
  'item-2': 2,
  'item-3': 2,
  footer: 1,
};

export const CD_NODE_COUNT = CD_NODE_ORDER.length;
export const DEFAULT_SELECTED_NODE: CdNodeId = 'list';

const INPUT_TRIGGERS: ReadonlySet<CdTriggerType> = new Set(['inputReferenceChange', 'inputMutation']);

const FIX_FOR_DIAGNOSIS: Readonly<Record<CdDiagnosisCode, CdFixId>> = {
  'mutation-same-reference': 'immutable-update',
  'manual-subscribe-no-mark': 'async-pipe',
  'onpush-no-trigger': 'mark-for-check',
  'parent-onpush-skipped': 'mark-for-check',
  'outside-detect-changes-subtree': 'mark-for-check',
  'no-tick-scheduled-zoneless': 'signal',
  'no-tick-outside-zone': 'signal',
};

const FIX_TRIGGER_TYPE: Readonly<Record<CdFixId, CdTriggerType>> = {
  'immutable-update': 'inputReferenceChange',
  'mark-for-check': 'markForCheck',
  'async-pipe': 'httpAsyncPipe',
  signal: 'signalSet',
};

const DIRTY_REASON: Readonly<Record<CdDirtySource, CdOutcomeReason>> = {
  event: 'marked-dirty-event',
  markForCheck: 'marked-dirty-mark-for-check',
  asyncPipe: 'marked-dirty-async-pipe',
};

export function createNodeState(id: CdNodeId, strategy: CdStrategy = 'default'): CdNodeState {
  return {
    id,
    strategy,
    inputVersion: 1,
    renderedInputVersion: 1,
    dataVersion: 1,
    renderedDataVersion: 1,
    dirty: false,
    dirtySource: null,
    refreshRequested: false,
    mutatedInPlace: false,
    manualSubscribe: false,
    outcome: 'idle',
    reason: null,
    checkCount: 0,
  };
}

export function createNodes(
  strategies: Readonly<Partial<Record<CdNodeId, CdStrategy>>> = {},
): Readonly<Record<CdNodeId, CdNodeState>> {
  const nodes = {} as Record<CdNodeId, CdNodeState>;
  for (const id of CD_NODE_ORDER) nodes[id] = createNodeState(id, strategies[id] ?? 'default');
  return nodes;
}

export function createVisualizerState(mode: CdMode = 'zone'): CdVisualizerState {
  return {
    mode,
    nodes: createNodes(),
    selectedNodeId: DEFAULT_SELECTED_NODE,
    scenario: null,
    stage: 'custom',
    lastRun: null,
    runCount: 0,
    scenariosRun: [],
    fixesApplied: 0,
  };
}

export function applyScenario(state: CdVisualizerState, preset: CdScenarioPreset): CdVisualizerState {
  return {
    ...state,
    mode: preset.mode,
    nodes: createNodes(preset.strategies),
    selectedNodeId: preset.trigger.nodeId,
    scenario: preset,
    stage: 'ready',
    lastRun: null,
  };
}

export function isTriggerAllowed(type: CdTriggerType, nodeId: CdNodeId): boolean {
  if (INPUT_TRIGGERS.has(type)) return CD_PARENT[nodeId] !== null;
  return true;
}

export function isDescendant(nodeId: CdNodeId, ancestorId: CdNodeId): boolean {
  let current = CD_PARENT[nodeId];
  while (current) {
    if (current === ancestorId) return true;
    current = CD_PARENT[current];
  }
  return false;
}

export function isStale(node: CdNodeState): boolean {
  return node.renderedDataVersion !== node.dataVersion;
}

function markDirtyUpwards(
  nodes: Record<CdNodeId, CdNodeState>,
  nodeId: CdNodeId,
  source: CdDirtySource,
): void {
  let current: CdNodeId | null = nodeId;
  while (current) {
    nodes[current] = { ...nodes[current], dirty: true, dirtySource: source };
    current = CD_PARENT[current];
  }
}

function bumpData(nodes: Record<CdNodeId, CdNodeState>, nodeId: CdNodeId, patch: Partial<CdNodeState> = {}): void {
  nodes[nodeId] = { ...nodes[nodeId], dataVersion: nodes[nodeId].dataVersion + 1, ...patch };
}

interface TriggerEffect {
  readonly schedule: CdSchedule;
  readonly noneReason: CdOutcomeReason | null;
}

function applyTriggerEffects(
  nodes: Record<CdNodeId, CdNodeState>,
  trigger: CdTrigger,
  mode: CdMode,
): TriggerEffect {
  const { type, nodeId } = trigger;
  const parent = CD_PARENT[nodeId];
  if (INPUT_TRIGGERS.has(type) && !parent) {
    throw new Error(`Trigger ${type} needs a parent component; ${nodeId} is the root.`);
  }
  const asyncTick: TriggerEffect = mode === 'zone'
    ? { schedule: 'tick', noneReason: null }
    : { schedule: 'none', noneReason: 'no-tick-zoneless' };
  const tick: TriggerEffect = { schedule: 'tick', noneReason: null };

  switch (type) {
    case 'click':
      bumpData(nodes, nodeId);
      markDirtyUpwards(nodes, nodeId, 'event');
      return tick;
    case 'inputReferenceChange':
      bumpData(nodes, nodeId, { inputVersion: nodes[nodeId].inputVersion + 1, mutatedInPlace: false });
      markDirtyUpwards(nodes, parent!, 'event');
      return tick;
    case 'inputMutation':
      bumpData(nodes, nodeId, { mutatedInPlace: true });
      markDirtyUpwards(nodes, parent!, 'event');
      return tick;
    case 'timerInService':
      bumpData(nodes, nodeId);
      return asyncTick;
    case 'httpAsyncPipe':
      bumpData(nodes, nodeId, { manualSubscribe: false });
      markDirtyUpwards(nodes, nodeId, 'asyncPipe');
      return tick;
    case 'manualSubscribeAssign':
      bumpData(nodes, nodeId, { manualSubscribe: true });
      return asyncTick;
    case 'signalSet':
      bumpData(nodes, nodeId, { refreshRequested: true });
      return tick;
    case 'markForCheck':
      markDirtyUpwards(nodes, nodeId, 'markForCheck');
      return tick;
    case 'detectChanges':
      return { schedule: 'subtree', noneReason: null };
    case 'runOutsideAngular':
      bumpData(nodes, nodeId);
      return { schedule: 'none', noneReason: mode === 'zone' ? 'no-tick-outside-zone' : 'no-tick-zoneless' };
  }
}

function checkReason(node: CdNodeState, isSubtreeRoot: boolean): CdOutcomeReason | null {
  if (isSubtreeRoot) return 'detect-changes-root';
  if (node.strategy === 'default') return 'default-always-checked';
  if (node.inputVersion !== node.renderedInputVersion) return 'input-reference-changed';
  if (node.dirty) return DIRTY_REASON[node.dirtySource ?? 'markForCheck'];
  if (node.refreshRequested) return 'signal-refresh';
  return null;
}

function hasRefreshDescendant(nodes: Record<CdNodeId, CdNodeState>, nodeId: CdNodeId): boolean {
  return CD_NODE_ORDER.some((id) => id !== nodeId && isDescendant(id, nodeId) && nodes[id].refreshRequested);
}

function diagnose(
  nodes: Record<CdNodeId, CdNodeState>,
  schedule: CdSchedule,
  noneReason: CdOutcomeReason | null,
  subtreeRootId: CdNodeId | null,
  staleNodeIds: readonly CdNodeId[],
): CdDiagnosis | null {
  const nodeId = staleNodeIds[0];
  if (!nodeId) return null;
  const node = nodes[nodeId];
  let code: CdDiagnosisCode;
  if (schedule === 'none') {
    code = noneReason === 'no-tick-outside-zone' ? 'no-tick-outside-zone' : 'no-tick-scheduled-zoneless';
  } else if (node.reason === 'outside-detect-changes-subtree') {
    code = 'outside-detect-changes-subtree';
  } else if (node.reason === 'parent-subtree-skipped') {
    code = 'parent-onpush-skipped';
  } else if (node.mutatedInPlace) {
    code = 'mutation-same-reference';
  } else if (node.manualSubscribe) {
    code = 'manual-subscribe-no-mark';
  } else {
    code = 'onpush-no-trigger';
  }
  let fix = FIX_FOR_DIAGNOSIS[code];
  if (fix === 'immutable-update' && CD_PARENT[nodeId] === null) fix = 'mark-for-check';
  return {
    code,
    nodeId,
    parentId: CD_PARENT[nodeId],
    subtreeRootId,
    fix,
    fixTrigger: { type: FIX_TRIGGER_TYPE[fix], nodeId },
  };
}

export function runDetection(state: CdVisualizerState, trigger: CdTrigger): CdRunOutput {
  const nodes = { ...state.nodes } as Record<CdNodeId, CdNodeState>;
  const { schedule, noneReason } = applyTriggerEffects(nodes, trigger, state.mode);
  const steps: CdTraceStep[] = [];
  let checkedCount = 0;
  const subtreeRootId = schedule === 'subtree' ? trigger.nodeId : null;

  if (schedule === 'none') {
    const reason = noneReason ?? 'no-tick-zoneless';
    for (const id of CD_NODE_ORDER) nodes[id] = { ...nodes[id], outcome: 'not-scheduled', reason };
    steps.push({ index: 0, nodeId: null, outcome: 'not-scheduled', reason, domUpdated: false });
  } else {
    const skippedAncestors = new Set<CdNodeId>();
    for (const id of CD_NODE_ORDER) {
      const node = nodes[id];
      const parent = CD_PARENT[id];
      const inSubtree = subtreeRootId === null || id === subtreeRootId || isDescendant(id, subtreeRootId);
      let outcome: CdNodeOutcome;
      let reason: CdOutcomeReason;
      let domUpdated = false;

      if (!inSubtree) {
        outcome = 'skipped';
        reason = 'outside-detect-changes-subtree';
        nodes[id] = { ...node, outcome, reason };
      } else if (parent && skippedAncestors.has(parent)) {
        skippedAncestors.add(id);
        outcome = 'skipped';
        reason = 'parent-subtree-skipped';
        nodes[id] = { ...node, outcome, reason };
      } else {
        const checked = checkReason(node, id === subtreeRootId);
        if (checked) {
          domUpdated = isStale(node);
          outcome = domUpdated ? 'updated' : 'checked';
          reason = checked;
          checkedCount += 1;
          nodes[id] = {
            ...node,
            renderedDataVersion: node.dataVersion,
            renderedInputVersion: node.inputVersion,
            dirty: false,
            dirtySource: null,
            refreshRequested: false,
            mutatedInPlace: false,
            manualSubscribe: false,
            outcome,
            reason,
            checkCount: node.checkCount + 1,
          };
        } else if (hasRefreshDescendant(nodes, id)) {
          outcome = 'traversed';
          reason = 'ancestor-of-signal-refresh';
          nodes[id] = { ...node, outcome, reason };
        } else {
          skippedAncestors.add(id);
          outcome = 'skipped';
          reason = 'onpush-no-trigger';
          nodes[id] = { ...node, outcome, reason };
        }
      }
      steps.push({ index: steps.length, nodeId: id, outcome, reason, domUpdated });
    }
  }

  const staleNodeIds = CD_NODE_ORDER.filter((id) => isStale(nodes[id]));
  return {
    nodes,
    result: {
      trigger,
      mode: state.mode,
      schedule,
      steps,
      checkedCount,
      staleNodeIds,
      diagnosis: diagnose(nodes, schedule, noneReason, subtreeRootId, staleNodeIds),
    },
  };
}

export const SIMULATED_ENGINE: CdEngine = { run: runDetection };

function withRun(
  state: CdVisualizerState,
  trigger: CdTrigger,
  stage: CdScenarioStage,
  engine: CdEngine,
  patch: Partial<CdVisualizerState> = {},
): CdVisualizerState {
  if (!isTriggerAllowed(trigger.type, trigger.nodeId)) return state;
  const { nodes, result } = engine.run(state, trigger);
  return {
    ...state,
    nodes,
    selectedNodeId: trigger.nodeId,
    stage,
    lastRun: result,
    runCount: state.runCount + 1,
    ...patch,
  };
}

export function reduceVisualizer(
  state: CdVisualizerState,
  action: CdVisualizerAction,
  engine: CdEngine = SIMULATED_ENGINE,
): CdVisualizerState {
  switch (action.type) {
    case 'select-scenario':
      return applyScenario(state, action.preset);
    case 'run-scenario': {
      if (!state.scenario) return state;
      const id = state.scenario.id;
      const scenariosRun = state.scenariosRun.includes(id) ? state.scenariosRun : [...state.scenariosRun, id];
      return withRun(state, state.scenario.trigger, 'ran', engine, { scenariosRun });
    }
    case 'apply-fix': {
      const diagnosis = state.lastRun?.diagnosis;
      if (!diagnosis) return state;
      return withRun(state, diagnosis.fixTrigger, state.scenario ? 'fixed' : 'custom', engine, {
        fixesApplied: state.fixesApplied + 1,
      });
    }
    case 'run-trigger':
      return withRun(state, action.trigger, 'custom', engine);
    case 'set-strategy': {
      const node = state.nodes[action.nodeId];
      if (node.strategy === action.strategy) return state;
      return {
        ...state,
        nodes: { ...state.nodes, [action.nodeId]: { ...node, strategy: action.strategy } },
        stage: state.scenario ? 'custom' : state.stage,
      };
    }
    case 'set-mode':
      return state.mode === action.mode
        ? state
        : { ...state, mode: action.mode, stage: state.scenario ? 'custom' : state.stage };
    case 'select-node':
      return state.selectedNodeId === action.nodeId ? state : { ...state, selectedNodeId: action.nodeId };
    case 'reset': {
      const progress = {
        runCount: state.runCount,
        scenariosRun: state.scenariosRun,
        fixesApplied: state.fixesApplied,
      };
      return state.scenario
        ? applyScenario({ ...createVisualizerState(state.mode), ...progress }, state.scenario)
        : { ...createVisualizerState('zone'), ...progress };
    }
  }
}

export const QUALIFYING_SCENARIO_COUNT = 3;

/** Three distinct preset scenarios, or one diagnosis repaired with its fix. */
export function isVisualizerQualified(state: CdVisualizerState): boolean {
  return state.scenariosRun.length >= QUALIFYING_SCENARIO_COUNT || state.fixesApplied >= 1;
}

/** Check counts a real component tree should reproduce for a preset (one run of its trigger). */
export function expectedRenderCounts(preset: CdScenarioPreset, engine: CdEngine = SIMULATED_ENGINE): Readonly<Record<CdNodeId, number>> {
  const ran = reduceVisualizer(applyScenario(createVisualizerState(preset.mode), preset), { type: 'run-scenario' }, engine);
  const counts = {} as Record<CdNodeId, number>;
  for (const id of CD_NODE_ORDER) counts[id] = ran.nodes[id].checkCount;
  return counts;
}
