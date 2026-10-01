import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { syncCdnAssets } from './sync-cdn-assets.mjs';

test('copies canonical bytes and removes retired assets without publishing unrelated CDN files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fa-cdn-stage-'));
  try {
    const source = path.join(root, 'cdn');
    const target = path.join(root, 'staged');
    for (const entry of ['questions', 'incidents', 'tradeoff-battles', 'practice']) {
      await fs.mkdir(path.join(source, entry), { recursive: true });
      await fs.writeFile(path.join(source, entry, 'index.json'), `{"catalog":"${entry}"}\n`);
    }
    await fs.writeFile(path.join(source, 'data-version.json'), '{"dataVersion":"v1"}\n');
    await fs.writeFile(path.join(source, 'unrelated.txt'), 'not a public asset input');
    await syncCdnAssets(source, target);
    await fs.writeFile(path.join(target, 'questions', 'retired.json'), '{}');
    await fs.writeFile(path.join(source, 'data-version.json'), '{"dataVersion":"v2"}\n');
    await syncCdnAssets(source, target);

    for (const entry of ['questions', 'incidents', 'tradeoff-battles', 'practice']) {
      assert.deepEqual(await fs.readFile(path.join(target, entry, 'index.json')), await fs.readFile(path.join(source, entry, 'index.json')));
    }
    assert.deepEqual(await fs.readFile(path.join(target, 'data-version.json')), await fs.readFile(path.join(source, 'data-version.json')));
    await assert.rejects(fs.access(path.join(target, 'questions', 'retired.json')));
    await assert.rejects(fs.access(path.join(target, 'unrelated.txt')));
    assert.equal(await fs.readFile(path.join(source, 'unrelated.txt'), 'utf8'), 'not a public asset input');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
