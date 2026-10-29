import assert from 'node:assert/strict';
import test from 'node:test';
import { Worker } from 'node:worker_threads';
import { createHarness } from './monaco-clipboard-cancellation.harness.mjs';

const harnessUrl = new URL('./monaco-clipboard-cancellation.harness.mjs', import.meta.url);

function runEscapeThenKey({ upstream }) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(harnessUrl, { workerData: { scenario: 'escape-then-key', upstream } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => { if (code !== 0) reject(new Error(`harness worker exited with ${code}`)); });
  });
}

test('upstream: superseding a write that WebKit rejected before reading it is an unhandled "Canceled" rejection', async () => {
  const result = await runEscapeThenKey({ upstream: true });
  assert.equal(result.afterEscape, 0);
  assert.equal(result.unhandledRejections.length, 1);
  assert.equal(result.unhandledRejections[0].name, 'Canceled');
  assert.equal(result.unhandledRejections[0].message, 'Canceled');
  assert.match(result.unhandledRejections[0].stack, /cancel/);
  assert.deepEqual(result.logErrors, ['NotAllowedError']);
});

test('patched: the same sequence escapes nothing', async () => {
  const result = await runEscapeThenKey({ upstream: false });
  assert.deepEqual(result.unhandledRejections, []);
  assert.deepEqual(result.consoleErrors, []);
  assert.deepEqual(result.logErrors, ['NotAllowedError']);
});

test('a write rejected before the item is read is dropped, so later events cancel nothing', async () => {
  const harness = createHarness();
  harness.dispatch('click');
  await harness.flush();
  harness.dispatch('keydown', { gesture: false });
  await harness.flush();
  assert.equal(harness.service.webKitPendingClipboardWritePromise, undefined);
  assert.equal(harness.logErrors.length, 1);
  assert.equal(harness.logErrors[0].name, 'NotAllowedError');
  harness.dispatch('keydown');
  harness.dispatch('click');
  await harness.flush();
  assert.deepEqual(harness.consoleErrors, []);
  assert.equal(harness.logErrors.length, 1);
  assert.equal(harness.service.webKitPendingClipboardWritePromise.isSettled, false);
});

test('copying after a dead write falls through instead of completing a promise nobody reads', async () => {
  const harness = createHarness();
  harness.dispatch('keydown', { gesture: false });
  await harness.flush();
  await harness.service.writeText('copied text');
  await harness.flush();
  assert.deepEqual(harness.copy(harness.webkit.writeTextCalls), ['copied text']);
  assert.equal(harness.webkit.text, undefined);
  assert.deepEqual(harness.consoleErrors, []);
});

test('upstream: copying after a dead write completes a promise WebKit never reads, so nothing is copied', async () => {
  const harness = createHarness({ upstream: true });
  harness.dispatch('keydown', { gesture: false });
  await harness.flush();
  await harness.service.writeText('lost text');
  await harness.flush();
  assert.deepEqual(harness.copy(harness.webkit.writeTextCalls), []);
  assert.equal(harness.webkit.text, undefined);
});

test('gesture-driven writes keep completing through the pending promise and cancel quietly', async () => {
  const harness = createHarness();
  harness.dispatch('click');
  await harness.service.writeText('first copy');
  await harness.flush();
  assert.equal(harness.webkit.text, 'first copy');
  assert.deepEqual(harness.copy(harness.webkit.writeTextCalls), []);

  harness.dispatch('keydown');
  await harness.flush();
  const superseded = harness.service.webKitPendingClipboardWritePromise;
  harness.dispatch('keydown');
  await harness.flush();
  assert.equal(superseded.isRejected, true);
  assert.notEqual(harness.service.webKitPendingClipboardWritePromise, superseded);
  await harness.service.writeText('second copy');
  await harness.flush();
  assert.equal(harness.webkit.text, 'second copy');
  assert.deepEqual(harness.logErrors, []);
  assert.deepEqual(harness.consoleErrors, []);
});

test('without navigator.clipboard the handler is a no-op and writeText uses the fallback', async () => {
  const harness = createHarness({ clipboardAvailable: false });
  harness.dispatch('click');
  harness.dispatch('keydown');
  await harness.flush();
  assert.equal(harness.service.webKitPendingClipboardWritePromise, undefined);
  await harness.service.writeText('fallback copy');
  assert.deepEqual(harness.copy(harness.service.fallbackWrites), ['fallback copy']);
  assert.deepEqual(harness.logErrors, []);
});

test('upstream: a missing navigator.clipboard throws from the event handler', () => {
  const harness = createHarness({ upstream: true, clipboardAvailable: false });
  // The error comes from the vm realm, so match by name rather than prototype.
  assert.throws(() => harness.dispatch('click'), (error) => error.name === 'TypeError');
});
