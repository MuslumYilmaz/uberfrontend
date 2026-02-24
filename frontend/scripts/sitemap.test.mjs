import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const SRC_DIR = path.resolve('src');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const FALLBACK_PATH = path.join(SRC_DIR, 'sitemap.xml');
const MAX_URLS = 50000;
const GUIDE_REGISTRY_PATH = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');
const APP_ROUTES_PATH = path.join(SRC_DIR, 'app', 'app.routes.ts');

function readXml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run: npm run gen:data`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function countUrlEntries(xml) {
  const matches = xml.match(/<url>/g);
  return matches ? matches.length : 0;
}

function extractLocs(xml) {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1]);
}

function toLocalFile(loc) {
  try {
    const url = new URL(loc);
    return url.pathname.replace(/^\//, '');
  } catch {
    return String(loc).replace(/^\//, '');
  }
}

function normalizePath(rawPath) {
  const raw = String(rawPath || '').trim();
  if (!raw) return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const clean = withSlash.replace(/\/+$/, '');
  return clean || '/';
}

function assertSitemapWithinLimit(fileName) {
  const filePath = path.join(SRC_DIR, fileName);
  const xml = readXml(filePath);
  const count = countUrlEntries(xml);
  if (count > MAX_URLS) {
    throw new Error(`${fileName} has ${count} URLs (max ${MAX_URLS}). Split the sitemap.`);
  }
}

function extractGuideSlugs(content, exportName) {
  const marker = `export const ${exportName}`;
  const start = content.indexOf(marker);
  if (start === -1) return [];
  const rest = content.slice(start);
  const end = rest.indexOf('];');
  if (end === -1) return [];
  const block = rest.slice(0, end);
  const slugs = [];
  const re = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(block))) {
    slugs.push(match[1]);
  }
  return slugs;
}

function getSitemapFileNames() {
  if (!fs.existsSync(INDEX_PATH)) return ['sitemap.xml'];
  const indexXml = readXml(INDEX_PATH);
  const locs = extractLocs(indexXml);
  if (!locs.length) {
    throw new Error('sitemap-index.xml does not list any sitemaps.');
  }
  return locs.map((loc) => toLocalFile(loc));
}

function getAllSitemapPaths(fileNames) {
  const paths = new Set();
  fileNames.forEach((fileName) => {
    const xml = readXml(path.join(SRC_DIR, fileName));
    extractLocs(xml).forEach((loc) => {
      try {
        paths.add(normalizePath(new URL(loc).pathname));
      } catch {
        paths.add(normalizePath(loc));
      }
    });
  });
  return paths;
}

function assertGuideDetailCoverage(paths) {
  if (!fs.existsSync(GUIDE_REGISTRY_PATH)) return;
  const registrySource = readXml(GUIDE_REGISTRY_PATH);
  const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
  const frameworkPrep = playbook.filter((slug) => slug.endsWith('-prep-path'));
  const interviewBlueprintOnly = playbook.filter((slug) => !slug.endsWith('-prep-path'));
  const expected = [
    ...interviewBlueprintOnly.map((slug) => `/guides/interview-blueprint/${slug}`),
    ...frameworkPrep.map((slug) => `/guides/framework-prep/${slug}`),
    ...extractGuideSlugs(registrySource, 'SYSTEM').map((slug) => `/guides/system-design-blueprint/${slug}`),
    ...extractGuideSlugs(registrySource, 'BEHAVIORAL').map((slug) => `/guides/behavioral/${slug}`),
  ];
  const missing = expected.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(
      `Sitemap missing ${missing.length} guide detail routes. Examples: ${missing.slice(0, 5).join(', ')}`
    );
  }
}

function assertCoreIndexableCoverage(paths) {
  const core = [
    '/changelog',
    '/guides/interview-blueprint',
    '/legal/editorial-policy',
  ];

  const missing = core.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(`Sitemap missing core indexable routes: ${missing.join(', ')}`);
  }
}

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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

function readArrayProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

function isStaticPathSegment(segment) {
  const value = String(segment || '');
  if (value === '') return true;
  return !value.includes(':') && !value.includes('*');
}

function joinRoutePath(parentPath, segment) {
  const parent = normalizePath(parentPath || '/');
  const child = String(segment || '');
  if (!child) return parent;
  if (parent === '/') return normalizePath(`/${child}`);
  return normalizePath(`${parent}/${child}`);
}

function hasStaticDefaultRedirectChild(routeObject) {
  const children = readArrayProperty(routeObject, 'children');
  if (!children) return false;

  return children.elements.some((child) => {
    if (!ts.isObjectLiteralExpression(child)) return false;
    const childPath = readStringProperty(child, 'path');
    const redirectTo = readStringProperty(child, 'redirectTo');
    if (childPath !== '' || !redirectTo) return false;
    return isStaticPathSegment(redirectTo);
  });
}

function collectRouteSeoEntries(routeArray, parentPath, out) {
  routeArray.elements.forEach((element) => {
    if (!ts.isObjectLiteralExpression(element)) return;

    const pathSegment = readStringProperty(element, 'path');
    const currentPath = joinRoutePath(parentPath, pathSegment);
    const hasRedirect = Boolean(getObjectProperty(element, 'redirectTo'));
    const hasDefaultRedirectChild = hasStaticDefaultRedirectChild(element);
    const dataObject = readObjectProperty(element, 'data');
    const seoObject = dataObject ? readObjectProperty(dataObject, 'seo') : null;

    if (seoObject && !hasRedirect && !hasDefaultRedirectChild && isStaticPathSegment(pathSegment)) {
      const title = readStringProperty(seoObject, 'title');
      if (title) {
        out.push({
          path: currentPath,
          title,
          robots: readStringProperty(seoObject, 'robots'),
        });
      }
    }

    const children = readArrayProperty(element, 'children');
    if (children) {
      collectRouteSeoEntries(children, currentPath, out);
    }
  });
}

function readRoutesArrayExpression(sourceFile) {
  let routesArray = null;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name)) return;
      if (decl.name.text !== 'routes') return;
      if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        routesArray = decl.initializer;
      }
    });
  });
  return routesArray;
}

function assertIndexableRouteTitlesUnique() {
  if (!fs.existsSync(APP_ROUTES_PATH)) return;

  const source = fs.readFileSync(APP_ROUTES_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    APP_ROUTES_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const routesArray = readRoutesArrayExpression(sourceFile);
  if (!routesArray) {
    throw new Error('Could not parse routes array in src/app/app.routes.ts');
  }

  const rawEntries = [];
  collectRouteSeoEntries(routesArray, '/', rawEntries);

  // Keep one SEO record per static route path (child routes override parent for same path).
  const byPath = new Map();
  rawEntries.forEach((entry) => {
    byPath.set(normalizePath(entry.path), entry);
  });

  const indexableEntries = Array.from(byPath.values()).filter(
    (entry) => !String(entry.robots || '').toLowerCase().includes('noindex'),
  );

  const titleMap = new Map();
  indexableEntries.forEach((entry) => {
    const key = normalizeTitle(entry.title);
    if (!key) return;
    const list = titleMap.get(key) || [];
    list.push(entry);
    titleMap.set(key, list);
  });

  const duplicates = Array.from(titleMap.values()).filter((entries) => entries.length > 1);
  if (duplicates.length) {
    const details = duplicates
      .map((entries) => {
        const title = entries[0].title;
        const paths = entries.map((entry) => entry.path).join(', ');
        return `"${title}" -> ${paths}`;
      })
      .join(' | ');
    throw new Error(`Duplicate indexable SEO titles detected: ${details}`);
  }

  const homeEntry = indexableEntries.find((entry) => normalizePath(entry.path) === '/');
  if (!homeEntry) {
    throw new Error('Missing indexable SEO title for homepage (/).');
  }

  const homeTitlePhrase = normalizeTitle(homeEntry.title);
  const homePhraseCollisions = indexableEntries.filter((entry) => {
    if (normalizePath(entry.path) === '/') return false;
    return normalizeTitle(entry.title).includes(homeTitlePhrase);
  });

  if (homePhraseCollisions.length) {
    const details = homePhraseCollisions
      .map((entry) => `${entry.path} ("${entry.title}")`)
      .join(', ');
    throw new Error(
      `Homepage primary title phrase appears in other indexable route titles (${details}).`,
    );
  }
}

const sitemapFiles = getSitemapFileNames();
sitemapFiles.forEach((fileName) => assertSitemapWithinLimit(fileName));
const paths = getAllSitemapPaths(sitemapFiles);
assertGuideDetailCoverage(paths);
assertCoreIndexableCoverage(paths);
assertIndexableRouteTitlesUnique();

console.log('Sitemap size check passed.');
