#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const scriptPath = fileURLToPath(import.meta.url);
const frontendRoot = path.resolve(path.dirname(scriptPath), '..');
const repoRoot = path.resolve(frontendRoot, '..');

export const defaultCanonicalRoot = path.join(repoRoot, 'cdn', 'sb');
export const defaultMirrorRoot = path.join(frontendRoot, 'src', 'assets', 'sb');

const CSS_FILE_PATTERN = /\.css$/i;
const JSON_FILE_PATTERN = /\.json$/i;
const INDENT = '  ';

export class FrameworkCssFormatError extends Error {
  constructor(mode, issues) {
    const visibleIssues = issues.slice(0, 40);
    const hiddenCount = issues.length - visibleIssues.length;
    const detail = visibleIssues.map((issue) => `- ${issue}`).join('\n');
    const remainder = hiddenCount > 0 ? `\n- ... ${hiddenCount} more issue(s)` : '';
    super(
      `Framework CSS ${mode} failed with ${issues.length} issue(s):` +
        (detail ? `\n${detail}${remainder}` : '')
    );
    this.name = 'FrameworkCssFormatError';
    this.mode = mode;
    this.issues = issues;
  }
}

function semanticNode(node) {
  switch (node.type) {
    case 'root':
      return {
        type: node.type,
        nodes: (node.nodes ?? []).map(semanticNode),
      };
    case 'rule':
      return {
        type: node.type,
        selector: node.selector,
        nodes: (node.nodes ?? []).map(semanticNode),
      };
    case 'atrule':
      return {
        type: node.type,
        name: node.name,
        params: node.params,
        nodes: node.nodes ? node.nodes.map(semanticNode) : null,
      };
    case 'decl':
      return {
        type: node.type,
        prop: node.prop,
        value: node.value,
        important: node.important === true,
        embeddedComments: declarationComments(node),
      };
    case 'comment':
      return {
        type: node.type,
        text: node.text,
        left: node.raws.left ?? '',
        right: node.raws.right ?? '',
      };
    default:
      throw new Error(`Unsupported PostCSS node type: ${node.type}`);
  }
}

function commentsIn(raw) {
  return [...String(raw ?? '').matchAll(/\/\*([\s\S]*?)\*\//g)].map((match) => match[1]);
}

function declarationComments(node) {
  const rawValue = node.raws.value?.raw;
  const rawImportant = node.raws.important;
  return [
    ...commentsIn(node.raws.between),
    ...commentsIn(rawValue),
    ...commentsIn(rawImportant),
  ];
}

function declarationValue(node) {
  if (node.raws.value?.value === node.value && typeof node.raws.value.raw === 'string') {
    return node.raws.value.raw;
  }
  return node.value;
}

function declarationPrefixComments(node) {
  const between = String(node.raws.between ?? '');
  const colon = between.indexOf(':');
  return commentsIn(colon >= 0 ? between.slice(colon + 1) : between);
}

function declarationImportant(node) {
  if (!node.important) return '';
  const comments = commentsIn(node.raws.important);
  return comments.length > 0 ? ` ${comments.map((text) => `/*${text}*/`).join(' ')} !important` : ' !important';
}

export function cssSemanticAst(source, from = '<css>') {
  return semanticNode(postcss.parse(source, { from }));
}

function isBlockNode(node) {
  return node.type === 'rule' || (node.type === 'atrule' && Array.isArray(node.nodes));
}

function renderChildren(nodes, depth) {
  let output = '';

  for (let index = 0; index < nodes.length; index += 1) {
    if (index > 0) {
      const previous = nodes[index - 1];
      output += isBlockNode(previous) || isBlockNode(nodes[index]) ? '\n\n' : '\n';
    }
    output += renderNode(nodes[index], depth);
  }

  return output;
}

function renderBlockHeader(header, depth) {
  const padding = INDENT.repeat(depth);
  return `${padding}${header}`;
}

function renderNode(node, depth) {
  const padding = INDENT.repeat(depth);

  switch (node.type) {
    case 'rule': {
      const header = renderBlockHeader(node.selector, depth);
      const children = renderChildren(node.nodes ?? [], depth + 1);
      return children ? `${header} {\n${children}\n${padding}}` : `${header} {\n${padding}}`;
    }
    case 'atrule': {
      const parameters = node.params ? ` ${node.params}` : '';
      const header = renderBlockHeader(`@${node.name}${parameters}`, depth);
      if (!Array.isArray(node.nodes)) return `${header};`;
      const children = renderChildren(node.nodes, depth + 1);
      return children ? `${header} {\n${children}\n${padding}}` : `${header} {\n${padding}}`;
    }
    case 'decl': {
      const prefixComments = declarationPrefixComments(node);
      const prefix = prefixComments.length > 0
        ? `${prefixComments.map((text) => `/*${text}*/`).join(' ')} `
        : '';
      return `${padding}${node.prop}: ${prefix}${declarationValue(node)}${declarationImportant(node)};`;
    }
    case 'comment': {
      const left = node.raws.left ?? '';
      const right = node.raws.right ?? '';
      return `${padding}/*${left}${node.text}${right}*/`;
    }
    default:
      throw new Error(`Unsupported PostCSS node type: ${node.type}`);
  }
}

function renderRoot(root) {
  const body = renderChildren(root.nodes ?? [], 0);
  return `${body}\n`;
}

export function formatCss(source, from = '<css>') {
  if (typeof source !== 'string') {
    throw new TypeError(`${from}: CSS source must be a string`);
  }

  const originalRoot = postcss.parse(source, { from });
  const formatted = renderRoot(originalRoot);
  const formattedRoot = postcss.parse(formatted, { from: `${from}#formatted` });

  if (!isDeepStrictEqual(semanticNode(originalRoot), semanticNode(formattedRoot))) {
    throw new Error(`${from}: canonical formatting changed the semantic PostCSS AST`);
  }

  const formattedAgain = renderRoot(formattedRoot);
  if (formattedAgain !== formatted) {
    throw new Error(`${from}: canonical formatting is not idempotent`);
  }

  return formatted;
}

function listRelativeFiles(root) {
  if (!fs.existsSync(root)) return [];

  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(root, absolute));
      else throw new Error(`${absolute}: sandbox asset trees must contain only files and directories`);
    }
  };
  visit(root);
  return files.sort();
}

function skipJsonWhitespace(raw, start) {
  let cursor = start;
  while (/\s/.test(raw[cursor] ?? '')) cursor += 1;
  return cursor;
}

function propertyValueStart(raw, property, searchStart, label) {
  const propertyToken = JSON.stringify(property);
  let propertyStart = raw.indexOf(propertyToken, searchStart);

  while (propertyStart >= 0) {
    const colon = skipJsonWhitespace(raw, propertyStart + propertyToken.length);
    if (raw[colon] === ':') return skipJsonWhitespace(raw, colon + 1);
    propertyStart = raw.indexOf(propertyToken, propertyStart + propertyToken.length);
  }

  throw new Error(`${label}: could not locate JSON property ${propertyToken}`);
}

function sourcePatch(raw, filesStart, file, value, formatted, label) {
  const fileValueStart = propertyValueStart(raw, file, filesStart, label);
  let codeValueStart = fileValueStart;
  let source;

  if (typeof value === 'string') {
    source = value;
  } else if (value && typeof value === 'object' && typeof value.code === 'string') {
    source = value.code;
    codeValueStart = propertyValueStart(raw, 'code', fileValueStart, `${label}:${file}`);
  } else {
    throw new Error(`${label}:${file}: CSS entries must be strings or { "code": string } objects`);
  }

  const codeValueEnd = jsonStringEnd(raw, codeValueStart, `${label}:${file}`);
  const encodedSource = raw.slice(codeValueStart, codeValueEnd);
  if (JSON.parse(encodedSource) !== source) {
    throw new Error(`${label}:${file}: could not match the parsed CSS source in the JSON document`);
  }

  return {
    start: codeValueStart,
    end: codeValueEnd,
    replacement: encodeCssJsonString(formatted, encodedSource),
  };
}

function jsonStringEnd(raw, start, label) {
  if (raw[start] !== '"') throw new Error(`${label}: CSS source must be encoded as a JSON string`);
  for (let cursor = start + 1; cursor < raw.length; cursor += 1) {
    if (raw[cursor] === '\\') {
      cursor += 1;
      continue;
    }
    if (raw[cursor] === '"') return cursor + 1;
  }
  throw new Error(`${label}: unterminated JSON string`);
}

function unicodeEscapeStyles(encoded) {
  const tokens = [];
  for (let cursor = 1; cursor < encoded.length - 1;) {
    if (encoded[cursor] === '\\' && encoded[cursor + 1] === 'u') {
      const escape = encoded.slice(cursor, cursor + 6);
      tokens.push({ codeUnit: Number.parseInt(escape.slice(2), 16), escape });
      cursor += 6;
      continue;
    }
    if (encoded[cursor] === '\\') {
      const escape = encoded.slice(cursor, cursor + 2);
      const decoded = JSON.parse(`"${escape}"`);
      for (let index = 0; index < decoded.length; index += 1) {
        tokens.push({ codeUnit: decoded.charCodeAt(index), escape: null });
      }
      cursor += 2;
      continue;
    }
    tokens.push({ codeUnit: encoded.charCodeAt(cursor), escape: null });
    cursor += 1;
  }

  const escapedUnits = new Set(tokens.filter((token) => token.escape).map((token) => token.codeUnit));
  const styles = new Map();
  for (const token of tokens) {
    if (!escapedUnits.has(token.codeUnit)) continue;
    const queue = styles.get(token.codeUnit) ?? [];
    queue.push(token.escape);
    styles.set(token.codeUnit, queue);
  }
  return styles;
}

function encodeCssJsonString(source, originalEncoded) {
  const styles = unicodeEscapeStyles(originalEncoded);
  if (styles.size === 0) return JSON.stringify(source);

  const occurrences = new Map();
  let output = '"';
  for (let index = 0; index < source.length; index += 1) {
    const codeUnit = source.charCodeAt(index);
    const queue = styles.get(codeUnit);
    const occurrence = occurrences.get(codeUnit) ?? 0;
    const preservedEscape = queue?.[occurrence] ?? null;
    if (queue) occurrences.set(codeUnit, occurrence + 1);

    if (preservedEscape) {
      output += preservedEscape;
      continue;
    }

    const nextCodeUnit = source.charCodeAt(index + 1);
    const isSurrogatePair =
      codeUnit >= 0xd800 && codeUnit <= 0xdbff &&
      nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff;
    if (isSurrogatePair && !styles.has(nextCodeUnit)) {
      output += JSON.stringify(source.slice(index, index + 2)).slice(1, -1);
      index += 1;
    } else {
      output += JSON.stringify(source[index]).slice(1, -1);
    }
  }
  return `${output}"`;
}

function applyPatches(raw, patches) {
  let output = raw;
  for (const patch of [...patches].sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, patch.start)}${patch.replacement}${output.slice(patch.end)}`;
  }
  return output;
}

function assignFileSource(asset, file, source) {
  if (typeof asset.files[file] === 'string') asset.files[file] = source;
  else asset.files[file].code = source;
}

function formatAsset(raw, relative) {
  const label = `cdn/sb/${relative}`;
  const asset = JSON.parse(raw);
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
    throw new Error(`${label}: asset must be a JSON object`);
  }
  if (!asset.files || typeof asset.files !== 'object' || Array.isArray(asset.files)) {
    throw new Error(`${label}: asset must contain a files object`);
  }

  const filesStart = propertyValueStart(raw, 'files', 0, label);
  if (raw[filesStart] !== '{') {
    throw new Error(`${label}: files must be encoded as a JSON object`);
  }

  const expectedAsset = JSON.parse(raw);
  const patches = [];
  let cssSources = 0;
  let changedCssSources = 0;

  for (const [file, value] of Object.entries(asset.files)) {
    if (!CSS_FILE_PATTERN.test(file)) continue;
    const source = typeof value === 'string' ? value : value?.code;
    if (typeof source !== 'string') {
      throw new Error(`${label}:${file}: CSS entries must be strings or { "code": string } objects`);
    }

    const sourceLabel = `${label}:${file}`;
    const formatted = formatCss(source, sourceLabel);
    cssSources += 1;
    if (formatted !== source) changedCssSources += 1;
    if (formatted !== source) {
      patches.push(sourcePatch(raw, filesStart, file, value, formatted, label));
    }
    assignFileSource(expectedAsset, file, formatted);
  }

  const output = applyPatches(raw, patches);
  const outputAsset = JSON.parse(output);
  if (!isDeepStrictEqual(outputAsset, expectedAsset)) {
    throw new Error(`${label}: formatting changed data outside embedded CSS sources`);
  }

  return {
    output,
    cssSources,
    changedCssSources,
  };
}

export function planFrameworkCssFormatting({
  mode = 'check',
  canonicalRoot = defaultCanonicalRoot,
  mirrorRoot = defaultMirrorRoot,
} = {}) {
  if (!['check', 'write'].includes(mode)) {
    throw new Error(`Unsupported framework CSS mode: ${mode}`);
  }

  const issues = [];
  let canonicalFiles = [];
  let mirrorFiles = [];

  try {
    canonicalFiles = listRelativeFiles(canonicalRoot);
  } catch (error) {
    issues.push(error.message);
  }
  try {
    mirrorFiles = listRelativeFiles(mirrorRoot);
  } catch (error) {
    issues.push(error.message);
  }

  if (canonicalFiles.length === 0) issues.push(`${canonicalRoot}: no canonical sandbox assets found`);

  const canonicalSet = new Set(canonicalFiles);
  const mirrorSet = new Set(mirrorFiles);
  for (const relative of mirrorFiles) {
    if (!canonicalSet.has(relative)) {
      issues.push(`frontend/src/assets/sb/${relative}: mirror has no canonical CDN asset`);
    }
  }
  if (mode === 'check') {
    for (const relative of canonicalFiles) {
      if (!mirrorSet.has(relative)) {
        issues.push(`frontend/src/assets/sb/${relative}: missing mirror asset`);
      }
    }
  }

  const files = [];
  let cssSources = 0;
  let changedCssSources = 0;

  for (const relative of canonicalFiles) {
    if (!JSON_FILE_PATTERN.test(relative)) {
      issues.push(`cdn/sb/${relative}: framework sandbox assets must be JSON files`);
      continue;
    }

    let raw;
    try {
      raw = fs.readFileSync(path.join(canonicalRoot, relative), 'utf8');
      const formatted = formatAsset(raw, relative);
      cssSources += formatted.cssSources;
      changedCssSources += formatted.changedCssSources;
      files.push({ relative, canonicalRaw: raw, output: formatted.output });

      if (mode === 'check' && formatted.output !== raw) {
        issues.push(
          `cdn/sb/${relative}: ${formatted.changedCssSources} embedded CSS source(s) are not canonically formatted`
        );
      }
    } catch (error) {
      issues.push(error.message);
      continue;
    }

    if (!mirrorSet.has(relative)) continue;
    try {
      const mirrorRaw = fs.readFileSync(path.join(mirrorRoot, relative), 'utf8');
      if (mode === 'check' && mirrorRaw !== raw) {
        issues.push(`frontend/src/assets/sb/${relative}: mirror differs from canonical CDN asset`);
      }
    } catch (error) {
      issues.push(`${path.join(mirrorRoot, relative)}: ${error.message}`);
    }
  }

  return {
    mode,
    canonicalRoot,
    mirrorRoot,
    files,
    issues,
    summary: {
      assets: canonicalFiles.length,
      cssSources,
      changedAssets: files.filter((file) => file.output !== file.canonicalRaw).length,
      changedCssSources,
    },
  };
}

function writeAtomically(target, contents) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporary, contents, 'utf8');
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function runFrameworkCssFormatter(options = {}) {
  const plan = planFrameworkCssFormatting(options);
  if (plan.issues.length > 0) throw new FrameworkCssFormatError(plan.mode, plan.issues);

  if (plan.mode === 'write') {
    for (const file of plan.files) {
      writeAtomically(path.join(plan.canonicalRoot, file.relative), file.output);
      writeAtomically(path.join(plan.mirrorRoot, file.relative), file.output);
    }
  }

  const action = plan.mode === 'write' ? 'formatted and mirrored' : 'checked';
  options.logger?.log(
    `Framework CSS: ${action} ${plan.summary.cssSources} source(s) in ${plan.summary.assets} asset(s).`
  );
  return plan.summary;
}

function cliMode(arguments_) {
  const modes = arguments_.filter((argument) => argument === '--check' || argument === '--write');
  const unknown = arguments_.filter((argument) => !['--check', '--write'].includes(argument));
  if (unknown.length > 0 || modes.length !== 1) {
    throw new Error('Usage: node scripts/format-framework-css.mjs (--check|--write)');
  }
  return modes[0].slice(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    runFrameworkCssFormatter({ mode: cliMode(process.argv.slice(2)), logger: console });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
