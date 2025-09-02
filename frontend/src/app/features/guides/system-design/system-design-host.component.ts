import { CommonModule } from '@angular/common';
import { Component, OnDestroy, Type, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { GuideEntry, SYSTEM, SYSTEM_GROUPS } from '../../../shared/guides/guide.registry';

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
    imports: [CommonModule, RouterModule],
    template: `<ng-container #vc></ng-container>`
})
export class SystemDesignHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private sub?: Subscription;

    ngOnInit() {
        this.sub = this.route.paramMap
            .pipe(map(p => p.get('slug') || ''), distinctUntilChanged())
            .subscribe(slug => this.load(slug));
    }

    ngOnDestroy() { this.sub?.unsubscribe(); }

    private toTitle(slug: string): string {
        return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    }

    private async load(slug: string) {
        const idx = SYSTEM.findIndex(e => e.slug === slug);
        const current: GuideEntry | undefined = idx >= 0 ? SYSTEM[idx] : undefined;

        // Left nav (filter to known slugs)
        const registryMap = new Map(SYSTEM.map(e => [e.slug, e]));
        const leftNav = {
            title: 'Front End System Design',
            sections: SYSTEM_GROUPS.map(g => ({
                title: g.title,
                items: g.items
                    .filter(it => registryMap.has(it.slug))
                    .map(it => {
                        const entry = registryMap.get(it.slug)!;
                        return {
                            title: entry?.title ?? this.toTitle(it.slug),
                            link: ['/', 'guides', 'system-design', it.slug],
                            active: it.slug === slug
                        };
                    })
            }))
        };

        if (!current) { this.go404(); return; }

        const prev = idx > 0 ? ['/', 'guides', 'system-design', SYSTEM[idx - 1].slug] : null;
        const next = idx < SYSTEM.length - 1 ? ['/', 'guides', 'system-design', SYSTEM[idx + 1].slug] : null;

        this.vc.clear();
        try {
            const Cmp = (await current.load()) as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = prev;
            ref.instance.next = next;
            ref.instance.leftNav = leftNav;
        } catch {
            this.go404();
            return;
        }

        window.scrollTo({ top: 0 });
    }

    private go404() {
        const missing = this.router.url; // e.g. /guides/system-design/wrong
        try { sessionStorage.setItem('uf:lastMissing', missing); } catch { }
        this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
    }
}
