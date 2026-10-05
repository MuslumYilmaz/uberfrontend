import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { shouldRewriteToIndex, startSeoStaticServer } from './seo-static-server.mjs';

const marketingHtml = '<app-root ngh="0"><app-marketing-header></app-marketing-header></app-root>';
const csrHtml = '<app-root></app-root><script src="main.js"></script>';

async function serveBuild(t, files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-static-server-'));
  let server;
  t.after(async () => {
    await server?.close();
    await fs.rm(directory, { recursive: true, force: true });
  });
  for (const [name, content] of Object.entries(files)) {
    const filename = path.join(directory, name);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, content);
  }
  server = await startSeoStaticServer({ buildDir: directory, port: 0 });
  return (pathname) => fetch(`${server.baseUrl}${pathname}`);
}

test('private app fallbacks serve the CSR shell instead of home hydration markup', async (t) => {
  const request = await serveBuild(t, {
    'index.html': marketingHtml,
    'index.csr.html': csrHtml,
  });
  for (const route of ['/interview', '/interview/session-123', '/interview/session-123/results', '/admin/new-page']) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
    assert.equal(await response.text(), csrHtml, route);
  }
});

test('filesystem prerender output takes priority over CSR fallbacks', async (t) => {
  const adminHtml = '<meta name="robots" content="noindex,nofollow"><app-root>Private-safe admin shell</app-root>';
  const request = await serveBuild(t, {
    'index.html': marketingHtml,
    'index.csr.html': csrHtml,
    'admin/users/index.html': adminHtml,
  });
  const admin = await request('/admin/users');
  assert.equal(admin.status, 200);
  assert.equal(await admin.text(), adminHtml);
  const home = await request('/');
  assert.equal(home.status, 200);
  assert.equal(await home.text(), marketingHtml);
});

test('unknown public URLs remain 404 instead of using the CSR shell', async (t) => {
  const request = await serveBuild(t, {
    'index.html': marketingHtml,
    'index.csr.html': csrHtml,
    '404/index.html': '<main>Not found</main>',
  });
  const response = await request('/unknown-public-page');
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '<main>Not found</main>');
});

test('deployment app rewrites use the same CSR shell and preserve the public 404 fallback', async (t) => {
  const config = JSON.parse(await fs.readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const rewrites = config.rewrites;
  const fallback = rewrites.filter(({ source }) => source === '/:path*');
  assert.equal(fallback.length, 1);
  assert.deepEqual(fallback[0], { source: '/:path*', destination: '/404', statusCode: 404 });
  assert.equal(rewrites.at(-1), fallback[0], 'Public 404 fallback must remain last');

  const appRewrites = rewrites.filter((rule) => rule !== fallback[0]);
  for (const source of ['/interview', '/interview/:path*', '/admin', '/admin/:path*']) {
    assert.equal(appRewrites.filter((rule) => rule.source === source).length, 1, source);
  }

  const request = await serveBuild(t, {
    'index.html': marketingHtml,
    'index.csr.html': csrHtml,
  });
  for (const rule of appRewrites) {
    const route = rule.source.replace(':path*', 'nested/results').replace(':slug', 'example');
    assert.ok(shouldRewriteToIndex(route), `Unexpected public app fallback: ${rule.source}`);
    assert.equal(rule.destination, '/index.csr.html', rule.source);
    const local = await request(route);
    assert.equal(local.status, 200, route);
    assert.equal(await local.text(), csrHtml, route);
  }
  const deployedDestination = await request('/index.csr.html');
  assert.equal(deployedDestination.status, 200);
  assert.equal(await deployedDestination.text(), csrHtml);
});

test('legacy builds without an explicit CSR file retain their index fallback', async (t) => {
  const request = await serveBuild(t, { 'index.html': csrHtml });
  const response = await request('/interview');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), csrHtml);
});
