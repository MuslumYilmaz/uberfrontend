import { environment } from '../../../environments/environment';

const warned = {
    invalidBase: false,
};

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function getCurrentOrigin(): string {
    if (typeof window === 'undefined') return '';
    try {
        return window.location.origin || '';
    } catch {
        return '';
    }
}

function warnInvalidBaseOnce(baseUrl: string): void {
    if (warned.invalidBase) return;
    warned.invalidBase = true;
    console.warn('[assets] Ignoring invalid asset base; using same-origin assets instead.', {
        baseUrl,
    });
}

export function normalizeAssetPath(path: string): string {
    const raw = String(path || '').replace(/^\/+/, '');
    if (!raw) return 'assets/';
    if (isAbsoluteUrl(raw)) return raw;
    if (raw.startsWith('assets/')) return raw;
    if (raw.startsWith('questions/')) return `assets/${raw}`;
    return `assets/${raw}`;
}

export function getSafeAssetBase(preferBase?: string): string {
    const candidate = String(preferBase || (environment as any).cdnBaseUrl || '').trim();
    if (!candidate) return '';
    if (!isAbsoluteUrl(candidate)) return '';

    try {
        const candidateUrl = new URL(candidate);
        const origin = getCurrentOrigin();
        const isPreview = candidateUrl.hostname.endsWith('.vercel.app');
        const isSameOrigin = !!origin && candidateUrl.origin === origin;

        if (isPreview && !isSameOrigin) {
            warnInvalidBaseOnce(candidateUrl.origin);
            return '';
        }

        return candidateUrl.origin;
    } catch {
        warnInvalidBaseOnce(candidate);
        return '';
    }
}

export function buildAssetUrl(path: string, opts?: { preferBase?: string }): string {
    const normalized = normalizeAssetPath(path);
    if (isAbsoluteUrl(normalized)) return normalized;

    const base = getSafeAssetBase(opts?.preferBase);
    if (!base) return normalized;

    return new URL(normalized, base).toString();
}
