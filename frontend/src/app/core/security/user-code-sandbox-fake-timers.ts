// Fake timers for sandbox tests. useFakeTimers() swaps the timer functions, Date and performance.now of a scope for a
// clock that moves only when a test advances it, so timing tests run instantly and the same way every time. The runner
// keeps its own timers, taken before any test could swap them, and turns fake timers off after every test.

type TimerCallback = (...args: unknown[]) => unknown;
type FakeTimer = { id: number; at: number; order: number; callback: TimerCallback; args: unknown[]; every: number | null };
type TimerScope = {
  setTimeout: unknown;
  clearTimeout: unknown;
  setInterval: unknown;
  clearInterval: unknown;
  Date: DateConstructor;
  performance?: { now(): number };
  MessageChannel?: typeof MessageChannel;
};

export type SandboxFakeTimers = {
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(ms: number): void;
  /** Like advanceTimersByTime, but lets promises settle before and after each timer, for code that awaits between timers. */
  advanceTimersByTimeAsync(ms: number): Promise<void>;
};

// A timer that keeps scheduling another one at the same moment would otherwise never let an advance finish.
const MAX_TIMERS_PER_ADVANCE = 10_000;

export function createSandboxFakeTimers(scope: TimerScope): SandboxFakeTimers {
  const real = {
    setTimeout: scope.setTimeout,
    clearTimeout: scope.clearTimeout,
    setInterval: scope.setInterval,
    clearInterval: scope.clearInterval,
    Date: scope.Date,
  };
  const realSetTimeout = real.setTimeout as (callback: () => void, ms: number) => unknown;
  const performance = scope.performance;
  const RealMessageChannel = scope.MessageChannel;

  let installed = false;
  let clock = 0;
  let installedAt = 0;
  let performanceAtInstall = 0;
  let performanceNow: PropertyDescriptor | undefined;
  let nextId = 1;
  let nextOrder = 0;
  const timers = new Map<number, FakeTimer>();

  // One task on the real event loop, so every promise reaction queued so far runs first.
  const settle = () => new Promise<void>((resolve) => {
    if (RealMessageChannel) {
      const channel = new RealMessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        resolve();
      };
      channel.port2.postMessage(null);
    } else {
      realSetTimeout.call(scope, resolve, 0);
    }
  });

  const schedule = (callback: unknown, delay: unknown, args: unknown[], repeat: boolean): number => {
    if (typeof callback !== 'function') throw new TypeError('Fake timers run functions, not strings of code.');
    const ms = Math.max(0, Number(delay) || 0);
    const id = nextId++;
    timers.set(id, { id, at: clock + ms, order: nextOrder++, callback: callback as TimerCallback, args, every: repeat ? Math.max(1, ms) : null });
    return id;
  };
  const clear = (id: unknown) => {
    timers.delete(Number(id));
  };

  const RealDate = real.Date;
  // new Date() and Date.now() read the fake clock; a date built from arguments is an ordinary date.
  const FakeDate = function (this: unknown, ...args: unknown[]) {
    if (!new.target) return new RealDate(clock).toString();
    return Reflect.construct(RealDate, args.length ? args : [clock], new.target);
  } as unknown as DateConstructor;
  Object.defineProperties(FakeDate, {
    prototype: { value: RealDate.prototype },
    now: { value: () => clock, writable: true, configurable: true },
    parse: { value: RealDate.parse, writable: true, configurable: true },
    UTC: { value: RealDate.UTC, writable: true, configurable: true },
  });

  const install = () => {
    clock = RealDate.now();
    installedAt = clock;
    timers.clear();
    const target = scope as Record<string, unknown>;
    target['setTimeout'] = (callback: unknown, delay?: unknown, ...args: unknown[]) => schedule(callback, delay, args, false);
    target['clearTimeout'] = clear;
    target['setInterval'] = (callback: unknown, delay?: unknown, ...args: unknown[]) => schedule(callback, delay, args, true);
    target['clearInterval'] = clear;
    target['Date'] = FakeDate;
    if (performance) {
      performanceAtInstall = performance.now();
      performanceNow = Object.getOwnPropertyDescriptor(performance, 'now');
      Object.defineProperty(performance, 'now', {
        value: () => performanceAtInstall + (clock - installedAt),
        writable: true,
        configurable: true,
      });
    }
    installed = true;
  };

  const uninstall = () => {
    if (!installed) return;
    const target = scope as Record<string, unknown>;
    target['setTimeout'] = real.setTimeout;
    target['clearTimeout'] = real.clearTimeout;
    target['setInterval'] = real.setInterval;
    target['clearInterval'] = real.clearInterval;
    target['Date'] = RealDate;
    if (performance) {
      if (performanceNow) Object.defineProperty(performance, 'now', performanceNow);
      else delete (performance as { now?: unknown }).now;
    }
    timers.clear();
    installed = false;
  };

  const requireInstalled = (name: string) => {
    if (!installed) throw new Error(`Call useFakeTimers() before ${name}().`);
  };

  const nextDue = (limit: number): FakeTimer | undefined => {
    let next: FakeTimer | undefined;
    for (const timer of timers.values()) {
      if (timer.at > limit) continue;
      if (!next || timer.at < next.at || (timer.at === next.at && timer.order < next.order)) next = timer;
    }
    return next;
  };

  const fire = (timer: FakeTimer) => {
    clock = timer.at;
    if (timer.every === null) {
      timers.delete(timer.id);
    } else {
      timer.at += timer.every;
      timer.order = nextOrder++;
    }
    timer.callback(...timer.args);
  };

  const tooManyTimers = (name: string, ms: number) =>
    new Error(`${name}(${ms}) ran ${MAX_TIMERS_PER_ADVANCE} timers without reaching the end; a timer probably keeps scheduling another one.`);

  return {
    useFakeTimers() {
      uninstall();
      install();
    },
    useRealTimers() {
      uninstall();
    },
    advanceTimersByTime(ms: number) {
      requireInstalled('advanceTimersByTime');
      const end = clock + Math.max(0, Number(ms) || 0);
      let runs = 0;
      for (let timer = nextDue(end); timer; timer = nextDue(end)) {
        if (++runs > MAX_TIMERS_PER_ADVANCE) throw tooManyTimers('advanceTimersByTime', ms);
        fire(timer);
      }
      clock = end;
    },
    async advanceTimersByTimeAsync(ms: number) {
      requireInstalled('advanceTimersByTimeAsync');
      const end = clock + Math.max(0, Number(ms) || 0);
      let runs = 0;
      await settle();
      for (let timer = nextDue(end); timer; timer = nextDue(end)) {
        if (++runs > MAX_TIMERS_PER_ADVANCE) throw tooManyTimers('advanceTimersByTimeAsync', ms);
        fire(timer);
        await settle();
      }
      clock = end;
    },
  };
}
