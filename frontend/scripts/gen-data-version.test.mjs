import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { computeDataVersion } from './gen-data-version.mjs';

test('commit-resolved SEO dates cannot invalidate content version, substantive source changes still do', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-data-version-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const frontend = path.join(root, 'frontend');
  const generated = path.join(frontend, 'src/app/generated');
  await fs.mkdir(generated, { recursive: true });
  const appFile = path.join(frontend, 'src/app/content.ts');
  await fs.writeFile(appFile, 'export const title = "original";');
  const first = await computeDataVersion(frontend);
  const dates = path.join(generated, 'seo-content-dates.ts');
  await fs.writeFile(dates, 'export const SEO_CONTENT_DATES = {};');
  assert.equal(await computeDataVersion(frontend), first);
  await fs.writeFile(dates, 'export const SEO_CONTENT_DATES = {"/page":"2026-10-05"};');
  assert.equal(await computeDataVersion(frontend), first);
  await fs.writeFile(appFile, 'export const title = "changed";');
  const second = await computeDataVersion(frontend);
  assert.notEqual(second, first);
  await fs.mkdir(path.join(root, 'cdn/questions/react'), { recursive: true });
  await fs.writeFile(path.join(root, 'cdn/questions/react/trivia.json'), '[{"id":"example","answer":"new content"}]');
  assert.notEqual(await computeDataVersion(frontend), second);
});
