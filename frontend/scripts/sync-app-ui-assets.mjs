#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const nodeModulesRoot = path.join(projectRoot, 'node_modules');
const outputRoot = path.join(projectRoot, 'src', 'assets', 'vendor');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFile(from, to) {
  await ensureDir(path.dirname(to));
  await fs.copyFile(from, to);
}

async function copyDir(from, to) {
  await ensureDir(path.dirname(to));
  await fs.cp(from, to, { recursive: true, force: true });
}

await copyFile(
  path.join(nodeModulesRoot, 'primeng', 'resources', 'themes', 'lara-dark-amber', 'theme.css'),
  path.join(outputRoot, 'primeng', 'resources', 'themes', 'lara-dark-amber', 'theme.css'),
);
await copyDir(
  path.join(nodeModulesRoot, 'primeng', 'resources', 'themes', 'lara-dark-amber', 'fonts'),
  path.join(outputRoot, 'primeng', 'resources', 'themes', 'lara-dark-amber', 'fonts'),
);
await copyFile(
  path.join(nodeModulesRoot, 'primeng', 'resources', 'primeng.min.css'),
  path.join(outputRoot, 'primeng', 'resources', 'primeng.min.css'),
);
await copyFile(
  path.join(nodeModulesRoot, 'primeicons', 'primeicons.css'),
  path.join(outputRoot, 'primeicons', 'primeicons.css'),
);
await copyDir(
  path.join(nodeModulesRoot, 'primeicons', 'fonts'),
  path.join(outputRoot, 'primeicons', 'fonts'),
);
await copyFile(
  path.join(nodeModulesRoot, '@fortawesome', 'fontawesome-free', 'css', 'all.min.css'),
  path.join(outputRoot, 'fontawesome', 'css', 'all.min.css'),
);
await copyDir(
  path.join(nodeModulesRoot, '@fortawesome', 'fontawesome-free', 'webfonts'),
  path.join(outputRoot, 'fontawesome', 'webfonts'),
);
