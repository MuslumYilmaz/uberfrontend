#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { collectContentDocuments } from './content-prose-lib.mjs';
import { frontendRoot } from './content-paths.mjs';

const warnOnly = process.argv.includes('--warn-only');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function run() {
  const docs = collectContentDocuments();
  if (!docs.length) {
    console.log('[lint:text] no content documents found');
    return 0;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'frontendatlas-textlint-'));
  const files = [];

  try {
    docs.forEach((doc) => {
      const outPath = path.join(tempRoot, doc.virtualPath);
      ensureDir(outPath);
      fs.writeFileSync(outPath, `${doc.content}\n`, 'utf8');
      files.push(outPath);
    });

    console.log(`[lint:text] linting ${files.length} extracted content documents`);

    const args = [
      'textlint',
      '--config',
      '.textlintrc.json',
      '--ignore-path',
      '.textlintignore',
      '--format',
      'compact',
      ...files,
    ];

    const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
      cwd: frontendRoot,
      stdio: 'inherit',
    });

    return warnOnly ? 0 : (result.status ?? 1);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

process.exit(run());
