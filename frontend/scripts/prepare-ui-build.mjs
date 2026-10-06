import { cpSync, existsSync, rmSync } from 'node:fs';

const browser = 'dist/frontendatlas/browser';
const reference = 'dist/prime-ssr-inline';
if (!existsSync(`${browser}/index.html`)) {
  throw new Error('Build production output before preparing the UI reference.');
}
// Preserve the actual pre-optimization output for the SSR CSS comparison.
rmSync(reference, { recursive: true, force: true });
cpSync(browser, reference, { recursive: true });
console.log(`Copied inline SSR reference to ${reference}`);
