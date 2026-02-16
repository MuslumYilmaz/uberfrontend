import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, PLATFORM_ID, Type, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { GuideEntry, SYSTEM, SYSTEM_GROUPS } from '../../../shared/guides/guide.registry';
import { OfflineBannerComponent } from "../../../shared/components/offline-banner/offline-banner";
import { SeoService } from '../../../core/services/seo.service';
import { buildGuideDetailSeo } from '../guide-seo.util';

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
        <app-offline-banner></app-offline-banner>`
})
export class SystemDesignHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private seo = inject(SeoService);
    private sub?: Subscription;
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    protected readonly showShellHeading = signal(true);
    protected readonly shellHeading = signal('');

    ngOnInit() {
        this.sub = this.route.paramMap
            .pipe(
                startWith(this.route.snapshot.paramMap),
                map(p => p.get('slug') || ''),
                distinctUntilChanged(),
            )
            .subscribe(slug => {
                void this.load(slug);
            });
    }

    ngOnDestroy() { this.sub?.unsubscribe(); }

    private toTitle(slug: string): string {
        return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    }

    private async load(slug: string) {
        this.showShellHeading.set(true);
        this.shellHeading.set(this.toTitle(slug));

        const idx = SYSTEM.findIndex(e => e.slug === slug);
        const current: GuideEntry | undefined = idx >= 0 ? SYSTEM[idx] : undefined;

        // Left nav (filter to known slugs)
        const registryMap = new Map(SYSTEM.map(e => [e.slug, e]));
        const leftNav = {
            title: 'Frontend System Design Blueprint',
            sections: SYSTEM_GROUPS.map(g => ({
                title: g.title,
                items: g.items
                    .filter(it => registryMap.has(it.slug))
                    .map(it => {
                        const entry = registryMap.get(it.slug)!;
                        return {
                            title: entry?.title ?? this.toTitle(it.slug),
                            link: ['/', 'guides', 'system-design-blueprint', it.slug],
                            active: it.slug === slug
                        };
                    })
            }))
        };

        if (!current) { this.go404(); return; }
        this.shellHeading.set(current.title || this.toTitle(slug));

        const prev = idx > 0 ? ['/', 'guides', 'system-design-blueprint', SYSTEM[idx - 1].slug] : null;
        const next = idx < SYSTEM.length - 1 ? ['/', 'guides', 'system-design-blueprint', SYSTEM[idx + 1].slug] : null;

        this.seo.updateTags(
            buildGuideDetailSeo(this.seo, 'System Design Blueprint', 'system-design-blueprint', current)
        );

        this.vc.clear();
        try {
            const Cmp = (await current.load()) as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = prev;
            ref.instance.next = next;
            ref.instance.leftNav = leftNav;
            this.showShellHeading.set(false);
        } catch {
            this.go404();
            return;
        }

        if (this.isBrowser) window.scrollTo({ top: 0 });
    }

    private go404() {
        const missing = this.router.url; // e.g. /guides/system-design-blueprint/wrong
        if (this.isBrowser) {
            try { sessionStorage.setItem('fa:lastMissing', missing); } catch { }
        }
        this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
    }
}
