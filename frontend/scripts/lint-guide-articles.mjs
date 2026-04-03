#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { execFileSync } from 'child_process';
import { frontendRoot, guideRegistryPath, repoRoot } from './content-paths.mjs';

const REGISTRY_PATH = path.resolve(process.env.GUIDE_REGISTRY_PATH || guideRegistryPath);
const CONTENT_DRAFTS_DIR = path.resolve(process.env.CONTENT_DRAFTS_DIR || path.join(repoRoot, 'content-drafts'));
const GUIDE_SHELL_PATH = path.resolve(
  process.env.GUIDE_SHELL_PATH || path.join(frontendRoot, 'src', 'app', 'shared', 'components', 'guide', 'guide-shell.component.ts'),
);
const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];
const TEMPLATE_BASENAMES = new Set(['playbook.md', 'system-design.md', 'trivia.md', 'tradeoff-battle.md', 'incident.md']);

const errors = [];
const warnings = [];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\[[^\]]+\]="[^"]*"/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function wordCount(value) {
  const text = normalizeText(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function propertyNameToString(name) {
  if (!name) return '';
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return String(name.text || '');
  }
  return '';
}

function getObjectProperty(objectLiteral, propName) {
  return objectLiteral.properties.find((prop) => {
    if (!ts.isPropertyAssignment(prop)) return false;
    return propertyNameToString(prop.name) === propName;
  }) || null;
}

function readStringProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop) return '';
  const init = prop.initializer;
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return init.text;
  }
  return '';
}

function readObjectProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

function readStringArrayProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return [];
  return prop.initializer.elements
    .map((element) => {
      if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
        return element.text;
      }
      return '';
    })
    .filter(Boolean);
}

function readImportPath(entryObject) {
  const loadProp = getObjectProperty(entryObject, 'load');
  if (!loadProp) return '';
  let importPath = '';
  function visit(node) {
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length > 0
      && ts.isStringLiteral(node.arguments[0])
    ) {
      importPath = node.arguments[0].text;
    }
    node.forEachChild(visit);
  }
  loadProp.initializer.forEachChild(visit);
  return importPath;
}

function readGuideArrays() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    addError(`guide registry not found: ${relFromRepo(REGISTRY_PATH)}`);
    return [];
  }

  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    REGISTRY_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const arrays = new Map();
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name)) return;
      if (!GUIDE_COLLECTIONS.includes(decl.name.text)) return;
      if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        arrays.set(decl.name.text, decl.initializer);
      }
    });
  });

  const entries = [];
  arrays.forEach((arrayLiteral, collection) => {
    arrayLiteral.elements.forEach((element) => {
      if (!ts.isObjectLiteralExpression(element)) return;
      const slug = readStringProperty(element, 'slug');
      const title = readStringProperty(element, 'title');
      const summary = readStringProperty(element, 'summary');
      const seo = readObjectProperty(element, 'seo');
      const importPath = readImportPath(element);
      const componentPath = importPath
        ? path.resolve(path.dirname(REGISTRY_PATH), `${importPath}.ts`)
        : '';

      entries.push({
        collection,
        slug,
        title,
        summary,
        seo: {
          title: readStringProperty(seo || { properties: [] }, 'title'),
          description: readStringProperty(seo || { properties: [] }, 'description'),
          primaryKeyword: readStringProperty(seo || { properties: [] }, 'primaryKeyword'),
          keywords: readStringArrayProperty(seo || { properties: [] }, 'keywords'),
          publishedAt: readStringProperty(seo || { properties: [] }, 'publishedAt'),
          updatedAt: readStringProperty(seo || { properties: [] }, 'updatedAt'),
          draftSource: readStringProperty(seo || { properties: [] }, 'draftSource'),
          searchIntent: readStringProperty(seo || { properties: [] }, 'searchIntent'),
          readerPromise: readStringProperty(seo || { properties: [] }, 'readerPromise'),
          uniqueAngle: readStringProperty(seo || { properties: [] }, 'uniqueAngle'),
          factCheckedAt: readStringProperty(seo || { properties: [] }, 'factCheckedAt'),
          reviewedBy: readStringProperty(seo || { properties: [] }, 'reviewedBy'),
        },
        componentPath,
      });
    });
  });

  return entries;
}

function extractComponentTemplate(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let template = '';
  sourceFile.forEachChild(function visit(node) {
    if (
      ts.isDecorator(node)
      && ts.isCallExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === 'Component'
    ) {
      const [arg] = node.expression.arguments;
      if (!arg || !ts.isObjectLiteralExpression(arg)) return;
      const templateProp = getObjectProperty(arg, 'template');
      if (!templateProp) return;
      const init = templateProp.initializer;
      if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
        template = init.text;
      } else {
        template = init.getText(sourceFile);
      }
    }
    node.forEachChild(visit);
  });

  return template;
}

function countInternalLinks(template) {
  return (
    template.match(/\[routerLink\]|routerLink=|href=["']\/(?!\/)/g)?.length || 0
  );
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: raw };
  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const pair = line.match(/^([a-z_]+):(.*)$/);
    if (!pair) continue;
    const key = pair[1];
    const value = pair[2].trim();
    if (!value) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length && /^\s+-\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s+-\s+/, '').trim().replace(/^"(.*)"$/, '$1'));
        cursor += 1;
      }
      frontmatter[key] = items;
      index = cursor - 1;
      continue;
    }
    frontmatter[key] = value.replace(/^"(.*)"$/, '$1');
  }

  return { frontmatter, body: raw.slice(match[0].length) };
}

function listDraftFiles(rootDir, out = []) {
  if (!fs.existsSync(rootDir)) return out;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      listDraftFiles(fullPath, out);
      return;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) return;
    if (entry.name === 'README.md') return;
    if (TEMPLATE_BASENAMES.has(entry.name)) return;
    out.push(fullPath);
  });
  return out;
}

function findDraftForSlug(slug) {
  const matches = listDraftFiles(CONTENT_DRAFTS_DIR).filter(
    (filePath) => path.basename(filePath, '.md') === slug,
  );
  if (matches.length > 1) {
    addWarning(`multiple draft files match slug "${slug}": ${matches.map(relFromRepo).join(', ')}`);
  }
  return matches[0] || '';
}

function validateDate(label, value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function readGitDateRange(filePath) {
  try {
    const first = execFileSync('git', ['log', '--follow', '--diff-filter=A', '--format=%aI', '--', filePath], {
      cwd: frontendRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .pop() || '';
    const last = execFileSync('git', ['log', '-1', '--format=%aI', '--', filePath], {
      cwd: frontendRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return {
      first: first ? first.slice(0, 10) : '',
      last: last ? last.slice(0, 10) : '',
    };
  } catch {
    return { first: '', last: '' };
  }
}

function validateGuideShellContract() {
  if (!fs.existsSync(GUIDE_SHELL_PATH)) {
    addError(`guide shell not found: ${relFromRepo(GUIDE_SHELL_PATH)}`);
    return false;
  }

  const source = fs.readFileSync(GUIDE_SHELL_PATH, 'utf8');
  const hasRelatedSection = source.includes('Continue Exploring') && source.includes('[routerLink]="item.link"');
  if (!hasRelatedSection) {
    addError(`guide shell is missing the shared related-links block: ${relFromRepo(GUIDE_SHELL_PATH)}`);
  }
  return hasRelatedSection;
}

function draftPathForEntry(entry) {
  if (entry.seo.draftSource) {
    return path.resolve(path.dirname(REGISTRY_PATH), entry.seo.draftSource);
  }
  return findDraftForSlug(entry.slug);
}

function validateDraftParity(entry, shippedWordCount, template, usesGuideShell) {
  const draftPath = draftPathForEntry(entry);
  if (!draftPath) return;
  if (!fs.existsSync(draftPath)) {
    addError(`${entry.collection}:${entry.slug} draftSource not found: ${relFromRepo(draftPath)}`);
    return;
  }

  const raw = fs.readFileSync(draftPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const draftStatus = String(frontmatter?.status || '').trim();
  const draftPrimaryKeyword = normalizeKey(frontmatter?.primary_keyword || '');
  const draftSearchIntent = normalizeKey(frontmatter?.search_intent || '');
  const draftReaderPromise = normalizeKey(frontmatter?.reader_promise || '');
  const draftUniqueAngle = normalizeKey(frontmatter?.unique_angle || '');
  const draftFactCheckedAt = validateDate('last_fact_checked_at', frontmatter?.last_fact_checked_at);
  const shippedPrimaryKeyword = normalizeKey(entry.seo.primaryKeyword);
  const shippedSearchIntent = normalizeKey(entry.seo.searchIntent);
  const shippedReaderPromise = normalizeKey(entry.seo.readerPromise);
  const shippedUniqueAngle = normalizeKey(entry.seo.uniqueAngle);
  const shippedFactCheckedAt = validateDate('factCheckedAt', entry.seo.factCheckedAt);
  const draftWordCount = wordCount(body);
  const minShippedWords = Math.max(250, Math.floor(draftWordCount * 0.55));
  const bindsReaderPromise = /\[readerPromise\]\s*=\s*"readerPromise(?:\s*\|\|\s*undefined)?"|\[readerPromise\]\s*=\s*"readerPromise"/.test(template);

  if (draftStatus && !['approved', 'converted'].includes(draftStatus)) {
    addWarning(`${entry.collection}:${entry.slug} draft is linked but status is "${draftStatus}" (${relFromRepo(draftPath)})`);
  }
  if (!String(entry.seo.searchIntent || '').trim()) addError(`${entry.collection}:${entry.slug} missing seo.searchIntent for draft-backed guide`);
  if (!String(entry.seo.readerPromise || '').trim()) addError(`${entry.collection}:${entry.slug} missing seo.readerPromise for draft-backed guide`);
  if (!String(entry.seo.uniqueAngle || '').trim()) addError(`${entry.collection}:${entry.slug} missing seo.uniqueAngle for draft-backed guide`);
  if (!String(entry.seo.factCheckedAt || '').trim()) addError(`${entry.collection}:${entry.slug} missing seo.factCheckedAt for draft-backed guide`);
  if (!String(entry.seo.reviewedBy || '').trim()) addError(`${entry.collection}:${entry.slug} missing seo.reviewedBy for draft-backed guide`);
  if (draftPrimaryKeyword && shippedPrimaryKeyword && draftPrimaryKeyword !== shippedPrimaryKeyword) {
    addError(`${entry.collection}:${entry.slug} primaryKeyword does not match draft primary_keyword (${relFromRepo(draftPath)})`);
  }
  if (draftSearchIntent && shippedSearchIntent && draftSearchIntent !== shippedSearchIntent) {
    addError(`${entry.collection}:${entry.slug} seo.searchIntent does not match draft search_intent (${relFromRepo(draftPath)})`);
  }
  if (draftReaderPromise && shippedReaderPromise && draftReaderPromise !== shippedReaderPromise) {
    addError(`${entry.collection}:${entry.slug} seo.readerPromise does not match draft reader_promise (${relFromRepo(draftPath)})`);
  }
  if (draftUniqueAngle && shippedUniqueAngle && draftUniqueAngle !== shippedUniqueAngle) {
    addError(`${entry.collection}:${entry.slug} seo.uniqueAngle does not match draft unique_angle (${relFromRepo(draftPath)})`);
  }
  if (!shippedFactCheckedAt) {
    addError(`${entry.collection}:${entry.slug} seo.factCheckedAt must be a valid YYYY-MM-DD date for draft-backed guides`);
  }
  if (draftFactCheckedAt && shippedFactCheckedAt && shippedFactCheckedAt < draftFactCheckedAt) {
    addError(`${entry.collection}:${entry.slug} seo.factCheckedAt cannot be earlier than draft last_fact_checked_at (${relFromRepo(draftPath)})`);
  }
  if (draftWordCount > 0 && shippedWordCount < minShippedWords) {
    addError(
      `${entry.collection}:${entry.slug} shipped article is too thin vs draft (${shippedWordCount} words vs draft ${draftWordCount}; expected at least ${minShippedWords})`,
    );
  }
  if (usesGuideShell && !bindsReaderPromise) {
    addError(`${entry.collection}:${entry.slug} guide article must pass readerPromise into <fa-guide-shell>`);
  }
}

function main() {
  const guideShellHasRelatedLinks = validateGuideShellContract();
  const entries = readGuideArrays();

  const titleMap = new Map();
  const descriptionMap = new Map();
  const primaryKeywordMap = new Map();

  entries.forEach((entry) => {
    const id = `${entry.collection}:${entry.slug}`;

    if (!entry.slug) addError(`${id} missing slug`);
    if (!entry.title) addError(`${id} missing title`);
    if (!entry.componentPath || !fs.existsSync(entry.componentPath)) {
      addError(`${id} component file not found: ${entry.componentPath ? relFromRepo(entry.componentPath) : '(missing import path)'}`);
      return;
    }

    const seoTitle = String(entry.seo.title || '').trim();
    const seoDescription = String(entry.seo.description || '').trim();
    const primaryKeyword = String(entry.seo.primaryKeyword || '').trim();
    const keywords = Array.isArray(entry.seo.keywords) ? entry.seo.keywords.map((item) => String(item || '').trim()).filter(Boolean) : [];
    const publishedAt = validateDate('publishedAt', entry.seo.publishedAt);
    const updatedAt = validateDate('updatedAt', entry.seo.updatedAt);

    if (!seoTitle) addError(`${id} missing seo.title`);
    if (!seoDescription) addError(`${id} missing seo.description`);
    if (!primaryKeyword) addError(`${id} missing seo.primaryKeyword`);
    if (!keywords.length) addError(`${id} missing seo.keywords`);
    if (!publishedAt) addError(`${id} missing or invalid seo.publishedAt`);
    if (!updatedAt) addError(`${id} missing or invalid seo.updatedAt`);
    if (publishedAt && updatedAt && updatedAt < publishedAt) {
      addError(`${id} seo.updatedAt cannot be earlier than seo.publishedAt`);
    }
    if (primaryKeyword && keywords.length && !keywords.some((item) => normalizeKey(item) === normalizeKey(primaryKeyword))) {
      addError(`${id} seo.keywords must include seo.primaryKeyword`);
    }

    const gitDates = readGitDateRange(entry.componentPath);
    if (publishedAt && gitDates.first && publishedAt < gitDates.first) {
      addError(`${id} seo.publishedAt (${publishedAt}) is earlier than the first git commit for ${relFromRepo(entry.componentPath)} (${gitDates.first})`);
    }
    if (updatedAt && gitDates.last && updatedAt < gitDates.last) {
      addWarning(`${id} seo.updatedAt (${updatedAt}) is older than the latest git commit for ${relFromRepo(entry.componentPath)} (${gitDates.last})`);
    }

    const template = extractComponentTemplate(entry.componentPath);
    const usesGuideShell = /<fa-guide-shell\b/.test(template);
    const bindsPrev = /\[prev\]\s*=\s*"prev"/.test(template);
    const bindsNext = /\[next\]\s*=\s*"next"/.test(template);
    const bindsLeftNav = /\[leftNav\]\s*=\s*"leftNav"/.test(template);
    const explicitInternalLinks = countInternalLinks(template);
    const shippedWordCount = wordCount(template);

    if (usesGuideShell) {
      if (!bindsLeftNav) addError(`${id} guide article must pass leftNav into <fa-guide-shell>`);
      if (!bindsPrev && !bindsNext) addError(`${id} guide article must pass prev/next navigation into <fa-guide-shell>`);
      if (!guideShellHasRelatedLinks) addError(`${id} cannot satisfy internal-link requirement because guide shell lacks related links`);
    } else if (explicitInternalLinks < 2) {
      addError(`${id} must include at least 2 internal links when not using the shared guide shell`);
    }

    validateDraftParity(entry, shippedWordCount, template, usesGuideShell);

    const titleKey = normalizeKey(seoTitle);
    const descriptionKey = normalizeKey(seoDescription);
    const primaryKeywordKey = normalizeKey(primaryKeyword);

    if (titleKey) {
      const list = titleMap.get(titleKey) || [];
      list.push(id);
      titleMap.set(titleKey, list);
    }
    if (descriptionKey) {
      const list = descriptionMap.get(descriptionKey) || [];
      list.push(id);
      descriptionMap.set(descriptionKey, list);
    }
    if (primaryKeywordKey) {
      const list = primaryKeywordMap.get(primaryKeywordKey) || [];
      list.push(id);
      primaryKeywordMap.set(primaryKeywordKey, list);
    }
  });

  for (const [key, ids] of titleMap.entries()) {
    if (ids.length > 1) addError(`duplicate guide seo.title detected (${key}): ${ids.join(', ')}`);
  }
  for (const [key, ids] of descriptionMap.entries()) {
    if (ids.length > 1) addError(`duplicate guide seo.description detected (${key}): ${ids.join(', ')}`);
  }
  for (const [key, ids] of primaryKeywordMap.entries()) {
    if (ids.length > 1) addError(`keyword cannibalization risk: duplicate seo.primaryKeyword "${key}" across ${ids.join(', ')}`);
  }

  warnings.forEach((message) => console.warn(`[lint-guide-articles] WARN ${message}`));
  errors.forEach((message) => console.error(`[lint-guide-articles] ${message}`));

  if (errors.length) {
    console.error(`[lint-guide-articles] failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`[lint-guide-articles] guide articles look valid (${entries.length} guide(s) checked).`);
  if (warnings.length) {
    console.log(`[lint-guide-articles] warnings: ${warnings.length}`);
  }
}

main();
