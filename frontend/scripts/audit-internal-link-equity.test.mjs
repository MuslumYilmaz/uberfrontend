#!/usr/bin/env node

import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const scriptPath = path.resolve('scripts/audit-internal-link-equity.mjs');
const requiredTargets = [
  '/interview-questions',
  '/interview-questions/essential',
  '/machine-coding',
  '/coding',
  '/system-design',
  '/guides/system-design-blueprint',
  '/tracks',
  '/companies',
  '/guides/interview-blueprint/intro',
  '/guides/framework-prep',
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
  '/html-css/interview-questions',
];

function makeTempBuild() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fa-link-equity-'));
}

function writePage(root, route, hrefs) {
  const clean = route === '/' ? '' : route.replace(/^\/+|\/+$/g, '');
  const dir = path.join(root, clean);
  fs.mkdirSync(dir, { recursive: true });
  const links = hrefs.map((href, index) => `<a href="${href}">Link ${index}</a>`).join('\n');
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><body>${links}</body></html>`, 'utf8');
}

function runAudit(buildDir, extraEnv = {}) {
  return spawnSync('node', [scriptPath], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    env: {
      ...process.env,
      SEO_BUILD_DIR: buildDir,
      SEO_STRATEGIC_MIN_LINKS: '1',
      SEO_TECH_HUB_MIN_LINKS: '1',
      SEO_TRIVIA_INBOUND_CAP: '2',
      SEO_LINK_EQUITY_TOP_SAMPLE_SIZE: '8',
      SEO_TOP_TRIVIA_MAX: '2',
      ...extraEnv,
    },
  });
}

{
  const buildDir = makeTempBuild();
  writePage(buildDir, '/', [
    ...requiredTargets,
    '/javascript/trivia/js-event-loop',
  ]);

  const result = runAudit(buildDir);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[seo:link-equity\] passed/);
}

{
  const buildDir = makeTempBuild();
  writePage(buildDir, '/', [
    '/javascript/trivia/js-event-loop',
    '/javascript/trivia/js-event-loop',
    '/javascript/trivia/js-event-loop',
  ]);

  const result = runAudit(buildDir, {
    SEO_STRATEGIC_MIN_LINKS: '0',
    SEO_TECH_HUB_MIN_LINKS: '0',
  });
  assert.notEqual(result.status, 0, 'Expected trivia cap failure');
  assert.match(`${result.stdout}${result.stderr}`, /cap is 2/);
}

{
  const buildDir = makeTempBuild();
  writePage(buildDir, '/', [
    '/javascript/trivia/js-event-loop',
    '/react/trivia/react-keys-in-lists',
    '/angular/trivia/angular-rxjs-switchmap',
    '/coding',
  ]);

  const result = runAudit(buildDir, {
    SEO_STRATEGIC_MIN_LINKS: '0',
    SEO_TECH_HUB_MIN_LINKS: '0',
    SEO_TRIVIA_INBOUND_CAP: '5',
    SEO_LINK_EQUITY_TOP_SAMPLE_SIZE: '4',
    SEO_TOP_TRIVIA_MAX: '1',
  });
  assert.notEqual(result.status, 0, 'Expected top-list trivia dominance failure');
  assert.match(`${result.stdout}${result.stderr}`, /trivia detail targets appear in the top 4/);
}

console.log('[audit-internal-link-equity.test] passed');
