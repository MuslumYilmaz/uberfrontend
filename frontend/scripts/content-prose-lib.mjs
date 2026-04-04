#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { cdnQuestionsDir, guideRegistryPath, repoRoot } from './content-paths.mjs';

const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
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

function stripMarkup(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\[[^\]]+\]="[^"]*"/g, ' ')
    .replace(/\([^)]+\)="[^"]*"/g, ' ')
    .replace(/\*ng[A-Za-z]+="[^"]*"/g, ' ')
    .replace(/routerLink(?:Active)?="[^"]*"/g, ' ')
    .replace(/href="[^"]*"/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, '\'')
    .replace(/[^\p{L}\p{N}\s.,!?;:'"()/%+-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectTextFromListBlock(block) {
  const parts = [block.caption];
  if (Array.isArray(block.columns)) parts.push(...block.columns);
  if (Array.isArray(block.rows)) {
    block.rows.forEach((row) => {
      if (Array.isArray(row)) parts.push(...row);
    });
  }
  return parts;
}

function collectTriviaAnswerText(entry) {
  const answer = entry?.answer;
  if (!answer) return '';
  if (typeof answer === 'string') return answer;
  if (!Array.isArray(answer.blocks)) return '';

  const parts = [];
  answer.blocks.forEach((block) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'text') parts.push(block.text);
    if (block.type === 'list') parts.push(...collectTextFromListBlock(block));
    if (block.type === 'image') parts.push(block.caption, block.alt);
  });
  return parts.join(' ');
}

function listTriviaFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, 'trivia.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function readGuideEntries() {
  if (!fs.existsSync(guideRegistryPath)) return [];

  const source = fs.readFileSync(guideRegistryPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    guideRegistryPath,
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
        seoTitle: readStringProperty(seo || { properties: [] }, 'title'),
        seoDescription: readStringProperty(seo || { properties: [] }, 'description'),
        componentPath: importPath
          ? path.resolve(path.dirname(guideRegistryPath), `${importPath}.ts`)
          : '',
      });
    });
  });

  return entries;
}

function extractTriviaDocuments() {
  const docs = [];
  listTriviaFiles(cdnQuestionsDir).forEach((filePath) => {
    const tech = path.basename(path.dirname(filePath));
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(parsed)) return;

    parsed.forEach((entry) => {
      const id = String(entry?.id || '').trim();
      if (!id) return;
      const content = stripMarkup([
        entry.title,
        entry.description,
        entry?.seo?.title,
        entry?.seo?.description,
        collectTriviaAnswerText(entry),
      ].join('\n\n'));
      if (!content) return;
      docs.push({
        kind: 'trivia',
        sourcePath: relFromRepo(filePath),
        virtualPath: path.posix.join('trivia', tech, `${id}.txt`),
        content,
      });
    });
  });
  return docs;
}

function extractGuideDocuments() {
  const docs = [];
  readGuideEntries().forEach((entry) => {
    const implPath = resolveGuideImplementationPath(entry.componentPath);
    const template = extractComponentTemplate(implPath);
    const content = stripMarkup([
      entry.title,
      entry.summary,
      entry.seoTitle,
      entry.seoDescription,
      template,
    ].join('\n\n'));
    if (!content) return;
    docs.push({
      kind: 'guide',
      sourcePath: relFromRepo(implPath),
      virtualPath: path.posix.join('guides', entry.collection.toLowerCase(), `${entry.slug || 'unknown'}.txt`),
      content,
    });
  });
  return docs;
}

export function collectContentDocuments() {
  return [...extractTriviaDocuments(), ...extractGuideDocuments()]
    .sort((left, right) => left.virtualPath.localeCompare(right.virtualPath));
}
