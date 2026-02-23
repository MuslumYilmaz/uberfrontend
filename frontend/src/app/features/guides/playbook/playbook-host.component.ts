import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, PLATFORM_ID, Type, ViewChild, ViewContainerRef, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";
import { navFor, PLAYBOOK, PLAYBOOK_GROUPS } from '../../../shared/guides/guide.registry';
import { SeoService } from '../../../core/services/seo.service';
import { buildGuideDetailSeo } from '../guide-seo.util';
import { GuideDetailResolved } from '../../../core/resolvers/guide-detail.resolver';

// Inputs that every article supports
type GuideArticleInputs = {
    prev?: any[] | null;
    next?: any[] | null;
    leftNav?: {
        title?: string;
        sections: Array<{ title: string; items: Array<{ title: string; link: any[]; active?: boolean }> }>;
    };
};

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, OfflineBannerComponent],
    styles: [`
      .guide-ssr-shell {
        padding: 20px 16px 8px;
      }
      .guide-ssr-shell__title {
        margin: 0;
        font-size: clamp(1.7rem, 3vw, 2.1rem);
        font-weight: 800;
        line-height: 1.2;
        color: var(--uf-text-primary);
      }
    `],
    template: `
    <section class="guide-ssr-shell" *ngIf="showShellHeading()">
      <h1 class="guide-ssr-shell__title">{{ shellHeading() }}</h1>
    </section>
    <ng-container #vc></ng-container>
    <app-offline-banner></app-offline-banner>
`
})
export class PlaybookHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private seo = inject(SeoService);
    private sub?: Subscription;
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    protected readonly showShellHeading = signal(true);
    protected readonly shellHeading = signal('');

    ngOnInit() {
        this.sub = this.route.data
            .pipe(
                startWith(this.route.snapshot.data),
                map((data) => (data['guideDetail'] as GuideDetailResolved | null) ?? null),
                distinctUntilChanged((a, b) => a?.slug === b?.slug),
            )
            .subscribe((resolved) => {
                this.load(resolved);
            });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private toTitle(slug: string): string {
        return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }

    private toGuideLink(base: string, slug: string): any[] {
        if (base === 'interview-blueprint' && String(slug).endsWith('-prep-path')) {
            return ['/', 'guides', 'framework-prep', slug];
        }
        return ['/', 'guides', base, slug];
    }

    private remapPrevNextLink(link: any[] | null, base: string): any[] | null {
        if (!Array.isArray(link)) return link;
        if (base !== 'interview-blueprint') return link;

        const slug = String(link[link.length - 1] ?? '');
        if (!slug.endsWith('-prep-path')) return link;

        return ['/', 'guides', 'framework-prep', slug];
    }

    private load(resolved: GuideDetailResolved | null) {
        const snapshotSlug = this.route.snapshot.paramMap.get('slug') || '';
        const slug = resolved?.slug || snapshotSlug;
        this.showShellHeading.set(true);
        this.shellHeading.set(this.toTitle(slug));

        const hostConfig = this.getHostConfig();
        const groups = hostConfig.frameworkOnly
            ? PLAYBOOK_GROUPS.filter((g) => g.key === 'framework-paths')
            : PLAYBOOK_GROUPS;
        const allowedSlugs = new Set(groups.flatMap((group) => group.items.map((item) => item.slug)));
        const registry = hostConfig.frameworkOnly
            ? PLAYBOOK.filter((entry) => allowedSlugs.has(entry.slug))
            : PLAYBOOK;

        const { current, prev, next } = navFor(registry, slug, hostConfig.guideBase);
        const mappedPrev = this.remapPrevNextLink(prev, hostConfig.guideBase);
        const mappedNext = this.remapPrevNextLink(next, hostConfig.guideBase);

        // If the slug isn't in the registry -> go to 404 and show the missing path
        if (!resolved || !current) {
            this.go404();
            return;
        }
        this.shellHeading.set(current.title || this.toTitle(slug));

        // Build the left navigator safely (hide unknown slugs to avoid dead links)
        const registryMap = new Map(registry.map(e => [e.slug, e]));
        const leftNavSections = groups.map(g => ({
            title: g.title,
            items: g.items
                .filter(it => registryMap.has(it.slug))
                .map(it => {
                    const entry = registryMap.get(it.slug)!;
                    return {
                        title: entry.title,
                        link: this.toGuideLink(hostConfig.guideBase, entry.slug),
                        active: entry.slug === slug,
                    };
                })
        }));
        const leftNav = {
            title: hostConfig.guideTitle,
            sections: leftNavSections,
        };

        this.seo.updateTags(
            buildGuideDetailSeo(this.seo, hostConfig.seoSectionTitle, hostConfig.guideBase, current)
        );

        // Recreate the article component for the new slug
        this.vc.clear();
        try {
            const Cmp = resolved.component as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = mappedPrev;
            ref.instance.next = mappedNext;
            ref.instance.leftNav = leftNav;
            this.showShellHeading.set(false);
        } catch {
            // If the module fails to load (bad path/export), treat as not found
            this.go404();
            return;
        }

        // Ensure we start at the top for each article
        if (this.isBrowser) window.scrollTo({ top: 0 });
    }

    private getHostConfig(): {
        guideBase: string;
        guideTitle: string;
        seoSectionTitle: string;
        frameworkOnly: boolean;
    } {
        const data = this.route.snapshot.data as Record<string, unknown>;
        return {
            guideBase: typeof data['guideBase'] === 'string' ? data['guideBase'] : 'interview-blueprint',
            guideTitle:
                typeof data['guideTitle'] === 'string'
                    ? data['guideTitle']
                    : 'FrontendAtlas Interview Blueprint',
            seoSectionTitle:
                typeof data['seoSectionTitle'] === 'string'
                    ? data['seoSectionTitle']
                    : 'Interview Blueprint',
            frameworkOnly: data['frameworkOnly'] === true,
        };
    }

    private go404() {
        const missing = this.router.url; // e.g. /guides/interview-blueprint/asd
        if (this.isBrowser) {
            try { sessionStorage.setItem('fa:lastMissing', missing); } catch { }
        }
        this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
    }
}
