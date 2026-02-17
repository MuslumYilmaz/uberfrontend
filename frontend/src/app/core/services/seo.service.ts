import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

const CANONICAL_HOST = 'frontendatlas.com';

export type SeoMeta = {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  robots?: string;
  canonical?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  private readonly defaults = {
    siteName: 'FrontendAtlas',
    title: 'High-signal frontend interview preparation platform.',
    description:
      'FrontendAtlas helps you prepare for frontend interviews with structured coding, trivia, system design practice, and practical guides.',
    keywords: [
      'front end interview prep',
      'javascript interview questions',
      'react interview questions',
      'angular interview questions',
      'system design for frontend',
    ],
    image: '/assets/images/frontend-atlas-logo.png',
    robots: 'index,follow',
  };

  /**
   * Manually override meta tags (e.g., detail pages once data is loaded).
   * Missing values fall back to defaults.
   */
  updateTags(payload: SeoMeta = {}): void {
    const description = payload.description || this.defaults.description;
    const keywordsArr = payload.keywords?.length ? payload.keywords : this.defaults.keywords;
    const keywords = keywordsArr.join(', ');
    const hasQueryParams =
      this.hasCurrentQueryParams() || this.hasQueryInValue(payload.canonical);
    const robots = this.resolveRobots(payload.robots, hasQueryParams);
    const image = this.toAbsoluteUrl(payload.image || this.defaults.image);
    const canonical = this.normalizeCanonical(payload.canonical || this.currentUrl());
    const title = payload.title
      ? `${payload.title} | ${this.defaults.siteName}`
      : `${this.defaults.siteName} | ${this.defaults.title}`;
    const ogType = payload.ogType || 'website';

    this.titleSvc.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:site_name', content: this.defaults.siteName });
    this.meta.updateTag({ property: 'og:image', content: image });

    if (canonical) {
      this.meta.updateTag({ property: 'og:url', content: canonical });
      this.setCanonical(canonical);
    }

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setJsonLd(payload.jsonLd);
  }

  buildCanonicalUrl(pathOrUrl: string): string {
    return this.normalizeCanonical(pathOrUrl);
  }

  getSiteUrl(): string {
    return this.siteUrl();
  }

  private setCanonical(url: string): void {
    if (!url || !this.doc?.head) return;
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(extra?: Record<string, any> | Array<Record<string, any>>): void {
    if (!this.doc?.head) return;
    const scriptId = 'seo-jsonld';
    let script = this.doc.head.querySelector<HTMLScriptElement>(`script#${scriptId}`);
    const schema = this.buildJsonLdGraph(extra);

    if (!schema) {
      if (script) script.remove();
      return;
    }

    if (!script) {
      script = this.doc.createElement('script');
      script.setAttribute('id', scriptId);
      script.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
  }

  private buildJsonLdGraph(extra?: Record<string, any> | Array<Record<string, any>>): Record<string, any> | null {
    const siteUrl = this.siteUrl();
    if (!siteUrl) return null;

    const logoUrl = this.toAbsoluteUrl(this.defaults.image);
    const graph: Array<Record<string, any>> = [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: this.defaults.siteName,
        url: siteUrl,
        logo: { '@type': 'ImageObject', url: logoUrl },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: this.defaults.siteName,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ];

    if (extra) {
      if (Array.isArray(extra)) graph.push(...extra);
      else graph.push(extra);
    }

    return { '@context': 'https://schema.org', '@graph': graph };
  }

  private currentUrl(): string {
    try {
      const loc = this.doc?.location;
      if (!loc) return '';
      return this.normalizeCanonical(loc.href);
    } catch {
      return '';
    }
  }

  private siteUrl(): string {
    return this.canonicalBaseUrl();
  }

  private toAbsoluteUrl(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = this.siteUrl();
    if (!base) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${base}${path}`;
  }

  private normalizeCanonical(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const base = this.canonicalBaseUrl();
    const path = this.normalizePath(raw);
    if (!base) return path;
    if (path === '/') return `${base}/`;
    return `${base}${path.replace(/\/$/, '')}`;
  }

  private normalizeBaseUrl(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        return url.origin;
      } catch {
        return raw.replace(/\/$/, '');
      }
    }
    return raw.replace(/\/$/, '');
  }

  private resolveRobots(requested?: string, hasQueryParams = false): string {
    if (this.isNonProductionHost()) return 'noindex,nofollow';
    if (requested) return requested;
    if (hasQueryParams) return 'noindex,follow';
    return this.defaults.robots;
  }

  private isNonProductionHost(): boolean {
    const host = this.getRuntimeHostname();
    if (!host) return false;
    if (host.endsWith('.vercel.app')) return true;
    if (host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`) return false;
    return true;
  }

  private getRuntimeHostname(): string {
    const win = this.doc?.defaultView as (Window & { __FA_SEO_HOST__?: string }) | null;
    const override = win?.__FA_SEO_HOST__;
    if (typeof override === 'string' && override.trim()) {
      return this.normalizeHostname(override);
    }
    return (this.doc?.location?.hostname || '').toLowerCase();
  }

  private normalizeHostname(value: string): string {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw.includes('://')) {
      try {
        return new URL(raw).hostname.toLowerCase();
      } catch {
        return raw.split('/')[0].split(':')[0];
      }
    }
    return raw.split('/')[0].split(':')[0];
  }

  private canonicalBaseUrl(): string {
    if (environment.production) return `https://${CANONICAL_HOST}`;
    const envBase = String(environment.frontendBase || '').trim();
    if (envBase) return this.normalizeBaseUrl(envBase);
    const loc = this.doc?.location;
    if (loc?.origin) return this.normalizeBaseUrl(loc.origin);
    return '';
  }

  private normalizePath(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '/';
    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        return this.normalizePath(url.pathname || '/');
      } catch {
        return '/';
      }
    }
    const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
    const stripped = withSlash.split('?')[0].split('#')[0];
    if (stripped === '/' || stripped === '') return '/';
    return stripped.replace(/\/+$/, '');
  }

  private hasCurrentQueryParams(): boolean {
    const search = this.doc?.location?.search || '';
    return search.startsWith('?') && search.length > 1;
  }

  private hasQueryInValue(value?: string): boolean {
    const raw = String(value || '').trim();
    if (!raw) return false;

    if (/^https?:\/\//i.test(raw)) {
      try {
        return Boolean(new URL(raw).search);
      } catch {
        return raw.includes('?');
      }
    }

    return raw.includes('?');
  }
}
