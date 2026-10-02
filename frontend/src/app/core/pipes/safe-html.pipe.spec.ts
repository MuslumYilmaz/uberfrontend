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

  it('preserves escaped HTML and regex examples inside code blocks', () => {
    const out = new SafeHtmlPipe().transform('<pre><code>&lt;button onclick="run()"&gt; /[a-z]+/g &amp; value</code></pre>');
    const host = document.createElement('div');
    host.innerHTML = out;

    expect(host.querySelector('pre code')?.textContent).toBe('<button onclick="run()"> /[a-z]+/g & value');
    expect(host.querySelector('button')).toBeNull();
  });

  it('blocks encoded script links and protects external tab links', () => {
    const out = new SafeHtmlPipe().transform(
      '<a href="jav&#x61;script:alert(1)">unsafe</a>' +
      '<a href="https://example.com/docs" target="_blank" rel="nofollow">docs</a>',
    );
    const host = document.createElement('div');
    host.innerHTML = out;
    const [unsafe, external] = Array.from(host.querySelectorAll('a'));

    expect(unsafe.hasAttribute('href')).toBeFalse();
    expect(external.getAttribute('href')).toBe('https://example.com/docs');
    expect(external.relList.contains('nofollow')).toBeTrue();
    expect(external.relList.contains('noopener')).toBeTrue();
    expect(external.relList.contains('noreferrer')).toBeTrue();
  });
});
