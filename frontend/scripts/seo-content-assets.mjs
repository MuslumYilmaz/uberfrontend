import path from 'node:path';

const FRAMEWORKS = new Set(['javascript', 'react', 'angular', 'vue', 'html', 'css']);
const ASSET_KEY = /assets?(?:paths?)?$/i;
const TEXT_ASSET = /\.(?:json|md|html|[cm]?[jt]s|jsx|tsx|css|scss|txt)$/i;

function assetFile(value, owner, assetHint) {
  if (typeof value !== 'string' || /\r|\n/.test(value)) return null;
  const raw = value.trim().split(/[?#]/, 1)[0];
  if (!TEXT_ASSET.test(raw) || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw)) return null;
  let file;
  if (/^\/?assets\//.test(raw)) file = `cdn/${raw.replace(/^\/?assets\//, '')}`;
  else if (/^\/?sb\//.test(raw)) file = `cdn/${raw.replace(/^\//, '')}`;
  else if (/^cdn\//.test(raw)) file = raw;
  else if (owner && !raw.startsWith('/') && (assetHint || /^\.\.?\//.test(raw))) {
    file = path.posix.join(path.posix.dirname(owner), raw);
  }
  if (!file) return null;
  const normalized = path.posix.normalize(file);
  return normalized.startsWith('cdn/') ? normalized : null;
}

/** Pure reader-based traversal: only referenced CDN payloads enter the projection. */
export function collectSeoContentAssets(reader, value, { tech, route, clean = (input) => input } = {}) {
  const sources = new Set();
  const roots = new Set();
  const active = new Set();
  const memo = new Map();
  let complete = true;

  function fail(file, reason) {
    if (reader.strict !== false) throw new Error(reason);
    reader.report?.({ route, file, reason });
    complete = false;
    return { missingAsset: true };
  }

  function projectAsset(file) {
    if (active.has(file)) return { assetCycle: true };
    if (memo.has(file)) return memo.get(file);
    const raw = reader.read(file);
    if (raw === null) return fail(file, `Missing SEO content dependency: ${file}`);
    sources.add(file);
    active.add(file);
    let projected;
    if (file.endsWith('.json')) {
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (error) {
        active.delete(file);
        return fail(file, `Invalid SEO asset JSON ${file}: ${error.message}`);
      }
      projected = walk(clean(parsed), file);
    } else {
      projected = raw;
    }
    active.delete(file);
    memo.set(file, projected);
    return projected;
  }

  function walk(input, owner = null, key = '', inheritedAssetHint = false, codeFiles = false) {
    if (typeof input === 'string') {
      // SDK file contents and editor open-file paths are code, not asset manifests.
      const file = codeFiles || key === 'openFile' ? null : assetFile(input, owner, inheritedAssetHint || ASSET_KEY.test(key));
      if (!file) return input;
      if (!owner) roots.add(file);
      return { assetContent: projectAsset(file) };
    }
    if (Array.isArray(input)) return input.map((item) => walk(item, owner, key, inheritedAssetHint, codeFiles));
    if (!input || typeof input !== 'object') return input;
    const assetHint = inheritedAssetHint || ASSET_KEY.test(key);
    const frameworkMap = tech && assetHint && Object.keys(input).some((name) => FRAMEWORKS.has(name));
    return Object.fromEntries(Object.keys(input).sort()
      .filter((name) => !frameworkMap || !FRAMEWORKS.has(name) || name === tech)
      .map((name) => [name, walk(input[name], owner, name, assetHint, codeFiles || key === 'files' || name === 'files')]));
  }

  const projectedValue = walk(clean(value));
  const parts = [...roots].map((file) => memo.get(file)).filter((part) => part !== undefined);
  // Filenames are provenance, not content. Renames cannot reorder the payload hash.
  parts.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return { value: projectedValue, parts, sources: [...sources].sort(), complete };
}
