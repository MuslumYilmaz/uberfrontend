import crypto from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
import { parseFragment, serialize } from 'parse5';
import { buildFrameworkFamilyByIdMap, collectCompanyCounts } from './gen-showcase-stats.mjs';
import { collectSeoContentAssets } from './seo-content-assets.mjs';
import { parseTypeScript } from './content-typescript.mjs';

// Increment when the meaning of a projection changes. This module deliberately
// has no filesystem or Git access: the same projection reads a worktree or a commit.
export const PROJECTION_VERSION = 'seo-content-v2';
const APP = 'frontend/src/app/';
const ROUTES = `${APP}app.routes.ts`;
const GUIDES = `${APP}shared/guides/guide.registry.ts`;
const REGISTRY = 'cdn/practice/registry.json';
const TRACKS = 'cdn/questions/track-registry.json';
const OMIT = new Set([
  'updatedAt', 'createdAt', 'publishedAt', 'lastmod', 'lastModified', 'dateModified',
  'datePublished', 'factCheckedAt', 'reviewedAt', 'reviewedBy', 'draftSource',
  'contentVersion', 'schemaVersion', 'contentSchemaVersion', 'editorialReview',
  'editorialStatus', 'contentHash', 'fingerprint', 'updatedLabel',
]);
const DATE_NAME = /(?:dateModified|datePublished|lastmod|lastModified|updatedAt|publishedAt|createdAt|factCheckedAt|reviewedAt|_DATE_MODIFIED|_DATE_PUBLISHED|seoLastmod)/i;
const jsonCache = new Map();
const projectionCache = new Map();
const htmlCache = new Map();
const own = (node, key) => node?.properties?.find((p) => p.name && propertyName(p.name) === key);
const init = (node, key) => own(node, key)?.initializer;
const propertyName = (name) => ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : '';
const string = (node) => node && ts.isStringLiteralLike(node) ? node.text : '';
const joinRoute = (a, b) => `/${[a, b].join('/').split('/').filter(Boolean).join('/')}`;
const free = (entry) => entry?.access !== 'premium';

function ast(source) {
  return parseTypeScript(source);
}

function json(source, file) {
  if (source === null) return null;
  if (!jsonCache.has(source)) {
    try { jsonCache.set(source, JSON.parse(source)); }
    catch (error) { throw new Error(`Invalid SEO content JSON ${file}: ${error.message}`); }
  }
  return jsonCache.get(source);
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().filter((key) => !OMIT.has(key)).map((key) => [key, clean(value[key])]));
}

const HUB_NAMES = { Master: 'master', JavaScript: 'javascript', Javascript: 'javascript', React: 'react', Angular: 'angular', Vue: 'vue', HtmlCss: 'htmlCss', Html: 'html', Css: 'css' };
function hubCondition(expression, hub) {
  const text = expression.replace(/(?:this\.)?is(Master|JavaScript|Javascript|React|Angular|Vue|HtmlCss|Html|Css)Hub\(\)/g, (_, name) => String(HUB_NAMES[name] === hub)).trim();
  if (/^true$/.test(text)) return true;
  if (/^false$/.test(text)) return false;
  if (/^!\s*true$/.test(text)) return false;
  if (/^!\s*false$/.test(text)) return true;
  return undefined;
}

function html(source, scope = {}) {
  const cacheKey = `${scope.hub || ''}\0${source}`;
  if (htmlCache.has(cacheKey)) return htmlCache.get(cacheKey);
  if (scope.hub) {
    const document = parseFragment(source);
    function visit(node) {
      if (node.childNodes) node.childNodes = node.childNodes.filter((child) => {
        const condition = child.attrs?.find((attr) => attr.name.toLowerCase() === '*ngif')?.value;
        return !condition || hubCondition(condition, scope.hub) !== false;
      });
      node.childNodes?.forEach(visit);
      if (node.content) visit(node.content);
    }
    visit(document);
    source = serialize(document);
  }
  const code = [];
  const visualAttributes = (text) => text.replace(/\s+(?:class|style|\[class(?:\.[\w-]+)?\]|\[style(?:\.[\w-]+)?\]|\[ngClass\]|\[ngStyle\])\s*=\s*(?:"[^"]*"|'[^']*')/g, '');
  source = source.replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => `SEOCODE${code.push(block.replace(/<[^>]+>/g, visualAttributes)) - 1}END`);
  // Removing markup can join fragments into another comment or style block.
  // Reach a fixed point while keeping authored code examples protected above.
  let previous;
  do {
    previous = source;
    source = source.replace(/<!--[\s\S]*?-->|<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  } while (source !== previous);
  const result = source
    .replace(/\s+(?:class|style|\[class(?:\.[\w-]+)?\]|\[style(?:\.[\w-]+)?\]|\[ngClass\]|\[ngStyle\])\s*=\s*(?:"[^"]*"|'[^']*')/g, '')
    .replace(/\s+/g, ' ').trim()
    .replace(/SEOCODE(\d+)END/g, (_, index) => code[Number(index)]);
  htmlCache.set(cacheKey, result);
  return result;
}

function dateOnly(node) {
  if (ts.isExpressionStatement(node)) return dateOnly(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = node.left;
    return ts.isPropertyAccessExpression(left) && DATE_NAME.test(left.name.text)
      || ts.isElementAccessExpression(left) && DATE_NAME.test(string(left.argumentExpression));
  }
  if (ts.isBlock(node)) return node.statements.length > 0 && node.statements.every(dateOnly);
  if (ts.isIfStatement(node)) return dateOnly(node.thenStatement) && (!node.elseStatement || dateOnly(node.elseStatement));
  return false;
}

function projectNode(node, scope = {}) {
  if (!node) return null;
  if (dateOnly(node)) return null;
  if (ts.isDecorator(node) && ts.isCallExpression(node.expression)
    && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'Component') {
    const metadata = node.expression.arguments[0];
    // The authored template is content. Angular component configuration (DI,
    // standalone migration, selector registration, styles, hydration, etc.) is
    // infrastructure; external template contents are followed separately.
    const template = metadata && ts.isObjectLiteralExpression(metadata) ? init(metadata, 'template') : null;
    return template ? ['componentTemplate', html(string(template), scope)] : null;
  }
  if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)
    || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
    || ts.isExportDeclaration(node)) return null;
  const name = node.name ? propertyName(node.name) : '';
  if (OMIT.has(name) || DATE_NAME.test(name)) return null;
  if (scope.company && /^(?:OPENAI|GOOGLE|NETFLIX)_/.test(name) && !name.startsWith(`${scope.company.toUpperCase()}_`)) return null;
  if (scope.tech && /^(?:REACT|ANGULAR|VUE)_/.test(name) && !name.startsWith(`${scope.tech.toUpperCase()}_`)) return null;
  if (scope.hub) {
    const prefix = name.match(/^(HTML_CSS|MASTER|JAVASCRIPT|REACT|ANGULAR|VUE|HTML|CSS)_/)?.[1];
    const variant = { HTML_CSS: 'htmlCss', MASTER: 'master', JAVASCRIPT: 'javascript', REACT: 'react', ANGULAR: 'angular', VUE: 'vue', HTML: 'html', CSS: 'css' }[prefix];
    if (variant && variant !== scope.hub) return null;
    const memberVariant = name.match(/^(htmlCss|master|javascript|react|angular|vue|html|css)(?=[A-Z])/i)?.[1];
    if (memberVariant && memberVariant.toLowerCase() !== scope.hub.toLowerCase()) return null;
    if (ts.isVariableDeclaration(node) && ['HUB_INTENT_PROFILES', 'HUB_FAQ_PROFILES'].includes(name) && ts.isObjectLiteralExpression(node.initializer)) {
      return [name, ...node.initializer.properties.filter((property) => propertyName(property.name) === scope.hub).map((property) => projectNode(property, scope))];
    }
    if (ts.isIfStatement(node)) {
      const condition = hubCondition(node.expression.getText(), scope.hub);
      if (condition !== undefined) return projectNode(condition ? node.thenStatement : node.elseStatement, scope);
    }
    if (ts.isConditionalExpression(node)) {
      const condition = hubCondition(node.condition.getText(), scope.hub);
      if (condition !== undefined) return projectNode(condition ? node.whenTrue : node.whenFalse, scope);
    }
  }
  if (ts.isSpreadAssignment(node) && /\bdateModified\b|\bdatePublished\b/.test(node.getText())) return null;
  if (ts.isVariableDeclaration(node) && ['PREP_CONFIG', 'FRAMEWORK_PRACTICE_NEXT', 'TRACK_PREVIEW_CONTENT'].includes(name)
    && ts.isObjectLiteralExpression(node.initializer) && scope.slug) {
    return [name, ...node.initializer.properties.filter((property) => propertyName(property.name) === scope.slug).map((property) => projectNode(property, scope))];
  }
  if ((ts.isPropertyAssignment(node) || ts.isPropertyDeclaration(node))
    && ['styles', 'styleUrls', 'styleUrl', 'imports', 'templateUrl'].includes(name)) return null;
  if (ts.isPropertyAssignment(node) && name === 'template') return ['template', html(string(node.initializer), scope)];
  if (ts.isStringLiteralLike(node)) return ['text', node.text];
  if (ts.isIdentifier(node) || ts.isNumericLiteral(node)) return [node.kind, node.text];
  if (ts.isVariableStatement(node)) {
    const values = node.declarationList.declarations.map((child) => projectNode(child, scope)).filter((value) => value !== null);
    return values.length ? ['variables', ...values] : null;
  }
  const children = [];
  node.forEachChild((child) => { const value = projectNode(child, scope); if (value !== null) children.push(value); });
  return [node.kind, ...children];
}

function declarationNames(node) {
  if (ts.isVariableStatement(node)) return node.declarationList.declarations.map((d) => propertyName(d.name));
  return node.name ? [propertyName(node.name)] : [];
}

function importsIn(node) {
  const result = [];
  function visit(child) {
    if (ts.isCallExpression(child) && child.expression.kind === ts.SyntaxKind.ImportKeyword) result.push(string(child.arguments[0]));
    child.forEachChild(visit);
  }
  if (node) visit(node);
  return result.filter(Boolean);
}

function resolve(reader, from, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  return [base, `${base}.ts`, `${base}.json`, `${base}/index.ts`].find((file) => reader.read(file) !== null) || null;
}

function excluded(file) {
  return /(?:\.spec\.ts$|\.test\.[cm]?js$|\.(?:css|scss)$|\/generated\/|\/header\/|\/marketing-header\/|\/footer\/|\/seo-content-date\.util\.ts$)/.test(file);
}

function contentDependency(from, target) {
  if (excluded(target)) return false;
  if (target.startsWith(`${APP}core/content/`)) return true;
  if (/\/(?:content|data|paths)\//.test(target) || /(?:-content|\.data|\.path)\.ts$/.test(target)) return true;
  // Local article helpers and components can render substantive page content.
  return path.posix.dirname(from) === path.posix.dirname(target)
    && !/\.(?:model|service|guard|resolver)\.ts$/.test(target);
}

function selectedStatements(source, names) {
  if (!names?.length) return source.statements;
  const wanted = new Set(names);
  let selected = [];
  for (let pass = 0; pass < source.statements.length; pass += 1) {
    selected = source.statements.filter((statement) => declarationNames(statement).some((name) => wanted.has(name)));
    const before = wanted.size;
    function visit(node) { if (ts.isIdentifier(node)) wanted.add(node.text); node.forEachChild(visit); }
    selected.forEach(visit);
    if (before === wanted.size) break;
  }
  return selected;
}

function tsContent(reader, file, parts, sources, visited = new Set(), names = null, scope = {}) {
  const key = `${file}#${names?.slice().sort().join(',') || '*'}`;
  if (visited.has(key) || excluded(file)) return !visited.failed;
  visited.add(key);
  const raw = reader.read(file);
  function missing(dependency) {
    const reason = `Missing SEO content dependency: ${dependency}`;
    if (reader.strict !== false) throw new Error(reason);
    reader.report?.({ route: scope.route, file: dependency, reason });
    visited.failed = true;
  }
  if (raw === null) { missing(file); return false; }
  sources.add(file);
  if (file.endsWith('.json')) { parts.push(clean(json(raw, file))); return true; }
  if (file.endsWith('.html')) { parts.push(html(raw, scope)); return true; }
  const source = ast(raw);
  const statements = selectedStatements(source, names);
  const cacheKey = `${JSON.stringify({ company: scope.company, slug: scope.slug, tech: scope.tech, hub: scope.hub })}\0${names?.slice().sort().join(',') || '*'}\0${raw}`;
  if (!projectionCache.has(cacheKey)) projectionCache.set(cacheKey, statements.map((statement) => projectNode(statement, scope)).filter((part) => part !== null));
  const projection = projectionCache.get(cacheKey);
  if (projection.length) parts.push(projection);
  const used = new Set();
  function visit(node) {
    if (node.name && DATE_NAME.test(propertyName(node.name)) || dateOnly(node)) return;
    if (ts.isSpreadAssignment(node) && /\bdateModified\b|\bdatePublished\b/.test(node.getText())) return;
    if (ts.isIdentifier(node)) used.add(node.text);
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'templateUrl') {
      const target = resolve(reader, file, string(node.initializer));
      if (target) tsContent(reader, target, parts, sources, visited, null, scope);
      else missing(path.posix.normalize(path.posix.join(path.posix.dirname(file), string(node.initializer))));
    }
    node.forEachChild(visit);
  }
  statements.forEach(visit);
  const dependencies = [];
  for (const statement of source.statements) {
    if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))) continue;
    if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
    const specifier = string(statement.moduleSpecifier);
    if (!specifier.startsWith('.')) continue;
    const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const target = resolve(reader, file, specifier);
    if (!contentDependency(file, target || `${candidate}.ts`)) continue;
    const bindings = statement.importClause?.namedBindings;
    const selected = bindings && ts.isNamedImports(bindings)
      ? bindings.elements.filter((item) => !item.isTypeOnly && used.has(item.name.text)).map((item) => (item.propertyName || item.name).text)
      : null;
    if (ts.isImportDeclaration(statement) && selected && !selected.length) continue;
    if (!target) { missing(/\.(?:ts|json|html|md|[cm]?js)$/.test(candidate) ? candidate : `${candidate}.ts`); continue; }
    const companyFile = target.match(/\/(google|netflix)-preview-content\.ts$/);
    if (companyFile && scope.company && companyFile[1] !== scope.company) continue;
    if (ts.isExportDeclaration(statement)) { dependencies.push({ target, names: null }); continue; }
    if (bindings && ts.isNamedImports(bindings)) {
      if (selected.length) dependencies.push({ target, names: selected });
    } else if (statement.importClause?.name && used.has(statement.importClause.name.text)) dependencies.push({ target, names: null });
  }
  dependencies.sort((a, b) => a.target.localeCompare(b.target));
  for (const dependency of dependencies) tsContent(reader, dependency.target, parts, sources, visited, dependency.names, scope);
  return !visited.failed;
}

function routeEntries(reader) {
  const raw = reader.read(ROUTES);
  if (raw === null) return new Map();
  const source = ast(raw);
  const imported = new Map();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) imported.set(binding.name.text, string(statement.moduleSpecifier));
  }
  const out = new Map();
  function walk(array, prefix = '') {
    if (!array || !ts.isArrayLiteralExpression(array)) return;
    for (const entry of array.elements) {
      if (!ts.isObjectLiteralExpression(entry)) continue;
      const segment = init(entry, 'matcher') ? ':tech' : string(init(entry, 'path'));
      const route = joinRoute(prefix, segment);
      const component = importsIn(init(entry, 'loadComponent'))[0] || imported.get(init(entry, 'component')?.text);
      if (component && !init(entry, 'redirectTo')) {
        out.set(route, { node: entry, component: resolve(reader, ROUTES, component), data: projectNode(init(entry, 'data')) });
      }
      walk(init(entry, 'children'), route);
    }
  }
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (propertyName(declaration.name) === 'routes') walk(declaration.initializer);
  }
  return out;
}

const STATIC_ROUTES = [
  '/', '/changelog', '/pricing', '/machine-coding', '/coding', '/incidents', '/tradeoffs',
  '/interview-questions', '/interview-questions/essential', '/javascript/interview-questions',
  '/react/interview-questions', '/angular/interview-questions', '/vue/interview-questions',
  '/html/interview-questions', '/css/interview-questions', '/html-css/interview-questions',
  '/tracks', '/focus-areas', '/companies', '/system-design', '/tools/cv',
  '/guides/framework-prep', '/guides/interview-blueprint', '/guides/system-design-blueprint', '/guides/behavioral',
  '/legal', '/legal/editorial-policy', '/legal/terms', '/legal/privacy', '/legal/refund', '/legal/cookies',
];

function card(item, route) {
  const fields = ['id', 'slug', 'title', 'description', 'summary', 'difficulty', 'access', 'tags', 'technology', 'tech', 'type', 'importance', 'estimatedMinutes', 'questionFormat', 'discovery', 'companies', 'companyTags'];
  const value = { route, ...Object.fromEntries(fields.filter((key) => item[key] !== undefined).map((key) => [key, item[key]])) };
  if (value.description && typeof value.description === 'object') value.description = value.description.summary || value.description.text || '';
  return value;
}

/**
 * reader.read(path) returns immutable source text or null; reader.list(prefix)
 * returns repo-relative file paths. Historical readers set strict:false.
 */
export function buildSeoInventory(reader) {
  const strict = reader.strict !== false;
  const output = new Map();
  const routes = routeEntries(reader);
  const records = [];
  const companies = new Set();
  const readJson = (file) => json(reader.read(file), file);
  function emit(route, parts, sources) {
    const semanticParts = clean(parts).map((part) => JSON.stringify(part)).sort();
    output.set(route, {
      fingerprint: crypto.createHash('sha256').update(JSON.stringify([PROJECTION_VERSION, semanticParts])).digest('hex'),
      sources: [...sources].sort(),
    });
  }
  function page(route, pattern = route) {
    const descriptor = routes.get(pattern);
    if (!descriptor?.component) return null;
    const parts = [descriptor.data];
    const sources = new Set([ROUTES]);
    const scope = { route };
    if (route.startsWith('/companies/')) scope.company = route.split('/')[2];
    if (route.startsWith('/tracks/')) scope.slug = route.split('/')[2];
    if (/^(?:\/(?:javascript|react|angular|vue|html|css|html-css))?\/interview-questions$/.test(route)) scope.hub = route === '/interview-questions' ? 'master' : route.split('/')[1] === 'html-css' ? 'htmlCss' : route.split('/')[1];
    if (!tsContent(reader, descriptor.component, parts, sources, new Set(), null, scope)) return null;
    return { parts, sources };
  }
  function requiredAsset(file, parts, sources, route) {
    const raw = reader.read(file);
    if (raw === null) {
      if (strict) throw new Error(`Missing SEO content dependency: ${file}`);
      reader.report?.({ route, file, reason: `Missing SEO content dependency: ${file}` });
      return false;
    }
    sources.add(file);
    parts.push(file.endsWith('.json') ? clean(json(raw, file)) : raw);
    return true;
  }
  const catalogs = reader.list('cdn/questions/').filter((file) => /^cdn\/questions\/[^/]+\/(?:coding|trivia|debug)\.json$/.test(file)).sort();
  for (const file of catalogs) {
    const [, , tech, name] = file.split('/');
    const kind = name.slice(0, -5);
    const entries = readJson(file);
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry?.id) continue;
      const route = `/${tech}/${kind}/${entry.id}`;
      records.push({ route, entry, file, kind, tech });
    }
  }
  for (const [prefix, kind, file] of [
    ['system-design', 'system-design', 'cdn/questions/system-design/index.json'],
    ['incidents', 'incident', 'cdn/incidents/index.json'],
    ['tradeoffs', 'tradeoff-battle', 'cdn/tradeoff-battles/index.json'],
  ]) {
    const entries = readJson(file);
    if (Array.isArray(entries)) for (const entry of entries) if (entry?.id) records.push({ route: `/${prefix}/${entry.id}`, entry, file, kind, tech: entry.tech || kind });
  }
  // Per-entry pages are dated by their own content: the catalog object, the CDN
  // assets it references, per-entry bundles and page-specific lab components.
  // The shared detail component, its template, the parameterized route metadata
  // and the SEO helpers render every entry of a family and deliberately take no
  // part, so one shared edit cannot re-date hundreds of pages at once.
  for (const record of records) {
    const { route, entry, file, kind } = record;
    if (!['incident', 'tradeoff-battle'].includes(kind)) for (const company of entry.companies || entry.companyTags || []) companies.add(String(company).trim().toLowerCase());
    if (!free(entry)) continue;
    const assets = collectSeoContentAssets(reader, entry, { tech: record.tech, route, clean });
    const parts = [assets.value ?? clean(entry), ...assets.parts];
    const sources = new Set([file, ...assets.sources]);
    let complete = assets.complete;
    if (kind === 'system-design') {
      const base = `cdn/questions/system-design/${entry.id}/`;
      sources.add(base);
      const files = reader.list(base).filter((name) => /\.(?:json|md)$/.test(name)).sort();
      if (!files.length) complete = requiredAsset(`${base}meta.json`, parts, sources, route);
      else for (const name of files) complete = requiredAsset(name, parts, sources, route) && complete;
    } else if (kind === 'incident' || kind === 'tradeoff-battle') {
      complete = requiredAsset(`cdn/${kind === 'incident' ? 'incidents' : 'tradeoff-battles'}/${entry.id}/scenario.json`, parts, sources, route);
    }
    const lab = {
      'js-event-loop': 'javascript-event-loop-experience',
      'css-position-sticky-not-working': 'css-sticky-debugging-lab',
      'angular-http-what-actually-cancels-request': 'angular-http-cancellation-lab',
      'react-stale-state-closures': 'react-stale-closure-case-files',
    }[entry.id];
    if (lab) {
      const component = `${APP}features/trivia/trivia-detail/${lab}/${lab}.component.ts`;
      if (reader.read(component) !== null) complete = tsContent(reader, component, parts, sources, new Set(), null, { route }) && complete;
    }
    if (complete) emit(route, parts, sources);
  }
  // Unknown public registry routes must not silently disappear during verification.
  const registry = readJson(REGISTRY);
  if (strict && Array.isArray(registry)) for (const item of registry) if (item?.route && free(item) && !output.has(item.route)) {
    throw new Error(`No SEO content projection for public practice route: ${item.route}`);
  }
  const familyFile = `${APP}shared/framework-families.ts`;
  const familySource = reader.read(familyFile) || '';
  const companyCounts = collectCompanyCounts({
    coding: records.filter((record) => record.kind === 'coding').map((record) => record.entry),
    trivia: records.filter((record) => record.kind === 'trivia').map((record) => record.entry),
    system: records.filter((record) => record.kind === 'system-design').map((record) => record.entry),
  }, buildFrameworkFamilyByIdMap(familySource));
  const aggregateSources = ['cdn/questions/', 'cdn/incidents/index.json', 'cdn/tradeoff-battles/index.json', familyFile];
  const guideGroups = new Map();
  const guideText = reader.read(GUIDES);
  if (guideText !== null) {
    const source = ast(guideText);
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        const collection = propertyName(declaration.name);
        if (!['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'].includes(collection) || !ts.isArrayLiteralExpression(declaration.initializer)) continue;
        for (const entry of declaration.initializer.elements) {
          if (!ts.isObjectLiteralExpression(entry)) continue;
          const slug = string(init(entry, 'slug'));
          if (!slug) continue;
          const group = collection === 'SYSTEM' ? 'system-design-blueprint' : collection === 'BEHAVIORAL' ? 'behavioral' : slug.endsWith('-prep-path') ? 'framework-prep' : 'interview-blueprint';
          const component = resolve(reader, GUIDES, importsIn(init(entry, 'load'))[0] || '');
          if (!component) {
            const file = path.posix.normalize(path.posix.join(path.posix.dirname(GUIDES), `${importsIn(init(entry, 'load'))[0] || ''}.ts`));
            if (strict) throw new Error(`Missing SEO guide component for ${slug}: ${file}`);
            reader.report?.({ route: `/guides/${group}/${slug}`, file, reason: `Missing guide component for ${slug}` }); continue;
          }
          const projected = entry.properties.filter((property) => propertyName(property.name) !== 'load').map((property) => projectNode(property)).filter((value) => value !== null);
          const parts = [projected];
          const sources = new Set([GUIDES]);
          if (!tsContent(reader, component, parts, sources, new Set(), null, { route: `/guides/${group}/${slug}`, slug, ...(slug.endsWith('-prep-path') ? { tech: slug.replace('-prep-path', '') } : {}) })) continue;
          const seoHelper = `${APP}features/guides/guide-seo.util.ts`;
          if (reader.read(seoHelper) !== null && !tsContent(reader, seoHelper, parts, sources, new Set(), ['buildGuideDetailSeo'], { route: `/guides/${group}/${slug}` })) continue;
          emit(`/guides/${group}/${slug}`, parts, sources);
          if (!guideGroups.has(group)) guideGroups.set(group, []);
          guideGroups.get(group).push(projected);
        }
      }
    }
  }
  for (const file of reader.list(`${APP}shared/mastery/paths/`).filter((name) => name.endsWith('.ts') && !excluded(name)).sort()) {
    const raw = reader.read(file);
    const match = raw?.match(/frameworkSlug:\s*['"]([^'"]+)['"]/);
    if (!match) continue;
    const value = page(`/guides/framework-prep/${match[1]}/mastery`, '/guides/framework-prep/:slug/mastery');
    if (!value) continue;
    tsContent(reader, file, value.parts, value.sources);
    emit(`/guides/framework-prep/${match[1]}/mastery`, value.parts, value.sources);
  }
  const tracks = readJson(TRACKS)?.tracks?.filter((track) => track.slug && !track.hidden) || [];
  for (const track of tracks) {
    const route = `/tracks/${track.slug}/preview`;
    const value = page(route, '/tracks/:slug/preview');
    if (!value) continue;
    value.parts.push(clean(track)); value.sources.add(TRACKS);
    emit(route, value.parts, value.sources);
  }
  for (const company of [...companies].filter(Boolean).sort()) {
    const route = `/companies/${company}/preview`;
    const value = page(route, '/companies/:slug/preview');
    if (!value) continue;
    if (!['google', 'openai', 'netflix'].includes(company)) {
      const techOrder = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
      const matching = records.filter(({ entry, kind }) => ['coding', 'trivia', 'system-design'].includes(kind) && (entry.companies || entry.companyTags || []).includes(company))
        .sort((a, b) => techOrder.indexOf(a.tech) - techOrder.indexOf(b.tech));
      const primary = ['coding', 'trivia', 'system-design'].flatMap((kind) => matching.filter((record) => record.kind === kind).slice(0, kind === 'system-design' ? 2 : 3));
      const extras = ['coding', 'trivia', 'system-design'].flatMap((kind) => matching.filter((record) => record.kind === kind)).slice(0, 8);
      const samples = [...new Map([...primary, ...extras].map((record) => [record.route, record])).values()].slice(0, 8);
      value.parts.push(companyCounts[company] || {}, samples.map(({ entry, route: itemRoute, tech, kind }) => ({ route: itemRoute, tech, kind,
        title: entry.title, difficulty: entry.difficulty, access: entry.access === 'free' ? 'free' : 'premium' })));
      value.sources.add('cdn/questions/'); value.sources.add(familyFile);
    }
    emit(route, value.parts, value.sources);
  }
  for (const route of STATIC_ROUTES) {
    const value = page(route);
    if (!value) continue;
    let selected = [];
    if (route === '/coding') selected = records.filter(({ kind }) => ['coding', 'debug'].includes(kind));
    else if (route === '/system-design') selected = records.filter(({ kind }) => kind === 'system-design');
    else if (route === '/incidents') selected = records.filter(({ kind }) => kind === 'incident');
    else if (route === '/tradeoffs') selected = records.filter(({ kind }) => kind === 'tradeoff-battle');
    else if (/interview-questions$/.test(route)) {
      const tech = route.split('/')[1];
      selected = records.filter((record) => ['trivia', 'coding', 'debug'].includes(record.kind) && (tech === 'interview-questions' || tech === record.tech || tech === 'html-css' && ['html', 'css'].includes(record.tech)));
      value.sources.add('cdn/questions/');
    }
    value.parts.push(selected.map(({ entry, route: itemRoute }) => card(entry, itemRoute)));
    selected.forEach(({ file }) => value.sources.add(file));
    if (['/tracks', '/focus-areas'].includes(route)) { value.parts.push(clean(tracks)); value.sources.add(TRACKS); }
    if (route.startsWith('/guides/')) { value.parts.push(guideGroups.get(route.split('/')[2]) || []); value.sources.add(GUIDES); }
    if (route === '/interview-questions/essential') {
      const file = 'cdn/questions/collections/frontend-essential-60.json';
      if (reader.read(file) !== null) {
        requiredAsset(file, value.parts, value.sources);
        const refs = (readJson(file)?.items || []).flatMap((item) => [item.primary, ...(item.alternates || [])]).filter(Boolean);
        const refRoutes = new Set(refs.map((ref) => ref.kind === 'system-design' ? `/system-design/${ref.id}` : `/${ref.tech}/${ref.kind}/${ref.id}`));
        const linked = records.filter((record) => refRoutes.has(record.route));
        value.parts.push(linked.map(({ entry, route: itemRoute }) => card(entry, itemRoute)));
        linked.forEach(({ file: source }) => value.sources.add(source));
      }
    }
    if (route === '/') {
      value.parts.push({
        totalQuestions: new Set(records.filter((record) => record.kind !== 'debug').map((record) => `${record.kind}:${record.entry.id}`)).size,
        premiumPracticeCount: records.filter(({ entry }) => !free(entry)).length,
        companyCounts,
      });
      aggregateSources.forEach((file) => value.sources.add(file));
      const incident = records.find((record) => record.kind === 'incident' && record.entry.id === 'stale-search-race') || records.find((record) => record.kind === 'incident');
      const battle = records.find((record) => record.kind === 'tradeoff-battle' && record.entry.id === 'context-vs-zustand-vs-redux') || records.find((record) => record.kind === 'tradeoff-battle');
      if (incident) value.parts.push({ ...card(incident.entry, incident.route), signals: incident.entry.signals?.slice(0, 3) });
      if (battle) {
        value.parts.push(card(battle.entry, battle.route));
        const scenarioFile = `cdn/tradeoff-battles/${battle.entry.id}/scenario.json`;
        const scenario = readJson(scenarioFile);
        if (scenario) { value.parts.push(scenario.options?.slice(0, 3).map((option) => option.label) || []); value.sources.add(scenarioFile); }
      }
    }
    if (route === '/companies') {
      value.parts.push(companyCounts);
      value.sources.add('cdn/questions/'); value.sources.add(familyFile);
    }
    emit(route, value.parts, value.sources);
  }
  if (strict) for (const [route, descriptor] of routes) {
    if (route.includes(':') || route.includes('*') || output.has(route)) continue;
    const robots = string(init(init(init(descriptor.node, 'data'), 'seo'), 'robots'));
    if (/noindex/.test(robots) || route === '/404' || /^\/(?:auth|admin|billing|onboarding|interview)(?:\/|$)/.test(route)) continue;
    throw new Error(`No SEO content projection for public app route: ${route}`);
  }
  return new Map([...output].sort(([a], [b]) => a.localeCompare(b)));
}
