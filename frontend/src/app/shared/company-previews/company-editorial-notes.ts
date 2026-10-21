import type { CompanyEditorialNotes } from './company-editorial-notes.model';

/**
 * Editorial notes for catalog-driven company previews, keyed by company slug.
 * A company without an entry renders the shared template copy unchanged. The SEO inventory
 * scopes this registry per company (COMPANY_SCOPED_REGISTRIES in scripts/seo-content-inventory.mjs),
 * so an entry re-dates only its own page; keep the keys mirrored in
 * frontend/scripts/authored-companies.mjs (EDITORIAL_NOTE_COMPANIES).
 * The preview component imports this object directly: an injection token or a service wrapper
 * would be projected into every company page by the inventory and re-date all of them at once.
 */
export const COMPANY_EDITORIAL_NOTES: Readonly<Record<string, CompanyEditorialNotes>> = {
};

export type CompanyEditorialNotesRegistry = Readonly<Record<string, CompanyEditorialNotes>>;
