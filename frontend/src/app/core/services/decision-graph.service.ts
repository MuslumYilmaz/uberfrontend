import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DecisionGraphDocument,
  DecisionGraphLanguage,
  DecisionGraphNode,
} from '../models/decision-graph.model';
import { buildAssetUrl, getSafeAssetBase, normalizeAssetPath } from '../utils/asset-url.util';

const CDN_FLAG_KEY = 'fa:cdn:enabled';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasLocalStorage(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const probe = '__decision_graph_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function isCdnEnabled(): boolean {
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

function toPositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized >= 1 ? normalized : null;
}

function parseLanguage(value: unknown): DecisionGraphLanguage | undefined {
  if (value === 'javascript' || value === 'typescript') return value;
  return undefined;
}

function parseNode(value: unknown): DecisionGraphNode | null {
  if (!isRecord(value)) return null;

  const id = String(value['id'] || '').trim();
  if (!id) return null;

  const title = String(value['title'] || '').trim() || 'Decision';

  const anchorRaw = value['anchor'];
  if (!isRecord(anchorRaw)) return null;

  const lineStart = toPositiveInt(anchorRaw['lineStart']);
  if (!lineStart) return null;

  const lineEndCandidate = toPositiveInt(anchorRaw['lineEnd']);
  const lineEnd = lineEndCandidate && lineEndCandidate >= lineStart ? lineEndCandidate : lineStart;

  const snippet = String(anchorRaw['snippet'] || '').trim();
  const label = String(anchorRaw['label'] || '').trim();

  const why = String(value['why'] || '').trim();
  const alternative = String(value['alternative'] || '').trim();
  const tradeoff = String(value['tradeoff'] || '').trim();

  if (!why || !alternative || !tradeoff) return null;

  return {
    id,
    title,
    anchor: {
      lineStart,
      lineEnd,
      ...(snippet ? { snippet } : {}),
      ...(label ? { label } : {}),
    },
    why,
    alternative,
    tradeoff,
  };
}

type ParsedGraphPayload = {
  language?: DecisionGraphLanguage;
  code: string;
  nodes: DecisionGraphNode[];
};

function parseGraphPayload(raw: unknown): ParsedGraphPayload | null {
  if (!isRecord(raw)) return null;

  const code = String(raw['code'] || '');
  if (!code.trim()) return null;

  const nodesRaw = Array.isArray(raw['nodes']) ? raw['nodes'] : [];
  const nodes = nodesRaw
    .map(parseNode)
    .filter((item): item is DecisionGraphNode => !!item)
    .sort((a, b) => {
      if (a.anchor.lineStart !== b.anchor.lineStart) {
        return a.anchor.lineStart - b.anchor.lineStart;
      }
      return a.id.localeCompare(b.id);
    });

  if (!nodes.length) return null;

  return {
    language: parseLanguage(raw['language']),
    code,
    nodes,
  };
}

function parseFlatDocument(raw: Record<string, unknown>): DecisionGraphDocument | null {
  const questionId = String(raw['questionId'] || '').trim();
  if (!questionId) return null;

  const versionRaw = Number(raw['version']);
  const version = Number.isFinite(versionRaw) && versionRaw >= 1 ? Math.floor(versionRaw) : 1;
  const payload = parseGraphPayload(raw);
  if (!payload) return null;

  return {
    questionId,
    version,
    language: payload.language,
    code: payload.code,
    nodes: payload.nodes,
  };
}

function parseVariantDocument(
  raw: Record<string, unknown>,
  variantKey?: string,
): DecisionGraphDocument | null {
  const questionId = String(raw['questionId'] || '').trim();
  if (!questionId) return null;

  const variantsRaw =
    (isRecord(raw['variants']) && (raw['variants'] as Record<string, unknown>)) ||
    (isRecord(raw['approaches']) && (raw['approaches'] as Record<string, unknown>)) ||
    null;
  if (!variantsRaw) return null;

  const parsedByKey = new Map<string, ParsedGraphPayload>();
  for (const [key, value] of Object.entries(variantsRaw)) {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) continue;
    const payload = parseGraphPayload(value);
    if (!payload) continue;
    parsedByKey.set(normalizedKey, payload);
  }
  if (!parsedByKey.size) return null;

  const requestedKey = String(variantKey || '').trim();
  let selectedKey = '';
  if (requestedKey) {
    if (!parsedByKey.has(requestedKey)) return null;
    selectedKey = requestedKey;
  } else {
    const defaultKey = String(raw['defaultKey'] || '').trim();
    if (defaultKey && parsedByKey.has(defaultKey)) selectedKey = defaultKey;
    else selectedKey = Array.from(parsedByKey.keys()).sort()[0];
  }

  const payload = parsedByKey.get(selectedKey);
  if (!payload) return null;

  const versionRaw = Number(raw['version']);
  const version = Number.isFinite(versionRaw) && versionRaw >= 1 ? Math.floor(versionRaw) : 1;

  return {
    questionId,
    version,
    key: selectedKey,
    language: payload.language,
    code: payload.code,
    nodes: payload.nodes,
  };
}

function parseDocument(raw: unknown, variantKey?: string): DecisionGraphDocument | null {
  if (!isRecord(raw)) return null;
  if (isRecord(raw['variants']) || isRecord(raw['approaches'])) {
    return parseVariantDocument(raw, variantKey);
  }
  return parseFlatDocument(raw);
}

@Injectable({ providedIn: 'root' })
export class DecisionGraphService {
  private readonly http = inject(HttpClient);
  private readonly rawCache = new Map<string, Observable<unknown>>();
  private readonly cache = new Map<string, Observable<DecisionGraphDocument | null>>();

  load(assetPath: string | null | undefined, variantKey?: string | null): Observable<DecisionGraphDocument | null> {
    const normalized = String(assetPath || '').trim();
    if (!normalized) return of(null);
    const normalizedVariantKey = String(variantKey || '').trim();
    const hasVariantKey = normalizedVariantKey.length > 0;

    const assetCacheKey = normalizeAssetPath(normalized);
    const cacheKey = hasVariantKey ? `${assetCacheKey}::${normalizedVariantKey}` : assetCacheKey;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const raw$ = this.loadRaw(normalized);
    const request$ = raw$.pipe(
      map((raw) => parseDocument(raw, hasVariantKey ? normalizedVariantKey : undefined)),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  private loadRaw(assetPath: string): Observable<unknown> {
    const cacheKey = normalizeAssetPath(assetPath);
    const cached = this.rawCache.get(cacheKey);
    if (cached) return cached;

    const urls = this.buildFetchUrls(assetPath);
    const request$ = this.fetchWithFallback(urls).pipe(
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.rawCache.set(cacheKey, request$);
    return request$;
  }

  private buildFetchUrls(assetPath: string): string[] {
    const normalized = normalizeAssetPath(assetPath);
    if (/^https?:\/\//i.test(normalized)) {
      return [normalized];
    }

    const fallbackUrl = buildAssetUrl(normalized);
    if (!isCdnEnabled()) return [fallbackUrl];

    const base = getSafeAssetBase((environment as any).cdnBaseUrl || '');
    if (!base) return [fallbackUrl];

    const primaryUrl = buildAssetUrl(normalized, { preferBase: base });
    if (primaryUrl === fallbackUrl) return [fallbackUrl];
    return [primaryUrl, fallbackUrl];
  }

  private fetchWithFallback(urls: string[]): Observable<unknown> {
    if (!urls.length) return of(null);

    const [first, ...rest] = urls;
    return this.http.get<unknown>(first).pipe(
      catchError(() => {
        if (!rest.length) return of(null);
        return this.fetchWithFallback(rest);
      }),
    );
  }
}
