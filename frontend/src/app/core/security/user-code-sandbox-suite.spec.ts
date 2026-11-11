import { createTestSuite } from './user-code-sandbox-suite';

describe('createTestSuite', () => {
  const runAll = async (tests: Array<{ fn: () => unknown }>) => {
    const outcomes: string[] = [];
    for (const test of tests) {
      try {
        await test.fn();
        outcomes.push('pass');
      } catch (error) {
        outcomes.push(`fail: ${(error as Error).message}`);
      }
    }
    return outcomes;
  };

  it('runs hooks in Jest order around every test of nested suites', async () => {
    const order: string[] = [];
    const suite = createTestSuite(' › ');
    suite.beforeAll(() => order.push('outer beforeAll'));
    suite.beforeEach(() => order.push('outer beforeEach'));
    suite.afterEach(() => order.push('outer afterEach'));
    suite.afterAll(() => order.push('outer afterAll'));
    suite.describe('group', () => {
      suite.beforeEach(async () => {
        await Promise.resolve();
        order.push('inner beforeEach');
      });
      suite.test('first', () => order.push('first'));
      suite.test('second', () => order.push('second'));
      suite.afterEach(() => order.push('inner afterEach'));
    });

    const tests = suite.tests();
    expect(tests.map((test) => test.fullName)).toEqual(['group › first', 'group › second']);
    expect(await runAll(tests)).toEqual(['pass', 'pass']);
    expect(order).toEqual([
      'outer beforeAll', 'outer beforeEach', 'inner beforeEach', 'first', 'inner afterEach', 'outer afterEach',
      'outer beforeEach', 'inner beforeEach', 'second', 'inner afterEach', 'outer afterEach', 'outer afterAll',
    ]);
  });

  it('runs afterEach after a failing test and reports the first error', async () => {
    const order: string[] = [];
    const suite = createTestSuite(' › ');
    suite.beforeEach(() => {
      throw new Error('setup broke');
    });
    suite.afterEach(() => {
      order.push('afterEach');
      throw new Error('teardown broke too');
    });
    suite.test('body', () => order.push('body'));

    expect(await runAll(suite.tests())).toEqual(['fail: setup broke']);
    expect(order).toEqual(['afterEach']);
  });

  it('keeps a test without hooks as its own function', () => {
    const suite = createTestSuite(' › ');
    const body = () => undefined;
    suite.it('plain', body);

    expect(suite.tests()[0].fn).toBe(body);
  });
});
