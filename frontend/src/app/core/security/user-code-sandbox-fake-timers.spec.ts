import { createSandboxFakeTimers } from './user-code-sandbox-fake-timers';

describe('createSandboxFakeTimers', () => {
  // A scope of its own, so installing fake timers never touches the page running the spec.
  const makeScope = () => ({
    setTimeout: setTimeout.bind(window),
    clearTimeout: clearTimeout.bind(window),
    setInterval: setInterval.bind(window),
    clearInterval: clearInterval.bind(window),
    Date,
    performance: { now: () => 500 },
    MessageChannel,
  }) as any;

  it('runs timers in time order only when advanced, and moves Date and performance.now with them', () => {
    const scope = makeScope();
    const timers = createSandboxFakeTimers(scope);
    timers.useFakeTimers();
    const start = scope.Date.now();
    const calls: string[] = [];
    scope.setTimeout(() => calls.push('b'), 20);
    scope.setTimeout(() => calls.push('a'), 10);
    const interval = scope.setInterval(() => calls.push('tick'), 15);

    timers.advanceTimersByTime(9);
    expect(calls).toEqual([]);
    timers.advanceTimersByTime(21);
    expect(calls).toEqual(['a', 'tick', 'b', 'tick']);
    expect(scope.Date.now() - start).toBe(30);
    expect(new scope.Date().getTime() - start).toBe(30);
    expect(scope.performance.now()).toBe(530);

    scope.clearInterval(interval);
    timers.advanceTimersByTime(100);
    expect(calls.length).toBe(4);
  });

  it('lets awaited code schedule its next timer when advanced asynchronously', async () => {
    const scope = makeScope();
    const timers = createSandboxFakeTimers(scope);
    timers.useFakeTimers();
    const steps: number[] = [];
    const sleep = (ms: number) => new Promise((resolve) => scope.setTimeout(resolve, ms));
    void (async () => {
      for (let step = 1; step <= 3; step += 1) {
        await sleep(10);
        steps.push(step);
      }
    })();

    await timers.advanceTimersByTimeAsync(30);
    expect(steps).toEqual([1, 2, 3]);
  });

  it('keeps dates built from arguments, instanceof and Date() as a function working', () => {
    const scope = makeScope();
    const timers = createSandboxFakeTimers(scope);
    timers.useFakeTimers();

    const fixed = new scope.Date('2020-01-01T00:00:00Z');
    expect(fixed.toISOString()).toBe('2020-01-01T00:00:00.000Z');
    expect(fixed instanceof Date).toBeTrue();
    expect(new Date(0) instanceof scope.Date).toBeTrue();
    expect(typeof scope.Date()).toBe('string');
  });

  it('restores the scope and drops pending fake timers when real timers come back', () => {
    const scope = makeScope();
    const original = { setTimeout: scope.setTimeout, Date: scope.Date, now: scope.performance.now };
    const timers = createSandboxFakeTimers(scope);
    timers.useFakeTimers();
    let ran = false;
    scope.setTimeout(() => {
      ran = true;
    }, 5);

    timers.useRealTimers();
    expect(scope.setTimeout).toBe(original.setTimeout);
    expect(scope.Date).toBe(original.Date);
    expect(scope.performance.now).toBe(original.now);
    expect(() => timers.advanceTimersByTime(10)).toThrowError(/useFakeTimers\(\)/);

    timers.useFakeTimers();
    timers.advanceTimersByTime(10);
    expect(ran).toBeFalse();
  });

  it('stops an advance that a self-rescheduling timer would never let finish', () => {
    const scope = makeScope();
    const timers = createSandboxFakeTimers(scope);
    timers.useFakeTimers();
    const loop = () => scope.setTimeout(loop, 0);
    loop();

    expect(() => timers.advanceTimersByTime(1)).toThrowError(/keeps scheduling another one/);
  });
});
