#!/usr/bin/env node

import fs from 'fs';
import http from 'http';
import path from 'path';

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.ttf', 'font/ttf'],
  ['.map', 'application/json; charset=utf-8'],
]);

const TARGETED_INDEX_REWRITES = [
  /^\/dashboard(?:\/.*)?$/i,
  /^\/profile(?:\/.*)?$/i,
  /^\/admin(?:\/.*)?$/i,
  /^\/billing(?:\/.*)?$/i,
  /^\/onboarding(?:\/.*)?$/i,
  /^\/track\/[^/]+$/i,
  /^\/tracks\/[^/]+$/i,
  /^\/companies\/[^/]+(?:\/(?:all|coding|trivia|system))?$/i,
];

function existsFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function existsDir(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function toSafePathname(rawPathname) {
  const decoded = decodeURIComponent(rawPathname || '/');
  const noQuery = decoded.split('?')[0].split('#')[0];
  const withSlash = noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
  return path.posix.normalize(withSlash);
}

function resolveStaticFile(buildDir, pathname) {
  const safePath = toSafePathname(pathname);
  const rel = safePath.replace(/^\/+/, '');
  const direct = path.join(buildDir, rel);
  if (existsFile(direct)) return direct;

  if (existsDir(direct)) {
    const nestedIndex = path.join(direct, 'index.html');
    if (existsFile(nestedIndex)) return nestedIndex;
  }

  if (!rel || rel === '/') {
    const rootIndex = path.join(buildDir, 'index.html');
    if (existsFile(rootIndex)) return rootIndex;
  }

  return null;
}

export function shouldRewriteToIndex(pathname) {
  const safePath = toSafePathname(pathname);
  return TARGETED_INDEX_REWRITES.some((pattern) => pattern.test(safePath));
}

export function resolveStaticFileForPath(buildDir, pathname) {
  return resolveStaticFile(path.resolve(buildDir), pathname);
}

function sendFile(res, filePath, statusCode) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME.get(ext) || 'application/octet-stream';
  const body = fs.readFileSync(filePath);
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': body.length,
  });
  res.end(body);
}

function send404(res, buildDir) {
  const notFoundCandidates = [
    path.join(buildDir, '404', 'index.html'),
    path.join(buildDir, '404.html'),
  ];
  const page = notFoundCandidates.find((candidate) => existsFile(candidate));
  if (page) {
    sendFile(res, page, 404);
    return;
  }

  const body = 'Not Found';
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
  });
  res.end(body);
}

export async function startSeoStaticServer({
  buildDir = path.resolve('dist/frontendatlas/browser'),
  host = '127.0.0.1',
  port = 4173,
  logPrefix = '[seo:serve]',
} = {}) {
  const root = path.resolve(buildDir);
  if (!existsDir(root)) {
    throw new Error(`${logPrefix} build directory not found: ${root}`);
  }

  const server = http.createServer((req, res) => {
    const method = String(req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${host}:${port}`);
    const pathname = toSafePathname(url.pathname || '/');

    // Filesystem-first routing so prerendered pages always win.
    const staticFile = resolveStaticFile(root, pathname);
    if (staticFile) {
      sendFile(res, staticFile, 200);
      return;
    }

    // Targeted CSR fallback only for private/app routes.
    if (shouldRewriteToIndex(pathname)) {
      const indexHtml = path.join(root, 'index.html');
      if (existsFile(indexHtml)) {
        sendFile(res, indexHtml, 200);
        return;
      }
    }

    send404(res, root);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(null));
  });

  return {
    host,
    port,
    baseUrl: `http://${host}:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve(null));
      }),
  };
}

export function isNonNavigationalLink(rawUrl) {
  const url = String(rawUrl || '').trim().toLowerCase();
  return (
    url.startsWith('#')
    || url.startsWith('mailto:')
    || url.startsWith('tel:')
    || url.startsWith('javascript:')
  );
}

export function isInternalHttpLink(rawUrl, baseUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return false;
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    const protocol = target.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return target.origin === base.origin;
  } catch {
    return false;
  }
}
