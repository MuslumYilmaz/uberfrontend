#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { guideRegistryPath, repoRoot } from './content-paths.mjs';

const REGISTRY_PATH = path.resolve(process.env.GUIDE_REGISTRY_PATH || guideRegistryPath);
const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];
const COLLECTION_RULES = {
  PLAYBOOK: {
    minWords: 700,
    minH2: 4,
    minIntroWords: 16,
    inlineLinkWarnAtWords: 700,
    recommendedInlineLinks: 1,
    explicitExampleWarnAtWords: 750,
  },
  SYSTEM: {
    minWords: 350,
    minH2: 4,
    minIntroWords: 16,
    inlineLinkWarnAtWords: 700,
    recommendedInlineLinks: 1,
    explicitExampleWarnAtWords: 800,
  },
  BEHAVIORAL: {
    minWords: 180,
    minH2: 3,
    minIntroWords: 16,
    inlineLinkWarnAtWords: Number.POSITIVE_INFINITY,
    recommendedInlineLinks: 0,
    explicitExampleWarnAtWords: 600,
  },
};
const EXPLICIT_EXAMPLE_RX = /\b(example|for example|worked example|scenario|case study|e\.g\.)\b/i;
const JUDGMENT_RX = /\b(trade(?:\s|[-‑–—])?offs?|pitfalls?|mistakes?|anti(?:\s|[-‑–—])?patterns?|decision(?:s)?|constraints?|risk(?:s)?|avoid)\b/i;
const FAQ_RX = /\bfaq\b/i;

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

function readGuideEntries() {
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
      const seo = readObjectProperty(element, 'seo');
      const importPath = readImportPath(element);
      entries.push({
        collection,
        slug: readStringProperty(element, 'slug'),
        title: readStringProperty(element, 'title'),
        summary: readStringProperty(element, 'summary'),
        seo: {
          updatedAt: readStringProperty(seo || { properties: [] }, 'updatedAt'),
          primaryKeyword: readStringProperty(seo || { properties: [] }, 'primaryKeyword'),
        },
        componentPath: importPath
          ? path.resolve(path.dirname(REGISTRY_PATH), `${importPath}.ts`)
          : '',
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

function resolveGuideImplementationPath(filePath, seen = new Set()) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) return absolutePath;
  if (seen.has(absolutePath)) return absolutePath;
  seen.add(absolutePath);

  const source = fs.readFileSync(absolutePath, 'utf8');
  if (source.includes('@Component(')) return absolutePath;

  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const reExport = sourceFile.statements.find(
    (statement) =>
      ts.isExportDeclaration(statement)
      && statement.moduleSpecifier
      && ts.isStringLiteral(statement.moduleSpecifier),
  );

  if (!reExport || !ts.isStringLiteral(reExport.moduleSpecifier)) {
    return absolutePath;
  }

  const targetPath = path.resolve(path.dirname(absolutePath), `${reExport.moduleSpecifier.text}.ts`);
  if (!fs.existsSync(targetPath)) return absolutePath;
  return resolveGuideImplementationPath(targetPath, seen);
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
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

function countMatches(value, pattern) {
  return value.match(pattern)?.length || 0;
}

function firstParagraphText(template) {
  const match = template.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return normalizeText(match?.[1] || '');
}

function parseDateOnly(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function daysSince(value) {
  const date = parseDateOnly(value);
  if (!date) return null;
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.floor((startOfToday.getTime() - date.getTime()) / 86_400_000);
}

function validateEntry(entry) {
  const id = `${entry.collection}:${entry.slug}`;
  const rules = COLLECTION_RULES[entry.collection];

  if (!rules) {
    addError(`${id} is using an unsupported guide collection`);
    return;
  }
  if (!entry.componentPath || !fs.existsSync(entry.componentPath)) {
    addError(`${id} component file not found: ${entry.componentPath ? relFromRepo(entry.componentPath) : '(missing import path)'}`);
    return;
  }

  const inspectionPath = resolveGuideImplementationPath(entry.componentPath);
  const template = extractComponentTemplate(inspectionPath);
  if (!template) {
    addError(`${id} is missing an inline component template: ${relFromRepo(inspectionPath)}`);
    return;
  }
  if (!/<fa-guide-shell\b/.test(template)) {
    addError(`${id} must render through <fa-guide-shell> to keep the shared article shell`);
    return;
  }

  const normalized = normalizeText(template);
  const words = wordCount(template);
  const introWords = wordCount(firstParagraphText(template));
  const h2Count = countMatches(template, /<h2\b/gi);
  const inlineGuideLinks = countMatches(template, /\[routerLink\]|routerLink=|href=["']\/(?!\/)/g);
  const hasExplicitExample = EXPLICIT_EXAMPLE_RX.test(normalized);
  const hasJudgmentCue = JUDGMENT_RX.test(normalized);
  const hasFaq = FAQ_RX.test(normalized) || /<app-faq-section\b/i.test(template);
  const hasConcreteFormat = /<(blockquote|table|code|pre)\b/i.test(template);

  if (words < rules.minWords) {
    addError(`${id} is too thin for the shipped editorial floor (${words} words; expected at least ${rules.minWords})`);
  }
  if (h2Count < rules.minH2) {
    addError(`${id} needs at least ${rules.minH2} H2 sections to teach the concept in stages (found ${h2Count})`);
  }
  if (introWords < rules.minIntroWords) {
    addError(`${id} needs a clearer opening paragraph before the first section (found ${introWords} intro words)`);
  }
  if (!hasJudgmentCue && !hasExplicitExample && !hasFaq && !hasConcreteFormat) {
    addError(`${id} is missing an editorial teaching signal; add a trade-off, explicit example, FAQ, or concrete worked artifact`);
  }

  const staleDays = daysSince(entry.seo.updatedAt);
  if (staleDays !== null && staleDays > 365) {
    addWarning(`${id} has not been updated in ${staleDays} days; review whether the advice or examples need a refresh`);
  }
  if (words >= rules.inlineLinkWarnAtWords && inlineGuideLinks < rules.recommendedInlineLinks) {
    addWarning(`${id} has no inline body links; add at least ${rules.recommendedInlineLinks} contextual guide or practice link inside the article body`);
  }
  if (words >= rules.explicitExampleWarnAtWords && !hasExplicitExample) {
    addWarning(`${id} is long but does not surface an explicit example cue; consider adding a worked example or a clearly labeled scenario`);
  }

}

function main() {
  const entries = readGuideEntries();
  entries.forEach(validateEntry);

  warnings.forEach((message) => console.log(`[lint-guide-editorial-quality] warning: ${message}`));
  errors.forEach((message) => console.error(`[lint-guide-editorial-quality] ${message}`));

  if (errors.length) {
    console.error(`[lint-guide-editorial-quality] failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`[lint-guide-editorial-quality] editorial quality checks passed (${entries.length} guide(s) checked, ${warnings.length} warning(s)).`);
}

main();
