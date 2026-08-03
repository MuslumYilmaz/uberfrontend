export const ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS = [
  'manual-unsubscribe',
  'switch-map',
  'merge-map',
  'take-until-destroyed',
  'async-pipe',
  'share-replay',
] as const;

export type AngularHttpCancellationScenarioId =
  (typeof ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS)[number];

export interface CancellationLayer {
  id: 'subscription' | 'transport' | 'ui' | 'server';
  title: string;
  question: string;
  proof: string;
}

export interface CancellationScenario {
  id: AngularHttpCancellationScenarioId;
  label: string;
  pattern: string;
  intent: string;
  summary: string;
  code: string;
  subscription: string;
  transport: string;
  ui: string;
  server: string;
  devToolsSignal: string;
  testAssertion: string;
}

export const CANCELLATION_LAYERS: readonly CancellationLayer[] = [
  {
    id: 'subscription',
    title: '1. RxJS subscription',
    question: 'Did the consumer unsubscribe before the Observable completed?',
    proof: 'A teardown or finalize log runs for the abandoned subscription.',
  },
  {
    id: 'transport',
    title: '2. Browser transport',
    question: 'Did Angular’s HTTP backend receive the teardown while the request was active?',
    proof: 'DevTools marks the request as canceled, or TestRequest.cancelled becomes true.',
  },
  {
    id: 'ui',
    title: '3. UI commit ownership',
    question: 'Can an older response still write into state after a newer intent?',
    proof: 'A request generation, latest key, or operator contract blocks stale commits.',
  },
  {
    id: 'server',
    title: '4. Server work',
    question: 'Did the server stop computation after the client connection closed?',
    proof: 'Only server-side cancellation logs or cooperative abort handling can prove it.',
  },
];

export const CANCELLATION_SCENARIOS: readonly CancellationScenario[] = [
  {
    id: 'manual-unsubscribe',
    label: 'Manual unsubscribe',
    pattern: 'Subscription.unsubscribe()',
    intent: 'Stop one request owned by an imperative workflow.',
    summary:
      'Unsubscribing an active HttpClient subscription tears down Angular’s transport. It does not retroactively cancel a response that already completed.',
    code: `const subscription = this.http.get('/api/profile').subscribe({
  next: profile => this.profile.set(profile),
  error: error => this.error.set(error)
});

// Run while the request is still active.
subscription.unsubscribe();`,
    subscription: 'Closed immediately; teardown runs once.',
    transport: 'The active XHR or Fetch request receives an abort signal.',
    ui: 'No next/error notification reaches this subscriber after teardown.',
    server: 'The server may continue work unless it observes disconnects cooperatively.',
    devToolsSignal: 'The active request is normally labeled canceled or aborted.',
    testAssertion: 'expect(request.cancelled).toBeTrue()',
  },
  {
    id: 'switch-map',
    label: 'switchMap',
    pattern: 'Latest request wins',
    intent: 'Replace an obsolete read when search text, filters, or route state changes.',
    summary:
      'Each new outer value unsubscribes the previous inner HttpClient Observable before subscribing to the next one.',
    code: `readonly results$ = this.query.valueChanges.pipe(
  distinctUntilChanged(),
  switchMap(query => this.http.get<SearchResult[]>('/api/search', {
    params: { query }
  }))
);`,
    subscription: 'The previous inner subscription closes when a new input arrives.',
    transport: 'The previous active request is aborted; the newest request stays active.',
    ui: 'An obsolete request cannot emit through this chain and overwrite the latest result.',
    server: 'Earlier server work may still finish despite the client abort.',
    devToolsSignal: 'Request A is canceled when request B starts.',
    testAssertion: 'expect(requestA.cancelled).toBeTrue()',
  },
  {
    id: 'merge-map',
    label: 'mergeMap',
    pattern: 'Parallel requests',
    intent: 'Allow independent operations to overlap and finish in any order.',
    summary:
      'A new outer value does not cancel earlier inner requests. That is useful for independent work but risky for latest-only UI state.',
    code: `readonly saves$ = this.saveClicks.pipe(
  mergeMap(payload => this.http.post('/api/drafts', payload))
);

// Do not use this contract for a latest-only search result.
// An older response can arrive last and overwrite newer state.`,
    subscription: 'Both inner subscriptions remain active until completion or parent teardown.',
    transport: 'Both requests remain in flight; neither is canceled by the next input.',
    ui: 'Completion order can differ from intent order, creating stale-state risk.',
    server: 'Both operations are allowed to run, which may be the required product behavior.',
    devToolsSignal: 'Requests A and B overlap and can complete out of order.',
    testAssertion: 'expect(requestA.cancelled).toBeFalse()',
  },
  {
    id: 'take-until-destroyed',
    label: 'takeUntilDestroyed',
    pattern: 'Lifecycle ownership',
    intent: 'Tie an imperative subscription to the Angular injection context that owns it.',
    summary:
      'Destroying the owning component completes the chain and unsubscribes an active HttpClient request without a manual destroy Subject.',
    code: `private readonly destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.http.get('/api/dashboard').pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => this.dashboard.set(data));
}`,
    subscription: 'Closes when the owning DestroyRef is destroyed.',
    transport: 'An active request is aborted during component teardown.',
    ui: 'A destroyed component cannot receive a late notification through this chain.',
    server: 'The client disconnect still does not guarantee server computation stopped.',
    devToolsSignal: 'Navigate away while pending; the request is canceled.',
    testAssertion: 'fixture.destroy(); expect(request.cancelled).toBeTrue()',
  },
  {
    id: 'async-pipe',
    label: 'AsyncPipe',
    pattern: 'Template ownership',
    intent: 'Let the rendered view own subscription setup and teardown.',
    summary:
      'AsyncPipe unsubscribes when its view is destroyed or when the bound Observable reference changes.',
    code: `readonly profile$ = this.http.get<Profile>('/api/profile');

// template
@if (profile$ | async; as profile) {
  <app-profile [profile]="profile" />
}`,
    subscription: 'The view subscribes and AsyncPipe releases the subscription automatically.',
    transport: 'Destroying the view aborts the request if it is still active.',
    ui: 'No imperative callback remains to mutate a view that no longer exists.',
    server: 'The same server-side limitation applies after browser abort.',
    devToolsSignal: 'Remove the view before completion and inspect the canceled request.',
    testAssertion: 'fixture.destroy(); expect(request.cancelled).toBeTrue()',
  },
  {
    id: 'share-replay',
    label: 'shareReplay',
    pattern: 'Shared request ownership',
    intent: 'Share one request while making the cache and teardown policy explicit.',
    summary:
      'With refCount true, the source is torn down when the last active subscriber leaves. With refCount false, an active source can remain subscribed.',
    code: `readonly config$ = this.http.get<AppConfig>('/api/config').pipe(
  shareReplay({ bufferSize: 1, refCount: true })
);

// Subscriber A leaves: source stays active while B remains.
// Subscriber B leaves: the active source is torn down.`,
    subscription: 'The shared source closes only after its last active consumer unsubscribes.',
    transport: 'With refCount true, the final unsubscribe aborts an active request.',
    ui: 'All consumers share one result; cache lifetime must match product expectations.',
    server: 'A shared client teardown still cannot prove server work stopped.',
    devToolsSignal: 'One network request serves both consumers; final teardown cancels it.',
    testAssertion: 'second.unsubscribe(); expect(request.cancelled).toBeTrue()',
  },
];
