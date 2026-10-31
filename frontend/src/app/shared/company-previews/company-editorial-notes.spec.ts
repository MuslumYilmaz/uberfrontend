import { COMPANY_BRANDS } from '../company-branding';
import { processRowIds } from './authored-company-preview.spec-fixture';
import { AUTHORED_COMPANY_SLUGS } from './authored-company-slugs';
import { COMPANY_EDITORIAL_NOTES } from './company-editorial-notes';

const ABSOLUTE_WORDS = /\b(always|never|guaranteed|every candidate)\b/i;
const UNSUPPORTED_CLAIMS = [/known questions/i, /candidate reports/i, /How\s+\w+\s+Evaluates/i, /questions used in this company/i, /and counting/i];
const LEGACY_SLUGS = ['google', 'openai', 'netflix'];

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

describe('company editorial notes', () => {
  const entries = Object.entries(COMPANY_EDITORIAL_NOTES);

  it('keys only catalog-driven companies with known brands, never authored or inline guides', () => {
    expect(Array.isArray(entries)).toBeTrue();
    for (const [slug, notes] of entries) {
      expect(notes.slug).withContext(slug).toBe(slug);
      expect(COMPANY_BRANDS[slug]).withContext(slug).toBeDefined();
      expect(AUTHORED_COMPANY_SLUGS).withContext(slug).not.toContain(slug);
      expect(LEGACY_SLUGS).withContext(slug).not.toContain(slug);
    }
  });

  it('keeps titles unique and within the SEO length rules', () => {
    const titles = entries.map(([, notes]) => notes.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const [slug, notes] of entries) {
      expect(notes.title.length).withContext(`${slug} title`).toBeLessThanOrEqual(60);
      expect(notes.description.length).withContext(`${slug} description`).toBeGreaterThanOrEqual(70);
      expect(notes.description.length).withContext(`${slug} description`).toBeLessThanOrEqual(160);
      expect(notes.h1.trim().length).withContext(slug).toBeGreaterThan(0);
    }
  });

  for (const [slug, notes] of entries) {
    it(`${slug}: copy stays within the provenance rules`, () => {
      for (const text of allStrings(notes)) {
        expect(text).withContext(`${slug}: ${text}`).not.toMatch(ABSOLUTE_WORDS);
        expect(text).withContext(`${slug}: ${text}`).not.toContain("'");
        for (const claim of UNSUPPORTED_CLAIMS) expect(text).withContext(`${slug}: ${text}`).not.toMatch(claim);
      }
      for (const step of notes.prepSteps?.steps ?? []) {
        expect(step.path).withContext(`${slug} / ${step.label}`).toMatch(/^\/[a-z0-9/-]+$/);
        expect(step.why.trim().length).withContext(`${slug} / ${step.label}`).toBeGreaterThan(0);
      }
      const accessOrder = (notes.prepSteps?.steps ?? []).map((step) => step.access);
      const firstPremium = accessOrder.indexOf('premium');
      if (firstPremium >= 0) {
        expect(accessOrder.slice(firstPremium).every((access) => access === 'premium')).withContext(`${slug}: free steps before premium`).toBeTrue();
      }
      for (const bullet of notes.reportsDescribe?.bullets ?? []) {
        if (bullet.link) {
          expect(Boolean(bullet.link.path) !== Boolean(bullet.link.fragment)).withContext(`${slug}: one target per link`).toBeTrue();
          if (bullet.link.path) expect(bullet.link.path).toMatch(/^\/[a-z0-9/-]+$/);
        }
      }
      const rowIds = processRowIds(slug);
      for (const round of notes.roundSpotlights ?? []) {
        expect(round.lede.length).withContext(`${slug} ${round.id} lede`).toBeGreaterThan(0);
        expect(round.facts.length).withContext(`${slug} ${round.id} facts`).toBeGreaterThan(0);
        // Catalog-driven pages have no prompt anchors, so a practice link must be a page path.
        if (round.practiceLink) expect(round.practiceLink.path ?? '').withContext(`${slug} ${round.id} practice`).toMatch(/^\/[a-z0-9/-]+$/);
        if (round.processLink) expect(rowIds.has(round.processLink.fragment)).withContext(`${slug} ${round.id} process ${round.processLink.fragment}`).toBeTrue();
      }
      if (notes.faqs) {
        expect(notes.faqs.items.length).withContext(`${slug} faqs`).toBeGreaterThanOrEqual(2);
        expect(notes.faqs.items.length).withContext(`${slug} faqs`).toBeLessThanOrEqual(3);
      }
    });
  }
});
