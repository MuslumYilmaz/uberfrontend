import rehearsalFile from '../../../../../cdn/questions/rehearsals/rehearsals.v1.json';
import type { RehearsalDefinition } from '../../core/models/rehearsal.model';
import { isPremiumRoute } from '../../core/utils/premium-route.util';
import { rehearsalHeading } from '../../features/coding/rehearsal/rehearsal-panel.component';
import { COMPANY_BRANDS } from '../company-branding';
import { COMPANY_INTERVIEW_PROCESSES, type InterviewProcessSource } from './company-interview-processes';
import { COMPANY_PLAN_ROUNDS } from './company-plan-rounds';

// Snippet-only, templated or brief-hosting sites: never evidence for a public process table.
const BANNED_HOSTS = [/(^|\.)glassdoor\./, /(^|\.)1point3acres\.com$/, /(^|\.)prepfully\.com$/, /(^|\.)dataford\.io$/, /(^|\.)github\.com$/];
const ABSOLUTE_WORDS = /\b(always|never|guaranteed|every candidate)\b/i;

function expectReadableSource(source: InterviewProcessSource, checkedMonth: string): void {
  const url = new URL(source.url);
  expect(url.protocol).withContext(source.url).toBe('https:');
  expect(BANNED_HOSTS.some((host) => host.test(url.hostname))).withContext(source.url).toBeFalse();
  expect(source.date).withContext(source.url).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  expect(source.date <= checkedMonth).withContext(`${source.url} dated after the check`).toBeTrue();
  expect(['official', 'report']).toContain(source.kind);
  expect(source.label.trim().length).withContext(source.url).toBeGreaterThan(0);
}

describe('company interview processes', () => {
  const entries = Object.entries(COMPANY_INTERVIEW_PROCESSES);

  it('covers the companies with enough sourced evidence, using known company slugs', () => {
    expect(entries.map(([slug]) => slug).sort()).toEqual([
      'agoda', 'airbnb', 'amazon', 'anduril', 'apple', 'booking-com', 'bytedance', 'capital-one', 'crowdstrike', 'datadog', 'elevenlabs', 'gitlab', 'google', 'intuit', 'jpmorgan',
      'meta', 'microsoft', 'netflix', 'openai', 'revolut', 'servicenow', 'shopee', 'spotify', 'stripe', 'tesla', 'uber',
      'walmart', 'waymo', 'xai', 'zalando',
    ]);
    for (const [slug] of entries) {
      expect(COMPANY_BRANDS[slug]).withContext(slug).toBeDefined();
    }
  });

  it('links every timed rehearsal from the stage of its round in each list, under its heading, and from no other stage', () => {
    const definitions = (rehearsalFile as unknown as { rehearsals: RehearsalDefinition[] }).rehearsals;
    const expected: Record<string, { label: string; path: string }> = {};
    for (const definition of definitions) {
      // "Meta coding round, 2 problems in 40 minutes", and the first free problem, whose page shows a visitor the card.
      const label = rehearsalHeading(definition).replace(`${definition.title}: `, `${definition.title}, `);
      const path = (definition.items.find((item) => !isPremiumRoute(item.path)) ?? definition.items[0]).path;
      for (const variant of COMPANY_PLAN_ROUNDS[definition.company].variants) {
        const round = variant.rounds.find((entry) => entry.id === definition.round);
        if (round) expected[`${definition.company} | ${variant.title} | ${round.stage}`] = { label, path };
      }
    }
    // Every rehearsal sits on a round of its company's plan; a round in two lists is linked in both.
    expect(Object.keys(expected).length).toBeGreaterThanOrEqual(definitions.length);
    const actual: Record<string, { label: string; path: string }> = {};
    for (const [slug, process] of entries) {
      for (const variant of process.variants) {
        for (const stage of variant.stages) {
          if (stage.rehearsal) actual[`${slug} | ${variant.title} | ${stage.stage}`] = { ...stage.rehearsal };
        }
      }
    }
    expect(actual).toEqual(expected);
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
          // A section link opens the company's own guide on the section that answers the round.
          if (stage.practice?.fragment !== undefined) {
            expect(stage.practice.path).withContext(where).toBe(`/companies/${slug}/preview`);
            expect(stage.practice.fragment).withContext(where).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
          }

          for (const source of stage.sources) expectReadableSource(source, checkedMonth);
        }
      }
      // The question list is held to the stage table's source rules.
      for (const question of [...(process.questions ?? []), ...(process.behaviouralQuestions ?? [])]) {
        for (const source of question.sources) expectReadableSource(source, checkedMonth);
      }
    });
  }
});
