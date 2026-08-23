import { isMarketingPath, normalizePathname } from './marketing-route.util';

describe('marketing route utilities', () => {
  it('normalizes trailing slashes without changing the root route', () => {
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('/showcase/')).toBe('/showcase');
    expect(normalizePathname('/showcase///?source=test#hero')).toBe('/showcase');
  });

  it('keeps trailing-slash variants on the same marketing shell', () => {
    expect(isMarketingPath('/')).toBeTrue();
    expect(isMarketingPath('/showcase/')).toBeTrue();
    expect(isMarketingPath('/coding/')).toBeFalse();
  });
});
