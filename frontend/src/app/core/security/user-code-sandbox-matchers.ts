export type SandboxExpect = ReturnType<typeof createSandboxExpect>;

export function createSandboxExpect(safeStringify: (value: unknown) => string) {
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
          `Expected error message to include ${safeStringify(expected)}, received ${safeStringify(msg)}`,
        );
      }
      return;
    }

    if (expected instanceof RegExp) {
      if (!expected.test(msg)) {
        throw new Error(
          `Expected error message to match ${String(expected)}, received ${safeStringify(msg)}`,
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
              `Expected promise to reject, resolved with ${safeStringify(resolvedMarker.value)}`,
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
          throw new Error(`Expected ${safeStringify(received)} to be ${safeStringify(expected)}`);
        }
      },
      toBeTruthy() {
        if (!received) throw new Error(`Expected ${safeStringify(received)} to be truthy`);
      },
      toBeFalsy() {
        if (received) throw new Error(`Expected ${safeStringify(received)} to be falsy`);
      },
      toEqual(expected: any) {
        if (!deepEqual(received, expected)) {
          throw new Error(
            `Expected ${safeStringify(received)} to deeply equal ${safeStringify(expected)}`,
          );
        }
      },
      toStrictEqual(expected: any) {
        if (!deepEqual(received, expected)) {
          throw new Error(
            `Expected ${safeStringify(received)} to strictly equal ${safeStringify(expected)}`,
          );
        }
      },
      toMatchObject(expected: any) {
        if (!matchObject(received, expected)) {
          throw new Error(
            `Expected ${safeStringify(received)} to match ${safeStringify(expected)}`,
          );
        }
      },
      toBeNaN() {
        if (!Number.isNaN(received)) throw new Error(`Expected ${safeStringify(received)} to be NaN`);
      },
      toBeCloseTo(expected: number, precision = 2) {
        const diff = Math.abs(Number(received) - Number(expected));
        const threshold = Math.pow(10, -precision) / 2;
        if (!(Number.isFinite(diff) && diff <= threshold)) {
          throw new Error(
            `Expected ${safeStringify(received)} to be close to ${safeStringify(expected)} (+/-${threshold})`,
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
