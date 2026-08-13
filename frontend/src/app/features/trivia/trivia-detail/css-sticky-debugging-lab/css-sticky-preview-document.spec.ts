import { CSS_STICKY_CASES } from './css-sticky-debugging-lab.content';
import { buildCssStickyPreviewDocument } from './css-sticky-preview-document';

describe('buildCssStickyPreviewDocument', () => {
  const ids = {
    parentOrigin: 'https://frontendatlas.test',
    sessionId: '11111111111111111111111111111111',
    frameId: '22222222222222222222222222222222',
    readyRunToken: '33333333333333333333333333333333',
    nonce: '44444444444444444444444444444444',
  };

  it('builds one opaque-origin document with a nonce bridge and deny-by-default CSP', () => {
    const source = buildCssStickyPreviewDocument(CSS_STICKY_CASES[0], ids);

    expect(source).toContain(`default-src 'none'`);
    expect(source).toContain(`script-src 'nonce-${ids.nonce}'`);
    expect(source).toContain(`style-src 'unsafe-inline'`);
    expect(source).toContain('img-src data:');
    expect(source).toContain(`connect-src 'none'`);
    expect(source).toContain(`object-src 'none'`);
    expect(source).toContain(`frame-src 'none'`);
    expect(source).toContain(`form-action 'none'`);
    expect(source).toContain(`base-uri 'none'`);
    expect(source).not.toContain('navigate-to');
    expect(source).toContain(`nonce="${ids.nonce}"`);
    expect(source).toContain('FA_CSS_STICKY_INSPECTOR');
    expect(source).toContain(`"parentOrigin":"${ids.parentOrigin}"`);
    expect(source).toContain('payload), config.parentOrigin)');
    expect(source).toContain('event.origin !== config.parentOrigin');
    expect(source).toContain(CSS_STICKY_CASES[0].html);
    expect(source.match(/<script\b/g)?.length).toBe(1);
    expect(source.match(/id="fa-user-css"/g)?.length).toBe(1);
    expect(source).not.toContain('__spreadValues');
    expect(source).not.toContain('__async');
  });

  it('applies trusted initial CSS through textContent and never interpolates it into a style tag', () => {
    const stickyCase = CSS_STICKY_CASES[0];
    const source = buildCssStickyPreviewDocument(stickyCase, ids);

    expect(source).toContain(JSON.stringify(stickyCase.initialCss).slice(1, -1));
    expect(source).not.toContain(stickyCase.fixedCss);
    expect(source).toContain('userStyle.textContent');
    expect(source).toContain('blockedNetworkReference');
    expect(source).not.toContain('innerHTML = data');
    expect(source).not.toContain(`<style id="fa-user-css">${stickyCase.initialCss}`);
  });

  it('rejects a nonce that could break out of the CSP or script attribute', () => {
    expect(() => buildCssStickyPreviewDocument(CSS_STICKY_CASES[0], {
      ...ids,
      nonce: `bad\"><script src="https://attacker.invalid">`,
    })).toThrowError('CSS sticky preview could not create a safe document.');
  });

  it('rejects non-HTTP tuple origins before creating the child bridge', () => {
    for (const parentOrigin of [
      '*',
      'null',
      'file:///tmp/index.html',
      'javascript:alert(1)',
      'https://frontendatlas.test/path',
      'https://frontendatlas.test?query=1',
    ]) {
      expect(() => buildCssStickyPreviewDocument(CSS_STICKY_CASES[0], {
        ...ids,
        parentOrigin,
      })).withContext(parentOrigin)
        .toThrowError('CSS sticky preview requires a trusted HTTP(S) parent origin.');
    }
  });
});
