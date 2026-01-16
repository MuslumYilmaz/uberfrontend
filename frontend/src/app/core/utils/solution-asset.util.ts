import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildAssetUrl, getSafeAssetBase } from './asset-url.util';
import { normalizeSdkFiles } from './snapshot.utils';

export type SdkAsset = {
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
};

const CDN_FLAG_KEY = 'fa:cdn:enabled';

function hasLocalStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
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

    const base = isCdnEnabledByFlag() ? getSafeAssetBase((environment as any).cdnBaseUrl || '') : '';
    const localUrl = buildAssetUrl(url);
    const preferredUrl = base ? buildAssetUrl(url, { preferBase: base }) : localUrl;

    if (preferredUrl !== localUrl) {
        try {
            return await firstValueFrom(http.get<SdkAsset>(preferredUrl));
        } catch {
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
