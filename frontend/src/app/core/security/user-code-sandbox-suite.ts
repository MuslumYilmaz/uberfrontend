// The describe/test DSL of sandbox tests, with Jest-style hooks. Tests run in the order they were defined. Each one is
// wrapped with the beforeEach and afterEach hooks of its suites, and the first and last test of a suite also run its
// beforeAll and afterAll hooks, so the runner keeps treating every test as one function with one time limit.

type Hook = () => unknown;
type Suite = { beforeAll: Hook[]; afterAll: Hook[]; beforeEach: Hook[]; afterEach: Hook[]; first: number; last: number };
type Entry = { name: string; fullName: string; fn: () => unknown; suites: Suite[] };

export type SuiteTest = { idx: number; name: string; fullName: string; fn: () => unknown };

const newSuite = (): Suite => ({ beforeAll: [], afterAll: [], beforeEach: [], afterEach: [], first: -1, last: -1 });
const hasHooks = (suite: Suite) =>
  suite.beforeAll.length + suite.afterAll.length + suite.beforeEach.length + suite.afterEach.length > 0;

export function createTestSuite(separator: string) {
  const names: string[] = [];
  const stack: Suite[] = [newSuite()];
  const entries: Entry[] = [];
  const current = () => stack[stack.length - 1];

  const test = (name: string, fn: () => unknown) => {
    const index = entries.length;
    for (const suite of stack) {
      if (suite.first === -1) suite.first = index;
      suite.last = index;
    }
    entries.push({ name: String(name), fullName: [...names, String(name)].join(separator), fn, suites: [...stack] });
  };

  // Before hooks run from the outermost suite in, after hooks from the innermost out. After hooks run even when the
  // test or a before hook failed, and the first error is the one reported.
  const withHooks = (entry: Entry, index: number): (() => unknown) => {
    if (!entry.suites.some(hasHooks)) return entry.fn;
    const outward = [...entry.suites].reverse();
    return async () => {
      let failed = false;
      let failure: unknown;
      const attempt = async (run: () => unknown) => {
        try {
          await run();
        } catch (error) {
          if (!failed) {
            failed = true;
            failure = error;
          }
        }
      };
      for (const suite of entry.suites) {
        if (suite.first === index) for (const hook of suite.beforeAll) if (!failed) await attempt(hook);
      }
      for (const suite of entry.suites) for (const hook of suite.beforeEach) if (!failed) await attempt(hook);
      if (!failed) await attempt(entry.fn);
      for (const suite of outward) for (const hook of suite.afterEach) await attempt(hook);
      for (const suite of outward) {
        if (suite.last === index) for (const hook of suite.afterAll) await attempt(hook);
      }
      if (failed) throw failure;
    };
  };

  return {
    describe(name: string, fn: () => unknown) {
      names.push(String(name));
      stack.push(newSuite());
      try {
        fn();
      } finally {
        stack.pop();
        names.pop();
      }
    },
    test,
    it: test,
    beforeAll: (fn: Hook) => void current().beforeAll.push(fn),
    afterAll: (fn: Hook) => void current().afterAll.push(fn),
    beforeEach: (fn: Hook) => void current().beforeEach.push(fn),
    afterEach: (fn: Hook) => void current().afterEach.push(fn),
    /** The tests defined so far, in order, each wrapped with its hooks. */
    tests(): SuiteTest[] {
      return entries.map((entry, index) => ({ idx: index, name: entry.name, fullName: entry.fullName, fn: withHooks(entry, index) }));
    },
  };
}
