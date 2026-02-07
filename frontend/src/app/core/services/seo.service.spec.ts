import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let meta: Meta;
  let title: Title;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTestingModule, RouterTestingModule],
    });

    service = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    const win = doc.defaultView as (Window & { __FA_SEO_HOST__?: string }) | null;
    if (win && '__FA_SEO_HOST__' in win) {
      delete win.__FA_SEO_HOST__;
    }
  });

  it('sets title, description, canonical, and json-ld', () => {
    service.updateTags({
      title: 'SEO Test',
      description: 'SEO description',
      canonical: '/pricing?ref=ad#top',
      jsonLd: { '@type': 'WebPage', name: 'SEO Test' },
    });

    expect(title.getTitle()).toContain('SEO Test');
    const desc = meta.getTag('name="description"');
    expect(desc?.content).toBe('SEO description');

    const canonical = doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    expect(canonical).toContain('/pricing');
    expect(canonical).not.toContain('?ref=');
    expect(canonical).not.toContain('#top');

    const script = doc.head.querySelector('script#seo-jsonld');
    expect(script?.textContent || '').toContain('"@type":"WebPage"');
  });

  it('forces noindex on non-production hosts', () => {
    const win = doc.defaultView as (Window & { __FA_SEO_HOST__?: string }) | null;
    if (win) win.__FA_SEO_HOST__ = 'preview.frontendatlas.vercel.app';

    service.updateTags({ title: 'SEO Test' });
    const robots = meta.getTag('name="robots"');
    expect(robots?.content).toBe('noindex,nofollow');
  });

  it('does not emit SearchAction in default WebSite json-ld', () => {
    service.updateTags({ title: 'SEO Test' });
    const script = doc.head.querySelector('script#seo-jsonld');
    const parsed = JSON.parse(script?.textContent || '{}');
    const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [];
    const website = graph.find((node: any) => node?.['@type'] === 'WebSite');
    expect(website).toBeTruthy();
    expect(website?.potentialAction).toBeUndefined();
  });
});
