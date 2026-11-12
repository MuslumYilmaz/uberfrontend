#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import postcss from 'postcss';

const assetDirectory = 'assets/prime-ssr';
const componentAssetDirectory = 'assets/ssr-styles';
// Smaller component styles stay inline: a request costs more than they weigh.
const COMPONENT_MIN_BYTES = 2048;
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

/**
 * Angular's emulated encapsulation scopes every rule of a component with its _ngcontent/_nghost attributes. A style
 * the client no longer manages must stay harmless on later routes, so only fully scoped CSS moves; ::ng-deep, an
 * unencapsulated component and URL-dependent CSS stay inline.
 */
export function isScopedComponentCss(css) {
  if (/url\s*\(|@import|@charset|@namespace/i.test(css)) return false;
  let ast;
  try { ast = postcss.parse(css); } catch { return false; }
  let rules = 0;
  let scoped = true;
  ast.walkRules(rule => {
    // Keyframe steps (from, to, 50%) are not selectors.
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    rules += 1;
    if (!rule.selectors.every(selector => /\[_ng(?:content|host)-/.test(selector))) scoped = false;
  });
  return scoped && rules > 0;
}

function headOf(html) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const head = document.childNodes.find(node => node.tagName === 'html')?.childNodes.find(node => node.tagName === 'head');
  const base = head?.childNodes.find(node => node.tagName === 'base')?.attrs.find(attr => attr.name === 'href')?.value;
  return { head, base };
}

function componentStyleText(html, node) {
  const location = node.sourceCodeLocation;
  if (!location?.startTag || !location?.endTag) throw new Error('Incomplete Angular SSR style');
  return html.slice(location.startTag.endOffset, location.endTag.startOffset);
}

/** The component styles Angular wrote into a page's head (`<style ng-app-id>`), as written. */
export function componentStylesOf(html) {
  const { head } = headOf(html);
  return (head?.childNodes ?? [])
    .filter(node => node.tagName === 'style' && node.attrs.length === 1 && node.attrs[0].name === 'ng-app-id')
    .map(node => componentStyleText(html, node));
}

/**
 * Moves a page's large, scoped Angular component styles into content-hashed files, one link in place of each style
 * so the cascade keeps its order. `shared` limits the move to styles other pages also carry; each moved style is then
 * downloaded once and cached across routes instead of repeated in every page. On the client Angular finds no server
 * style to reuse and adds the component's own <style>: the same rules again, after the link.
 */
export function planComponentStyles(html, shared) {
  const { head, base } = headOf(html);
  const assets = new Map();
  const edits = [];
  const references = [];
  for (const node of head?.childNodes ?? []) {
    if (node.tagName === 'link' && node.attrs.some(attr => attr.name === 'data-fa-ssr-styles')) {
      const href = node.attrs.find(attr => attr.name === 'href')?.value;
      if (!/^\/assets\/ssr-styles\/[a-f0-9]{64}\.css$/.test(href ?? '')) throw new Error('Invalid Angular SSR style asset reference');
      references.push(href.slice(1));
    }
    // Only Angular's own markup: a style with any other attribute (media, nonce) stays as it is.
    if (node.tagName !== 'style' || node.attrs.length !== 1 || node.attrs[0].name !== 'ng-app-id') continue;
    const css = componentStyleText(html, node);
    if (Buffer.byteLength(css) < COMPONENT_MIN_BYTES || (shared && !shared.has(css)) || !isScopedComponentCss(css)) continue;
    if (base !== '/') throw new Error('Angular SSR style extraction requires <base href="/">');
    const asset = `${componentAssetDirectory}/${hash(css)}.css`;
    assets.set(asset, css);
    const location = node.sourceCodeLocation;
    edits.push({ start: location.startOffset, end: location.endOffset,
      text: `<link rel="stylesheet" href="/${asset}" data-fa-ssr-styles>` });
  }
  let output = html;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return { html: output, assets, references };
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
  const filenames = await htmlFiles(buildDirectory);
  // Component styles move only when another page carries the same CSS, so first count where each one appears.
  const pagesPerStyle = new Map();
  for (const filename of filenames) {
    const html = await fs.readFile(filename, 'utf8');
    if (!html.includes('ng-app-id')) continue;
    for (const css of new Set(componentStylesOf(html))) pagesPerStyle.set(css, (pagesPerStyle.get(css) ?? 0) + 1);
  }
  const shared = new Set([...pagesPerStyle].filter(([, pages]) => pages > 1).map(([css]) => css));
  // Validate every page and existing generated reference before changing output.
  for (const filename of filenames) {
    const html = await fs.readFile(filename, 'utf8');
    if (!html.includes('data-primeng-style-id') && !html.includes('ng-app-id') && !html.includes('data-fa-ssr-styles')) continue;
    const prime = planPrimeStyles(html);
    const plan = planComponentStyles(prime.html, shared);
    for (const [reference, label] of [...prime.references.map(r => [r, 'PrimeNG']), ...plan.references.map(r => [r, 'Angular'])]) {
      const css = await fs.readFile(path.join(buildDirectory, reference), 'utf8');
      if (path.basename(reference) !== `${hash(css)}.css`) throw new Error(`Corrupt ${label} SSR asset: ${reference}`);
    }
    for (const [asset, css] of [...prime.assets, ...plan.assets]) assets.set(asset, css);
    if (plan.html !== html) {
      plans.push({ filename, html: plan.html });
      savedBytes += Buffer.byteLength(html) - Buffer.byteLength(plan.html);
    }
  }
  // Publish assets before their HTML references; never delete previous hashes.
  for (const directory of new Set([...assets.keys()].map(asset => path.dirname(asset)))) {
    await fs.mkdir(path.join(buildDirectory, directory), { recursive: true });
  }
  for (const [asset, css] of assets) await fs.writeFile(path.join(buildDirectory, asset), css);
  for (const plan of plans) await fs.writeFile(plan.filename, plan.html);
  return { pages: plans.length, assets: assets.size, assetBytes: [...assets.values()].reduce((sum, css) => sum + Buffer.byteLength(css), 0), savedHtmlBytes: savedBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = path.resolve(process.argv[2] || 'dist/frontendatlas/browser');
  console.log('[prime-ssr]', JSON.stringify(await extractPrimeStyles(directory)));
}
