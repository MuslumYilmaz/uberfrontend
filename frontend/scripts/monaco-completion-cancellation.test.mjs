import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const monacoSource = readFileSync(
  new URL('../node_modules/monaco-editor/min/vs/editor/editor.main.js', import.meta.url),
  'utf8',
);
const zoneSource = readFileSync(
  new URL('../node_modules/zone.js/bundles/zone.umd.js', import.meta.url),
  'utf8',
);

// Exercise the actual production distribution. The package is pinned, so fail
// explicitly if an upgrade changes these function boundaries or patch targets.
const functionStart = monacoSource.indexOf('async function h(A,P,N,O=r.default');
const functionEnd = monacoSource.indexOf('}function v(A,P){', functionStart);
assert.ok(functionStart > 0 && functionEnd > functionStart, 'Expected Monaco 0.52.2 suggestion function');
const completionSource = monacoSource.slice(functionStart, functionEnd + 1);
const upstreamCancellation = 'return await K,x.isCancellationRequested?(U.dispose(),Promise.reject(new k.CancellationError)):new f';
const patchedCancellation = 'if(await K,x.isCancellationRequested)throw U.dispose(),new k.CancellationError;return new f';
assert.ok(completionSource.includes(patchedCancellation), 'The Monaco cancellation patch must be installed');

function createHarness({ upstream = false, provider, snippetProvider } = {}) {
  const consoleErrors = [];
  const externalErrors = [];
  const state = { disposed: 0 };
  class CancellationError extends Error {
    constructor() {
      super('Canceled');
      this.name = 'Canceled';
    }
  }
  class DisposableStore {
    items = [];
    add(item) { this.items.push(item); }
    dispose() {
      for (const item of this.items.splice(0)) item.dispose();
    }
  }
  class Range {
    setEndPosition() { return this; }
    static fromPositions() { return new Range(); }
  }
  class CompletionItem {
    constructor(position, completion) { this.completion = completion; }
  }
  class CompletionItemModel {
    constructor(items, needsClipboard, durations, disposable) {
      Object.assign(this, { items, needsClipboard, durations, disposable });
    }
  }
  const context = vm.createContext({
    console: { ...console, error: (...args) => consoleErrors.push(args) },
    setTimeout, clearTimeout, setInterval, clearInterval,
    // Only editor/service dependencies are stubbed; native async functions,
    // ZoneAwarePromise and the complete cancellation path run unchanged.
    r: {},
    d: {},
    y: { StopWatch: class { elapsed() { return 0; } } },
    p: { Range },
    E: { DisposableStore, isDisposable: (value) => typeof value?.dispose === 'function' },
    k: { CancellationError, onUnexpectedExternalError: (error) => externalErrors.push(error) },
    a: CompletionItem,
    f: CompletionItemModel,
    D: () => () => 0,
    u: snippetProvider,
  });
  vm.runInContext(zoneSource, context, { filename: 'zone.umd.js' });
  vm.runInContext(
    `globalThis.provideSuggestionItems = ${upstream
      ? completionSource.replace(patchedCancellation, upstreamCancellation)
      : completionSource};`,
    context,
    { filename: 'monaco-completion-runtime.js' },
  );

  const token = { isCancellationRequested: false };
  const suggestions = {
    suggestions: [{ label: 'alpha', kind: 1 }],
    dispose: () => { state.disposed += 1; },
  };
  const completionProvider = provider ?? { provideCompletionItems: async () => suggestions };
  const options = {
    kindFilter: new Set(), providerFilter: new Set(), providerItemsToReuse: new Map(),
    showDeprecated: true, snippetSortOrder: 1,
  };
  return {
    token, state, suggestions, consoleErrors, externalErrors, CancellationError,
    complete: () => context.provideSuggestionItems(
      { orderedGroups: () => [[completionProvider]] },
      { getWordAtPosition: () => null },
      { lineNumber: 1, column: 1, clone() { return this; } },
      options,
      { triggerKind: 0 },
      token,
    ),
    flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
  };
}

test('upstream cancellation is caught by Monaco but still falsely reported by Zone', async () => {
  const harness = createHarness({ upstream: true });
  harness.token.isCancellationRequested = true;
  await assert.rejects(harness.complete(), harness.CancellationError);
  await harness.flush();
  assert.equal(harness.consoleErrors.length, 1);
  assert.match(String(harness.consoleErrors[0][0]), /Canceled/);
});

test('canceling pending completions rejects normally, disposes results and avoids a Zone false error', async () => {
  let resolveProvider;
  const pending = new Promise((resolve) => { resolveProvider = resolve; });
  const harness = createHarness({ provider: { provideCompletionItems: () => pending } });
  const result = harness.complete();
  harness.token.isCancellationRequested = true;
  resolveProvider(harness.suggestions);
  await assert.rejects(result, harness.CancellationError);
  await harness.flush();
  assert.equal(harness.state.disposed, 1);
  assert.deepEqual(harness.consoleErrors, []);
  assert.deepEqual(harness.externalErrors, []);
});

test('successful completions remain available and retain their disposal lifecycle', async () => {
  const harness = createHarness();
  const result = await harness.complete();
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].completion.label, 'alpha');
  assert.equal(harness.state.disposed, 0);
  result.disposable.dispose();
  assert.equal(harness.state.disposed, 1);
  await harness.flush();
  assert.deepEqual(harness.consoleErrors, []);
});

test('unrelated provider errors still reach Monaco external error reporting', async () => {
  const failure = new Error('Provider failure');
  const harness = createHarness({ provider: { provideCompletionItems: async () => { throw failure; } } });
  const result = await harness.complete();
  assert.equal(result.items.length, 0);
  assert.deepEqual(harness.externalErrors, [failure]);
  await harness.flush();
  assert.deepEqual(harness.consoleErrors, []);
});

test('unrelated snippet failures still reject with the original error', async () => {
  const failure = new Error('Snippet failure');
  const harness = createHarness({ snippetProvider: { provideCompletionItems: async () => { throw failure; } } });
  await assert.rejects(harness.complete(), (error) => error === failure);
  await harness.flush();
  assert.deepEqual(harness.consoleErrors, []);
});
