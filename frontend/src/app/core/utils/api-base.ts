import { environment } from '../../../environments/environment';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeBase(value: string): string {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function getRuntimeOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location?.origin || '';
}

function getRuntimeHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location?.hostname || '';
}

function getOverrideApiBase(): string {
  if (typeof window === 'undefined') return '';
  const override = (window as any).__FA_API_BASE__;
  return typeof override === 'string' ? normalizeBase(override) : '';
}

function deriveApiBaseFromOrigin(origin: string): string {
  if (!origin) return '';
  try {
    const url = new URL(origin);
    const host = url.hostname.replace(/^www\./, '');
    if (!host) return '';
    return `${url.protocol}//api.${host}`;
  } catch {
    return '';
  }
}

function resolveApiBase(): string {
  const override = getOverrideApiBase();
  const raw = override || String(environment.apiBase || '').trim();
  let base = normalizeBase(raw);

  if (isAbsoluteUrl(base)) return base;

  const runtimeHost = getRuntimeHost();
  const runtimeOrigin = getRuntimeOrigin();
  const isLocal = runtimeHost ? LOCAL_HOSTS.has(runtimeHost) : false;
  const isProdRuntime = environment.production || (runtimeHost && !isLocal);

  if (isProdRuntime) {
    const fromEnv = deriveApiBaseFromOrigin(environment.frontendBase || '');
    const fromRuntime = deriveApiBaseFromOrigin(runtimeOrigin);
    const derived = normalizeBase(fromEnv || fromRuntime);
    if (derived) return derived;
  }

  return base;
}

export function getApiBase(): string {
  return resolveApiBase();
}

export function getApiRoot(): string {
  const base = resolveApiBase();
  if (!base) return '/api';
  return base.endsWith('/api') ? base : `${base}/api`;
}

export function apiUrl(path: string): string {
  const apiRoot = getApiRoot();
  const rawPath = String(path || '').trim();
  if (!rawPath) return apiRoot;
  const trimmed = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (trimmed === '/api') return apiRoot;
  const normalized = trimmed.startsWith('/api/') ? trimmed.slice(4) : trimmed;
  return `${apiRoot}${normalized}`;
}

export function getFrontendBase(): string {
  return normalizeBase(environment.frontendBase || '');
}
