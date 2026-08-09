'use strict';

const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normalizeCanonicalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

function validateFrontendAtlasUrl(value) {
  const raw = String(value || '').trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (
    parsed.origin !== 'https://frontendatlas.com' ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.search
  ) return null;
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return normalizeCanonicalUrl(parsed.toString());
}

function normalizePageIdentityUrl(value) {
  // Search Console can report the same FrontendAtlas route both with and
  // without a trailing slash. Match the manifest's strict canonical identity
  // while leaving query variants and external origins deliberately distinct.
  return validateFrontendAtlasUrl(value) || normalizeCanonicalUrl(value);
}

function normalizeQuery(value) {
  return String(value || '').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
}

function pageKeyForUrl(url) {
  const normalized = normalizePageIdentityUrl(url);
  if (!normalized) throw new Error('A canonical URL is required to create a page key');
  return sha256(normalized);
}

function queryKeyForText(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) throw new Error('A query is required to create a query key');
  return sha256(normalized);
}

function isBrandQuery(query) {
  const normalized = normalizeQuery(query).replace(/[^a-z0-9]+/g, ' ').trim();
  return normalized.includes('frontendatlas') || normalized.includes('frontend atlas');
}

module.exports = {
  isBrandQuery,
  normalizeCanonicalUrl,
  normalizePageIdentityUrl,
  normalizeQuery,
  pageKeyForUrl,
  queryKeyForText,
  sha256,
  validateFrontendAtlasUrl,
};
