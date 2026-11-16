import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeAssetPath } from './asset-url.util';
import { normalizeSdkFiles } from './snapshot.utils';

export type SdkAsset = {
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
};

/** Fetch a solution/sdk asset JSON from the page origin's /assets (absolute URLs pass through). */
export async function fetchSdkAsset(http: HttpClient, url: string): Promise<SdkAsset> {
    if (!url) {
        throw new Error('[fetchSdkAsset] url is required');
    }

    return await firstValueFrom(http.get<SdkAsset>(normalizeAssetPath(url)));
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
