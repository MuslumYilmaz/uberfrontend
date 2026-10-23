import { COMPANY_BRANDS } from '../company-branding';
import { COMPANY_INTERVIEW_PROCESSES } from './company-interview-processes';

// Snippet-only, templated or brief-hosting sites: never evidence for a public process table.
const BANNED_HOSTS = [/(^|\.)glassdoor\./, /(^|\.)1point3acres\.com$/, /(^|\.)prepfully\.com$/, /(^|\.)dataford\.io$/, /(^|\.)github\.com$/];
const ABSOLUTE_WORDS = /\b(always|never|guaranteed|every candidate)\b/i;

describe('company interview processes', () => {
  const entries = Object.entries(COMPANY_INTERVIEW_PROCESSES);

  it('covers the companies with enough sourced evidence, using known company slugs', () => {
    expect(entries.map(([slug]) => slug).sort()).toEqual([
      'agoda', 'amazon', 'anduril', 'apple', 'booking-com', 'bytedance', 'capital-one', 'datadog', 'elevenlabs', 'gitlab', 'google', 'intuit', 'jpmorgan',
      'meta', 'microsoft', 'netflix', 'openai', 'revolut', 'servicenow', 'shopee', 'spotify', 'stripe', 'tesla', 'uber',
      'walmart', 'waymo', 'xai', 'zalando',
    ]);
    for (const [slug] of entries) {
      expect(COMPANY_BRANDS[slug]).withContext(slug).toBeDefined();
    }
  });

  for (const [slug, process] of entries) {
    it(`${slug}: every stage cites dated, readable sources and avoids absolute claims`, () => {
      expect(process.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const checkedMonth = process.checkedAt.slice(0, 7);
      expect(process.summary.trim().length).toBeGreaterThan(0);
      expect(process.caveat.trim().length).toBeGreaterThan(0);
      expect(process.summary).not.toMatch(ABSOLUTE_WORDS);
      expect(process.variants.length).toBeGreaterThan(0);

      for (const variant of process.variants) {
        expect(variant.stages.length).withContext(variant.title).toBeGreaterThan(1);
        for (const stage of variant.stages) {
          const where = `${slug} / ${variant.title} / ${stage.stage}`;
          expect(stage.format.trim().length).withContext(where).toBeGreaterThan(0);
          expect(stage.appliesTo.trim().length).withContext(where).toBeGreaterThan(0);
          expect(`${stage.format} ${stage.appliesTo}`).withContext(where).not.toMatch(ABSOLUTE_WORDS);
          expect(stage.sources.length).withContext(where).toBeGreaterThan(0);
          if (stage.practice) expect(stage.practice.path).withContext(where).toMatch(/^\/[a-z0-9/-]+$/);

          for (const source of stage.sources) {
            const url = new URL(source.url);
            expect(url.protocol).withContext(source.url).toBe('https:');
            expect(BANNED_HOSTS.some((host) => host.test(url.hostname))).withContext(source.url).toBeFalse();
            expect(source.date).withContext(source.url).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
            expect(source.date <= checkedMonth).withContext(`${source.url} dated after the check`).toBeTrue();
            expect(['official', 'report']).toContain(source.kind);
            expect(source.label.trim().length).withContext(source.url).toBeGreaterThan(0);
          }
        }
      }
    });
  }
});
