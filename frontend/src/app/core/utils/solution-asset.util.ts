import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizeSdkFiles } from './snapshot.utils';

export type SdkAsset = {
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
};

const CDN_FLAG_KEY = 'fa:cdn:enabled';

function hasLocalStorage(): boolean {
    try {
        const k = '__sdk_probe__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
}

function isCdnEnabledByFlag(): boolean {
    if (!hasLocalStorage()) {
        if (typeof (environment as any).cdnEnabled === 'boolean') {
            return (environment as any).cdnEnabled;
        }
        return !!(environment as any).cdnBaseUrl;
    }

    const raw = localStorage.getItem(CDN_FLAG_KEY);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;

    if (typeof (environment as any).cdnEnabled === 'boolean') {
        return (environment as any).cdnEnabled;
    }
    return !!(environment as any).cdnBaseUrl;
}

function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

/**
 * Local'de `assets/` altında nasıl tutuluyorsa,
 * CDN'de de aynı relative path ile servis eder.
 *
 * Örnek:
 *  - assets/sb/react/question/react-counter.v1.json
 *  - assets/sb/angular/question/angular-counter.v2.json
 * CDN:
 *  - sb/react/question/react-counter.v1.json
 *  - sb/angular/question/angular-counter.v2.json
 */
function buildCdnUrl(url: string, cdnBase: string): string {
    const normalizedPath = url.replace(/^\/+/, ''); // baştaki '/' leri temizle

    // Zaten 'sb/...' ile başlıyorsa olduğu gibi kullan
    if (normalizedPath.startsWith('sb/')) {
        return `${cdnBase}/${normalizedPath}`;
    }

    // assets/sb/... ise `assets/` prefix'ini kaldır (sb/... şeklinde servis ediyoruz)
    if (normalizedPath.startsWith('assets/sb/')) {
        return `${cdnBase}/${normalizedPath.replace(/^assets\//, '')}`;
    }

    // Genel fallback: assets/ prefix'ini sil, kalan kısmı kullan
    let cdnPath = normalizedPath;
    if (cdnPath.startsWith('assets/')) {
        cdnPath = cdnPath.replace(/^assets\//, '');
    }

    return `${cdnBase}/${cdnPath}`;
}

/**
 * Fetch a solution/sdk asset JSON, resolving against CDN if enabled,
 * otherwise falling back to <base href>/assets.
 */
export async function fetchSdkAsset(http: HttpClient, url: string): Promise<SdkAsset> {
    if (!url) {
        throw new Error('[fetchSdkAsset] url is required');
    }

    // 1) Absolute URL ise direkt kullan
    if (isAbsoluteUrl(url)) {
        return await firstValueFrom(http.get<SdkAsset>(url));
    }

    const cdnBase = (environment as any).cdnBaseUrl?.replace(/\/+$/, '');
    const useCdn = isCdnEnabledByFlag() && !!cdnBase;

    // Local URL: Angular'ın baseHref'ine göre
    const localUrl = new URL(url, document.baseURI).toString();

    // 2) CDN URL'i
    const cdnUrl = useCdn && cdnBase ? buildCdnUrl(url, cdnBase) : null;

    // 3) Önce CDN, patlarsa local
    if (cdnUrl) {
        try {
            return await firstValueFrom(http.get<SdkAsset>(cdnUrl));
        } catch (e) {
            console.warn('[fetchSdkAsset] CDN failed, falling back to local assets', e);
        }
    }

    return await firstValueFrom(http.get<SdkAsset>(localUrl));
}

/**
 * Normalizes various asset shapes into a simple files map + initial open path.
 */
export function resolveSolutionFiles(raw: any): {
    files: Record<string, string>;
    initialPath: string;
} {
    const normalized = normalizeSdkFiles(raw?.files || raw || {});
    const keys = Object.keys(normalized || {});

    if (!keys.length) {
        return { files: {}, initialPath: '' };
    }

    const metaOpen = (raw?.openFile || '').replace(/^\/+/, '');
    const initialPath = metaOpen && normalized[metaOpen] ? metaOpen : keys[0];

    return { files: normalized, initialPath };
}
