import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { planPrimeStyles, extractPrimeStyles } from './extract-prime-ssr-styles.mjs';

const css = `@layer primeng{:root{${Array.from({ length: 60 }, (_, i) => `--p-test-${i}:${i}px;`).join('')}}}`;
const style = (value = css, extra = '') => `<style type="text/css" data-primeng-style-id="test"${extra}>${value}</style>`;
const page = (head = style()) => `<!doctype html><html><head><base href="/">${head}</head><body><!--ngh--><app-root ngh="0">ç &amp; 😃</app-root><script id="ng-state" type="application/json">{"x":"&<>"}</script></body></html>`;

test('preserves cascade, hydration markers, whitespace and all non-target bytes', () => {
  const input = page(`<style>@layer reset,primeng,utilities;</style>${style()}\n<style>.unlayered{color:red}</style>${style(css.replaceAll('px', 'em'))}`);
  const output = planPrimeStyles(input);
  assert.equal(output.assets.size, 2);
  let restored = output.html;
  for (const [asset, content] of output.assets) {
    restored = restored.replace(`<link rel="stylesheet" href="/${asset}" data-fa-prime-ssr>${style('')}`, style(content));
  }
  assert.equal(restored, input);
  assert.equal(planPrimeStyles(output.html).html, output.html);
});

test('keeps layer ordering, unlayered, small, URL-dependent, conditional and body styles inline', () => {
  for (const unchanged of [
    style('@layer reset,primeng,utilities'), style('.test{color:red}'.repeat(60)),
    style('@layer primeng{.test{color:red}}'), style(css, ' media="print"'),
    style(css, ' nonce="csp"'), style(css, ' title="alternate"'),
    style(css.replace('0px', 'url(../image.svg)')), style(css.replace('0px', 'u\\72l(icon.svg)')),
  ]) assert.equal(planPrimeStyles(page(unchanged)).html, page(unchanged));
  const inBody = page('').replace('</body>', `${style()}</body>`);
  assert.equal(planPrimeStyles(inBody).html, inBody);
});

test('leaves pages without PrimeNG style markers byte-for-byte unchanged', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'prime-ssr-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const input = page(`<style>${css}</style>`);
  const filename = path.join(directory, 'index.html');
  await fs.writeFile(filename, input);
  assert.equal(planPrimeStyles(input).html, input);
  assert.equal(planPrimeStyles(input).assets.size, 0);
  assert.deepEqual(await extractPrimeStyles(directory), { pages: 0, assets: 0, assetBytes: 0, savedHtmlBytes: 0 });
  assert.equal(await fs.readFile(filename, 'utf8'), input);
});

test('reuses exact CSS across routes and changes its hash when CSS changes', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'prime-ssr-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.mkdir(path.join(directory, 'nested'));
  await fs.writeFile(path.join(directory, 'index.html'), page());
  await fs.writeFile(path.join(directory, 'nested/index.html'), page());
  const result = await extractPrimeStyles(directory);
  assert.equal(result.pages, 2);
  assert.equal(result.assets, 1);
  assert.ok(result.savedHtmlBytes > 1000);
  assert.equal((await extractPrimeStyles(directory)).pages, 0);
  assert.notEqual([...planPrimeStyles(page()).assets.keys()][0], [...planPrimeStyles(page(style(css + '\n'))).assets.keys()][0]);
  const [asset] = planPrimeStyles(page()).assets.keys();
  await fs.writeFile(path.join(directory, asset), 'corrupt');
  await assert.rejects(extractPrimeStyles(directory), /Corrupt PrimeNG SSR asset/);
});

test('rejects unsupported bases and missing assets before changing any HTML', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'prime-ssr-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'a.html'), page());
  await fs.writeFile(path.join(directory, 'z.html'), page().replace('href="/"', 'href="/sub/"'));
  await assert.rejects(extractPrimeStyles(directory), /requires/);
  assert.equal(await fs.readFile(path.join(directory, 'a.html'), 'utf8'), page());
  await fs.writeFile(path.join(directory, 'z.html'), planPrimeStyles(page()).html);
  await assert.rejects(extractPrimeStyles(directory), /ENOENT/);
  assert.equal(await fs.readFile(path.join(directory, 'a.html'), 'utf8'), page());
});
