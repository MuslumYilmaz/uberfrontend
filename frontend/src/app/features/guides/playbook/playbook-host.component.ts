import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { navFor, PLAYBOOK, PLAYBOOK_GROUPS } from '../../../shared/guides/guide.registry';

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
    imports: [CommonModule, RouterModule],
    template: `<ng-container #vc></ng-container>`
})
export class PlaybookHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private sub?: Subscription;

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
        const { current, prev, next } = navFor(PLAYBOOK, slug);

        // If the slug isn't in the registry -> go to 404 and show the missing path
        if (!current) {
            this.go404();
            return;
        }

        // Build the left navigator safely (hide unknown slugs to avoid dead links)
        const registryMap = new Map(PLAYBOOK.map(e => [e.slug, e]));
        const leftNav = {
            title: 'Front End Interview',
            sections: PLAYBOOK_GROUPS.map(g => ({
                title: g.title,
                items: g.items
                    .filter(it => registryMap.has(it.slug))
                    .map(it => {
                        const entry = registryMap.get(it.slug)!;
                        return {
                            title: entry.title,
                            link: ['/', 'guides', 'playbook', entry.slug],
                            active: entry.slug === slug,
                        };
                    })
            }))
        };

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
        window.scrollTo({ top: 0 });
    }

    private go404() {
        const missing = this.router.url; // e.g. /guides/playbook/asd
        try { sessionStorage.setItem('uf:lastMissing', missing); } catch { }
        this.router.navigateByUrl('/404', { state: { missing }, replaceUrl: true });
    }
}
