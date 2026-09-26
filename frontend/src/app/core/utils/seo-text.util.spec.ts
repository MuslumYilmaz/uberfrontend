import { normalizeSeoPlainText } from './seo-text.util';

describe('normalizeSeoPlainText', () => {
  it('preserves raw and encoded technical tags, generics, JSX, and comparisons', () => {
    expect(normalizeSeoPlainText(
      'Use <a>, <head>, <link rel="stylesheet">, Array<T>, <ProgressBar />, <A>child</A>, &lt;a&gt;, and &amp;lt;head&amp;gt;; <34 and >66.',
    )).toBe(
      'Use <a>, <head>, <link rel="stylesheet">, Array<T>, <ProgressBar />, <A>child</A>, <a>, and <head>; <34 and >66.',
    );
  });

  it('removes paired editorial wrappers while preserving literal examples inside them', () => {
    expect(normalizeSeoPlainText(
      '<p><strong>HTML:</strong> Use <code>&lt;a&gt;</code> with Array<T> and <a href="/guide?q=a>b">a useful label</a>.</p>',
    )).toBe('HTML: Use <a> with Array<T> and a useful label.');
  });

  it('distinguishes paired markup from standalone tags with the same name', () => {
    expect(normalizeSeoPlainText(
      '<a href="/">Link</a> explains the <a> tag. <strong>Outer <strong>inner</strong> label</strong>.',
    )).toBe('Link explains the <a> tag. Outer inner label.');
  });

  it('keeps escaped paired examples literal and decodes entities without dropping unknown ones', () => {
    expect(normalizeSeoPlainText(
      '&lt;strong&gt;text&lt;/strong&gt; &amp; &#60;T&#62; &#x1f4a1; &unknown;',
    )).toBe('<strong>text</strong> & <T> 💡 &unknown;');
  });

  it('normalizes whitespace and editorial formatting without shortening content', () => {
    const text = 'Preserve the complete explanation and its final technical term. '.repeat(5).trim();
    expect(normalizeSeoPlainText(`\n <p>**${text}**</p> \n`)).toBe(text);
    expect(normalizeSeoPlainText(' \n\t ')).toBe('');
  });

  it('preserves whitespace before technical punctuation and operators', () => {
    const text = 'CSS specificity without !important; negate !value; compare a != b and use :where().';
    expect(normalizeSeoPlainText(text)).toBe(text);
    expect(normalizeSeoPlainText('<strong>Keep !important</strong>.')).toBe('Keep !important.');
  });
});
