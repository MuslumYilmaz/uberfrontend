import { AUTHORED_COMPANY_PREVIEWS } from './authored-company-previews';
import { AUTHORED_COMPANY_SLUGS } from './authored-company-slugs';
import { COMPANY_INTERVIEW_PROCESSES } from './company-interview-processes';

/** Mirrors CompanyInterviewProcessComponent.stageId so a spotlight can only link to a row that renders. */
function processRowIds(slug: string): Set<string> {
  const process = COMPANY_INTERVIEW_PROCESSES[slug];
  const ids = new Set<string>();
  process?.variants.forEach((variant, index) => {
    for (const stage of variant.stages) {
      const name = stage.stage.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      ids.add(`${slug}-interview-process-${index + 1}-stage-${name}`);
    }
  });
  return ids;
}

describe('authored company preview registry', () => {
  it('keeps the content-free slug list in sync with the registry keys', () => {
    expect([...AUTHORED_COMPANY_SLUGS].sort()).toEqual(Object.keys(AUTHORED_COMPANY_PREVIEWS).sort());
  });

  it('keeps round spotlights consistent with their page: unique ids, a practice prompt on the page, a row in the reported process', () => {
    for (const [slug, preview] of Object.entries(AUTHORED_COMPANY_PREVIEWS)) {
      const spotlights = preview.roundSpotlights ?? [];
      const ids = spotlights.map((round) => round.id);
      expect(new Set(ids).size).withContext(slug).toBe(ids.length);
      const promptIds = new Set(preview.prompts.items.map((prompt) => prompt.id));
      const rowIds = processRowIds(slug);
      for (const round of spotlights) {
        expect(round.lede.length).withContext(`${slug} ${round.id} lede`).toBeGreaterThan(0);
        expect(round.facts.length).withContext(`${slug} ${round.id} facts`).toBeGreaterThan(0);
        if (round.practiceLink) expect(promptIds.has(round.practiceLink.fragment)).withContext(`${slug} ${round.id} practice ${round.practiceLink.fragment}`).toBeTrue();
        if (round.processLink) expect(rowIds.has(round.processLink.fragment)).withContext(`${slug} ${round.id} process ${round.processLink.fragment}`).toBeTrue();
      }
    }
  });

  it('registers each preview under its own slug and canonical path', () => {
    for (const [slug, preview] of Object.entries(AUTHORED_COMPANY_PREVIEWS)) {
      expect(preview.slug).toBe(slug);
      expect(preview.canonicalPath).toBe(`/companies/${slug}/preview`);
    }
  });
});
