import { CD_SCENARIOS } from './angular-change-detection-visualizer.content';
import {
  CD_NODE_ORDER,
  CdNodeId,
  CdScenarioPreset,
  CdTrigger,
  CdVisualizerState,
  applyScenario,
  createVisualizerState,
  expectedRenderCounts,
  isTriggerAllowed,
  isVisualizerQualified,
  reduceVisualizer,
  runDetection,
} from './angular-change-detection-visualizer.model';

function preset(id: CdScenarioPreset['id']): CdScenarioPreset {
  const scenario = CD_SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown scenario ${id}`);
  return scenario.preset;
}

function withStrategies(
  strategies: CdScenarioPreset['strategies'],
  mode: CdVisualizerState['mode'] = 'zone',
): CdVisualizerState {
  return applyScenario(createVisualizerState(mode), { id: 'push-mutation', mode, strategies, trigger: { type: 'click', nodeId: 'app' } });
}

function outcomes(state: CdVisualizerState): Record<CdNodeId, string> {
  return Object.fromEntries(CD_NODE_ORDER.map((id) => [id, state.nodes[id].outcome])) as Record<CdNodeId, string>;
}

function fire(state: CdVisualizerState, trigger: CdTrigger): CdVisualizerState {
  return reduceVisualizer(state, { type: 'run-trigger', trigger });
}

describe('angular change detection visualizer model', () => {
  it('checks every Default view after a click and updates only the view whose data changed', () => {
    const state = fire(createVisualizerState(), { type: 'click', nodeId: 'footer' });
    const run = state.lastRun!;

    expect(run.schedule).toBe('tick');
    expect(run.checkedCount).toBe(7);
    expect(run.staleNodeIds).toEqual([]);
    expect(run.diagnosis).toBeNull();
    expect(outcomes(state)).toEqual({
      app: 'checked', header: 'checked', list: 'checked', 'item-1': 'checked', 'item-2': 'checked', 'item-3': 'checked', footer: 'updated',
    });
    expect(run.steps.map((step) => step.nodeId)).toEqual([...CD_NODE_ORDER]);
  });

  it('skips an OnPush list whose input was mutated in place, then repairs it with a new reference', () => {
    const ready = applyScenario(createVisualizerState(), preset('push-mutation'));
    const ran = reduceVisualizer(ready, { type: 'run-scenario' });
    const run = ran.lastRun!;

    expect(run.checkedCount).toBe(3);
    expect(run.staleNodeIds).toEqual(['list']);
    expect(outcomes(ran)).toEqual({
      app: 'checked', header: 'checked', list: 'skipped', 'item-1': 'skipped', 'item-2': 'skipped', 'item-3': 'skipped', footer: 'checked',
    });
    expect(ran.nodes['item-1'].reason).toBe('parent-subtree-skipped');
    expect(run.diagnosis).toEqual(jasmine.objectContaining({
      code: 'mutation-same-reference',
      nodeId: 'list',
      parentId: 'app',
      fix: 'immutable-update',
      fixTrigger: { type: 'inputReferenceChange', nodeId: 'list' },
    }));
    expect(ran.stage).toBe('ran');
    expect(ran.scenariosRun).toEqual(['push-mutation']);

    const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
    expect(fixed.lastRun!.checkedCount).toBe(4);
    expect(fixed.lastRun!.staleNodeIds).toEqual([]);
    expect(fixed.lastRun!.diagnosis).toBeNull();
    expect(fixed.nodes.list.outcome).toBe('updated');
    expect(fixed.nodes.list.reason).toBe('input-reference-changed');
    expect(fixed.nodes['item-2'].reason).toBe('onpush-no-trigger');
    expect(fixed.stage).toBe('fixed');
    expect(fixed.fixesApplied).toBe(1);
  });

  it('leaves an OnPush view stale after a service timer and repairs it with markForCheck()', () => {
    const ran = reduceVisualizer(applyScenario(createVisualizerState(), preset('timer-in-service')), { type: 'run-scenario' });

    expect(ran.lastRun!.checkedCount).toBe(6);
    expect(ran.lastRun!.staleNodeIds).toEqual(['footer']);
    expect(ran.lastRun!.diagnosis).toEqual(jasmine.objectContaining({ code: 'onpush-no-trigger', fix: 'mark-for-check' }));

    const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
    expect(fixed.lastRun!.checkedCount).toBe(7);
    expect(fixed.nodes.footer.outcome).toBe('updated');
    expect(fixed.nodes.footer.reason).toBe('marked-dirty-mark-for-check');
    expect(fixed.nodes.footer.dirty).toBeFalse();
  });

  it('treats a manual subscribe() assignment as invisible to OnPush and repairs it with the async pipe', () => {
    const ran = reduceVisualizer(applyScenario(createVisualizerState(), preset('manual-subscribe')), { type: 'run-scenario' });

    expect(ran.lastRun!.checkedCount).toBe(6);
    expect(ran.lastRun!.diagnosis).toEqual(jasmine.objectContaining({
      code: 'manual-subscribe-no-mark',
      nodeId: 'header',
      fixTrigger: { type: 'httpAsyncPipe', nodeId: 'header' },
    }));

    const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
    expect(fixed.nodes.header.reason).toBe('marked-dirty-async-pipe');
    expect(fixed.nodes.header.manualSubscribe).toBeFalse();
    expect(fixed.lastRun!.staleNodeIds).toEqual([]);
  });

  it('refreshes exactly one OnPush view for a signal and only traverses its ancestors', () => {
    const ran = reduceVisualizer(applyScenario(createVisualizerState(), preset('signal-in-onpush')), { type: 'run-scenario' });

    expect(ran.lastRun!.checkedCount).toBe(1);
    expect(ran.lastRun!.diagnosis).toBeNull();
    expect(outcomes(ran)).toEqual({
      app: 'traversed', header: 'skipped', list: 'traversed', 'item-1': 'skipped', 'item-2': 'updated', 'item-3': 'skipped', footer: 'skipped',
    });
    expect(ran.nodes.app.reason).toBe('ancestor-of-signal-refresh');
    expect(ran.nodes['item-2'].reason).toBe('signal-refresh');
    expect(ran.nodes['item-2'].refreshRequested).toBeFalse();
    expect(ran.nodes.app.checkCount).toBe(0);
  });

  it('schedules nothing for a zoneless timer and repairs it with a signal', () => {
    const ran = reduceVisualizer(applyScenario(createVisualizerState(), preset('zoneless-timer')), { type: 'run-scenario' });
    const run = ran.lastRun!;

    expect(run.schedule).toBe('none');
    expect(run.checkedCount).toBe(0);
    expect(run.steps).toEqual([{ index: 0, nodeId: null, outcome: 'not-scheduled', reason: 'no-tick-zoneless', domUpdated: false }]);
    expect(Object.values(outcomes(ran)).every((outcome) => outcome === 'not-scheduled')).toBeTrue();
    expect(run.diagnosis).toEqual(jasmine.objectContaining({ code: 'no-tick-scheduled-zoneless', fix: 'signal', fixTrigger: { type: 'signalSet', nodeId: 'footer' } }));

    const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
    expect(fixed.lastRun!.schedule).toBe('tick');
    expect(fixed.lastRun!.checkedCount).toBe(7);
    expect(fixed.nodes.footer.outcome).toBe('updated');
  });

  it('runs the same timer in Zone.js mode and checks every Default view', () => {
    const zoneless = applyScenario(createVisualizerState(), preset('zoneless-timer'));
    const zoned = reduceVisualizer(zoneless, { type: 'set-mode', mode: 'zone' });
    const ran = reduceVisualizer(zoned, { type: 'run-scenario' });

    expect(zoned.stage).toBe('custom');
    expect(ran.lastRun!.checkedCount).toBe(7);
    expect(ran.lastRun!.diagnosis).toBeNull();
  });

  it('keeps zoneless passes for events, async pipes, signals, and markForCheck()', () => {
    const base = createVisualizerState('zoneless');
    for (const trigger of [
      { type: 'click', nodeId: 'footer' },
      { type: 'httpAsyncPipe', nodeId: 'footer' },
      { type: 'signalSet', nodeId: 'footer' },
      { type: 'markForCheck', nodeId: 'footer' },
      { type: 'inputReferenceChange', nodeId: 'footer' },
    ] as const) {
      expect(fire(base, trigger).lastRun!.schedule).withContext(trigger.type).toBe('tick');
    }
    for (const trigger of [
      { type: 'timerInService', nodeId: 'footer' },
      { type: 'manualSubscribeAssign', nodeId: 'footer' },
      { type: 'runOutsideAngular', nodeId: 'footer' },
    ] as const) {
      expect(fire(base, trigger).lastRun!.schedule).withContext(trigger.type).toBe('none');
    }
  });

  it('ignores a timer that ran outside NgZone in Zone.js mode', () => {
    const ran = fire(createVisualizerState(), { type: 'runOutsideAngular', nodeId: 'header' });

    expect(ran.lastRun!.schedule).toBe('none');
    expect(ran.lastRun!.steps[0].reason).toBe('no-tick-outside-zone');
    expect(ran.lastRun!.diagnosis).toEqual(jasmine.objectContaining({ code: 'no-tick-outside-zone', nodeId: 'header', fix: 'signal' }));
  });

  it('limits detectChanges() to the caller subtree and diagnoses stale views outside it', () => {
    const stale = fire(createVisualizerState('zoneless'), { type: 'timerInService', nodeId: 'footer' });
    const ran = fire(stale, { type: 'detectChanges', nodeId: 'list' });

    expect(ran.lastRun!.schedule).toBe('subtree');
    expect(ran.lastRun!.checkedCount).toBe(4);
    expect(outcomes(ran)).toEqual({
      app: 'skipped', header: 'skipped', list: 'checked', 'item-1': 'checked', 'item-2': 'checked', 'item-3': 'checked', footer: 'skipped',
    });
    expect(ran.nodes.list.reason).toBe('detect-changes-root');
    expect(ran.nodes.footer.reason).toBe('outside-detect-changes-subtree');
    expect(ran.lastRun!.diagnosis).toEqual(jasmine.objectContaining({
      code: 'outside-detect-changes-subtree',
      nodeId: 'footer',
      subtreeRootId: 'list',
      fixTrigger: { type: 'markForCheck', nodeId: 'footer' },
    }));
  });

  it('skips a Default child when its OnPush parent is skipped and names the parent in the diagnosis', () => {
    const state = withStrategies({ list: 'onpush' });
    const ran = fire(state, { type: 'timerInService', nodeId: 'item-2' });

    expect(ran.lastRun!.checkedCount).toBe(3);
    expect(ran.nodes['item-2'].outcome).toBe('skipped');
    expect(ran.nodes['item-2'].reason).toBe('parent-subtree-skipped');
    expect(ran.lastRun!.diagnosis).toEqual(jasmine.objectContaining({ code: 'parent-onpush-skipped', nodeId: 'item-2', parentId: 'list', fix: 'mark-for-check' }));

    const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
    expect(fixed.nodes.list.outcome).toBe('checked');
    expect(fixed.nodes.list.reason).toBe('marked-dirty-mark-for-check');
    expect(fixed.nodes['item-2'].outcome).toBe('updated');
    expect(fixed.lastRun!.diagnosis).toBeNull();
  });

  it('checks an OnPush parent when a child event bubbles dirtiness upwards', () => {
    const state = withStrategies({ app: 'onpush', list: 'onpush', 'item-3': 'onpush', header: 'onpush', footer: 'onpush' });
    const ran = fire(state, { type: 'click', nodeId: 'item-3' });

    expect(outcomes(ran)).toEqual({
      app: 'checked', header: 'skipped', list: 'checked', 'item-1': 'checked', 'item-2': 'checked', 'item-3': 'updated', footer: 'skipped',
    });
    expect(ran.nodes.app.reason).toBe('marked-dirty-event');
  });

  it('rejects input triggers on the root component and keeps the state identity', () => {
    const state = createVisualizerState();

    expect(isTriggerAllowed('inputMutation', 'app')).toBeFalse();
    expect(isTriggerAllowed('inputReferenceChange', 'app')).toBeFalse();
    expect(isTriggerAllowed('inputMutation', 'item-1')).toBeTrue();
    expect(isTriggerAllowed('click', 'app')).toBeTrue();
    expect(fire(state, { type: 'inputMutation', nodeId: 'app' })).toBe(state);
    expect(reduceVisualizer(state, { type: 'apply-fix' })).toBe(state);
    expect(reduceVisualizer(state, { type: 'run-scenario' })).toBe(state);
    expect(reduceVisualizer(state, { type: 'select-node', nodeId: state.selectedNodeId })).toBe(state);
    expect(() => runDetection(state, { type: 'inputMutation', nodeId: 'app' })).toThrowError(/root/);
  });

  it('resets a scenario to its preset while keeping progress counters', () => {
    const ran = reduceVisualizer(applyScenario(createVisualizerState(), preset('timer-in-service')), { type: 'run-scenario' });
    const toggled = reduceVisualizer(ran, { type: 'set-strategy', nodeId: 'header', strategy: 'onpush' });
    const reset = reduceVisualizer(toggled, { type: 'reset' });

    expect(toggled.stage).toBe('custom');
    expect(reset.stage).toBe('ready');
    expect(reset.lastRun).toBeNull();
    expect(reset.nodes.header.strategy).toBe('default');
    expect(reset.nodes.footer.strategy).toBe('onpush');
    expect(reset.nodes.footer.dataVersion).toBe(1);
    expect(reset.scenario?.id).toBe('timer-in-service');
    expect(reset.scenariosRun).toEqual(['timer-in-service']);
    expect(reset.runCount).toBe(1);

    const sandbox = reduceVisualizer(fire(createVisualizerState('zoneless'), { type: 'click', nodeId: 'app' }), { type: 'reset' });
    expect(sandbox.mode).toBe('zone');
    expect(sandbox.scenario).toBeNull();
    expect(sandbox.runCount).toBe(1);
  });

  it('qualifies after three distinct scenarios or one applied fix', () => {
    let state = createVisualizerState();
    expect(isVisualizerQualified(state)).toBeFalse();

    for (const id of ['signal-in-onpush', 'signal-in-onpush', 'push-mutation'] as const) {
      state = reduceVisualizer(applyScenario(state, preset(id)), { type: 'run-scenario' });
    }
    expect(state.scenariosRun).toEqual(['signal-in-onpush', 'push-mutation']);
    expect(isVisualizerQualified(state)).toBeFalse();

    state = reduceVisualizer(applyScenario(state, preset('zoneless-timer')), { type: 'run-scenario' });
    expect(isVisualizerQualified(state)).toBeTrue();

    const repaired = reduceVisualizer(
      reduceVisualizer(applyScenario(createVisualizerState(), preset('timer-in-service')), { type: 'run-scenario' }),
      { type: 'apply-fix' },
    );
    expect(isVisualizerQualified(repaired)).toBeTrue();
  });

  it('never mutates the previous state', () => {
    const before = applyScenario(createVisualizerState(), preset('push-mutation'));
    const snapshot = JSON.stringify(before);

    reduceVisualizer(before, { type: 'run-scenario' });
    reduceVisualizer(before, { type: 'set-strategy', nodeId: 'app', strategy: 'onpush' });
    reduceVisualizer(before, { type: 'set-mode', mode: 'zoneless' });
    runDetection(before, { type: 'detectChanges', nodeId: 'list' });

    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('reports expected render counts for every preset', () => {
    expect(expectedRenderCounts(preset('signal-in-onpush'))).toEqual({
      app: 0, header: 0, list: 0, 'item-1': 0, 'item-2': 1, 'item-3': 0, footer: 0,
    });
    expect(expectedRenderCounts(preset('zoneless-timer'))).toEqual({
      app: 0, header: 0, list: 0, 'item-1': 0, 'item-2': 0, 'item-3': 0, footer: 0,
    });
    for (const scenario of CD_SCENARIOS) {
      const total = Object.values(expectedRenderCounts(scenario.preset)).reduce((sum, count) => sum + count, 0);
      expect(total).withContext(scenario.id).toBe(scenario.expectedCheckedCount);
    }
  });
});
