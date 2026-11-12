import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { HARDENED_PROTOTYPE_CTORS } from '../security/user-code-sandbox-hardening';
import { createSandboxExpect } from '../security/user-code-sandbox-matchers';
import { userVisibleFailures } from '../utils/user-visible-failure-reporter';
import { UserCodeSandboxService, type RunnerOutput } from './user-code-sandbox.service';

class MockWorker {
  static instances: MockWorker[] = [];

  readonly terminate = jasmine.createSpy('terminate');
  readonly postMessage = jasmine.createSpy('postMessage').and.callFake((message: any) => {
    this.lastPostedMessage = message;
  });

  lastPostedMessage: any;
  private readonly messageListeners = new Set<(event: MessageEvent) => void>();
  private readonly errorListeners = new Set<(event: Event) => void>();

  constructor(_url: URL, _options?: WorkerOptions) {
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') return;
    if (type === 'message') {
      this.messageListeners.add(listener as (event: MessageEvent) => void);
      return;
    }
    if (type === 'error') {
      this.errorListeners.add(listener as (event: Event) => void);
    }
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') return;
    if (type === 'message') {
      this.messageListeners.delete(listener as (event: MessageEvent) => void);
      return;
    }
    if (type === 'error') {
      this.errorListeners.delete(listener as (event: Event) => void);
    }
  }

  emitMessage(data: any): void {
    for (const listener of this.messageListeners) {
      listener({ data } as MessageEvent);
    }
  }

  emitError(event: Event = new Event('error')): void {
    for (const listener of this.errorListeners) {
      listener(event);
    }
  }

  messageListenerCount(): number {
    return this.messageListeners.size;
  }

  errorListenerCount(): number {
    return this.errorListeners.size;
  }
}

describe('UserCodeSandboxService', () => {
  let originalWorker: typeof Worker;

  beforeEach(() => {
    originalWorker = window.Worker;
    MockWorker.instances = [];
    (window as any).Worker = MockWorker;
    (globalThis as any).Worker = MockWorker;
    spyOn(userVisibleFailures, 'report');
  });

  afterEach(() => {
    (window as any).Worker = originalWorker;
    (globalThis as any).Worker = originalWorker;
    MockWorker.instances = [];
  });

  it('force-stops a worker that never responds', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    let resolved: RunnerOutput | undefined;

    service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 }).then((result) => {
      resolved = result;
    });

    expect(MockWorker.instances.length).toBe(1);
    const worker = MockWorker.instances[0];
    expect(worker.messageListenerCount()).toBe(1);
    expect(worker.errorListenerCount()).toBe(1);

    tick(509);
    flushMicrotasks();
    expect(resolved).toBeUndefined();

    tick(1);
    flushMicrotasks();

    expect(resolved).toEqual(jasmine.objectContaining({
      timedOut: true,
      results: [],
      error: 'Sandbox was force-stopped after 510ms because execution blocked the worker.',
    }));
    expect(resolved?.entries.length).toBe(1);
    expect(resolved?.entries[0]).toEqual(jasmine.objectContaining({
      level: 'error',
      message: 'Sandbox was force-stopped after 510ms because execution blocked the worker.',
    }));
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.messageListenerCount()).toBe(0);
    expect(worker.errorListenerCount()).toBe(0);
  }));

  it('sends a multi-file task as its files, and a single-file task without any', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    const files = [{ path: 'src/money.js', code: 'export const one = 1;\n' }];

    void service.runWithTests({ userCode: '', testCode: "import { one } from './src/money.js';", files, timeoutMs: 10 });
    void service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 });

    expect(MockWorker.instances[0].lastPostedMessage.files).toEqual(files);
    expect(MockWorker.instances[0].lastPostedMessage.files).not.toBe(files);
    expect('files' in MockWorker.instances[1].lastPostedMessage).toBeFalse();
    tick(1000);
    flushMicrotasks();
  }));

  it('prefers worker completion before the hard watchdog fires', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    let resolved: RunnerOutput | undefined;
    let resolveCount = 0;

    service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 }).then((result) => {
      resolved = result;
      resolveCount += 1;
    });

    expect(MockWorker.instances.length).toBe(1);
    const worker = MockWorker.instances[0];

    setTimeout(() => {
      worker.emitMessage({
        type: 'done',
        nonce: worker.lastPostedMessage?.nonce,
        entries: [{ level: 'log', message: 'ok', timestamp: 1 }],
        results: [{ name: 'passes', passed: true }],
      });
    }, 10);

    tick(10);
    flushMicrotasks();

    expect(resolved).toEqual(jasmine.objectContaining({
      timedOut: false,
      error: undefined,
    }));
    expect(resolved?.results).toEqual([{ name: 'passes', passed: true }]);
    expect(resolveCount).toBe(1);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.messageListenerCount()).toBe(0);
    expect(worker.errorListenerCount()).toBe(0);

    tick(1000);
    flushMicrotasks();

    expect(resolveCount).toBe(1);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  }));

  it('keeps the tests that finished when a later test blocks the worker, and names the blocked one', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    let resolved: RunnerOutput | undefined;
    void service.runWithTests({ userCode: '', testCode: '', timeoutMs: 1500, testTimeoutMs: 1000 })
      .then((result) => { resolved = result; });
    const worker = MockWorker.instances[0];
    const progress = (data: Record<string, unknown>) =>
      worker.emitMessage({ type: 'progress', nonce: worker.lastPostedMessage.nonce, ...data });
    expect(worker.lastPostedMessage.testTimeoutMs).toBe(1000);

    progress({ phase: 'registered', tests: [{ idx: 0, name: 'first' }, { idx: 1, name: 'loops' }, { idx: 2, name: 'last' }] });
    progress({ phase: 'start', test: { idx: 0, name: 'first' } });
    progress({ phase: 'result', result: { name: 'first', passed: true, order: 0 } });
    progress({ phase: 'start', test: { idx: 1, name: 'loops' } });
    // The second test spins: no progress for the length of one test plus the watchdog's margin.
    tick(1499);
    flushMicrotasks();
    expect(resolved).toBeUndefined();
    tick(1);
    flushMicrotasks();

    expect(resolved?.timedOut).toBeTrue();
    expect(resolved?.results).toEqual([
      { name: 'first', passed: true, error: undefined },
      { name: 'loops', passed: false, error: 'Stopped after 1500 ms: this test kept the runner busy, as an endless loop does.' },
      { name: 'last', passed: false, error: 'Not run: the runner was stopped before this test.' },
    ]);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  }));

  it('lets a worker that keeps reporting progress run past the first deadline', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    let resolved: RunnerOutput | undefined;
    void service.runWithTests({ userCode: '', testCode: '', timeoutMs: 1500, testTimeoutMs: 1000 })
      .then((result) => { resolved = result; });
    const worker = MockWorker.instances[0];
    const nonce = worker.lastPostedMessage.nonce;

    worker.emitMessage({ type: 'progress', nonce, phase: 'registered', tests: [0, 1, 2, 3].map((idx) => ({ idx, name: `t${idx}` })) });
    // Four tests of 900 ms each: 3.6 s in all, past the 2 s the loading phase allows, but never 1.5 s without news.
    for (const idx of [0, 1, 2, 3]) {
      worker.emitMessage({ type: 'progress', nonce, phase: 'start', test: { idx, name: `t${idx}` } });
      tick(900);
      worker.emitMessage({ type: 'progress', nonce, phase: 'result', result: { name: `t${idx}`, passed: true, order: idx } });
    }
    flushMicrotasks();
    expect(resolved).toBeUndefined();

    worker.emitMessage({ type: 'done', nonce, entries: [], results: [{ name: 't0', passed: true }] });
    flushMicrotasks();
    expect(resolved?.timedOut).toBeFalse();
    expect(userVisibleFailures.report).not.toHaveBeenCalled();
  }));

  it('prevents default propagation when the sandbox worker emits an error', fakeAsync(() => {
    const service = new UserCodeSandboxService();
    let resolved: RunnerOutput | undefined;

    service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 }).then((result) => {
      resolved = result;
    });

    expect(MockWorker.instances.length).toBe(1);
    const worker = MockWorker.instances[0];
    const errorEvent = new Event('error', { cancelable: true });
    spyOn(errorEvent, 'preventDefault').and.callThrough();

    worker.emitError(errorEvent);
    flushMicrotasks();

    expect(errorEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(errorEvent.defaultPrevented).toBeTrue();
    expect(resolved).toEqual(jasmine.objectContaining({
      results: [],
      error: 'Worker crashed',
    }));
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.messageListenerCount()).toBe(0);
    expect(worker.errorListenerCount()).toBe(0);
  }));

  it('reports a crashed or force-stopped runner as a user-visible failure, but not a finished run', fakeAsync(() => {
    const service = new UserCodeSandboxService();

    void service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 });
    MockWorker.instances[0].emitError(new Event('error', { cancelable: true }));
    flushMicrotasks();

    void service.runWithTests({ userCode: 'while (true) {}', testCode: 'test()', timeoutMs: 10 });
    tick(510);
    flushMicrotasks();

    void service.runWithTests({ userCode: 'const value = 1;', testCode: 'test()', timeoutMs: 10 });
    const finished = MockWorker.instances[2];
    finished.emitMessage({ type: 'done', nonce: finished.lastPostedMessage?.nonce, entries: [], results: [] });
    flushMicrotasks();
    tick(1000);

    expect((userVisibleFailures.report as jasmine.Spy).calls.allArgs()).toEqual([
      ['runner_crashed'],
      ['runner_force_stopped', { timeoutMs: 510 }],
    ]);
  }));
});

describe('UserCodeSandboxService hardening configuration', () => {
  it('keeps Array.prototype extensible for catalog prototype-extension drills', () => {
    expect(HARDENED_PROTOTYPE_CTORS).not.toContain(Array as any);
  });
});

describe('UserCodeSandboxService matcher DSL', () => {
  const sandboxExpect = createSandboxExpect((value) => {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  });

  it('writes failed values as the test author would: undefined, holes, -0 and quoted strings', () => {
    // eslint-disable-next-line no-sparse-arrays
    const withHole = [1, undefined, 2, , 3];
    expect(() => sandboxExpect(withHole).toEqual([1, 2, 3]))
      .toThrowError('Expected [1,undefined,2,<empty>,3] to deeply equal [1,2,3]');
    expect(() => sandboxExpect(undefined).toBe('Ada')).toThrowError('Expected undefined to be "Ada"');
    expect(() => sandboxExpect(-0).toBe(0)).toThrowError('Expected -0 to be 0');
    expect(() => sandboxExpect({ a: undefined, b: NaN }).toEqual({})).toThrowError('Expected {"a":undefined,"b":NaN} to deeply equal {}');
  });

  it('supports async error matchers used by catalog tests', async () => {
    await expectAsync(
      sandboxExpect(Promise.reject(new Error('boom'))).rejects.toThrow('boom'),
    ).toBeResolved();
    await expectAsync(
      sandboxExpect(Promise.reject(new TypeError('bad type'))).rejects.toThrow(TypeError),
    ).toBeResolved();

    const abort = new Error('aborted');
    abort.name = 'AbortError';
    await expectAsync(
      sandboxExpect(Promise.reject(abort)).rejects.toMatchObject({ name: 'AbortError' }),
    ).toBeResolved();
  });

  it('supports sync toThrow expected values', () => {
    expect(() => {
      sandboxExpect(() => {
        throw new Error('boom went off');
      }).toThrow('boom');
      sandboxExpect(() => {
        throw new Error('boom went off');
      }).toThrow(/went off/);
      sandboxExpect(() => {
        throw new TypeError('bad type');
      }).toThrow(TypeError);
    }).not.toThrow();
  });

  it('supports strict equality as a deep-equality alias', () => {
    expect(() => {
      sandboxExpect({ value: [1, 2, 3] }).toStrictEqual({ value: [1, 2, 3] });
    }).not.toThrow();
  });

  it('fails rejects.toThrow when the promise resolves', async () => {
    await expectAsync(
      sandboxExpect(Promise.resolve('ok')).rejects.toThrow('boom'),
    ).toBeRejectedWithError(/Expected promise to reject/);
  });
});
