import { SEO_CONTENT_DATES } from '../../generated/seo-content-dates';
import { seoContentDateModified } from './seo-content-date.util';

describe('seoContentDateModified', () => {
  const dates = { '/guides/interview-blueprint/intro': '2026-06-18', '/': '2026-06-01' };

  it('shares one UTC date across canonical URL, path and URL variants', () => {
    for (const value of [
      '/guides/interview-blueprint/intro',
      'https://frontendatlas.com/guides/interview-blueprint/intro',
      '/guides/interview-blueprint/intro/?src=home#overview',
    ]) {
      expect(seoContentDateModified(value, dates)).toBe('2026-06-18T00:00:00.000Z');
    }
    expect(seoContentDateModified('https://frontendatlas.com/', dates)).toBe('2026-06-01T00:00:00.000Z');
  });

  it('leaves pending, absent and foreign routes without a modification claim', () => {
    expect(seoContentDateModified('/unresolved', dates)).toBeUndefined();
    expect(seoContentDateModified('https://other.example/guides/interview-blueprint/intro', dates)).toBeUndefined();
    expect(seoContentDateModified('http://[', dates)).toBeUndefined();
    expect(seoContentDateModified('/inherited', Object.create({ '/inherited': '2026-06-18' }))).toBeUndefined();
  });

  it('rejects invalid dates instead of rolling them forward or accepting build timestamps', () => {
    for (const day of ['2026-02-30', '2026-13-01', '2026-06-18T15:30:00Z', 'pending', '']) {
      expect(seoContentDateModified('/page', { '/page': day })).toBeUndefined();
    }
    expect(seoContentDateModified('/page', { '/page': '2024-02-29' })).toBe('2024-02-29T00:00:00.000Z');
  });

  it('defaults to the generated sitemap date map', () => {
    for (const [route, day] of Object.entries(SEO_CONTENT_DATES)) {
      expect(seoContentDateModified(route)).withContext(route).toBe(`${day}T00:00:00.000Z`);
    }
    expect(seoContentDateModified('/not-in-the-content-inventory')).toBeUndefined();
  });
});
