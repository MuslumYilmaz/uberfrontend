import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const catalogPath = path.join(repoRoot, 'cdn/questions/javascript/coding.json');
const graphDir = path.join(repoRoot, 'cdn/questions/javascript/decision-graphs');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function getQuestion(id) {
  const question = catalog.find((entry) => entry.id === id);
  assert.ok(question, `Missing canonical question: ${id}`);
  return question;
}

function getSolutionCode(id, language = 'js') {
  const field = language === 'ts' ? 'codeTs' : 'codeJs';
  const code = getQuestion(id).solutionBlock?.approaches?.[0]?.[field];
  assert.equal(typeof code, 'string', `Missing ${language} solution: ${id}`);
  return code;
}

async function importSolution(id, language = 'js') {
  const source = getSolutionCode(id, language);
  const executable = language === 'ts'
    ? ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
          strict: true,
        },
        reportDiagnostics: true,
        fileName: `${id}.ts`,
      }).outputText
    : source;
  const url = `data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#${id}-${language}`;
  return (await import(url)).default;
}

function assertDecisionGraphParity(id) {
  const question = getQuestion(id);
  const fileName = path.basename(question.decisionGraphAsset);
  const graph = JSON.parse(fs.readFileSync(path.join(graphDir, fileName), 'utf8'));
  for (const [key, variant] of Object.entries(graph.variants ?? {})) {
    const approach = question.solutionBlock?.approaches?.find(
      (candidate) => candidate.decisionGraphKey === key,
    );
    assert.ok(approach, `${id} decision graph has no canonical approach for ${key}`);
    assert.equal(variant.code, approach.codeJs, `${id}/${key} decision graph is stale`);
  }
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  return {
    setTimeout(fn, delay = 0) {
      const id = nextId++;
      timers.set(id, { at: now + Math.max(0, Number(delay) || 0), fn });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    count() {
      return timers.size;
    },
    async advance(ms) {
      const target = now + ms;
      await Promise.resolve();

      while (true) {
        let selectedId;
        let selected;
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!selected || timer.at < selected.at)) {
            selectedId = id;
            selected = timer;
          }
        }
        if (!selected) break;

        now = selected.at;
        timers.delete(selectedId);
        selected.fn();
        await Promise.resolve();
        await Promise.resolve();
      }

      now = target;
      await Promise.resolve();
    },
  };
}

async function withFakeClock(run) {
  const clock = createFakeClock();
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.setTimeout = clock.setTimeout;
  globalThis.clearTimeout = clock.clearTimeout;
  try {
    await run(clock);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
}

function createSignal() {
  const listeners = new Set();
  const signal = {
    aborted: false,
    reason: undefined,
    addEventListener(type, listener) {
      if (type === 'abort') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'abort') listeners.delete(listener);
    },
  };

  return {
    signal,
    listenerCount: () => listeners.size,
    abort(reason) {
      if (signal.aborted) return;
      signal.aborted = true;
      signal.reason = reason;
      for (const listener of [...listeners]) listener();
    },
  };
}

async function testSanitizeHrefUrl() {
  for (const language of ['js', 'ts']) {
    const sanitizeHrefUrl = await importSolution('js-sanitize-href-url', language);

    for (const input of [
      '',
      ' ',
      '   ',
      '\t',
      ' \t ',
      '\u0000 javascript:alert(1)',
      'java\u0000script:alert(1)',
      '\r\njavascript:alert(1)',
      'java%0Ascript:alert(1)',
      '/safe%1Fpath',
      'https://example.com/%7f',
      '/\\evil.com',
      '/safe\\segment',
      '//evil.example',
      '  //evil.example  ',
      '  JaVaScRiPt:alert(1)  ',
      'data:text/html,test',
      'https://',
    ]) {
      assert.equal(
        sanitizeHrefUrl(input),
        null,
        `${language}: expected unsafe href to be rejected: ${JSON.stringify(input)}`,
      );
    }

    assert.equal(sanitizeHrefUrl('/settings'), '/settings');
    assert.equal(sanitizeHrefUrl('../settings'), '../settings');
    assert.equal(sanitizeHrefUrl('?q=test'), '?q=test');
    assert.equal(sanitizeHrefUrl('#section'), '#section');
    assert.equal(sanitizeHrefUrl('profile'), 'profile');
    assert.equal(sanitizeHrefUrl('  https://example.com  '), 'https://example.com/');
    assert.equal(sanitizeHrefUrl('HTTP://EXAMPLE.COM'), 'http://example.com/');
    assert.equal(sanitizeHrefUrl('https://example.com/path'), 'https://example.com/path');
    assert.equal(sanitizeHrefUrl('mailto:hi@example.com'), 'mailto:hi@example.com');
    assert.equal(sanitizeHrefUrl('tel:+15551234567'), 'tel:+15551234567');
  }
}

async function testPollUntil() {
  for (const language of ['js', 'ts']) {
    const pollUntil = await importSolution('js-poll-until', language);

    await withFakeClock(async (clock) => {
      const outcome = pollUntil(() => 'ready', { timeout: 0 });
      await clock.advance(0);
      assert.equal(await outcome, 'ready');
      assert.equal(clock.count(), 0);
    });

    await withFakeClock(async (clock) => {
      const outcome = pollUntil(() => false, { timeout: 0 }).then(() => null, (error) => error);
      await clock.advance(0);
      assert.equal((await outcome)?.message, 'Timeout');
      assert.equal(clock.count(), 0);
    });

    await withFakeClock(async (clock) => {
      const outcome = pollUntil(() => new Promise(() => {}), { timeout: 20 }).then(
        () => null,
        (error) => error,
      );
      await clock.advance(20);
      assert.equal((await outcome)?.message, 'Timeout');
      assert.equal(clock.count(), 0);
    });

    await withFakeClock(async (clock) => {
      let calls = 0;
      const outcome = pollUntil(() => {
        calls += 1;
        return false;
      }, { interval: 100, timeout: 10 }).then(() => null, (error) => error);
      await clock.advance(10);
      assert.equal((await outcome)?.message, 'Timeout');
      assert.equal(calls, 1);
      assert.equal(clock.count(), 0);
    });

    await withFakeClock(async (clock) => {
      let finishCheck;
      const control = createSignal();
      const outcome = pollUntil(
        () => new Promise((resolve) => { finishCheck = resolve; }),
        { interval: 10, timeout: 100, signal: control.signal },
      ).then(() => null, (error) => error);

      control.abort();
      assert.equal((await outcome)?.name, 'AbortError');
      finishCheck(false);
      await clock.advance(200);
      assert.equal(clock.count(), 0);
      assert.equal(control.listenerCount(), 0);
    });

    {
      let calls = 0;
      const control = createSignal();
      control.abort();
      const outcome = pollUntil(() => {
        calls += 1;
        return true;
      }, { signal: control.signal }).then(() => null, (error) => error);
      assert.equal((await outcome)?.name, 'AbortError');
      assert.equal(calls, 0);
      assert.equal(control.listenerCount(), 0);
    }

    await withFakeClock(async (clock) => {
      const control = createSignal();
      const failure = new Error('async rejection');
      const outcome = pollUntil(
        () => Promise.reject(failure),
        { timeout: 50, signal: control.signal },
      ).then(() => null, (error) => error);
      await clock.advance(0);
      assert.equal(await outcome, failure);
      assert.equal(clock.count(), 0);
      assert.equal(control.listenerCount(), 0);
    });

    const syncError = new Error('sync failure');
    await assert.rejects(pollUntil(() => { throw syncError; }), (error) => error === syncError);
    const asyncError = new Error('async failure');
    await assert.rejects(pollUntil(() => Promise.reject(asyncError)), (error) => error === asyncError);

    await withFakeClock(async (clock) => {
      const control = createSignal();
      assert.equal(await pollUntil(() => 'ready', { timeout: 0, signal: control.signal }), 'ready');
      assert.equal(clock.count(), 0);
      assert.equal(control.listenerCount(), 0);
    });
  }
}

async function testMyNew() {
  for (const language of ['js', 'ts']) {
    const myNew = await importSolution('js-implement-new', language);

    function Person(name) {
      this.name = name;
    }
    Person.prototype.say = function say() { return `hi ${this.name}`; };
    const person = myNew(Person, 'Ada');
    assert.equal(person.name, 'Ada');
    assert.equal(person.say(), 'hi Ada');
    assert.ok(person instanceof Person);

    class Account {
      constructor(id) {
        this.id = id;
      }
    }
    const account = myNew(Account, 42);
    assert.equal(account.id, 42);
    assert.ok(account instanceof Account);

    const BoundPerson = Person.bind(null, 'Bound Ada');
    const boundPerson = myNew(BoundPerson);
    assert.ok(boundPerson instanceof Person);
    assert.ok(boundPerson instanceof BoundPerson);

    function CaptureTarget() {
      this.target = new.target;
    }
    assert.equal(myNew(CaptureTarget).target, CaptureTarget);

    function NullPrototype() {}
    NullPrototype.prototype = null;
    function PrimitivePrototype() {}
    PrimitivePrototype.prototype = 7;
    assert.equal(Object.getPrototypeOf(myNew(NullPrototype)), Object.prototype);
    assert.equal(Object.getPrototypeOf(myNew(PrimitivePrototype)), Object.prototype);

    function ReturnsObject() { return { ok: true }; }
    function ReturnsFunction() { return function returned() {}; }
    function ReturnsPrimitive() { this.ok = true; return 1; }
    assert.deepEqual(myNew(ReturnsObject), { ok: true });
    assert.equal(typeof myNew(ReturnsFunction), 'function');
    assert.equal(myNew(ReturnsPrimitive).ok, true);

    assert.throws(() => myNew(() => {}), TypeError);
    assert.throws(() => myNew(({ method() {} }).method), TypeError);
  }
}

async function testPromiseAny() {
  for (const language of ['js', 'ts']) {
    const promiseAny = await importSolution('js-promise-any', language);

    assert.equal(await promiseAny(new Array(1)), undefined);
    const sparse = [];
    sparse[1] = Promise.reject('rejected');
    assert.equal(await promiseAny(sparse), undefined);

    const emptyError = await promiseAny([]).then(() => null, (error) => error);
    assert.ok(emptyError instanceof AggregateError);
    assert.deepEqual(emptyError.errors, []);

    let rejectFirst;
    let rejectSecond;
    const orderedError = promiseAny([
      new Promise((_, reject) => { rejectFirst = reject; }),
      new Promise((_, reject) => { rejectSecond = reject; }),
    ]).then(() => null, (error) => error);
    rejectSecond('second');
    rejectFirst('first');
    assert.deepEqual((await orderedError).errors, ['first', 'second']);

    assert.equal(await promiseAny(new Set([Promise.reject('no'), 'set value'])), 'set value');
    function* values() {
      yield Promise.reject('still no');
      yield 'generator value';
    }
    assert.equal(await promiseAny(values()), 'generator value');
    await assert.rejects(promiseAny(null), TypeError);
  }
}

async function testShallowClone() {
  for (const language of ['js', 'ts']) {
    const shallowClone = await importSolution('js-shallow-clone', language);
    const symbolKey = Symbol('meta');
    const nested = { shared: true };
    const source = new Array(5);
    source[1] = nested;
    source.extra = 7;
    source[symbolKey] = 9;

    const copy = shallowClone(source);
    assert.notEqual(copy, source);
    assert.equal(copy.length, 5);
    assert.equal(0 in copy, false);
    assert.equal(1 in copy, true);
    assert.equal(2 in copy, false);
    assert.equal(4 in copy, false);
    assert.equal(copy[1], nested);
    assert.equal(copy.extra, 7);
    assert.equal(copy[symbolKey], 9);
  }
}

async function testEscapeHtmlContract() {
  const question = getQuestion('js-escape-html');
  const contract = [
    question.description.summary,
    question.solutionBlock.overview,
    ...question.solutionBlock.notes.pitfalls,
  ].join(' ');
  assert.match(contract, /constructed markup string/i);
  assert.match(contract, /textContent/);
  assert.match(contract, /URLs/);
  assert.match(contract, /event handlers/);
  assert.match(contract, /style\/CSS/);
  assert.match(contract, /unquoted attributes/);
  assert.doesNotMatch(question.description.summary, /safely inserted into HTML text nodes or attributes/i);

  for (const language of ['js', 'ts']) {
    const escapeHtml = await importSolution('js-escape-html', language);
    assert.equal(
      escapeHtml('<p title="x">Tom & Jerry\'s</p>'),
      '&lt;p title=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/p&gt;',
    );
  }
}

async function testMyBind() {
  const question = getQuestion('js-implement-bind');
  assert.match(question.description.summary, /not a complete/i);
  assert.match(question.description.summary, /ES classes/);
  assert.match(question.description.summary, /new\.target/);
  assert.doesNotMatch(getSolutionCode('js-implement-bind'), /this instanceof boundFn/);

  for (const language of ['js', 'ts']) {
    const myBind = await importSolution('js-implement-bind', language);

    function setValue(prefix, value) {
      this.value = `${prefix}:${value}`;
      return this.value;
    }
    const target = {};
    const bound = myBind(setValue, target, 'bound');
    assert.equal(bound('call'), 'bound:call');
    assert.equal(target.value, 'bound:call');

    const inheritedReceiver = Object.create(bound.prototype);
    bound.call(inheritedReceiver, 'ordinary');
    assert.equal(target.value, 'bound:ordinary');
    assert.equal(inheritedReceiver.value, undefined);

    function Person(name) { this.name = name; }
    const BoundPerson = myBind(Person, { name: 'ignored' });
    const person = new BoundPerson('Ada');
    assert.equal(person.name, 'Ada');
    assert.ok(person instanceof Person);
    assert.ok(person instanceof BoundPerson);
  }
}

async function testMyInstanceOf() {
  const question = getQuestion('js-implement-instanceof');
  assert.match(question.description.summary, /Symbol\.hasInstance/);
  assert.match(question.description.summary, /bound-function internals/);

  for (const language of ['js', 'ts']) {
    const myInstanceOf = await importSolution('js-implement-instanceof', language);
    function Person() {}
    assert.equal(myInstanceOf(new Person(), Person), true);
    assert.equal(myInstanceOf(1, Number), false);
    assert.throws(() => myInstanceOf(1, {}), TypeError);
    assert.throws(() => myInstanceOf({}, () => {}), TypeError);

    function InvalidPrototype() {}
    InvalidPrototype.prototype = 1;
    assert.throws(() => myInstanceOf({}, InvalidPrototype), TypeError);
  }
}

async function testDeferredExamples() {
  const question = getQuestion('js-create-deferred-promise');
  const renderedExamples = question.description.examples.join('\n\n');
  assert.match(renderedExamples, /const adopted = createDeferred\(\)/);
  const AsyncFunction = Object.getPrototypeOf(async function noop() {}).constructor;

  for (const language of ['js', 'ts']) {
    const createDeferred = await importSolution('js-create-deferred-promise', language);
    const runExamples = new AsyncFunction('createDeferred', renderedExamples);
    await runExamples(createDeferred);
  }
}

async function testDebounceExample() {
  const example = getQuestion('js-debounce').description.examples[1];
  assert.match(example, /const sayHello = debounce/);
  assert.match(example, /sayHello\(\)/);

  for (const language of ['js', 'ts']) {
    const debounce = await importSolution('js-debounce', language);
    await withFakeClock(async (clock) => {
      const calls = [];
      const runExample = new Function('debounce', 'console', example);
      runExample(debounce, { log: (value) => calls.push(value) });
      assert.deepEqual(calls, []);
      await clock.advance(299);
      assert.deepEqual(calls, []);
      await clock.advance(1);
      assert.deepEqual(calls, ['Hello!']);
      assert.equal(clock.count(), 0);
    });
  }
}

async function testTakeLatestCleanup() {
  for (const language of ['js', 'ts']) {
    const takeLatest = await importSolution('js-take-latest', language);
    const completedSignals = [];
    const completedLatest = takeLatest(async (signal, value) => {
      completedSignals.push(signal);
      return value;
    });
    assert.equal(await completedLatest('first'), 'first');
    const firstCompletedSignal = completedSignals[0];
    assert.equal(await completedLatest('second'), 'second');
    assert.equal(firstCompletedSignal.aborted, false);

    const runs = [];
    const controlledLatest = takeLatest((signal, value) => new Promise((resolve) => {
      runs.push({ signal, value, resolve });
    }));
    const first = controlledLatest('first');
    await Promise.resolve();
    const second = controlledLatest('second');
    await Promise.resolve();
    runs[0].resolve('first');
    await assert.rejects(first, (error) => error?.name === 'AbortError');

    const third = controlledLatest('third');
    await Promise.resolve();
    assert.equal(runs[1].signal.aborted, true);
    runs[1].resolve('second');
    runs[2].resolve('third');
    await assert.rejects(second, (error) => error?.name === 'AbortError');
    assert.equal(await third, 'third');
  }
}

async function testStreamToTextCleanup() {
  for (const language of ['js', 'ts']) {
    const streamToText = await importSolution('js-stream-to-text', language);

    let successReleases = 0;
    assert.equal(await streamToText({
      getReader: () => ({
        read: async () => ({ done: true }),
        releaseLock: () => { successReleases += 1; },
      }),
    }), '');
    assert.equal(successReleases, 1);

    let failureReleases = 0;
    const readFailure = new Error('read failed');
    await assert.rejects(streamToText({
      getReader: () => ({
        read: async () => { throw readFailure; },
        releaseLock: () => { failureReleases += 1; },
      }),
    }), (error) => error === readFailure);
    assert.equal(failureReleases, 1);

    let decoderFailureReleases = 0;
    await assert.rejects(streamToText({
      getReader: () => ({
        read: async () => ({ done: true }),
        releaseLock: () => { decoderFailureReleases += 1; },
      }),
    }, { encoding: 'definitely-not-an-encoding' }));
    assert.equal(decoderFailureReleases, 1);

    const control = createSignal();
    control.abort(new Error('already aborted'));
    let cancellations = 0;
    let abortReleases = 0;
    await assert.rejects(streamToText({
      getReader: () => ({
        read: async () => ({ done: true }),
        cancel: () => { cancellations += 1; },
        releaseLock: () => { abortReleases += 1; },
      }),
    }, { signal: control.signal }), (error) => error?.name === 'AbortError');
    assert.equal(cancellations, 1);
    assert.equal(abortReleases, 1);
    assert.equal(control.listenerCount(), 0);
  }
}

async function importEmbeddedFetchMock(language) {
  const question = getQuestion('js-fetch-json-timeout');
  const tests = language === 'ts' ? question.testsTs : question.tests;
  const start = tests.indexOf('function toAbortError');
  const end = tests.indexOf('describe(');
  assert.ok(start >= 0 && end > start, `Missing ${language} fetch mock prelude`);
  let source = `${tests.slice(start, end)}\nexport { makeFetch };`;
  if (language === 'ts') {
    source = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        strict: true,
      },
      reportDiagnostics: true,
      fileName: 'fetch-json-timeout-tests.ts',
    }).outputText;
  }
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#fetch-mock-${language}`;
  return (await import(url)).makeFetch;
}

async function testFetchJsonMock() {
  const question = getQuestion('js-fetch-json-timeout');
  for (const [language, tests] of [['js', question.tests], ['ts', question.testsTs]]) {
    assert.ok(tests.indexOf('let timerId') < tests.indexOf('const onAbort'));
    assert.match(tests, /embedded fetch mock handles an already-aborted signal/);

    const makeFetch = await importEmbeddedFetchMock(language);
    const controller = new AbortController();
    controller.abort(new Error('Already cancelled'));
    await assert.rejects(
      makeFetch()('/already-aborted', { signal: controller.signal }),
      (error) => error?.name === 'AbortError' && error?.message === 'Already cancelled',
    );

    const fetchJson = await importSolution('js-fetch-json-timeout', language);
    let fetchCalled = false;
    await assert.rejects(fetchJson('/already-aborted', {
      signal: controller.signal,
      fetchFn: async () => {
        fetchCalled = true;
        throw new Error('must not run');
      },
    }), (error) => error?.name === 'AbortError');
    assert.equal(fetchCalled, false);
  }
}

assertDecisionGraphParity('js-sanitize-href-url');
assertDecisionGraphParity('js-poll-until');
assertDecisionGraphParity('js-implement-new');
assertDecisionGraphParity('js-promise-any');
assertDecisionGraphParity('js-shallow-clone');
assertDecisionGraphParity('js-escape-html');
assertDecisionGraphParity('js-implement-bind');
assertDecisionGraphParity('js-implement-instanceof');
assertDecisionGraphParity('js-create-deferred-promise');
assertDecisionGraphParity('js-debounce');
assertDecisionGraphParity('js-take-latest');
assertDecisionGraphParity('js-stream-to-text');
assertDecisionGraphParity('js-fetch-json-timeout');
await testSanitizeHrefUrl();
await testPollUntil();
await testMyNew();
await testPromiseAny();
await testShallowClone();
await testEscapeHtmlContract();
await testMyBind();
await testMyInstanceOf();
await testDeferredExamples();
await testDebounceExample();
await testTakeLatestCleanup();
await testStreamToTextCleanup();
await testFetchJsonMock();

console.log('Question solution regressions passed (P0/P1/P2 JavaScript + TypeScript catalog).');
