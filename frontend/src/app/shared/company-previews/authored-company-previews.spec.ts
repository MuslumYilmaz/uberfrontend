import { AUTHORED_COMPANY_PREVIEWS } from './authored-company-previews';
import { AUTHORED_COMPANY_SLUGS } from './authored-company-slugs';

describe('authored company preview registry', () => {
  it('keeps the content-free slug list in sync with the registry keys', () => {
    expect([...AUTHORED_COMPANY_SLUGS].sort()).toEqual(Object.keys(AUTHORED_COMPANY_PREVIEWS).sort());
  });

  it('registers each preview under its own slug and canonical path', () => {
    for (const [slug, preview] of Object.entries(AUTHORED_COMPANY_PREVIEWS)) {
      expect(preview.slug).toBe(slug);
      expect(preview.canonicalPath).toBe(`/companies/${slug}/preview`);
    }
  });
});
