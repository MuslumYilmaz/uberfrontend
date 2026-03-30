#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src', 'assets', 'tradeoff-battles');
const CDN_DIR = path.resolve('../cdn', 'tradeoff-battles');

function countFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return 0;

  let count = 0;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
      continue;
    }
    count += 1;
  }
  return count;
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('[sync-tradeoff-battles] missing src/assets/tradeoff-battles');
  process.exit(1);
}

fs.rmSync(CDN_DIR, { recursive: true, force: true });
fs.mkdirSync(path.dirname(CDN_DIR), { recursive: true });
fs.cpSync(SRC_DIR, CDN_DIR, { recursive: true });

console.log(
  `[sync-tradeoff-battles] mirrored ${countFiles(CDN_DIR)} files to ${path.relative(process.cwd(), CDN_DIR)}`,
);
