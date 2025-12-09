import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export type SeoMeta = {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  robots?: string;
  canonical?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  private readonly defaults = {
    siteName: 'FrontendAtlas',
    title: 'High-signal frontend interview preparation platform.',
    description:
      'FrontendAtlas — High-signal frontend interview preparation platform. Practice front-end coding, trivia, and system design interview questions with curated guides and company tracks.',
    keywords: [
      'front end interview prep',
      'javascript interview questions',
      'react interview questions',
      'angular interview questions',
      'system design for frontend',
    ],
    image: '/favicon.ico',
    robots: 'index,follow',
  };

  /** Wire router events to SEO updates. Call once from the root component. */
  init(rootRoute: ActivatedRoute): void {
    this.applyRouteMeta(rootRoute);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applyRouteMeta(rootRoute));
  }

  /**
   * Manually override meta tags (e.g., detail pages once data is loaded).
   * Missing values fall back to defaults.
   */
  updateTags(payload: SeoMeta = {}): void {
    const description = payload.description || this.defaults.description;
    const keywordsArr = payload.keywords?.length ? payload.keywords : this.defaults.keywords;
    const keywords = keywordsArr.join(', ');
    const robots = payload.robots || this.defaults.robots;
    const image = payload.image || this.defaults.image;
    const canonical = payload.canonical || this.currentUrl();
    const title = payload.title
      ? `${payload.title} | ${this.defaults.siteName}`
      : `${this.defaults.siteName} | ${this.defaults.title}`;

    this.titleSvc.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
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
  }

  private applyRouteMeta(rootRoute: ActivatedRoute): void {
    const leaf = this.findDeepest(rootRoute);
    const data = (leaf?.snapshot?.data?.['seo'] as SeoMeta | undefined) ?? {};
    this.updateTags(data);
  }

  private findDeepest(route: ActivatedRoute): ActivatedRoute {
    let current: ActivatedRoute = route;
    while (current.firstChild) current = current.firstChild;
    return current;
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

  private currentUrl(): string {
    try {
      const path = (this.router?.url || '').split('#')[0];
      const loc = this.doc?.location;
      if (loc?.origin) return `${loc.origin}${path}`;
      return path;
    } catch {
      return '';
    }
  }
}
