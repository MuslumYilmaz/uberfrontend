import { CommonModule } from '@angular/common';
import { Component, OnDestroy, Type, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { BEHAVIORAL, BEHAVIORAL_GROUPS, GuideEntry } from '../../../shared/guides/guide.registry';

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
    imports: [CommonModule],
    template: `
    <div style="max-width:860px;margin:20px 0;padding:16px;border:1px solid rgba(255,255,255,.14);
                border-radius:12px;background:linear-gradient(180deg,#141414,#101010)">
      <h3 style="margin:0 0 8px;font-weight:800">Article not available</h3>
      <div style="opacity:.85">
        We couldn’t load this Behavioral guide. Check the registry entry (path & export) or try again.
      </div>
    </div>
  `
})
export class BehavioralMissingArticleComponent { }

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `<ng-container #vc></ng-container>`
})
export class BehavioralHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private sub?: Subscription;

    ngOnInit() {
        this.sub = this.route.paramMap
            .pipe(map(p => p.get('slug') || ''), distinctUntilChanged())
            .subscribe(slug => this.load(slug));
    }
    ngOnDestroy() { this.sub?.unsubscribe(); }

    private toTitle(slug: string) {
        return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    }

    private async load(slug: string) {
        const idx = BEHAVIORAL.findIndex(e => e.slug === slug);
        const current: GuideEntry | undefined = idx >= 0 ? BEHAVIORAL[idx] : undefined;

        const registryMap = new Map(BEHAVIORAL.map(e => [e.slug, e]));
        const leftNav = {
            title: 'Behavioral Interviews',
            sections: BEHAVIORAL_GROUPS.map(g => ({
                title: g.title,
                items: g.items
                    .filter(it => registryMap.has(it.slug))   // hides not-yet-implemented pages
                    .map(it => {
                        const entry = registryMap.get(it.slug);
                        return {
                            title: entry?.title ?? this.toTitle(it.slug),
                            link: ['/', 'guides', 'behavioral', it.slug],
                            active: it.slug === slug
                        };
                    })
            }))
        };

        if (!current) {
            this.vc.clear();
            this.vc.createComponent(BehavioralMissingArticleComponent);
            window.scrollTo({ top: 0 });
            return;
        }

        const prev = idx > 0 ? ['/', 'guides', 'behavioral', BEHAVIORAL[idx - 1].slug] : null;
        const next = idx < BEHAVIORAL.length - 1 ? ['/', 'guides', 'behavioral', BEHAVIORAL[idx + 1].slug] : null;

        this.vc.clear();
        try {
            const Cmp = (await current.load()) as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = prev;
            ref.instance.next = next;
            ref.instance.leftNav = leftNav;
        } catch {
            this.vc.createComponent(BehavioralMissingArticleComponent);
        }

        window.scrollTo({ top: 0 });
    }
}
