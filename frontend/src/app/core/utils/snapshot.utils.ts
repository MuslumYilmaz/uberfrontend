/** Accepts either a pure snapshot or v2 asset format and normalizes to { 'src/...': 'code' }. */
export function normalizeSdkFiles(raw: any): Record<string, string> {
    const source = raw?.files ?? raw ?? {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(source)) {
        const path = k.replace(/^\/+/, '');
        const code = typeof v === 'string' ? v : (v as any)?.code ?? '';
        out[path] = code;
    }
    // Ensure zone.js in main.ts (StackBlitz angular-cli quirk)
    if (out['src/main.ts'] && !/zone\.js/.test(out['src/main.ts'])) {
        out['src/main.ts'] = `import 'zone.js';\n${out['src/main.ts']}`;
    }
    return out;
}

/** Normalize content so cosmetic changes don’t trigger the banner. */
export function normalizeForCompare(path: string, code: string): string {
    let s = (code ?? '').replace(/\r\n/g, '\n');     // unify line endings
    s = s.replace(/[ \t]+$/gm, '');                  // strip trailing spaces
    if (path.endsWith('.json')) {
        try { return JSON.stringify(JSON.parse(s)); } catch { /* ignore */ }
    }
    return s.trimEnd();
}

/** Compare only files present in the baseline (usually src/**). */
export function matchesBaseline(
    current: Record<string, string>,
    baseline: Record<string, string>
): boolean {
    const keys = Object.keys(baseline).filter(k => k.startsWith('src/'));
    for (const k of keys) {
        const a = normalizeForCompare(k, current[k] ?? '');
        const b = normalizeForCompare(k, baseline[k] ?? '');
        if (a !== b) return false;
    }
    return true;
}