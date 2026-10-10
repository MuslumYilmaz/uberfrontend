import {
  AXIS_MS,
  BurstPattern,
  Hazard,
  HazardCode,
  InnerRequest,
  OverlapIntent,
  OverlapOperator,
  OverlapRunResult,
  OverlapScenarioId,
  OverlapScenarioPreset,
  OverlapTrigger,
  OverlapVerdict,
  PredictionChoice,
  RequestOutcome,
  SEED_TRIGGERS,
  UiDelivery,
  DEFAULT_DURATION_MS,
  OVERLAP_OPERATORS,
  runAll,
} from './rxjs-overlap-playground.model';

export interface OverlapScenario {
  readonly id: OverlapScenarioId;
  readonly chipLabel: string;
  readonly title: string;
  readonly story: string;
  readonly preset: OverlapScenarioPreset;
  readonly expectedUiSummary: string;
  readonly expectedHazards: readonly HazardCode[];
  readonly expectedFixUiSummary: string;
}

export interface OverlapRelatedLink {
  readonly id: string;
  readonly label: string;
  readonly route: string[];
  readonly fragment?: string;
}

export const OPERATOR_TAGLINES: Readonly<Record<OverlapOperator, string>> = {
  switchMap: 'latest wins, earlier requests are cancelled',
  mergeMap: 'everything runs, responses land in any order',
  concatMap: 'everything runs, one at a time, in order',
  exhaustMap: 'first wins, new triggers are ignored while busy',
};

export const INTENT_LABELS: Readonly<Record<OverlapIntent, string>> = {
  'latest-read': 'Show the latest result only',
  'submit-once': 'Submit exactly once',
  'ordered-write': 'Run every write, in order',
  'independent-parallel': 'Load independent data in parallel',
};

export const OUTCOME_LABELS: Readonly<Record<RequestOutcome, string>> = {
  completed: 'completed',
  cancelled: 'cancelled',
  dropped: 'dropped',
  running: 'still running at 1200 ms',
  queued: 'still queued at 1200 ms',
};

export const BURST_LABELS: Readonly<Record<BurstPattern, string>> = {
  'double-click': 'Double click (0, 100 ms)',
  'fast-typing': 'Fast typing (0, 80, 160, 240 ms)',
  spaced: 'Spaced clicks (0, 400, 800 ms)',
};

export const HAZARD_TITLES: Readonly<Record<HazardCode, string>> = {
  'stale-overwrite': 'Stale response overwrote a newer result',
  'stale-final-state': 'The UI ends on an older request',
  'duplicate-request': 'More than one request was started',
  'dropped-intent': 'A trigger was dropped',
  'cancelled-write': 'A write was cancelled on the client',
  'out-of-order': 'Responses arrived out of order',
  'queue-latency': 'Requests waited in a queue',
  'intermediate-render': 'The UI rendered a result that was already obsolete',
  'server-continues': 'Cancelling the client does not stop the server',
};

export const OVERLAP_SCENARIO_FRAGMENT_PREFIX = 'overlap-scenario-';

export const OVERLAP_SCENARIOS: readonly OverlapScenario[] = [
  {
    id: 'typeahead-search',
    chipLabel: 'Typeahead search',
    title: 'The search box shows results for the wrong query',
    story:
      'A FormControl fires a search request on every keystroke. The user types a, ab, abc within 200 ms, and the first request happens to be slow. The results panel must show results for abc only.',
    preset: {
      id: 'typeahead-search',
      intent: 'latest-read',
      operator: 'mergeMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'a', durationMs: 600 },
        { at: 100, label: 'ab', durationMs: null },
        { at: 200, label: 'abc', durationMs: null },
      ],
    },
    expectedUiSummary: 'ab at 400 ms, then abc at 500 ms, then a at 600 ms',
    expectedHazards: ['stale-overwrite', 'stale-final-state', 'intermediate-render'],
    expectedFixUiSummary: 'abc at 500 ms',
  },
  {
    id: 'save-double-click',
    chipLabel: 'Save button double click',
    title: 'One save button, two requests',
    story:
      'A submit Subject maps every click to a POST. The user double clicks within 120 ms. The order must be created exactly once.',
    preset: {
      id: 'save-double-click',
      intent: 'submit-once',
      operator: 'mergeMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'A', durationMs: null },
        { at: 120, label: 'B', durationMs: null },
      ],
    },
    expectedUiSummary: 'A at 300 ms, then B at 420 ms',
    expectedHazards: ['duplicate-request'],
    expectedFixUiSummary: 'A at 300 ms',
  },
  {
    id: 'parallel-loads',
    chipLabel: 'Dashboard parallel loads',
    title: 'Three independent widgets load one after another',
    story:
      'A dashboard requests users, orders, and stats as soon as it opens. Nothing depends on anything else, yet the page stays blank for almost a second.',
    preset: {
      id: 'parallel-loads',
      intent: 'independent-parallel',
      operator: 'concatMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'users', durationMs: 300 },
        { at: 30, label: 'orders', durationMs: 450 },
        { at: 60, label: 'stats', durationMs: 200 },
      ],
    },
    expectedUiSummary: 'users at 300 ms, then orders at 750 ms, then stats at 950 ms',
    expectedHazards: ['queue-latency'],
    expectedFixUiSummary: 'stats at 260 ms, then users at 300 ms, then orders at 480 ms',
  },
  {
    id: 'wizard-saves',
    chipLabel: 'Wizard step saves',
    title: 'Three wizard steps, only the last one is saved',
    story:
      'Each Next click saves a draft of the current step. The user moves through three steps quickly. Every step must reach the server, in order.',
    preset: {
      id: 'wizard-saves',
      intent: 'ordered-write',
      operator: 'switchMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'step 1', durationMs: null },
        { at: 150, label: 'step 2', durationMs: null },
        { at: 300, label: 'step 3', durationMs: null },
      ],
    },
    expectedUiSummary: 'step 3 at 600 ms',
    expectedHazards: ['cancelled-write', 'server-continues'],
    expectedFixUiSummary: 'step 1 at 300 ms, then step 2 at 600 ms, then step 3 at 900 ms',
  },
  {
    id: 'stale-overwrite',
    chipLabel: 'Bug: stale response wins',
    title: 'The slow old response arrives last and wins',
    story:
      'Two filter changes 100 ms apart. The first request takes 500 ms, the second only 200 ms. The user sees the right list for a moment, then the old list replaces it.',
    preset: {
      id: 'stale-overwrite',
      intent: 'latest-read',
      operator: 'mergeMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'A', durationMs: 500 },
        { at: 100, label: 'B', durationMs: 200 },
      ],
    },
    expectedUiSummary: 'B at 300 ms, then A at 500 ms',
    expectedHazards: ['stale-overwrite', 'stale-final-state'],
    expectedFixUiSummary: 'B at 300 ms',
  },
  {
    id: 'dropped-click',
    chipLabel: 'Bug: second filter ignored',
    title: 'The second filter change never loads',
    story:
      'A filter bar maps changes to a request. The user changes the filter twice within 100 ms. The second change must win, but the list keeps the first result.',
    preset: {
      id: 'dropped-click',
      intent: 'latest-read',
      operator: 'exhaustMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'A', durationMs: null },
        { at: 100, label: 'B', durationMs: null },
      ],
    },
    expectedUiSummary: 'A at 300 ms',
    expectedHazards: ['dropped-intent', 'stale-final-state'],
    expectedFixUiSummary: 'B at 400 ms',
  },
  {
    id: 'cancel-not-server',
    chipLabel: 'Bug: switchMap, paid twice',
    title: 'switchMap cancelled the client, the server still charged',
    story:
      'A Pay button maps clicks to a payment POST with switchMap. A nervous double click cancels the first subscription on the client, but the server already received the first request.',
    preset: {
      id: 'cancel-not-server',
      intent: 'submit-once',
      operator: 'switchMap',
      defaultDurationMs: 300,
      triggers: [
        { at: 0, label: 'pay 1', durationMs: null },
        { at: 100, label: 'pay 2', durationMs: null },
      ],
    },
    expectedUiSummary: 'pay 2 at 400 ms',
    expectedHazards: ['duplicate-request', 'server-continues'],
    expectedFixUiSummary: 'pay 1 at 300 ms',
  },
];

export function scenarioFragmentId(id: OverlapScenarioId): string {
  return `${OVERLAP_SCENARIO_FRAGMENT_PREFIX}${id}`;
}

export function scenarioIdFromFragment(fragment: string | null | undefined): OverlapScenarioId | null {
  const value = String(fragment || '').trim();
  if (!value.startsWith(OVERLAP_SCENARIO_FRAGMENT_PREFIX)) return null;
  const id = value.slice(OVERLAP_SCENARIO_FRAGMENT_PREFIX.length);
  return OVERLAP_SCENARIOS.some((scenario) => scenario.id === id) ? (id as OverlapScenarioId) : null;
}

export function listLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

export function uiSummary(deliveries: readonly UiDelivery[]): string {
  if (!deliveries.length) return `Nothing within ${AXIS_MS} ms`;
  return deliveries.map((delivery) => `${delivery.label} at ${delivery.at} ms`).join(', then ');
}

export function choiceLabel(choice: PredictionChoice): string {
  return uiSummary(choice.deliveries);
}

export function streamSentence(triggers: readonly Omit<OverlapTrigger, 'id'>[], defaultDurationMs: number): string {
  const parts = triggers.map((trigger) =>
    trigger.durationMs === null ? `${trigger.label} at ${trigger.at} ms` : `${trigger.label} at ${trigger.at} ms (${trigger.durationMs} ms request)`);
  return `${parts.join(', ')}; other requests take ${defaultDurationMs} ms.`;
}

export function requestSentence(request: InnerRequest): string {
  const label = request.label;
  switch (request.outcome) {
    case 'completed':
      return request.waitedMs > 0
        ? `${label}: waited ${request.waitedMs} ms, started ${request.startedAt} ms, delivered ${request.endedAt} ms.`
        : `${label}: started ${request.startedAt} ms, delivered ${request.endedAt} ms.`;
    case 'cancelled':
      return `${label}: started ${request.startedAt} ms, cancelled ${request.endedAt} ms, server finishes ${request.serverEndsAt} ms.`;
    case 'dropped':
      return `${label}: triggered ${request.triggeredAt} ms, dropped because a request was still running.`;
    case 'running':
      return `${label}: started ${request.startedAt} ms, still running at ${AXIS_MS} ms (needs ${request.durationMs} ms).`;
    case 'queued':
      return `${label}: triggered ${request.triggeredAt} ms, still queued at ${AXIS_MS} ms.`;
  }
}

export function seedSentence(run: OverlapRunResult): string {
  const cancelled = run.requests.filter((request) => request.outcome === 'cancelled');
  const dropped = run.requests.filter((request) => request.outcome === 'dropped');
  const waited = run.requests.filter((request) => request.waitedMs > 0);
  const gets = `the UI gets ${uiSummary(run.deliveries)}`;
  switch (run.operator) {
    case 'switchMap':
      return `switchMap cancels ${listLabels(cancelled.map((request) => `${request.label} at ${request.endedAt} ms`))} and ${gets}.`;
    case 'mergeMap':
      return `mergeMap keeps every request and ${gets}.`;
    case 'concatMap':
      return `concatMap starts ${listLabels(waited.map((request) => request.label))} only after the previous request completes, so ${gets}.`;
    case 'exhaustMap':
      return `exhaustMap ignores ${listLabels(dropped.map((request) => request.label))} and ${gets}.`;
  }
}

export const SEED_STREAM_INTRO = `Trigger A at 0 ms, trigger B at 100 ms, each request ${DEFAULT_DURATION_MS} ms.`;

export const SEED_STREAM_SENTENCES: readonly string[] = (() => {
  const runs = runAll({
    triggers: SEED_TRIGGERS.map((trigger, index) => ({ ...trigger, id: `seed${index}` })),
    defaultDurationMs: DEFAULT_DURATION_MS,
    axisMs: AXIS_MS,
  });
  return OVERLAP_OPERATORS.map((operator) => seedSentence(runs[operator]));
})();

export function hazardSentence(hazard: Hazard, run: OverlapRunResult): string {
  const labels = hazard.triggerIds.map((id) => run.requests.find((request) => request.triggerId === id)?.label ?? id);
  const names = listLabels(labels);
  switch (hazard.code) {
    case 'stale-overwrite':
      return `${names} responded after a newer request had already rendered, so the old data replaced the new data at ${hazard.ms} ms.`;
    case 'stale-final-state':
      return `The last thing on screen belongs to an older trigger than ${names}, the newest one the user asked for.`;
    case 'duplicate-request':
      return `${names} all reached the server. The second request started at ${hazard.ms} ms while the first was still in flight.`;
    case 'dropped-intent':
      return `${names} never started because a request was still running. The user's newest intent was ignored.`;
    case 'cancelled-write':
      return `${names} ${labels.length === 1 ? 'was' : 'were'} cancelled on the client. A cancelled write is lost data.`;
    case 'out-of-order':
      return `${names} completed before an earlier write finished, so the server applied writes in a different order than the user made them.`;
    case 'queue-latency':
      return `${names} waited for the previous request. The longest wait was ${hazard.ms} ms.`;
    case 'intermediate-render':
      return `${names} rendered after a newer trigger had already fired, so the user saw a result that was obsolete the moment it appeared.`;
    case 'server-continues':
      return `${names} ${labels.length === 1 ? 'was' : 'were'} cancelled on the client, but the server keeps working until ${hazard.ms} ms. Cancellation protects the UI, not the server.`;
  }
}

export function verdictHeading(verdict: OverlapVerdict): string {
  if (verdict.fits) return `${verdict.operator} fits: ${INTENT_LABELS[verdict.intent].toLowerCase()}`;
  const danger = verdict.hazards.find((hazard) => hazard.severity === 'danger');
  if (danger) return `${verdict.operator} breaks the promise: ${HAZARD_TITLES[danger.code].toLowerCase()}`;
  return `${verdict.operator} works here, but ${verdict.recommended} states the intent`;
}

export function verdictSentence(verdict: OverlapVerdict, run: OverlapRunResult): string {
  const ui = uiSummary(run.deliveries);
  const promise = INTENT_LABELS[verdict.intent].toLowerCase();
  if (verdict.fits) {
    return `The UI gets ${ui}. That is exactly what "${promise}" asks for.`;
  }
  return `The UI gets ${ui}. The promise was "${promise}"; ${verdict.recommended} is the operator that encodes it.`;
}

export function predictionFeedback(correct: boolean | null, chosenLabel: string | null, actual: string): string {
  if (correct === null) return '';
  return correct
    ? `Your prediction was right: ${actual}.`
    : `Your prediction was ${chosenLabel ?? 'not locked'}. The real run delivered ${actual}.`;
}

export function laneSummary(run: OverlapRunResult): string {
  const completed = run.requests.filter((request) => request.outcome === 'completed').length;
  const cancelled = run.requests.filter((request) => request.outcome === 'cancelled').length;
  const dropped = run.requests.filter((request) => request.outcome === 'dropped').length;
  const pending = run.requests.filter((request) => request.outcome === 'running' || request.outcome === 'queued').length;
  const parts = [`${completed} delivered`];
  if (cancelled) parts.push(`${cancelled} cancelled`);
  if (dropped) parts.push(`${dropped} dropped`);
  if (pending) parts.push(`${pending} pending`);
  return parts.join(', ');
}

export const FINAL_TAKEAWAY =
  'Same stream, four policies. switchMap keeps the latest and cancels the rest. mergeMap keeps everything and accepts any order. concatMap keeps everything in order and pays queue latency. exhaustMap keeps the first and drops the rest. Pick the operator by the promise the UI makes, not by the stream.';

export const OVERLAP_RELATED_LINKS: readonly OverlapRelatedLink[] = [
  {
    id: 'http-cancel',
    label: 'What actually cancels an HttpClient request',
    route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
  },
  {
    id: 'http-cancel-switchmap',
    label: 'Run the switchMap cancellation test',
    route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
    fragment: 'cancellation-scenario-switch-map',
  },
  {
    id: 'unsubscribe',
    label: 'Subscription cleanup patterns',
    route: ['/angular', 'trivia', 'angular-prevent-memory-leaks-unsubscribe-patterns'],
  },
  {
    id: 'share-replay',
    label: 'shareReplay failure modes',
    route: ['/angular', 'trivia', 'rxjs-sharereplay-angular-how-it-breaks-your-app'],
  },
  {
    id: 'take-latest',
    label: 'takeLatest coding exercise',
    route: ['/javascript', 'coding', 'js-take-latest'],
  },
];
