import { normalizeError, normalizeMessageLine } from './console-normalize';

describe('console-normalize', () => {
  it('normalizes errors to a single-line message and keeps stack in dev', () => {
    const err = new Error('Boom');
    err.stack = 'Error: Boom\n  at line1\n  at line2';

    const out = normalizeError(err, { mode: 'dev' });
    expect(out.message).toBe('Error: Boom');
    expect(out.stack).toContain('line2');
  });

  it('omits stack in prod', () => {
    const err = new Error('Boom');
    err.stack = 'Error: Boom\n  at line1';

    const out = normalizeError(err, { mode: 'prod' });
    expect(out.message).toBe('Error: Boom');
    expect(out.stack).toBeUndefined();
  });

  it('normalizes message lines', () => {
    const msg = normalizeMessageLine('Error:\n  line1\n  line2');
    expect(msg).toBe('Error: ↵ line1 ↵ line2');
  });
});
