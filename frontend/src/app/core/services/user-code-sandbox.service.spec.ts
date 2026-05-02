import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { HARDENED_PROTOTYPE_CTORS } from '../security/user-code-sandbox-hardening';
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
});

describe('UserCodeSandboxService hardening configuration', () => {
  it('keeps Array.prototype extensible for catalog prototype-extension drills', () => {
    expect(HARDENED_PROTOTYPE_CTORS).not.toContain(Array as any);
  });
});
