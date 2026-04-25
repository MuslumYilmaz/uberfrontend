import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import {
  INTERVIEW_PREP_SWITCHER_ITEMS,
  PrepRoadmapSwitcherItem,
  findPrepRoadmapSwitcherItem,
} from './prep-roadmap-sequence';

@Component({
  selector: 'app-prep-roadmap-switcher',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prep-roadmap-switcher.component.html',
  styleUrls: ['./prep-roadmap-switcher.component.css'],
})
export class PrepRoadmapSwitcherComponent {
  private readonly router = inject(Router);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly items = INTERVIEW_PREP_SWITCHER_ITEMS;
  readonly open = signal(false);
  readonly currentUrl = signal(this.router.url || '/');
  readonly currentItem = computed(() => findPrepRoadmapSwitcherItem(this.currentUrl()));
  readonly otherStepsLabel = computed(() => `${Math.max(0, this.items.length - 1)} other steps`);

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      this.doc.documentElement.style.setProperty(
        '--prep-roadmap-switcher-offset',
        this.currentItem() ? '64px' : '0px',
      );
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
        this.open.set(false);
      });
  }

  toggle(): void {
    if (!this.currentItem()) return;
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  isActive(item: PrepRoadmapSwitcherItem): boolean {
    return this.currentItem()?.id === item.id;
  }

  trackByStep(_index: number, item: PrepRoadmapSwitcherItem): number {
    return item.step;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || this.hostEl.nativeElement.contains(target)) return;
    this.close();
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    this.close();
  }
}
