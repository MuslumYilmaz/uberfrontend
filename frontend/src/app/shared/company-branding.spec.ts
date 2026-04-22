import { COMPANY_BRANDS, companyBrandFor, companySignalFor, normalizeCompanySlug } from './company-branding';

describe('company branding helpers', () => {
  it('normalizes company slugs case-insensitively', () => {
    expect(normalizeCompanySlug(' Google ')).toBe('google');
    expect(normalizeCompanySlug('Open AI')).toBe('openai');
    expect(normalizeCompanySlug('Byte Dance')).toBe('bytedance');
  });

  it('falls back to a monogram for unknown companies', () => {
    const brand = companyBrandFor('unknown-company');

    expect(brand).toEqual({
      slug: 'unknown-company',
      label: 'Unknown Company',
      monogram: 'U',
    });
  });

  it('prioritizes the current company route in a multi-company signal', () => {
    const signal = companySignalFor(['amazon', 'google', 'meta'], 'google');

    expect(signal?.primary.slug).toBe('google');
    expect(signal?.overflowCount).toBe(2);
    expect(signal?.ariaLabel).toBe('Company prep signal: Google and 2 more');
  });

  it('has registry entries for all currently tagged companies', () => {
    const currentCompanySlugs = [
      'airbnb',
      'amazon',
      'apple',
      'bytedance',
      'google',
      'meta',
      'microsoft',
      'netflix',
      'openai',
      'stripe',
      'uber',
    ];

    expect(currentCompanySlugs.every((slug) => !!COMPANY_BRANDS[slug])).toBeTrue();
  });
});

