export type ContentHashPart = { key: string; value: string };

function normalizeNewlines(input: string): string {
  return String(input ?? '').replace(/\r\n/g, '\n');
}

// FNV-1a 64-bit (BigInt), returned as 16-char hex string.
function fnv1a64Hex(input: string): string {
  const data = normalizeNewlines(input);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let i = 0; i < data.length; i++) {
    hash ^= BigInt(data.charCodeAt(i));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, '0');
}

function joinParts(parts: ContentHashPart[]): string {
  return parts
    .map(({ key, value }) => {
      const k = String(key);
      const v = normalizeNewlines(value);
      // include lengths to avoid accidental boundary collisions
      return `${k.length}:${k}\n${v.length}:${v}\n`;
    })
    .join('');
}

export function computeContentHash(parts: ContentHashPart[]): string {
  return fnv1a64Hex(joinParts(parts));
}

export function getExplicitContentVersion(raw: any): string | null {
  const v = String(raw?.contentVersion ?? '').trim();
  return v ? v : null;
}

export function computeJsQuestionContentVersion(raw: any): string {
  const explicit = getExplicitContentVersion(raw);
  if (explicit) return explicit;

  const starterJs = String(raw?.starterCode ?? '');
  const starterTs = String(raw?.starterCodeTs ?? raw?.starterCode ?? '');

  const pick = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  };

  const testsJs = pick(raw, ['tests', 'testsJs', 'unitTests', 'spec', 'specs', 'testCode']);
  const testsTs = pick(raw, ['testsTs', 'tests', 'unitTestsTs', 'specTs', 'specsTs', 'testCodeTs']);

  return computeContentHash([
    { key: 'starter.js', value: starterJs },
    { key: 'starter.ts', value: starterTs },
    { key: 'tests.js', value: testsJs },
    { key: 'tests.ts', value: testsTs },
  ]);
}

export function computeWebQuestionContentVersion(raw: any): string {
  const explicit = getExplicitContentVersion(raw);
  if (explicit) return explicit;

  const pickPath = (obj: any, paths: string[]) => {
    for (const p of paths) {
      const val = p
        .split('.')
        .reduce((o: any, k: string) => (o && k in o ? o[k] : undefined), obj);
      if (typeof val === 'string' && val.trim()) return val;
    }
    return '';
  };

  const starterHtml = pickPath(raw, ['web.starterHtml', 'starterHtml', 'htmlStarter', 'web.html', 'html']);
  const starterCss = pickPath(raw, [
    'web.starterCss',
    'starterCss',
    'cssStarter',
    'web.css',
    'css',
    'starterStyles',
    'styles',
    'starterCSS',
  ]);
  const tests = pickPath(raw, ['web.tests', 'tests', 'testsDom', 'testsHtml']);

  return computeContentHash([
    { key: 'starter.html', value: starterHtml },
    { key: 'starter.css', value: starterCss },
    { key: 'tests', value: tests },
  ]);
}

export function computeFrameworkContentVersion(input: {
  files: Record<string, string>;
  entryFile?: string;
  dependencies?: Record<string, string>;
  contentVersion?: string | null;
}): string {
  const explicit = String(input?.contentVersion ?? '').trim();
  if (explicit) return explicit;

  const files = input?.files || {};
  const deps = input?.dependencies || {};

  const fileParts: ContentHashPart[] = Object.keys(files)
    .sort()
    .map((path) => ({
      key: `file:${String(path).replace(/^\/+/, '')}`,
      value: String(files[path] ?? ''),
    }));

  const depParts: ContentHashPart[] = Object.keys(deps)
    .sort()
    .map((name) => ({ key: `dep:${name}`, value: String(deps[name] ?? '') }));

  return computeContentHash([
    { key: 'entryFile', value: String(input?.entryFile ?? '') },
    ...depParts,
    ...fileParts,
  ]);
}

