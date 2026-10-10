import {
  BURST_LABELS,
  FINAL_TAKEAWAY,
  HAZARD_TITLES,
  INTENT_LABELS,
  OPERATOR_TAGLINES,
  OUTCOME_LABELS,
  OVERLAP_RELATED_LINKS,
  OVERLAP_SCENARIOS,
  SEED_STREAM_INTRO,
  SEED_STREAM_SENTENCES,
  choiceLabel,
  hazardSentence,
  laneSummary,
  requestSentence,
  scenarioFragmentId,
  scenarioIdFromFragment,
  streamSentence,
  uiSummary,
  verdictHeading,
  verdictSentence,
} from './rxjs-overlap-playground.content';
import {
  AXIS_MS,
  OVERLAP_INTENTS,
  OVERLAP_OPERATORS,
  RECOMMENDED_OPERATOR,
  buildPredictionChoices,
  createOverlapState,
  evaluateVerdict,
  reduceOverlap,
} from './rxjs-overlap-playground.model';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

describe('rxjs overlap playground content', () => {
  it('runs every preset to its documented UI summary and hazards, and every fix removes the danger', () => {
    for (const scenario of OVERLAP_SCENARIOS) {
      expect(scenario.preset.id).toBe(scenario.id);
      const recommended = RECOMMENDED_OPERATOR[scenario.preset.intent];
      expect(scenario.preset.operator).withContext(scenario.id).not.toBe(recommended);

      const loaded = reduceOverlap(createOverlapState(), { type: 'select-scenario', preset: scenario.preset });
      const run = loaded.runs[scenario.preset.operator];
      const verdict = evaluateVerdict(run, scenario.preset.intent);
      expect(uiSummary(run.deliveries)).withContext(scenario.id).toBe(scenario.expectedUiSummary);
      expect([...verdict.hazards.map((hazard) => hazard.code)].sort()).withContext(scenario.id).toEqual([...scenario.expectedHazards].sort());
      expect(verdict.fits).withContext(scenario.id).toBeFalse();

      const fixed = reduceOverlap(loaded, { type: 'apply-fix' });
      const fixedRun = fixed.runs[recommended];
      const fixedVerdict = evaluateVerdict(fixedRun, scenario.preset.intent);
      expect(fixed.operator).toBe(recommended);
      expect(uiSummary(fixedRun.deliveries)).withContext(`${scenario.id} fixed`).toBe(scenario.expectedFixUiSummary);
      expect(fixedVerdict.fits).withContext(`${scenario.id} fixed`).toBeTrue();
      expect(fixedVerdict.hazards.some((hazard) => hazard.severity === 'danger')).toBeFalse();
      expect(buildPredictionChoices(loaded.runs).length).withContext(scenario.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('lists seven scenarios with stable ids, short chip labels, and fragment round trips', () => {
    expect(OVERLAP_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'typeahead-search', 'save-double-click', 'parallel-loads', 'wizard-saves', 'stale-overwrite', 'dropped-click', 'cancel-not-server',
    ]);
    for (const scenario of OVERLAP_SCENARIOS) {
      expect(scenario.chipLabel.length).withContext(scenario.id).toBeLessThanOrEqual(32);
      expect(scenario.preset.triggers.length).toBeGreaterThanOrEqual(2);
      expect(scenario.preset.triggers.every((trigger) => trigger.label.length <= 6)).withContext(scenario.id).toBeTrue();
      expect(scenarioFragmentId(scenario.id)).toBe(`overlap-scenario-${scenario.id}`);
      expect(scenarioIdFromFragment(scenarioFragmentId(scenario.id))).toBe(scenario.id);
    }
    expect(scenarioIdFromFragment('overlap-scenario-unknown')).toBeNull();
    expect(scenarioIdFromFragment('cd-scenario-push-mutation')).toBeNull();
    expect(scenarioIdFromFragment(null)).toBeNull();
  });

  it('generates the placeholder sentences from the seed stream model', () => {
    expect(SEED_STREAM_INTRO).toBe('Trigger A at 0 ms, trigger B at 100 ms, each request 300 ms.');
    expect(SEED_STREAM_SENTENCES).toEqual([
      'switchMap cancels A at 100 ms and the UI gets B at 400 ms.',
      'mergeMap keeps every request and the UI gets A at 300 ms, then B at 400 ms.',
      'concatMap starts B only after the previous request completes, so the UI gets A at 300 ms, then B at 600 ms.',
      'exhaustMap ignores B and the UI gets A at 300 ms.',
    ]);
  });

  it('has copy for every operator, intent, outcome, burst, and hazard', () => {
    expect(Object.keys(OPERATOR_TAGLINES).sort()).toEqual([...OVERLAP_OPERATORS].sort());
    expect(Object.keys(INTENT_LABELS).sort()).toEqual([...OVERLAP_INTENTS].sort());
    expect(Object.keys(OUTCOME_LABELS).sort()).toEqual(['cancelled', 'completed', 'dropped', 'queued', 'running']);
    expect(Object.keys(BURST_LABELS).sort()).toEqual(['double-click', 'fast-typing', 'spaced']);
    expect(Object.keys(HAZARD_TITLES).length).toBe(9);

    const state = reduceOverlap(createOverlapState(), { type: 'select-scenario', preset: OVERLAP_SCENARIOS[0].preset });
    const run = state.runs.mergeMap;
    const verdict = evaluateVerdict(run, 'latest-read');
    for (const hazard of verdict.hazards) {
      const sentence = hazardSentence(hazard, run);
      expect(sentence.length).withContext(hazard.code).toBeGreaterThan(40);
      expect(sentence).withContext(hazard.code).not.toContain('undefined');
    }
    expect(verdictHeading(verdict)).toContain('mergeMap breaks the promise');
    expect(verdictSentence(verdict, run)).toContain('switchMap is the operator that encodes it');
    expect(laneSummary(run)).toBe('3 delivered');
    expect(laneSummary(state.runs.switchMap)).toBe('1 delivered, 2 cancelled');
    expect(requestSentence(state.runs.switchMap.requests[0])).toBe('a: started 0 ms, cancelled 100 ms, server finishes 600 ms.');
    expect(requestSentence(state.runs.concatMap.requests[1])).toBe('ab: waited 500 ms, started 600 ms, delivered 900 ms.');
    expect(requestSentence(state.runs.exhaustMap.requests[2])).toBe('abc: triggered 200 ms, dropped because a request was still running.');
    expect(streamSentence(OVERLAP_SCENARIOS[0].preset.triggers, 300)).toBe('a at 0 ms (600 ms request), ab at 100 ms, abc at 200 ms; other requests take 300 ms.');
    expect(uiSummary([])).toBe(`Nothing within ${AXIS_MS} ms`);
    expect(choiceLabel(buildPredictionChoices(state.runs)[0])).toMatch(/ at \d+ ms/);
  });

  it('links to Angular trivia routes plus the takeLatest exercise and uses no em dashes', () => {
    for (const link of OVERLAP_RELATED_LINKS) {
      expect(['/angular', '/javascript']).toContain(link.route[0]);
      expect(link.route[2]).toMatch(/^[a-z0-9-]+$/);
    }
    expect(OVERLAP_RELATED_LINKS.find((link) => link.id === 'http-cancel-switchmap')?.fragment).toBe('cancellation-scenario-switch-map');
    const strings = collectStrings({ OVERLAP_SCENARIOS, OPERATOR_TAGLINES, INTENT_LABELS, OUTCOME_LABELS, BURST_LABELS, HAZARD_TITLES, FINAL_TAKEAWAY, OVERLAP_RELATED_LINKS, SEED_STREAM_SENTENCES });
    expect(strings.length).toBeGreaterThan(60);
    expect(strings.filter((text) => /[–—]/.test(text))).toEqual([]);
  });
});
