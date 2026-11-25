import { withAssertionLine } from './user-code-sandbox-assertion-line';

describe('withAssertionLine', () => {
  const tests = [
    "import shallowClone from './shallowClone';",
    "test('array holes stay holes', () => {",
    '  const copy = shallowClone([, 1]);',
    '  expect(0 in copy).toBe(false);',
    '});',
  ].join('\n');
  const testsUrl = 'blob:http://127.0.0.1:4200/0b7e5c0e-tests';
  const userUrl = 'blob:http://127.0.0.1:4200/9f1d2a44-user';
  const sources = new Map([[testsUrl, tests], [userUrl, 'export default (v) => [...v];']]);
  const stack = [
    'Error: Expected true to be false',
    '    at Object.toBe (http://127.0.0.1:4200/worker-ABC.js:1:2345)',
    `    at ${userUrl}:1:22`,
    `    at ${testsUrl}:4:31`,
  ].join('\n');

  it('adds the expect line the failed boolean check ran, under the message', () => {
    expect(withAssertionLine('Expected true to be false', stack, sources))
      .toBe('Expected true to be false\nexpect(0 in copy).toBe(false);');
    expect(withAssertionLine('Expected undefined to be truthy', stack, sources))
      .toBe('Expected undefined to be truthy\nexpect(0 in copy).toBe(false);');
    // The worker reports a thrown Error with its name in front.
    expect(withAssertionLine('Error: Expected true to be false', stack, sources))
      .toBe('Error: Expected true to be false\nexpect(0 in copy).toBe(false);');
  });

  it('leaves a message that shows its values, or a stack without a test line, as it was', () => {
    expect(withAssertionLine('Expected 3 to be 4', stack, sources)).toBe('Expected 3 to be 4');
    expect(withAssertionLine('Expected true to be false', 'Error: x\n    at worker.js:1:2', sources))
      .toBe('Expected true to be false');
    expect(withAssertionLine('Expected true to be false', undefined, sources)).toBe('Expected true to be false');
  });
});
