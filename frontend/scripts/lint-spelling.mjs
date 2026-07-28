#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { collectContentDocuments } from './content-prose-lib.mjs';
import { frontendRoot } from './content-paths.mjs';

const warnOnly = process.argv.includes('--warn-only');
const scopeArg = process.argv.find((arg) => arg.startsWith('--scope='));
const scope = scopeArg ? scopeArg.slice('--scope='.length) : '';
const VALID_SCOPES = new Set(['', 'system-design']);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function run() {
  if (!VALID_SCOPES.has(scope)) {
    console.error(`[lint:spelling] unknown scope ${JSON.stringify(scope)}`);
    return 1;
  }
  const docs = collectContentDocuments(scope ? { kinds: [scope] } : {});
  if (!docs.length) {
    console.log('[lint:spelling] no content documents found');
    return 0;
  }

  const tempRoot = fs.mkdtempSync(path.join(frontendRoot, '.frontendatlas-cspell-'));
  const files = [];

  try {
    docs.forEach((doc) => {
      const outPath = path.join(tempRoot, doc.virtualPath);
      ensureDir(outPath);
      fs.writeFileSync(outPath, `${doc.content}\n`, 'utf8');
      files.push(outPath);
    });

    console.log(`[lint:spelling] linting ${files.length} extracted content documents`);

    const args = [
      'cspell',
      'lint',
      '--config',
      'cspell.config.json',
      '--no-gitignore',
      '--no-progress',
      '--no-summary',
    ];
    if (warnOnly) args.push('--no-exit-code');
    args.push(...files);

    const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
      cwd: frontendRoot,
      stdio: 'inherit',
    });

    if (result.error) {
      console.error(`[lint:spelling] failed to start cspell: ${result.error.message}`);
      return 1;
    }
    if (result.signal) {
      console.error(`[lint:spelling] cspell terminated by signal ${result.signal}`);
      return 1;
    }

    // In warn-only mode cspell's --no-exit-code suppresses spelling findings,
    // while configuration, runtime, and CLI failures still propagate here.
    return result.status ?? 1;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

process.exit(run());
