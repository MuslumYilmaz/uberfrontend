import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SeoMeta, SeoService } from './seo.service';

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  constructor(private readonly seo: SeoService) {
    super();
  }

  updateTitle(snapshot: RouterStateSnapshot): void {
    const meta = this.extractSeo(snapshot);
    this.seo.updateTags(meta);
  }

  private extractSeo(snapshot: RouterStateSnapshot): SeoMeta {
    let current = snapshot.root;
    while (current.firstChild) current = current.firstChild;
    const data = current.data || {};

    if (data['seo']) return data['seo'] as SeoMeta;

    const built = this.buildTitle(snapshot);
    if (built) return { title: built };

    return {};
  }
}
