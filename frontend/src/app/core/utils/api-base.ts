import { environment } from '../../../environments/environment';

const RAW_API_BASE = String(environment.apiBase || '').trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const RAW_FRONTEND_BASE = String(environment.frontendBase || '').trim();
const FRONTEND_BASE = RAW_FRONTEND_BASE.replace(/\/+$/, '');

export function getApiBase(): string {
  return API_BASE;
}

export function getApiRoot(): string {
  return API_ROOT;
}

export function apiUrl(path: string): string {
  const rawPath = String(path || '').trim();
  if (!rawPath) return API_ROOT;
  const trimmed = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (trimmed === '/api') return API_ROOT;
  const normalized = trimmed.startsWith('/api/') ? trimmed.slice(4) : trimmed;
  return `${API_ROOT}${normalized}`;
}

export function getFrontendBase(): string {
  return FRONTEND_BASE;
}
