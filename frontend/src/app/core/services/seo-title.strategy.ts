import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { robotsForContentAccess } from '../utils/content-access-policy.util';
import { TRADEOFF_DETAIL_FALLBACK_SEO } from '../utils/tradeoff-seo.util';
import { SeoMeta, SeoService } from './seo.service';

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  constructor(private readonly seo: SeoService) {
    super();
  }

  updateTitle(snapshot: RouterStateSnapshot): void {
    let current = snapshot.root;
    while (current.firstChild) current = current.firstChild;
    const tradeoffDetail = current.data?.['tradeoffBattleDetail'] as { seo?: SeoMeta } | undefined;
    if (tradeoffDetail) {
      const canonical = this.canonicalFromSnapshot(snapshot);
      const meta = this.withCanonical(tradeoffDetail.seo ?? TRADEOFF_DETAIL_FALLBACK_SEO, canonical);
      this.seo.updateTags(snapshot.root.queryParamMap.keys.length > 0
        ? { ...meta, robots: 'noindex,follow' }
        : meta);
      return;
    }
    const question = current.data?.['questionDetail']?.question
      ?? current.data?.['systemDesignDetail']?.question;
    // Resolved question components own their title and complete structured metadata.
    // Only robots needs a router refresh when a query-only navigation reuses data.
    if (question) {
      this.seo.updateRobots(robotsForContentAccess(question.access), snapshot.root.queryParamMap.keys.length > 0);
      return;
    }
    const meta = this.extractSeo(snapshot);
    this.seo.updateTags(meta);
  }

  private extractSeo(snapshot: RouterStateSnapshot): SeoMeta {
    let current = snapshot.root;
    while (current.firstChild) current = current.firstChild;
    const data = current.data || {};
    const canonical = this.canonicalFromSnapshot(snapshot);

    if (data['seo']) return this.withCanonical(data['seo'] as SeoMeta, canonical);

    const built = this.buildTitle(snapshot);
    if (built) return canonical ? { title: built, canonical } : { title: built };

    return canonical ? { canonical } : {};
  }

  private canonicalFromSnapshot(snapshot: RouterStateSnapshot): string | null {
    const url = (snapshot.url || '').trim();
    if (!url) return '/';
    return url.startsWith('/') ? url : `/${url}`;
  }

  private withCanonical(meta: SeoMeta, canonical: string | null): SeoMeta {
    if (!canonical || meta.canonical) return meta;
    return { ...meta, canonical };
  }
}
