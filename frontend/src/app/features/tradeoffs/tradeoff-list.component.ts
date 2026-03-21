import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { TradeoffBattleListItem } from '../../core/models/tradeoff-battle.model';
import { TradeoffBattleListResolved } from '../../core/resolvers/tradeoff-battle.resolver';
import { TradeoffBattleProgressService } from '../../core/services/tradeoff-battle-progress.service';

const PAGE_TITLE = 'Frontend Tradeoff Interview Questions and Architecture Decisions';
const PAGE_DESCRIPTION =
  'Practice frontend tradeoff interview questions like Context vs Zustand vs Redux, SSE vs WebSocket, and CSR vs SSR vs RSC. Learn how to defend decisions clearly instead of sounding dogmatic.';

@Component({
  standalone: true,
  selector: 'app-tradeoff-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tradeoff-list.component.html',
  styleUrls: ['./tradeoff-list.component.css'],
})
export class TradeoffListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly progress = inject(TradeoffBattleProgressService);

  readonly items = signal<TradeoffBattleListItem[]>(
    ((this.route.snapshot.data['tradeoffBattleList'] as TradeoffBattleListResolved | undefined)?.items ?? []),
  );
  readonly searchTerm = signal('');

  readonly filteredItems = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) return this.items();

    return this.items().filter((item) => {
      const haystack = [item.title, item.summary, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(search);
    });
  });

  readonly completedCount = computed(() =>
    this.items().filter((item) => this.progress.getRecord(item.id).completed).length,
  );

  constructor() {
    this.publishSeo();
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  statusLabel(id: string): string {
    const record = this.progress.getRecord(id);
    if (record.completed) return 'Completed';
    if (record.started) return 'In progress';
    return 'Not started';
  }

  trackById(_: number, item: TradeoffBattleListItem): string {
    return item.id;
  }

  private publishSeo(): void {
    const canonicalPath = '/tradeoffs';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const itemListElement = this.items().map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: this.seo.buildCanonicalUrl(`/tradeoffs/${item.id}`),
    }));

    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Frontend architecture tradeoff questions' },
        { '@type': 'Thing', name: 'React state management interview questions' },
        { '@type': 'Thing', name: 'Frontend system design tradeoffs' },
      ],
    };

    if (itemListElement.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement,
      };
    }

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tradeoff Battles',
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb],
    });
  }
}
