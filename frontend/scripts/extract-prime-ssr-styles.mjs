#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import postcss from 'postcss';

const assetDirectory = 'assets/prime-ssr';
const hash = (css) => createHash('sha256').update(css).digest('hex');

/** Only move self-contained PrimeNG layers; retain small/conditional styles inline. */
function canExternalize(node, css) {
  if (css.length < 512 || node.attrs.some(({ name, value }) =>
    name !== 'data-primeng-style-id' && !(name === 'type' && value === 'text/css'))) return false;
  // Moving a URL/escaped URL to another directory changes its resolution. Keep it
  // inline, along with imports, rather than rewriting vendor CSS or its meaning.
  if (/url\s*\(|\\|@import|@charset|@namespace/i.test(css)) return false;
  const ast = postcss.parse(css);
  return ast.nodes.length > 0 && ast.nodes.every(node =>
    node.type === 'atrule' && node.name === 'layer' && node.params === 'primeng' && node.nodes);
}

export function planPrimeStyles(html) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const head = document.childNodes.find(node => node.tagName === 'html')?.childNodes.find(node => node.tagName === 'head');
  const assets = new Map();
  const edits = [];
  const references = [];
  const base = head?.childNodes.find(node => node.tagName === 'base')?.attrs.find(attr => attr.name === 'href')?.value;
  for (const node of head?.childNodes ?? []) {
    if (node.tagName === 'link' && node.attrs.some(attr => attr.name === 'data-fa-prime-ssr')) {
      const href = node.attrs.find(attr => attr.name === 'href')?.value;
      if (!/^\/assets\/prime-ssr\/[a-f0-9]{64}\.css$/.test(href ?? '')) throw new Error('Invalid PrimeNG SSR asset reference');
      references.push(href.slice(1));
    }
    if (node.tagName !== 'style' || !node.attrs.some(attr => attr.name === 'data-primeng-style-id')) continue;
    const location = node.sourceCodeLocation;
    if (!location?.startTag || !location?.endTag) throw new Error('Incomplete PrimeNG SSR style');
    const css = html.slice(location.startTag.endOffset, location.endTag.startOffset);
    if (!canExternalize(node, css)) continue;
    // The deployed app uses a root base. Fail before any writes if that changes.
    if (base !== '/') throw new Error('PrimeNG SSR extraction requires <base href="/">');
    const asset = `${assetDirectory}/${hash(css)}.css`;
    assets.set(asset, css);
    // Keep the exact original style element immediately after its replacement.
    // PrimeNG UseStyle finds and refills this marker during hydration. One link
    // per style preserves the cascade even while markers are filled separately.
    edits.push({ start: location.startOffset, end: location.startOffset,
      text: `<link rel="stylesheet" href="/${asset}" data-fa-prime-ssr>` });
    edits.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, text: '' });
  }
  let output = html;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return { html: output, assets, references };
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(filename));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(filename);
  }
  return files;
}

export async function extractPrimeStyles(buildDirectory) {
  const plans = [];
  const assets = new Map();
  let savedBytes = 0;
  // Validate every page and existing generated reference before changing output.
  for (const filename of await htmlFiles(buildDirectory)) {
    const html = await fs.readFile(filename, 'utf8');
    if (!html.includes('data-primeng-style-id')) continue;
    const plan = planPrimeStyles(html);
    for (const reference of plan.references) {
      const css = await fs.readFile(path.join(buildDirectory, reference), 'utf8');
      if (path.basename(reference) !== `${hash(css)}.css`) throw new Error(`Corrupt PrimeNG SSR asset: ${reference}`);
    }
    for (const [asset, css] of plan.assets) assets.set(asset, css);
    if (plan.html !== html) {
      plans.push({ filename, html: plan.html });
      savedBytes += Buffer.byteLength(html) - Buffer.byteLength(plan.html);
    }
  }
  // Publish assets before their HTML references; never delete previous hashes.
  if (assets.size) await fs.mkdir(path.join(buildDirectory, assetDirectory), { recursive: true });
  for (const [asset, css] of assets) await fs.writeFile(path.join(buildDirectory, asset), css);
  for (const plan of plans) await fs.writeFile(plan.filename, plan.html);
  return { pages: plans.length, assets: assets.size, assetBytes: [...assets.values()].reduce((sum, css) => sum + Buffer.byteLength(css), 0), savedHtmlBytes: savedBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = path.resolve(process.argv[2] || 'dist/frontendatlas/browser');
  console.log('[prime-ssr]', JSON.stringify(await extractPrimeStyles(directory)));
}
