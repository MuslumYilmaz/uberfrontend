function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

/** Content assets live under the page origin's /assets; absolute URLs pass through. */
export function normalizeAssetPath(path: string): string {
    const raw = String(path || '').replace(/^\/+/, '');
    if (!raw) return 'assets/';
    if (isAbsoluteUrl(raw)) return raw;
    if (raw.startsWith('assets/')) return raw;
    if (raw.startsWith('questions/')) return `assets/${raw}`;
    return `assets/${raw}`;
}
