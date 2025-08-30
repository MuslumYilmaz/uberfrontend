import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
    private sub?: Subscription;

    ngOnInit() {
        // React to slug changes on the same component instance
        this.sub = this.route.paramMap
            .pipe(
                map(pm => pm.get('slug') || ''),
                distinctUntilChanged()
            )
            .subscribe(slug => this.load(slug));
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private async load(slug: string) {
        const { current, prev, next } = navFor(PLAYBOOK, slug);
        if (!current) return;

        // Build the left navigator with the correct active state
        const leftNav = {
            title: 'Front End Interview',
            sections: PLAYBOOK_GROUPS.map(g => ({
                title: g.title,
                items: g.items.map(it => {
                    const entry = PLAYBOOK.find(e => e.slug === it.slug)!;
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
        const Cmp = (await current.load()) as Type<GuideArticleInputs>;
        const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);

        ref.instance.prev = prev;
        ref.instance.next = next;
        ref.instance.leftNav = leftNav;

        // Ensure we start at the top for each article
        window.scrollTo({ top: 0 });
    }
}