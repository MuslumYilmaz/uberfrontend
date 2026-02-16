#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { startSeoStaticServer } from './seo-static-server.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const HOST = process.env.SEO_SERVER_HOST || '127.0.0.1';
const PORT = Number(process.env.SEO_SERVER_PORT || 4173);
const SAMPLE_GUIDE_ROUTE = '/guides/interview-blueprint/intro';
const execFileAsync = promisify(execFile);

function pickSystemDesignSampleId() {
  const filePath = path.resolve('src/assets/questions/system-design/index.json');
  if (!fs.existsSync(filePath)) return '';
  try {
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) return '';
    const first = list.find((item) => typeof item?.id === 'string' && item.id.trim().length > 0);
    return first?.id || '';
  } catch {
    return '';
  }
}

async function curlStatus(url) {
  const { stdout } = await execFileAsync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', url], {
    encoding: 'utf8',
  });
  return Number(String(stdout).trim());
}

async function curlBody(url) {
  const { stdout } = await execFileAsync('curl', ['-sS', url], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return stdout;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1].trim() : '';
}

function extractRobots(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  return m ? m[1].trim().toLowerCase() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const systemDesignId = pickSystemDesignSampleId();
if (!systemDesignId) {
  console.error('[seo:smoke] Could not find a system-design sample id.');
  process.exit(1);
}

let server = null;

try {
  server = await startSeoStaticServer({
    buildDir: BUILD_DIR,
    host: HOST,
    port: PORT,
    logPrefix: '[seo:smoke]',
  });

  const base = server.baseUrl.replace(/\/+$/, '');
  const checks = [];

  const unknownPath = '/non-existent-seo-check-abc123';
  const unknownUrl = `${base}${unknownPath}`;
  const unknownStatus = await curlStatus(unknownUrl);
  const unknownBody = await curlBody(unknownUrl);
  const unknownCanonical = extractCanonical(unknownBody);
  checks.push({
    name: 'unknown route returns 404',
    ok: unknownStatus === 404,
    detail: `${unknownStatus} ${unknownPath}`,
  });
  checks.push({
    name: 'unknown route is not canonicalized to homepage',
    ok: !/https:\/\/frontendatlas\.com\/?$/.test(unknownCanonical),
    detail: `canonical=${unknownCanonical || '(missing)'}`,
  });

  const notFoundPath = '/404';
  const notFoundUrl = `${base}${notFoundPath}`;
  const notFoundStatus = await curlStatus(notFoundUrl);
  const notFoundBody = await curlBody(notFoundUrl);
  const notFoundCanonical = extractCanonical(notFoundBody);
  const notFoundRobots = extractRobots(notFoundBody);
  checks.push({
    name: '/404 returns 200 or 404',
    ok: notFoundStatus === 200 || notFoundStatus === 404,
    detail: `${notFoundStatus} ${notFoundPath}`,
  });
  checks.push({
    name: '/404 robots is noindex',
    ok: notFoundRobots.includes('noindex'),
    detail: `robots=${notFoundRobots || '(missing)'}`,
  });
  checks.push({
    name: '/404 canonical is /404',
    ok: /https:\/\/frontendatlas\.com\/404\/?$/.test(notFoundCanonical),
    detail: `canonical=${notFoundCanonical || '(missing)'}`,
  });

  const dashboardPath = '/dashboard';
  const dashboardUrl = `${base}${dashboardPath}`;
  const dashboardStatus = await curlStatus(dashboardUrl);
  const dashboardBody = await curlBody(dashboardUrl);
  const dashboardCanonical = extractCanonical(dashboardBody);
  const dashboardRobots = extractRobots(dashboardBody);
  checks.push({
    name: '/dashboard returns 200',
    ok: dashboardStatus === 200,
    detail: `${dashboardStatus} ${dashboardPath}`,
  });
  checks.push({
    name: '/dashboard robots is noindex',
    ok: dashboardRobots.includes('noindex'),
    detail: `robots=${dashboardRobots || '(missing)'}`,
  });
  checks.push({
    name: '/dashboard canonical is self (not homepage)',
    ok: /https:\/\/frontendatlas\.com\/dashboard\/?$/.test(dashboardCanonical),
    detail: `canonical=${dashboardCanonical || '(missing)'}`,
  });

  const systemPath = `/system-design/${systemDesignId}`;
  const systemUrl = `${base}${systemPath}`;
  const systemStatus = await curlStatus(systemUrl);
  const systemBody = await curlBody(systemUrl);
  const systemTitle = extractTitle(systemBody);
  const systemH1 = extractH1(systemBody);
  checks.push({
    name: 'system-design detail returns 200',
    ok: systemStatus === 200,
    detail: `${systemStatus} ${systemPath}`,
  });
  checks.push({
    name: 'system-design detail title is non-generic',
    ok: systemTitle.length > 0 && systemTitle.toLowerCase() !== 'system design scenario | frontendatlas',
    detail: `title=${systemTitle || '(missing)'}`,
  });
  checks.push({
    name: 'system-design detail has non-empty h1',
    ok: systemH1.length > 0,
    detail: `h1=${systemH1 || '(missing)'}`,
  });

  const guideUrl = `${base}${SAMPLE_GUIDE_ROUTE}`;
  const guideStatus = await curlStatus(guideUrl);
  const guideBody = await curlBody(guideUrl);
  const guideH1 = extractH1(guideBody);
  checks.push({
    name: 'guide detail returns 200',
    ok: guideStatus === 200,
    detail: `${guideStatus} ${SAMPLE_GUIDE_ROUTE}`,
  });
  checks.push({
    name: 'guide detail has non-empty h1',
    ok: guideH1.length > 0,
    detail: `h1=${guideH1 || '(missing)'}`,
  });

  let failed = 0;
  for (const check of checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    console.log(`[seo:smoke] ${status} ${check.name} (${check.detail})`);
    if (!check.ok) failed += 1;
  }

  if (failed > 0) process.exit(1);
} finally {
  if (server) {
    await server.close();
  }
}
