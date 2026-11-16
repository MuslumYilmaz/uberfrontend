// The company guide trailer's source frames: the Multi-step Signup task as a Premium member, its checks, and Pressure
// Mode round 1, from a production build served locally. Captured at twice the pixel density so the encoder can zoom in
// and stay sharp. The account is answered in the browser, so no API is reached.
//
//   node scripts/trailer/capture-premium-trailer.mjs [base, default http://127.0.0.1:4330] [out dir, default .]
//   swiftc scripts/trailer/premium-trailer.swift -o /tmp/premium-trailer -framework AVFoundation -framework ImageIO
//   /tmp/premium-trailer src/assets/media/premium-trailer.mp4 src/assets/media/premium-trailer-poster.jpg \
//     frame-1-task.png frame-2-checks.png frame-3-entry.png frame-4-round.png
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://127.0.0.1:4330';
const OUT = process.argv[3] || '.';
const ALLOWED = new Set([new URL(BASE).host, 'cdn.jsdelivr.net']);
const premium = { _id: 'trailer', username: 'trailer', email: 'trailer@example.com', role: 'user', accessTier: 'premium',
  prefs: { tz: 'UTC', theme: 'dark', defaultTech: 'react', keyboard: 'default', marketingEmails: false },
  entitlements: { pro: { status: 'active', validUntil: null }, projects: { status: 'none', validUntil: null } },
  solvedQuestionIds: [], companyPlan: null, freeUnlock: null };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await context.route((url) => !ALLOWED.has(url.host) && !url.protocol.startsWith('blob') && !url.protocol.startsWith('data'), (route) => route.abort());
await context.route((url) => url.pathname.startsWith('/api/'), (route) => route.request().url().includes('/auth/me')
  ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(premium) })
  : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
await context.addInitScript(() => { try { localStorage.setItem('fa:auth:session', '1'); } catch {} });
const page = await context.newPage();
await page.goto(`${BASE}/react/coding/react-multi-step-signup`, { waitUntil: 'load' });
await page.getByTestId('framework-run-checks').waitFor({ timeout: 60000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: path.join(OUT, 'frame-1-task.png') });
await page.getByTestId('framework-run-checks').first().click();
await page.getByTestId('framework-check-result').first().waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, 'frame-2-checks.png') });
await page.getByTestId('pressure-mode-entry').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, 'frame-3-entry.png') });
await page.getByTestId('pressure-mode-start').first().click();
await page.getByTestId('pressure-active-round').first().waitFor({ timeout: 30000 }).catch(() => console.log('no active round'));
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'frame-4-round.png') });
const round = page.getByTestId('pressure-active-round');
if (await round.count()) console.log('round:', (await round.first().innerText()).slice(0, 300).replace(/\n/g, ' | '));
const panel = page.getByTestId('pressure-mode-panel');
if (await panel.count()) console.log('panel:', (await panel.first().innerText()).slice(0, 300).replace(/\n/g, ' | '));
await browser.close();
