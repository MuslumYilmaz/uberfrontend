import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  it('strips scripts and event handlers but keeps allowed tags', () => {
    const pipe = new SafeHtmlPipe();
    const out = pipe.transform('<img src=x onerror=alert(1)><script>alert(1)</script><code>ok</code>');

    expect(out).not.toContain('<img');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<script');
    expect(out).toContain('<code>ok</code>');
  });
});

