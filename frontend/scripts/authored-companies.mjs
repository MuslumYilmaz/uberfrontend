// Single source of truth for company preview pages that are fully authored (no catalog samples).
// LEGACY entries are hard-coded template branches in company-preview.component.html.
// REGISTRY entries are keys of AUTHORED_COMPANY_PREVIEWS in
// frontend/src/app/shared/company-previews/authored-company-previews.ts and the content-free list in
// authored-company-slugs.ts (both kept in sync by authored-companies.test.mjs).
export const LEGACY_AUTHORED_COMPANIES = ['google', 'openai', 'netflix'];
export const REGISTRY_AUTHORED_COMPANIES = ['waymo', 'elevenlabs', 'datadog', 'intuit', 'servicenow', 'amazon', 'meta', 'revolut', 'spotify'];
export const AUTHORED_COMPANIES = [...LEGACY_AUTHORED_COMPANIES, ...REGISTRY_AUTHORED_COMPANIES];
export const AUTHORED_COMPANY_SET = new Set(AUTHORED_COMPANIES);
