import {
  CD_DIAGNOSIS_HEADINGS,
  CD_FIX_COPY,
  CD_MODES,
  CD_NODES,
  CD_REASON_COPY,
  CD_RELATED_LINKS,
  CD_SCENARIOS,
  CD_TRIGGERS,
  FINAL_TAKEAWAY,
  diagnosisSentence,
  freshHeading,
  freshSentence,
  liveSummary,
  scenarioFragmentId,
  scenarioIdFromFragment,
  scheduleLabel,
  triggerSummary,
} from './angular-change-detection-visualizer.content';
import {
  CD_NODE_ORDER,
  CdDiagnosis,
  CdDiagnosisCode,
  applyScenario,
  createVisualizerState,
  reduceVisualizer,
} from './angular-change-detection-visualizer.model';

const DIAGNOSIS_CODES: readonly CdDiagnosisCode[] = [
  'mutation-same-reference',
  'manual-subscribe-no-mark',
  'onpush-no-trigger',
  'parent-onpush-skipped',
  'outside-detect-changes-subtree',
  'no-tick-scheduled-zoneless',
  'no-tick-outside-zone',
];

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

describe('angular change detection visualizer content', () => {
  it('runs every preset to its documented check count and diagnosis, and every fix ends fresh', () => {
    for (const scenario of CD_SCENARIOS) {
      const ran = reduceVisualizer(applyScenario(createVisualizerState(), scenario.preset), { type: 'run-scenario' });
      const run = ran.lastRun!;

      expect(run.checkedCount).withContext(`${scenario.id} checked`).toBe(scenario.expectedCheckedCount);
      expect(run.diagnosis?.code ?? null).withContext(`${scenario.id} diagnosis`).toBe(scenario.expectedDiagnosis);
      expect(scenario.preset.id).toBe(scenario.id);
      expect(scenario.preset.trigger.nodeId).toBe(scenario.preset.trigger.nodeId);

      if (scenario.expectedDiagnosis) {
        const fixed = reduceVisualizer(ran, { type: 'apply-fix' });
        expect(fixed.lastRun!.diagnosis).withContext(`${scenario.id} fixed`).toBeNull();
        expect(fixed.lastRun!.staleNodeIds).withContext(`${scenario.id} stale after fix`).toEqual([]);
        expect(fixed.lastRun!.checkedCount).withContext(`${scenario.id} fixed checked`).toBe(scenario.expectedFixedCheckedCount!);
      } else {
        expect(scenario.expectedFixedCheckedCount).toBeNull();
        expect(run.staleNodeIds).toEqual([]);
      }
    }
  });

  it('describes all seven nodes, ten triggers, two modes, and five scenarios with unique ids', () => {
    expect(CD_NODES.map((node) => node.id)).toEqual([...CD_NODE_ORDER]);
    expect(new Set(CD_TRIGGERS.map((trigger) => trigger.type)).size).toBe(10);
    expect(CD_MODES.map((mode) => mode.id)).toEqual(['zone', 'zoneless']);
    expect(new Set(CD_SCENARIOS.map((scenario) => scenario.id)).size).toBe(5);
    expect(CD_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'push-mutation', 'timer-in-service', 'manual-subscribe', 'signal-in-onpush', 'zoneless-timer',
    ]);
  });

  it('keeps chip and trigger labels short enough for a single row on mobile', () => {
    for (const scenario of CD_SCENARIOS) {
      expect(scenario.chipLabel.length).withContext(scenario.id).toBeLessThanOrEqual(32);
    }
    for (const trigger of CD_TRIGGERS) {
      expect(trigger.label.length).withContext(trigger.type).toBeLessThanOrEqual(28);
      expect(trigger.description.endsWith('.')).withContext(trigger.type).toBeTrue();
    }
  });

  it('has non-empty copy for every reason, diagnosis, fix, and verdict', () => {
    expect(Object.values(CD_REASON_COPY).every((text) => text.length > 12)).toBeTrue();
    expect(Object.keys(CD_DIAGNOSIS_HEADINGS).sort()).toEqual([...DIAGNOSIS_CODES].sort());
    expect(Object.keys(CD_FIX_COPY).sort()).toEqual(['async-pipe', 'immutable-update', 'mark-for-check', 'signal']);
    for (const fix of Object.values(CD_FIX_COPY)) {
      expect(fix.title.length).toBeGreaterThan(5);
      expect(fix.code).toContain('\n');
      expect(fix.explanation.length).toBeGreaterThan(40);
    }
    for (const code of DIAGNOSIS_CODES) {
      const diagnosis: CdDiagnosis = {
        code,
        nodeId: 'footer',
        parentId: 'app',
        subtreeRootId: code === 'outside-detect-changes-subtree' ? 'list' : null,
        fix: 'mark-for-check',
        fixTrigger: { type: 'markForCheck', nodeId: 'footer' },
      };
      const sentence = diagnosisSentence(diagnosis);
      expect(sentence).withContext(code).toContain('LiveCount');
      expect(sentence.length).withContext(code).toBeGreaterThan(60);
    }

    const zoneless = reduceVisualizer(applyScenario(createVisualizerState(), CD_SCENARIOS[4].preset), { type: 'run-scenario' });
    const signal = reduceVisualizer(applyScenario(createVisualizerState(), CD_SCENARIOS[3].preset), { type: 'run-scenario' });
    expect(scheduleLabel(zoneless.lastRun!)).toBe('No pass scheduled');
    expect(scheduleLabel(signal.lastRun!)).toBe('Pass from the root');
    expect(liveSummary(zoneless.lastRun!)).toContain('LiveCount is stale');
    expect(liveSummary(signal.lastRun!)).toContain('Every value is fresh');
    expect(freshHeading(signal.lastRun!)).toBe('Fresh: 1 of 7 views checked, every value matches');
    expect(freshSentence(signal.lastRun!)).toContain('2 ancestor views were traversed');
    expect(triggerSummary(signal.lastRun!)).toContain('Set a signal on UserCard 2 (Zone.js)');
  });

  it('maps fragments to scenarios and back', () => {
    for (const scenario of CD_SCENARIOS) {
      expect(scenarioFragmentId(scenario.id)).toBe(`cd-scenario-${scenario.id}`);
      expect(scenarioIdFromFragment(scenarioFragmentId(scenario.id))).toBe(scenario.id);
    }
    expect(scenarioIdFromFragment('cd-scenario-unknown')).toBeNull();
    expect(scenarioIdFromFragment('push-mutation')).toBeNull();
    expect(scenarioIdFromFragment(null)).toBeNull();
    expect(scenarioIdFromFragment(undefined)).toBeNull();
  });

  it('links only to Angular trivia routes and uses no em dashes anywhere', () => {
    for (const link of CD_RELATED_LINKS) {
      expect(link.route.slice(0, 2)).toEqual(['/angular', 'trivia']);
      expect(link.route[2]).toMatch(/^[a-z0-9-]+$/);
    }
    const strings = collectStrings({
      CD_NODES, CD_TRIGGERS, CD_MODES, CD_SCENARIOS, CD_REASON_COPY, CD_DIAGNOSIS_HEADINGS, CD_FIX_COPY, FINAL_TAKEAWAY, CD_RELATED_LINKS,
    });
    expect(strings.length).toBeGreaterThan(60);
    expect(strings.filter((text) => /[–—]/.test(text))).toEqual([]);
  });
});
