import { createFailureSignature, normalizeErrorLine, stableHash } from './failure-signature.util';

describe('failure-signature.util', () => {
  it('normalizes noisy error lines', () => {
    const normalized = normalizeErrorLine(
      'TypeError: Cannot read properties of undefined (reading x) at foo (http://localhost:4200/main.js:12:4)',
    );
    expect(normalized).toContain('TypeError: Cannot read properties of undefined');
    expect(normalized).not.toContain('http://localhost:4200');
  });

  it('builds a deterministic signature', () => {
    const signature = createFailureSignature({
      firstFailName: 'returns expected value',
      errorLine: 'Expected undefined to be 3',
      failCount: 2,
    });
    expect(signature).toBe('returns expected value|Expected undefined to be 3|2');
  });

  it('hashes code stably', () => {
    const a = stableHash('export default function f() { return 1; }');
    const b = stableHash('export default function f() { return 1; }');
    const c = stableHash('export default function f() { return 2; }');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
