#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { cdnQuestionsDir, guideRegistryPath, repoRoot } from './content-paths.mjs';

const REGISTRY_PATH = path.resolve(process.env.GUIDE_REGISTRY_PATH || guideRegistryPath);
const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];
const TECH_TOKENS = new Set(['javascript', 'js', 'typescript', 'react', 'angular', 'vue', 'css', 'html']);
const STOPWORDS = new Set(['what', 'how', 'why', 'does', 'do', 'is', 'the', 'a', 'an', 'in', 'of', 'and', 'to', 'for']);
const GUIDE_DISTINCT_MARKERS = [
  /\binterview\b/i,
  /\bsenior\b/i,
  /\bproduction\b/i,
  /\bpitfall\b/i,
  /\btrade[\s-]?offs?\b/i,
  /\bconstraint(?:s)?\b/i,
  /\banti[\s-]?patterns?\b/i,
  /\bdebug\b/i,
  /\binternals?\b/i,
  /\bunder\s+the\s+hood\b/i,
  /\bwhen\s+not\b/i,
  /\bvs\b/i,
  /\bcompare\b/i,
  /\bdecision(?:s)?\b/i,
  /\bchecklist\b/i,
  /\bframework\b/i,
  /\bplaybook\b/i,
  /\bworkflow\b/i,
  /\bperformance\b/i,
  /\bfailure(?:s)?\b/i,
];
const TRIVIA_DISTINCT_MARKERS = [
  /\bpitfall\b/i,
  /\btrade[\s-]?offs?\b/i,
  /\binterview\b/i,
  /\bproduction\b/i,
  /\bconstraint(?:s)?\b/i,
  /\bwrong\b/i,
  /\bcommon\s+mistake(?:s)?\b/i,
  /\bvs\b/i,
  /\binternally\b/i,
  /\bunder\s+the\s+hood\b/i,
  /\bwhen\s+not\b/i,
  /\bsenior\b/i,
  /\bdebug\b/i,
];
const BROAD_TRIVIA_PREFIXES = ['what is', 'how does', 'how do', 'how to', 'why is', 'what does'];

const errors = [];
const warnings = [];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(code, message) {
  warnings.push({ code, message });
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function meaningfulTokens(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length > 1)
    .filter((token) => !TECH_TOKENS.has(token))
    .filter((token) => !STOPWORDS.has(token));
}

function hasDistinctMarker(value, markers) {
  return markers.some((marker) => marker.test(String(value || '')));
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

function readObjectProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
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

  if (!arrays.size) {
    addError(`guide registry could not be parsed into guide collections: ${relFromRepo(REGISTRY_PATH)}`);
    return [];
  }

  const entries = [];
  arrays.forEach((arrayLiteral, collection) => {
    arrayLiteral.elements.forEach((element) => {
      if (!ts.isObjectLiteralExpression(element)) return;
      const seo = readObjectProperty(element, 'seo');
      const importPath = readImportPath(element);
      const componentPath = importPath
        ? path.resolve(path.dirname(REGISTRY_PATH), `${importPath}.ts`)
        : '';

      if (!componentPath || !fs.existsSync(componentPath)) {
        addError(`${collection}:${readStringProperty(element, 'slug') || '<missing-slug>'} component file not found: ${componentPath ? relFromRepo(componentPath) : '(missing import path)'}`);
      }

      entries.push({
        collection,
        slug: readStringProperty(element, 'slug'),
        title: readStringProperty(element, 'title'),
        summary: readStringProperty(element, 'summary'),
        seo: {
          title: readStringProperty(seo || { properties: [] }, 'title'),
          description: readStringProperty(seo || { properties: [] }, 'description'),
          primaryKeyword: readStringProperty(seo || { properties: [] }, 'primaryKeyword'),
          draftSource: readStringProperty(seo || { properties: [] }, 'draftSource'),
          searchIntent: readStringProperty(seo || { properties: [] }, 'searchIntent'),
          readerPromise: readStringProperty(seo || { properties: [] }, 'readerPromise'),
          uniqueAngle: readStringProperty(seo || { properties: [] }, 'uniqueAngle'),
        },
        componentPath,
      });
    });
  });

  return entries;
}

function parseJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    addError(`${relFromRepo(filePath)} could not be parsed: ${error.message}`);
    return null;
  }
}

function listTriviaFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    addError(`questions directory not found: ${relFromRepo(rootDir)}`);
    return [];
  }

  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, 'trivia.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function collectTextFromTriviaEntry(entry) {
  const parts = [entry.title, entry.description, entry.seo?.title, entry.seo?.description];
  const answer = entry.answer;

  if (typeof answer === 'string') {
    parts.push(answer);
  } else if (answer && typeof answer === 'object' && Array.isArray(answer.blocks)) {
    answer.blocks.forEach((block) => {
      if (!block || typeof block !== 'object') return;
      if (block.type === 'text') parts.push(block.text);
      if (block.type === 'list') {
        parts.push(block.caption);
        if (Array.isArray(block.columns)) parts.push(...block.columns);
        if (Array.isArray(block.rows)) {
          block.rows.forEach((row) => {
            if (Array.isArray(row)) parts.push(...row);
          });
        }
      }
      if (block.type === 'image') parts.push(block.caption);
    });
  }

  return parts.join(' ');
}

function jaccardSimilarity(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });
  return intersection / union.size;
}

function guideSuppressed(entry) {
  return Boolean(
    String(entry.seo.uniqueAngle || '').trim()
    && (
      String(entry.seo.draftSource || '').trim()
      || String(entry.seo.searchIntent || '').trim()
      || String(entry.seo.readerPromise || '').trim()
    ),
  );
}

function validateGuides(entries) {
  const byComponent = new Map();

  entries.forEach((entry) => {
    const id = `${entry.collection}:${entry.slug}`;
    const distinctText = [entry.title, entry.summary, entry.seo.description].join(' ');
    const hasDistinct = hasDistinctMarker(distinctText, GUIDE_DISTINCT_MARKERS);
    const suppressed = guideSuppressed(entry);
    const keywordTokens = meaningfulTokens(entry.seo.primaryKeyword);
    const titleTokens = meaningfulTokens(entry.seo.title || entry.title);
    const broadTitle = titleTokens.length > 0 && titleTokens.length <= 4;
    const genericCandidate = (keywordTokens.length > 0 && keywordTokens.length <= 4) || broadTitle;

    if (entry.componentPath) {
      const list = byComponent.get(entry.componentPath) || [];
      list.push(id);
      byComponent.set(entry.componentPath, list);
    }

    if (!suppressed && genericCandidate && !hasDistinct) {
      addWarning('generic-query-risk', `${id} has a short/head-term metadata shape (${entry.seo.primaryKeyword || entry.seo.title || entry.title}) without a stronger distinct-angle signal`);
    }
    if (!suppressed && !hasDistinct) {
      addWarning('weak-distinct-angle', `${id} metadata does not surface a clear competitive angle; add interview/production/tradeoff/debug-specific framing`);
    }
  });

  byComponent.forEach((ids, componentPath) => {
    if (ids.length < 2) return;
    ids.forEach((id) => {
      addWarning('shared-guide-component', `${id} shares ${relFromRepo(componentPath)} with ${ids.filter((candidate) => candidate !== id).join(', ')}`);
    });
  });
}

function validateTrivia(entriesByTech) {
  entriesByTech.forEach(({ tech, entries }) => {
    entries.forEach((entry) => {
      const id = `${tech}:${String(entry?.id || '').trim() || '<missing-id>'}`;
      const title = String(entry?.seo?.title || entry?.title || '').trim();
      const broadTitle = normalizeText(title);
      const metadataText = [entry?.title, entry?.description, entry?.seo?.title, entry?.seo?.description].join(' ');
      const combinedText = collectTextFromTriviaEntry(entry);
      const metadataHasDistinct = hasDistinctMarker(metadataText, TRIVIA_DISTINCT_MARKERS);
      const combinedHasDistinct = hasDistinctMarker(combinedText, TRIVIA_DISTINCT_MARKERS);
      const titleTokens = meaningfulTokens(title);
      const genericCandidate = BROAD_TRIVIA_PREFIXES.some((prefix) => broadTitle.startsWith(prefix))
        || (titleTokens.length > 0 && titleTokens.length <= 4);

      if (genericCandidate && !metadataHasDistinct) {
        addWarning('generic-query-risk', `${id} looks like a broad commodity query (${title || entry?.title || '<missing-title>'}) without a stronger beyond-basics signal`);
      }
      if (!combinedHasDistinct) {
        addWarning('weak-distinct-angle', `${id} does not surface a clear beyond-basics angle in metadata/answer text; add production, pitfall, debug, or interview-specific framing`);
      }
    });

    for (let index = 0; index < entries.length; index += 1) {
      for (let cursor = index + 1; cursor < entries.length; cursor += 1) {
        const left = entries[index];
        const right = entries[cursor];
        const leftText = `${left?.seo?.title || left?.title || ''} ${left?.description || ''}`;
        const rightText = `${right?.seo?.title || right?.title || ''} ${right?.description || ''}`;
        const leftNormalized = meaningfulTokens(leftText).join(' ');
        const rightNormalized = meaningfulTokens(rightText).join(' ');
        if (!leftNormalized || !rightNormalized || leftNormalized === rightNormalized) continue;
        const similarity = jaccardSimilarity(leftNormalized.split(/\s+/), rightNormalized.split(/\s+/));
        if (similarity >= 0.72) {
          addWarning(
            'near-duplicate-trivia',
            `${tech}:${left.id} and ${tech}:${right.id} have highly overlapping search framing (${similarity.toFixed(2)} Jaccard on normalized seo.title + description)`,
          );
        }
      }
    }
  });
}

function readTriviaEntries() {
  const triviaFiles = listTriviaFiles(QUESTIONS_DIR);
  const entriesByTech = [];

  triviaFiles.forEach((filePath) => {
    const tech = path.basename(path.dirname(filePath));
    const parsed = parseJson(filePath);
    if (!Array.isArray(parsed)) {
      addError(`${relFromRepo(filePath)} must export an array of trivia entries`);
      return;
    }
    entriesByTech.push({ tech, entries: parsed });
  });

  return entriesByTech;
}

function main() {
  const guides = readGuideEntries();
  const trivia = readTriviaEntries();

  if (!errors.length) {
    validateGuides(guides);
    validateTrivia(trivia);
  }

  warnings.forEach(({ code, message }) => console.warn(`[lint-indexability-readiness] WARN [${code}] ${message}`));
  errors.forEach((message) => console.error(`[lint-indexability-readiness] ${message}`));

  if (errors.length) {
    console.error(`[lint-indexability-readiness] failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  const triviaCount = trivia.reduce((sum, item) => sum + item.entries.length, 0);
  console.log(`[lint-indexability-readiness] indexability readiness scan completed (${guides.length} guide(s), ${triviaCount} trivia entries, ${warnings.length} warning(s)).`);
}

main();
