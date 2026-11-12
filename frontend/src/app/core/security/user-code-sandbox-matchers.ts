export type SandboxExpect = ReturnType<typeof createSandboxExpect>;

const MAX_SHOWN_ITEMS = 20;
const MAX_SHOWN_DEPTH = 4;
const MAX_SHOWN_CHARS = 2000;

/**
 * A value in a failed assertion, written as the test author would write it: strings in quotes, and `undefined`,
 * array holes, `-0` and `NaN` as themselves. JSON printed the first three as `null` (or dropped the property), so
 * "Expected [1,null,2]" hid an `undefined` or a hole. Maps, sets, dates, errors and class instances keep `fallback`.
 */
export function formatExpectValue(value: unknown, fallback: (value: unknown) => string): string {
  const inProgress = new WeakSet<object>();
  const format = (v: unknown, depth: number): string => {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'string') return JSON.stringify(v.length > MAX_SHOWN_CHARS ? `${v.slice(0, MAX_SHOWN_CHARS)}…` : v);
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (typeof v === 'bigint') return `${v}n`;
    if (typeof v !== 'object') return fallback(v);
    if (inProgress.has(v)) return '[Circular]';
    if (Array.isArray(v)) {
      if (depth >= MAX_SHOWN_DEPTH) return '[Array]';
      inProgress.add(v);
      const shown = Math.min(v.length, MAX_SHOWN_ITEMS);
      const parts: string[] = [];
      for (let i = 0; i < shown; i += 1) parts.push(i in v ? format(v[i], depth + 1) : '<empty>');
      if (v.length > shown) parts.push(`… +${v.length - shown} more`);
      inProgress.delete(v);
      return `[${parts.join(',')}]`;
    }
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) return fallback(v);
    if (depth >= MAX_SHOWN_DEPTH) return '[Object]';
    inProgress.add(v);
    const keys = Object.keys(v);
    const parts = keys.slice(0, MAX_SHOWN_ITEMS).map((key) => `${JSON.stringify(key)}:${format((v as any)[key], depth + 1)}`);
    if (keys.length > MAX_SHOWN_ITEMS) parts.push('…');
    inProgress.delete(v);
    return `{${parts.join(',')}}`;
  };
  try {
    return format(value, 0);
  } catch {
    return fallback(value);
  }
}

export function createSandboxExpect(safeStringify: (value: unknown) => string) {
  const show = (value: unknown) => formatExpectValue(value, safeStringify);

  function deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }

  function matchObject(actual: any, expected: any): boolean {
    if (Object.is(actual, expected)) return true;
    if (expected === null || expected === undefined) return Object.is(actual, expected);
    if (typeof expected !== 'object') return Object.is(actual, expected);
    if (typeof actual !== 'object' || actual === null) return false;
    for (const k of Object.keys(expected)) {
      if (!matchObject(actual[k], expected[k])) return false;
    }
    return true;
  }

  function errorMessage(err: any): string {
    return String(err?.message ?? err);
  }

  function assertErrorLike(err: any, expected?: any): void {
    if (expected === undefined) return;
    const msg = errorMessage(err);

    if (typeof expected === 'string') {
      if (!msg.includes(expected)) {
        throw new Error(
          `Expected error message to include ${show(expected)}, received ${show(msg)}`,
        );
      }
      return;
    }

    if (expected instanceof RegExp) {
      if (!expected.test(msg)) {
        throw new Error(
          `Expected error message to match ${String(expected)}, received ${show(msg)}`,
        );
      }
      return;
    }

    if (typeof expected === 'function') {
      const expectedName = expected?.name || '';
      const actualName = err?.name || '';
      if (!(err instanceof expected) && (!expectedName || actualName !== expectedName)) {
        throw new Error(`Expected error type ${expectedName || 'Error'}`);
      }
    }
  }

  function assertThrows(fn: any, expected?: any): void {
    if (typeof fn !== 'function') throw new Error('toThrow expects a function');
    let thrown: any;
    try {
      fn();
    } catch (err) {
      thrown = err;
    }
    if (!thrown) throw new Error('Expected function to throw');
    assertErrorLike(thrown, expected);
  }

  function expect(received: any) {
    const makeAsync = (mode: 'resolves' | 'rejects') => {
      const resolveValue = async () => {
        try {
          return await Promise.resolve(received);
        } catch (err: any) {
          const msg = err?.message ? String(err.message) : 'Expected promise to resolve';
          throw new Error(msg);
        }
      };

      const rejectValue = async () => {
        const resolvedMarker = { value: undefined as any };
        try {
          resolvedMarker.value = await Promise.resolve(received);
          throw resolvedMarker;
        } catch (err: any) {
          if (err === resolvedMarker) {
            throw new Error(
              `Expected promise to reject, resolved with ${show(resolvedMarker.value)}`,
            );
          }
          return err;
        }
      };

      const run = async (cb: (value: any) => void | Promise<void>) => {
        await cb(mode === 'resolves' ? await resolveValue() : await rejectValue());
      };

      const matchers: any = {
        toBe: (expected: any) => run((v) => expect(v).toBe(expected)),
        toEqual: (expected: any) => run((v) => expect(v).toEqual(expected)),
        toStrictEqual: (expected: any) => run((v) => expect(v).toStrictEqual(expected)),
        toBeNaN: () => run((v) => expect(v).toBeNaN()),
        toBeCloseTo: (expected: number, precision?: number) =>
          run((v) => expect(v).toBeCloseTo(expected, precision)),
        toMatchObject: (expected: any) => run((v) => expect(v).toMatchObject(expected)),
      };

      if (mode === 'rejects') {
        matchers.toThrow = (expected?: any) => run((err) => assertErrorLike(err, expected));
      }

      return matchers;
    };

    return {
      toBe(expected: any) {
        if (!Object.is(received, expected)) {
          throw new Error(`Expected ${show(received)} to be ${show(expected)}`);
        }
      },
      toBeTruthy() {
        if (!received) throw new Error(`Expected ${show(received)} to be truthy`);
      },
      toBeFalsy() {
        if (received) throw new Error(`Expected ${show(received)} to be falsy`);
      },
      toEqual(expected: any) {
        if (!deepEqual(received, expected)) {
          throw new Error(
            `Expected ${show(received)} to deeply equal ${show(expected)}`,
          );
        }
      },
      toStrictEqual(expected: any) {
        if (!deepEqual(received, expected)) {
          throw new Error(
            `Expected ${show(received)} to strictly equal ${show(expected)}`,
          );
        }
      },
      toMatchObject(expected: any) {
        if (!matchObject(received, expected)) {
          throw new Error(
            `Expected ${show(received)} to match ${show(expected)}`,
          );
        }
      },
      toBeNaN() {
        if (!Number.isNaN(received)) throw new Error(`Expected ${show(received)} to be NaN`);
      },
      toBeCloseTo(expected: number, precision = 2) {
        const diff = Math.abs(Number(received) - Number(expected));
        const threshold = Math.pow(10, -precision) / 2;
        if (!(Number.isFinite(diff) && diff <= threshold)) {
          throw new Error(
            `Expected ${show(received)} to be close to ${show(expected)} (+/-${threshold})`,
          );
        }
      },
      toThrow(expected?: any) {
        assertThrows(received, expected);
      },
      resolves: makeAsync('resolves'),
      rejects: makeAsync('rejects'),
    };
  }

  return expect;
}
