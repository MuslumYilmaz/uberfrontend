import { rewritePreferenceMedia } from './preference-media.util';

describe('rewritePreferenceMedia', () => {
  const css = [
    '@media (prefers-color-scheme: dark) { :root { --bg: black; } }',
    '@media screen and (prefers-color-scheme:light) { :root { --bg: white; } }',
    '@media not (prefers-color-scheme: dark) { .a { color: red; } }',
    '@media (prefers-reduced-motion: reduce) { .b { transition: none; } }',
  ].join('\n');

  it('settles the color scheme it is given, leaving the other preferences to the browser', () => {
    expect(rewritePreferenceMedia(css, { 'prefers-color-scheme': 'dark' }).split('\n')).toEqual([
      '@media (min-width: 0px) { :root { --bg: black; } }',
      '@media screen and (max-width: 0px) { :root { --bg: white; } }',
      '@media not (min-width: 0px) { .a { color: red; } }',
      '@media (prefers-reduced-motion: reduce) { .b { transition: none; } }',
    ]);
    expect(rewritePreferenceMedia(css, { 'prefers-color-scheme': 'light' }).split('\n')[0])
      .toBe('@media (max-width: 0px) { :root { --bg: black; } }');
  });

  it('reads a bare reduced-motion feature as true for reduce only, and leaves CSS without preferences alone', () => {
    expect(rewritePreferenceMedia('@media (prefers-reduced-motion) {}', { 'prefers-reduced-motion': 'reduce' }))
      .toBe('@media (min-width: 0px) {}');
    expect(rewritePreferenceMedia('@media (prefers-reduced-motion) {}', { 'prefers-reduced-motion': 'no-preference' }))
      .toBe('@media (max-width: 0px) {}');
    expect(rewritePreferenceMedia('@media (min-width: 40em) {}', { 'prefers-color-scheme': 'dark' }))
      .toBe('@media (min-width: 40em) {}');
  });
});
