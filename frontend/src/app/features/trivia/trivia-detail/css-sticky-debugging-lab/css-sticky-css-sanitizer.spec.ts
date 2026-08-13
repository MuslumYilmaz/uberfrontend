import { sanitizeCssStickyPreviewSource } from './css-sticky-css-sanitizer';

describe('sanitizeCssStickyPreviewSource', () => {
  const fallback = '.sticky-target { position: sticky; }';

  it('preserves ordinary layout CSS', () => {
    const source = '.sticky-target { position: sticky; top: 0; background: #dbeafe; }';
    expect(sanitizeCssStickyPreviewSource(source, fallback)).toEqual({
      css: source,
      blockedNetworkReference: false,
    });
  });

  for (const source of [
    '@import "https://attacker.invalid/a.css";',
    '.x { background: url(https://attacker.invalid/a.png); }',
    '.x { background: url(//attacker.invalid/a.png); }',
    '.x { background: url(/assets/not-allowed-in-this-lab.png); }',
    '.x { background: image-set("https://attacker.invalid/a.png" 1x); }',
    '.x { background: -webkit-image-set("https://attacker.invalid/a.png" 1x); }',
    '@\\69mport "https://attacker.invalid/a.css";',
    '.x { background: u\\72l(https://attacker.invalid/a.png); }',
    '.x { background: u/**/rl(https://attacker.invalid/a.png); }',
  ]) {
    it(`uses trusted CSS for network-capable syntax: ${source}`, () => {
      expect(sanitizeCssStickyPreviewSource(source, fallback)).toEqual({
        css: fallback,
        blockedNetworkReference: true,
      });
    });
  }

  it('does not treat URL-like text in a comment as executable CSS', () => {
    const source = '/* url(https://attacker.invalid/a.png) */ .x { color: red; }';
    expect(sanitizeCssStickyPreviewSource(source, fallback).blockedNetworkReference).toBeFalse();
  });

  it('allows an inline data URL because the iframe CSP permits only data images', () => {
    const source = '.x { background-image: url("data:image/png;base64,iVBORw0KGgo="); }';
    expect(sanitizeCssStickyPreviewSource(source, fallback)).toEqual({
      css: source,
      blockedNetworkReference: false,
    });
  });
});
