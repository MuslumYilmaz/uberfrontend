import { CommonModule } from '@angular/common';
import {
    Component, OnDestroy, Type, ViewChild, ViewContainerRef, inject
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { GuideEntry, SYSTEM, SYSTEM_GROUPS } from '../../../shared/guides/guide.registry';

/** Inputs the article components accept (the shell reads these) */
type GuideArticleInputs = {
    prev?: any[] | null;
    next?: any[] | null;
    leftNav?: {
        title?: string;
        sections: Array<{ title: string; items: Array<{ title: string; link: any[]; active?: boolean }> }>;
    };
};

/** Lightweight fallback component shown when an article fails to load */
@Component({
    standalone: true,
    imports: [CommonModule],
    template: `
    <div style="max-width:860px;margin:20px 0;padding:16px;border:1px solid rgba(255,255,255,.14);
                border-radius:12px;background:linear-gradient(180deg,#141414,#101010)">
      <h3 style="margin:0 0 8px;font-weight:800">Article not available</h3>
      <div style="opacity:.85">
        We couldn’t load this System Design guide. Please check the registry entry (path & exported
        class name) or try again.
      </div>
    </div>
  `
})
export class SystemDesignMissingArticleComponent { }

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `<ng-container #vc></ng-container>`
})
export class SystemDesignHostComponent implements OnDestroy {
    @ViewChild('vc', { read: ViewContainerRef, static: true }) vc!: ViewContainerRef;

    private route = inject(ActivatedRoute);
    private sub?: Subscription;

    ngOnInit() {
        this.sub = this.route.paramMap
            .pipe(map(p => p.get('slug') || ''), distinctUntilChanged())
            .subscribe(slug => this.load(slug));
    }

    ngOnDestroy() { this.sub?.unsubscribe(); }

    private toTitle(slug: string): string {
        return slug
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, m => m.toUpperCase());
    }

    private async load(slug: string) {
        const idx = SYSTEM.findIndex(e => e.slug === slug);
        const current: GuideEntry | undefined = idx >= 0 ? SYSTEM[idx] : undefined;

        // Build left navigator safely (don’t assume every slug exists in SYSTEM)
        const registryMap = new Map(SYSTEM.map(e => [e.slug, e]));
        const leftNav = {
            title: 'Front End System Design',
            sections: SYSTEM_GROUPS.map(g => ({
                title: g.title,
                items: g.items
                    // optionally filter out unknown slugs to avoid dead links:
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

        // If the current slug isn't in SYSTEM, render the fallback but still show the left nav
        if (!current) {
            this.vc.clear();
            this.vc.createComponent(SystemDesignMissingArticleComponent);
            window.scrollTo({ top: 0 });
            return;
        }

        // Prev/next based on SYSTEM order
        const prev = idx > 0 ? ['/', 'guides', 'system-design', SYSTEM[idx - 1].slug] : null;
        const next = idx < SYSTEM.length - 1 ? ['/', 'guides', 'system-design', SYSTEM[idx + 1].slug] : null;

        // Try to lazy-create the article component
        this.vc.clear();
        try {
            const Cmp = (await current.load()) as Type<GuideArticleInputs>;
            const ref = this.vc.createComponent<GuideArticleInputs>(Cmp);
            ref.instance.prev = prev;
            ref.instance.next = next;
            ref.instance.leftNav = leftNav;
        } catch {
            this.vc.createComponent(SystemDesignMissingArticleComponent);
        }

        window.scrollTo({ top: 0 });
    }
}
