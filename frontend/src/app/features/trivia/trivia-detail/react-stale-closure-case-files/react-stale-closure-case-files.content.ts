export const REACT_STALE_CLOSURE_CASE_IDS = [
  'pr-interval-counter',
  'pr-chat-theme',
  'pr-escape-listener',
  'pr-debounced-autosave',
  'pr-export-snapshot',
  'pr-search-ordering',
] as const;

export type ReactStaleClosureCaseId = (typeof REACT_STALE_CLOSURE_CASE_IDS)[number];

export type ReactStaleClosureContractId =
  | 'previous-state-update'
  | 'reactive-resynchronization'
  | 'latest-nonreactive-read'
  | 'invocation-argument'
  | 'intentional-snapshot'
  | 'request-ordering';

export interface ReactStaleClosureChoice {
  readonly id: string;
  readonly label: string;
}

export interface ReactStaleClosureContractChoice {
  readonly id: ReactStaleClosureContractId;
  readonly label: string;
}

export interface ReactStaleClosureCaseFile {
  readonly id: ReactStaleClosureCaseId;
  readonly number: string;
  readonly heading: string;
  readonly reviewQuestion: string;
  readonly symptom: string;
  readonly evidence: readonly [string, string, string];
  readonly predictionPrompt: string;
  readonly predictions: readonly ReactStaleClosureChoice[];
  readonly correctPredictionId: string;
  readonly contractPrompt: string;
  readonly contracts: readonly ReactStaleClosureContractChoice[];
  readonly correctContractId: ReactStaleClosureContractId;
  readonly diagnosis: string;
  readonly commonMisdiagnosis: string;
  readonly prescriptionTitle: string;
  readonly prescription: string;
  readonly beforeCode: string;
  readonly afterCode: string;
  readonly proofAssertion: string;
  readonly compatibilityNote?: string;
  readonly fallbackCode?: string;
}

const contractChoices = (
  ...choices: readonly ReactStaleClosureContractChoice[]
): readonly ReactStaleClosureContractChoice[] => choices;

export const REACT_STALE_CLOSURE_CASE_FILES: readonly ReactStaleClosureCaseFile[] = [
  {
    id: 'pr-interval-counter',
    number: '01',
    heading: 'Interval counter: update from previous state',
    reviewQuestion: 'Why does the counter stop at 1 even though the interval keeps firing?',
    symptom: 'The interval callback was created during the first render, so every tick computes 0 + 1.',
    evidence: [
      'Render 1 creates a callback whose count value is 0.',
      'The first tick requests count = 1 and React commits the update.',
      'Later ticks still request count = 1 because the closed-over value did not change.',
    ],
    predictionPrompt: 'After three interval ticks, what should the broken UI display?',
    predictions: [
      { id: 'count-one', label: 'Count: 1' },
      { id: 'count-three', label: 'Count: 3' },
      { id: 'throws', label: 'It throws' },
    ],
    correctPredictionId: 'count-one',
    contractPrompt: 'Which state contract matches this callback?',
    contracts: contractChoices(
      { id: 'previous-state-update', label: 'Derive from previous state' },
      { id: 'reactive-resynchronization', label: 'Restart on every count' },
      { id: 'intentional-snapshot', label: 'Keep the first count' },
    ),
    correctContractId: 'previous-state-update',
    diagnosis: 'This is a stale closure. The callback needs the previous committed value, not the render snapshot that installed the interval.',
    commonMisdiagnosis: 'Adding count to the dependencies fixes freshness but resets interval cadence; use the updater contract instead.',
    prescriptionTitle: 'Use the functional state updater',
    prescription: 'Keep the interval lifecycle stable and move the changing value into React\'s updater contract.',
    beforeCode: `useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1_000);
  return () => clearInterval(id);
}, []);`,
    afterCode: `useEffect(() => {
  const id = setInterval(() => {
    setCount(current => current + 1);
  }, 1_000);
  return () => clearInterval(id);
}, []);`,
    proofAssertion: `expect(screen.getByText('Count: 3')).toBeInTheDocument();`,
  },
  {
    id: 'pr-chat-theme',
    number: '02',
    heading: 'Chat connection: read the latest theme without reconnecting',
    reviewQuestion: 'How can the connection depend on roomId while its notification sees the latest theme?',
    symptom: 'Adding theme to the Effect dependencies fixes the notification color but reconnects the chat whenever appearance changes.',
    evidence: [
      'roomId owns the connection lifecycle and must trigger a resubscription.',
      'theme is only read when the connected event fires; it should not own that lifecycle.',
      'The callback therefore needs a latest non-reactive read, not a broader dependency list.',
    ],
    predictionPrompt: 'What happens when theme changes if it is added to the connection Effect dependencies?',
    predictions: [
      { id: 'reconnects', label: 'The chat reconnects' },
      { id: 'notification-only', label: 'Only the notification changes' },
      { id: 'nothing', label: 'Nothing changes' },
    ],
    correctPredictionId: 'reconnects',
    contractPrompt: 'Which ownership contract fits the notification callback?',
    contracts: contractChoices(
      { id: 'latest-nonreactive-read', label: 'Read latest value without resync' },
      { id: 'reactive-resynchronization', label: 'Reconnect for theme changes' },
      { id: 'intentional-snapshot', label: 'Freeze the initial theme' },
    ),
    correctContractId: 'latest-nonreactive-read',
    diagnosis: 'The shown PR is over-synchronized, not currently stale: adding theme keeps the notification fresh but incorrectly makes appearance own the connection lifetime. The underlying requirement is a latest non-reactive read.',
    commonMisdiagnosis: 'Removing theme alone stops reconnects but reintroduces a stale notification callback.',
    prescriptionTitle: 'Use an Effect Event when React 19.2+ is available',
    prescription: 'Keep roomId as the connection dependency. Let the event callback read the latest theme without causing a reconnect.',
    beforeCode: `useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', () => {
    showNotification('Connected', theme);
  });
  connection.connect();
  return () => connection.disconnect();
}, [roomId, theme]);`,
    afterCode: `const onConnected = useEffectEvent(() => {
  showNotification('Connected', theme);
});

useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', onConnected);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);`,
    proofAssertion: `expect(connect).toHaveBeenCalledTimes(1);
expect(showNotification).toHaveBeenLastCalledWith('Connected', 'dark');`,
    compatibilityNote: 'useEffectEvent is available in React 19.2+. It reads the latest committed values for Effect-owned event work; do not pass it to components or hooks, hide genuine dependencies with it, or depend on a stable identity. On React 18, mirror theme into a ref from an Effect and read that ref from the connection callback.',
    fallbackCode: `const latestTheme = useRef(theme);

useEffect(() => {
  latestTheme.current = theme;
}, [theme]);

useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', () => {
    showNotification('Connected', latestTheme.current);
  });
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);`,
  },
  {
    id: 'pr-escape-listener',
    number: '03',
    heading: 'Escape listener: re-synchronize with isDirty',
    reviewQuestion: 'Why does Escape close the editor without warning after the form becomes dirty?',
    symptom: 'The window listener was installed once and still reads the initial false value for isDirty.',
    evidence: [
      'The first render installs the Escape handler while isDirty is false.',
      'Editing commits isDirty = true, but the external listener is not replaced.',
      'Escape follows the old branch and closes without asking for confirmation.',
    ],
    predictionPrompt: 'What does the empty-dependency listener do after the form becomes dirty?',
    predictions: [
      { id: 'closes', label: 'Closes without confirming' },
      { id: 'confirms', label: 'Shows confirmation' },
      { id: 'ignores', label: 'Ignores Escape' },
    ],
    correctPredictionId: 'closes',
    contractPrompt: 'Which contract should own this listener?',
    contracts: contractChoices(
      { id: 'reactive-resynchronization', label: 'Resync when isDirty changes' },
      { id: 'latest-nonreactive-read', label: 'Hide the dependency in a ref' },
      { id: 'intentional-snapshot', label: 'Keep the mount-time value' },
    ),
    correctContractId: 'reactive-resynchronization',
    diagnosis: 'This is a stale closure. isDirty changes the listener\'s behavior, so it belongs to the synchronization contract.',
    commonMisdiagnosis: 'A ref is not the default fix; it can hide behavior that should re-synchronize.',
    prescriptionTitle: 'Declare isDirty as an Effect dependency',
    prescription: 'Remove and re-register the external listener when the behavior it owns changes. Cleanup prevents duplicate listeners.',
    beforeCode: `useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeEditor(isDirty);
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);`,
    afterCode: `useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeEditor(isDirty);
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [isDirty]);`,
    proofAssertion: `rerender(<Editor isDirty />);
fireEvent.keyDown(window, { key: 'Escape' });
expect(confirmClose).toHaveBeenCalledTimes(1);`,
  },
  {
    id: 'pr-debounced-autosave',
    number: '04',
    heading: 'Debounced autosave: pass the invocation snapshot',
    reviewQuestion: 'Why does the save request keep sending the first draft?',
    symptom: 'The memoized debounced function closes over the first render\'s draft, even when later clicks schedule new work.',
    evidence: [
      'The memo factory runs once and captures draft A.',
      'A later render shows draft B, but it calls the same debounced function.',
      'When the queued callback runs, its closure still sends draft A.',
    ],
    predictionPrompt: 'Which draft reaches onSave after the user schedules autosave from draft B?',
    predictions: [
      { id: 'draft-a', label: 'Draft A' },
      { id: 'draft-b', label: 'Draft B' },
      { id: 'both', label: 'Both drafts' },
    ],
    correctPredictionId: 'draft-a',
    contractPrompt: 'Where should this value cross the debounce boundary?',
    contracts: contractChoices(
      { id: 'invocation-argument', label: 'Pass it at invocation time' },
      { id: 'reactive-resynchronization', label: 'Recreate on every keystroke' },
      { id: 'intentional-snapshot', label: 'Keep the first draft' },
    ),
    correctContractId: 'invocation-argument',
    diagnosis: 'This is a stale closure. The debounced worker is stable, but its payload should come from each invocation.',
    commonMisdiagnosis: 'Adding draft to the memo dependencies recreates the debouncer and can strand pending work.',
    prescriptionTitle: 'Make the queued value an argument',
    prescription: 'Keep one debounced worker, pass the draft at invocation time, and cancel pending work on unmount.',
    beforeCode: `const saveLater = useMemo(
  () => debounce(() => onSave(draft), 300),
  [onSave],
);

const scheduleSave = () => saveLater();`,
    afterCode: `const saveLater = useMemo(
  () => debounce((nextDraft: Draft) => onSave(nextDraft), 300),
  [onSave],
);

useEffect(() => () => saveLater.cancel(), [saveLater]);

const scheduleSave = () => saveLater(draft);`,
    proofAssertion: `scheduleSaveWith('draft A');
scheduleSaveWith('draft B');
advanceTimersByTime(300);
expect(onSave).toHaveBeenLastCalledWith('draft B');

scheduleSaveWith('draft C');
unmount();
advanceTimersByTime(300);
expect(onSave).not.toHaveBeenCalledWith('draft C');`,
  },
  {
    id: 'pr-export-snapshot',
    number: '05',
    heading: 'Export audit: preserve the initiating snapshot',
    reviewQuestion: 'Should an audit record the filters at click time or whatever filters exist after export finishes?',
    symptom: 'A reviewer calls the captured filters stale, but the product contract requires the initiating snapshot.',
    evidence: [
      'The user starts an export while filters equal “paid”.',
      'The user changes the live view to “trial” while the export is pending.',
      'The audit must describe the exported “paid” dataset, not the later screen state.',
    ],
    predictionPrompt: 'Which filters should the completed export audit record?',
    predictions: [
      { id: 'click-filters', label: 'Filters at the click' },
      { id: 'latest-filters', label: 'Latest screen filters' },
      { id: 'no-filters', label: 'No filters' },
    ],
    correctPredictionId: 'click-filters',
    contractPrompt: 'Which contract makes that capture correct?',
    contracts: contractChoices(
      { id: 'intentional-snapshot', label: 'Preserve the initiating snapshot' },
      { id: 'latest-nonreactive-read', label: 'Always read the latest filters' },
      { id: 'request-ordering', label: 'Discard older exports' },
    ),
    correctContractId: 'intentional-snapshot',
    diagnosis: 'This is not a stale-closure bug. The closure preserves the exact state that initiated a side effect whose result must stay attributable.',
    commonMisdiagnosis: 'Replacing the snapshot with a latest-value ref corrupts audit attribution.',
    prescriptionTitle: 'Name the snapshot to make intent reviewable',
    prescription: 'Capture and name filtersAtStart before the asynchronous boundary. The explicit name protects a correct snapshot from an incorrect “always latest” refactor.',
    beforeCode: `async function exportRows() {
  const file = await createExport(filters);
  audit({ fileId: file.id, filters });
}`,
    afterCode: `async function exportRows() {
  const filtersAtStart = filters;
  const file = await createExport(filtersAtStart);
  audit({ fileId: file.id, filters: filtersAtStart });
}`,
    proofAssertion: `expect(audit).toHaveBeenCalledWith({
  fileId: 'export-1',
  filters: filtersAtClick,
});`,
  },
  {
    id: 'pr-search-ordering',
    number: '06',
    heading: 'Async search: diagnose a race, not a closure',
    reviewQuestion: 'Why can an older result overwrite the latest query even when each request captured the right query?',
    symptom: 'Request A starts first, request B finishes first, and A later commits over B.',
    evidence: [
      'The closure for request A correctly captures query A.',
      'The closure for request B correctly captures query B.',
      'Completion order differs from intent order, so the stale commit is an ownership race.',
    ],
    predictionPrompt: 'If B resolves before A and both callbacks commit, which result remains visible?',
    predictions: [
      { id: 'result-a', label: 'Result A' },
      { id: 'result-b', label: 'Result B' },
      { id: 'combined', label: 'A and B combined' },
    ],
    correctPredictionId: 'result-a',
    contractPrompt: 'Which contract prevents the obsolete commit?',
    contracts: contractChoices(
      { id: 'request-ordering', label: 'Latest request owns the commit' },
      { id: 'reactive-resynchronization', label: 'Add the result as a dependency' },
      { id: 'intentional-snapshot', label: 'Commit every response' },
    ),
    correctContractId: 'request-ordering',
    diagnosis: 'This is a race condition, not a stale closure. Both callbacks captured the intended query; the missing rule is which request may commit.',
    commonMisdiagnosis: 'Adding query dependencies cannot stop an older completion from committing last.',
    prescriptionTitle: 'Guard the commit with a request generation',
    prescription: 'Increment an owner token for each search and ignore completions that no longer own the latest generation.',
    beforeCode: `async function search(query: string) {
  const result = await fetchResults(query);
  setResults(result);
}`,
    afterCode: `const latestRequest = useRef(0);

async function search(query: string) {
  const requestId = ++latestRequest.current;
  const result = await fetchResults(query);
  if (requestId !== latestRequest.current) return;
  setResults(result);
}`,
    proofAssertion: `resolveSearch('B');
resolveSearch('A');
expect(screen.getByText('Result B')).toBeInTheDocument();`,
  },
];

export const REACT_STALE_CLOSURE_TRUST_NOTE =
  'These are representative FrontendAtlas code-review scenarios, not real pull requests or leaked interview material.';
