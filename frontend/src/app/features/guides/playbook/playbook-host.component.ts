import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, PLATFORM_ID, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";
import { navFor, PLAYBOOK, PLAYBOOK_GROUPS } from '../../../shared/guides/guide.registry';
import { SeoService } from '../../../core/services/seo.service';
import { buildGuideDetailSeo } from '../guide-seo.util';

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
    template: `
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

    ngOnInit() {
        // React to slug changes on the same component instance
        this.sub = this.route.paramMap
            .pipe(map(pm => pm.get('slug') || ''), distinctUntilChanged())
            .subscribe(slug => this.load(slug));
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private async load(slug: string) {
        const hostConfig = this.getHostConfig();
        const groups = hostConfig.frameworkOnly
            ? PLAYBOOK_GROUPS.filter((g) => g.key === 'framework-paths')
            : PLAYBOOK_GROUPS;
        const allowedSlugs = new Set(groups.flatMap((group) => group.items.map((item) => item.slug)));
        const registry = hostConfig.frameworkOnly
            ? PLAYBOOK.filter((entry) => allowedSlugs.has(entry.slug))
            : PLAYBOOK;

        const { current, prev, next } = navFor(registry, slug, hostConfig.guideBase);

        // If the slug isn't in the registry -> go to 404 and show the missing path
        if (!current) {
            this.go404();
            return;
        }

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
                        link: ['/', 'guides', hostConfig.guideBase, entry.slug],
                        active: entry.slug === slug,
                    };
                })
        }));
        const normalizedSections = hostConfig.frameworkOnly
            ? leftNavSections
                .map((section) => ({
                    title: section.title,
                    items: section.items.filter((item) => item.active),
                }))
                .filter((section) => section.items.length > 0)
            : leftNavSections;

        const leftNav = {
            title: hostConfig.guideTitle,
            sections: normalizedSections,
        };

        this.seo.updateTags(
            buildGuideDetailSeo(this.seo, hostConfig.seoSectionTitle, hostConfig.guideBase, current)
        );

        // Recreate the article component for the new slug
        this.vc.clear();
        try {
            const Cmp = (await current.load()) as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = prev;
            ref.instance.next = next;
            ref.instance.leftNav = leftNav;
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
