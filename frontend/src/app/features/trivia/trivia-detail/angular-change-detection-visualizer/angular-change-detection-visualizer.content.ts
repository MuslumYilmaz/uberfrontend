import {
  CdDiagnosis,
  CdDiagnosisCode,
  CdFixId,
  CdMode,
  CdNodeId,
  CdOutcomeReason,
  CdRunResult,
  CdScenarioId,
  CdScenarioPreset,
  CdTriggerType,
  CD_NODE_COUNT,
} from './angular-change-detection-visualizer.model';

export interface CdNodeMeta {
  readonly id: CdNodeId;
  readonly label: string;
  readonly role: string;
  readonly dataLabel: string;
}

export interface CdTriggerMeta {
  readonly type: CdTriggerType;
  readonly label: string;
  readonly description: string;
}

export interface CdModeMeta {
  readonly id: CdMode;
  readonly label: string;
  readonly hint: string;
}

export interface CdScenario {
  readonly id: CdScenarioId;
  readonly chipLabel: string;
  readonly title: string;
  readonly story: string;
  readonly setup: string;
  readonly preset: CdScenarioPreset;
  readonly expectedCheckedCount: number;
  readonly expectedDiagnosis: CdDiagnosisCode | null;
  readonly expectedFixedCheckedCount: number | null;
}

export interface CdFixCopy {
  readonly title: string;
  readonly code: string;
  readonly explanation: string;
}

export interface CdRelatedLink {
  readonly id: string;
  readonly label: string;
  readonly route: string[];
}

export const CD_NODES: readonly CdNodeMeta[] = [
  { id: 'app', label: 'AppComponent', role: 'root', dataLabel: 'title' },
  { id: 'header', label: 'SummaryCard', role: 'child of AppComponent', dataLabel: 'stats.total' },
  { id: 'list', label: 'UserList', role: 'child of AppComponent', dataLabel: 'users' },
  { id: 'item-1', label: 'UserCard 1', role: 'child of UserList', dataLabel: 'user.name' },
  { id: 'item-2', label: 'UserCard 2', role: 'child of UserList', dataLabel: 'user.name' },
  { id: 'item-3', label: 'UserCard 3', role: 'child of UserList', dataLabel: 'user.name' },
  { id: 'footer', label: 'LiveCount', role: 'child of AppComponent', dataLabel: 'total' },
];

export const CD_NODE_LABELS: Readonly<Record<CdNodeId, string>> = Object.fromEntries(
  CD_NODES.map((node) => [node.id, node.label]),
) as Record<CdNodeId, string>;

export const CD_TRIGGERS: readonly CdTriggerMeta[] = [
  {
    type: 'click',
    label: 'Click inside',
    description: 'An event handler in this component changed its local state.',
  },
  {
    type: 'inputReferenceChange',
    label: 'New input reference',
    description: 'A handler in the parent replaced the object it binds to this input.',
  },
  {
    type: 'inputMutation',
    label: 'Mutate input in place',
    description: 'A handler in the parent changed a property on the same object it binds to this input.',
  },
  {
    type: 'timerInService',
    label: 'setTimeout in a service',
    description: 'A service timer callback assigned a plain field on this component.',
  },
  {
    type: 'httpAsyncPipe',
    label: 'HTTP via async pipe',
    description: 'An HttpClient response emitted through an async pipe in this template.',
  },
  {
    type: 'manualSubscribeAssign',
    label: 'subscribe() assigns a field',
    description: 'An HttpClient response inside a manual subscribe() assigned a field without markForCheck().',
  },
  {
    type: 'signalSet',
    label: 'Set a signal',
    description: 'A signal that this template reads was set to a new value.',
  },
  {
    type: 'markForCheck',
    label: 'markForCheck()',
    description: 'This component called ChangeDetectorRef.markForCheck() during its pending async work.',
  },
  {
    type: 'detectChanges',
    label: 'detectChanges()',
    description: 'This component called ChangeDetectorRef.detectChanges() for a synchronous subtree check.',
  },
  {
    type: 'runOutsideAngular',
    label: 'Timer outside NgZone',
    description: 'A timer scheduled with NgZone.runOutsideAngular() assigned a field on this component.',
  },
];

export const CD_MODES: readonly CdModeMeta[] = [
  { id: 'zone', label: 'Zone.js', hint: 'Every finished async task schedules a pass from the root.' },
  { id: 'zoneless', label: 'Zoneless (simulated)', hint: 'Only signals, markForCheck(), events, and async pipes schedule a pass.' },
];

export const CD_SCENARIOS: readonly CdScenario[] = [
  {
    id: 'push-mutation',
    chipLabel: 'Array push, OnPush list',
    title: 'The list keeps the old users after push()',
    story:
      'UserList is OnPush and renders the users array it receives from AppComponent. A save handler in AppComponent runs users.push(created). The new row never shows up until something unrelated triggers a check.',
    setup: 'UserList and every UserCard use OnPush; AppComponent, SummaryCard, and LiveCount stay Default.',
    preset: {
      id: 'push-mutation',
      mode: 'zone',
      strategies: { list: 'onpush', 'item-1': 'onpush', 'item-2': 'onpush', 'item-3': 'onpush' },
      trigger: { type: 'inputMutation', nodeId: 'list' },
    },
    expectedCheckedCount: 3,
    expectedDiagnosis: 'mutation-same-reference',
    expectedFixedCheckedCount: 4,
  },
  {
    id: 'timer-in-service',
    chipLabel: 'Service timer, OnPush footer',
    title: 'LiveCount freezes while the service keeps counting',
    story:
      'LiveCount is OnPush. A service setTimeout callback assigns total = n on the component. Zone.js runs a pass after the timer, but nothing marked LiveCount, so Angular skips its view and the DOM keeps the old number.',
    setup: 'LiveCount uses OnPush; every other component stays Default.',
    preset: {
      id: 'timer-in-service',
      mode: 'zone',
      strategies: { footer: 'onpush' },
      trigger: { type: 'timerInService', nodeId: 'footer' },
    },
    expectedCheckedCount: 6,
    expectedDiagnosis: 'onpush-no-trigger',
    expectedFixedCheckedCount: 7,
  },
  {
    id: 'manual-subscribe',
    chipLabel: 'subscribe() without a mark',
    title: 'The summary card shows the old total after save',
    story:
      'SummaryCard is OnPush and subscribes to total$ by hand. The callback assigns stats.total = total and never calls markForCheck(). The HTTP response ends a zone task, Angular runs a pass, and the card stays stale until the next click.',
    setup: 'SummaryCard uses OnPush; every other component stays Default.',
    preset: {
      id: 'manual-subscribe',
      mode: 'zone',
      strategies: { header: 'onpush' },
      trigger: { type: 'manualSubscribeAssign', nodeId: 'header' },
    },
    expectedCheckedCount: 6,
    expectedDiagnosis: 'manual-subscribe-no-mark',
    expectedFixedCheckedCount: 7,
  },
  {
    id: 'signal-in-onpush',
    chipLabel: 'Signal inside OnPush',
    title: 'A signal updates one OnPush card and nothing else',
    story:
      'Every component is OnPush. UserCard 2 reads name() from a signal. Setting the signal refreshes that one view. AppComponent and UserList are traversed on the way down, but their templates are not re-evaluated.',
    setup: 'All seven components use OnPush.',
    preset: {
      id: 'signal-in-onpush',
      mode: 'zone',
      strategies: {
        app: 'onpush',
        header: 'onpush',
        list: 'onpush',
        'item-1': 'onpush',
        'item-2': 'onpush',
        'item-3': 'onpush',
        footer: 'onpush',
      },
      trigger: { type: 'signalSet', nodeId: 'item-2' },
    },
    expectedCheckedCount: 1,
    expectedDiagnosis: null,
    expectedFixedCheckedCount: null,
  },
  {
    id: 'zoneless-timer',
    chipLabel: 'Zoneless timer',
    title: 'Default everywhere, but zoneless skips the timer',
    story:
      'The app runs with provideZonelessChangeDetection() and every component is Default. A service timer assigns a plain field on LiveCount. No signal, event, async pipe, or markForCheck() notified Angular, so no pass runs at all.',
    setup: 'Zoneless scheduling; all seven components use Default.',
    preset: {
      id: 'zoneless-timer',
      mode: 'zoneless',
      strategies: {},
      trigger: { type: 'timerInService', nodeId: 'footer' },
    },
    expectedCheckedCount: 0,
    expectedDiagnosis: 'no-tick-scheduled-zoneless',
    expectedFixedCheckedCount: 7,
  },
];

export const CD_SCENARIO_FRAGMENT_PREFIX = 'cd-scenario-';

export function scenarioFragmentId(id: CdScenarioId): string {
  return `${CD_SCENARIO_FRAGMENT_PREFIX}${id}`;
}

export function scenarioIdFromFragment(fragment: string | null | undefined): CdScenarioId | null {
  const value = String(fragment || '').trim();
  if (!value.startsWith(CD_SCENARIO_FRAGMENT_PREFIX)) return null;
  const id = value.slice(CD_SCENARIO_FRAGMENT_PREFIX.length);
  return CD_SCENARIOS.some((scenario) => scenario.id === id) ? (id as CdScenarioId) : null;
}

export const CD_REASON_COPY: Readonly<Record<CdOutcomeReason, string>> = {
  'default-always-checked': 'checked: Default views are checked on every pass that reaches them',
  'input-reference-changed': 'checked: the input reference changed',
  'marked-dirty-event': 'checked: an event in this subtree marked the view dirty',
  'marked-dirty-mark-for-check': 'checked: markForCheck() marked the view dirty',
  'marked-dirty-async-pipe': 'checked: the async pipe called markForCheck()',
  'signal-refresh': 'checked: a signal this template reads changed',
  'detect-changes-root': 'checked: detectChanges() started here',
  'onpush-no-trigger': 'skipped: OnPush, same input reference, not dirty',
  'parent-subtree-skipped': 'skipped: its parent subtree was skipped, so Angular never reached it',
  'outside-detect-changes-subtree': 'skipped: outside the detectChanges() subtree',
  'ancestor-of-signal-refresh': 'traversed: an OnPush ancestor on the path to a signal refresh; template not re-evaluated',
  'no-tick-zoneless': 'no pass: nothing notified Angular. No signal write, markForCheck(), event listener, or async pipe emission',
  'no-tick-outside-zone': 'no pass: the task ran outside NgZone, so Zone.js never saw it finish',
};

export const CD_OUTCOME_LABELS = {
  idle: 'not run yet',
  checked: 'checked',
  updated: 'checked, DOM updated',
  skipped: 'skipped',
  traversed: 'traversed only',
  'not-scheduled': 'no pass ran',
} as const;

export const CD_DIAGNOSIS_HEADINGS: Readonly<Record<CdDiagnosisCode, string>> = {
  'mutation-same-reference': 'Stale: same input reference',
  'manual-subscribe-no-mark': 'Stale: manual subscribe() without a mark',
  'onpush-no-trigger': 'Stale: OnPush saw no trigger',
  'parent-onpush-skipped': 'Stale: skipped together with its OnPush parent',
  'outside-detect-changes-subtree': 'Stale: outside the detectChanges() subtree',
  'no-tick-scheduled-zoneless': 'Stale: nothing scheduled a pass',
  'no-tick-outside-zone': 'Stale: the task ran outside NgZone',
};

export function diagnosisSentence(diagnosis: CdDiagnosis): string {
  const node = CD_NODE_LABELS[diagnosis.nodeId];
  const parent = diagnosis.parentId ? CD_NODE_LABELS[diagnosis.parentId] : 'its parent';
  const root = diagnosis.subtreeRootId ? CD_NODE_LABELS[diagnosis.subtreeRootId] : 'the caller';
  switch (diagnosis.code) {
    case 'mutation-same-reference':
      return `${node} is OnPush. ${parent} changed the object in place, so the input reference ${node} receives is unchanged and Angular skipped the view. The data moved, the DOM did not.`;
    case 'manual-subscribe-no-mark':
      return `${node} is OnPush. The manual subscribe() callback assigned a field, which is invisible to OnPush: no new input, no event in this subtree, no async pipe, no signal.`;
    case 'onpush-no-trigger':
      return `${node} is OnPush. Its data changed in a callback Angular does not treat as a trigger for this view: no new input reference, no event here, no async pipe emission, no signal write.`;
    case 'parent-onpush-skipped':
      return `${node} is Default, but ${parent} is OnPush and was skipped, so change detection never reached ${node}. A Default child cannot be checked if its parent subtree is skipped.`;
    case 'outside-detect-changes-subtree':
      return `detectChanges() checked only ${root} and its children. ${node} sits outside that subtree, so its stale value stays on screen until a normal pass includes it.`;
    case 'no-tick-scheduled-zoneless':
      return `Without Zone.js, a plain field assignment in a timer or subscribe() callback notifies nobody. Angular schedules a pass only after a signal write, markForCheck(), an event listener, or an async pipe emission, so ${node} keeps the old value.`;
    case 'no-tick-outside-zone':
      return `The timer ran inside NgZone.runOutsideAngular(), so Zone.js never saw the task finish and no pass ran. ${node} keeps the old value until some other trigger starts a pass.`;
  }
}

export const CD_FIX_COPY: Readonly<Record<CdFixId, CdFixCopy>> = {
  'immutable-update': {
    title: 'Pass a new reference',
    code: "// AppComponent\nsaveUser(created: User) {\n  this.users = [...this.users, created];\n}",
    explanation:
      'A new reference is a meaningful input change, so OnPush checks the child on the next pass. Creating a new array or object for the changed input costs far less than checking a large tree on every pass.',
  },
  'mark-for-check': {
    title: 'Mark the view for the next pass',
    code: "// LiveCount (OnPush)\nprivate readonly cd = inject(ChangeDetectorRef);\n\nonTick(n: number) {\n  this.total = n;\n  this.cd.markForCheck();\n}",
    explanation:
      'markForCheck() marks this view and its ancestors dirty, so the next pass includes them. detectChanges() would also work, but it forces a synchronous check of this subtree right now and is the sharper tool.',
  },
  'async-pipe': {
    title: 'Let the async pipe mark the view',
    code: "// SummaryCard (OnPush)\nreadonly stats$ = this.statsService.total$;\n\n// template\n{{ (stats$ | async) ?? 0 }}",
    explanation:
      'AsyncPipe subscribes, calls markForCheck() on every emission, and unsubscribes when the view is destroyed. This is the default pattern for Observable data in OnPush components.',
  },
  signal: {
    title: 'Store the value in a signal',
    code: "// LiveCount\nreadonly total = signal(0);\n\nonTick(n: number) {\n  this.total.set(n);\n}\n\n// template\n{{ total() }}",
    explanation:
      'A signal read by the template notifies the scheduler in zoneless and zone-based apps alike. In a Zone.js app you could also wrap the write in NgZone.run(), but the signal removes the dependency on Zone.js entirely.',
  },
};

export function freshHeading(result: CdRunResult): string {
  return result.checkedCount === 0
    ? 'Fresh: nothing changed, so no pass was needed'
    : `Fresh: ${result.checkedCount} of ${CD_NODE_COUNT} views checked, every value matches`;
}

export function freshSentence(result: CdRunResult): string {
  const skipped = result.steps.filter((step) => step.outcome === 'skipped').length;
  const traversed = result.steps.filter((step) => step.outcome === 'traversed').length;
  const parts = [`Every rendered value matches the data behind it.`];
  if (skipped) parts.push(`${skipped} OnPush ${skipped === 1 ? 'view was' : 'views were'} skipped without going stale.`);
  if (traversed) parts.push(`${traversed} ancestor ${traversed === 1 ? 'view was' : 'views were'} traversed but not re-rendered.`);
  if (result.schedule === 'subtree') parts.push('detectChanges() limited the pass to one subtree.');
  return parts.join(' ');
}

export function triggerSummary(result: CdRunResult): string {
  const trigger = CD_TRIGGERS.find((candidate) => candidate.type === result.trigger.type);
  const node = CD_NODE_LABELS[result.trigger.nodeId];
  const mode = result.mode === 'zone' ? 'Zone.js' : 'zoneless';
  return `${trigger?.label ?? result.trigger.type} on ${node} (${mode}): ${trigger?.description ?? ''}`.trim();
}

export function scheduleLabel(result: CdRunResult): string {
  switch (result.schedule) {
    case 'tick':
      return 'Pass from the root';
    case 'subtree':
      return `Subtree pass from ${CD_NODE_LABELS[result.trigger.nodeId]}`;
    case 'none':
      return 'No pass scheduled';
  }
}

export function liveSummary(result: CdRunResult): string {
  const base = `${scheduleLabel(result)}. Checked ${result.checkedCount} of ${CD_NODE_COUNT} views.`;
  if (!result.diagnosis) return `${base} Every value is fresh.`;
  return `${base} ${CD_NODE_LABELS[result.diagnosis.nodeId]} is stale. ${CD_DIAGNOSIS_HEADINGS[result.diagnosis.code]}.`;
}

export const FINAL_TAKEAWAY =
  'Default: checked on every pass that reaches it. OnPush: checked after a new input reference, an event in its subtree, an async pipe emission, a signal it reads, or markForCheck(). Zoneless: only those notifications schedule a pass at all.';

export const CD_RELATED_LINKS: readonly CdRelatedLink[] = [
  {
    id: 'onpush-bug',
    label: 'Debug the OnPush production bug',
    route: ['/angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
  },
  {
    id: 'zonejs',
    label: 'How Zone.js schedules change detection',
    route: ['/angular', 'trivia', 'angular-zonejs-change-detection'],
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle hooks and ExpressionChanged timing',
    route: ['/angular', 'trivia', 'angular-lifecycle-constructor-oninit-afterviewinit-dom'],
  },
  {
    id: 'http-cancel',
    label: 'HttpClient cancellation lab',
    route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
  },
];
