import {
  COMPANY_PRACTICE_DISCLAIMER,
  PUBLIC_EDITORIAL_FACTS,
  PUBLIC_EDITORIAL_WORKFLOW_DESCRIPTION,
  publicEditorialAuthorSchema,
} from './public-editorial-facts';

describe('public editorial facts', () => {
  it('exposes one neutral organization attribution and the actual review workflow', () => {
    expect(PUBLIC_EDITORIAL_FACTS).toEqual({
      author: {
        name: 'FrontendAtlas Editorial',
        schemaType: 'Organization',
      },
      descriptor: 'Built and maintained as an independent frontend interview-prep project',
      workflow: [
        'Runnable examples',
        'Regression tests',
        'Official-source checks where relevant',
        'Correction reports',
        'Dated updates',
      ],
    });
    expect(publicEditorialAuthorSchema()).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Editorial',
    });
    expect(PUBLIC_EDITORIAL_WORKFLOW_DESCRIPTION).toBe(
      'Content checks use runnable examples, regression tests, official-source checks where relevant, correction reports, and dated updates.',
    );
    expect(COMPANY_PRACTICE_DISCLAIMER).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
  });
});
