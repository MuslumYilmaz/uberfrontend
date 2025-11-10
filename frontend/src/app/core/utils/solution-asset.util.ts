import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeSdkFiles } from './snapshot.utils';

export type SdkAsset = {
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
};

/**
 * Fetch a solution/sdk asset JSON, resolving relative URLs against <base href>.
 */
export async function fetchSdkAsset(http: HttpClient, url: string): Promise<SdkAsset> {
    const href = new URL(url, document.baseURI).toString();
    return await firstValueFrom(http.get<SdkAsset>(href));
}

/**
 * Normalizes various asset shapes into a simple files map + initial open path.
 *
 * Accepts:
 * - v1: { "/path": "code", ... }
 * - v2: { files: { "/path": { code: "..." } }, openFile?: "..." }
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