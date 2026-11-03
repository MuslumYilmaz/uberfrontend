import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, PLATFORM_ID, afterNextRender, computed, inject, input, model } from '@angular/core';

/**
 * Words that take turns in one line of a sentence. The server draws the first word, so the page needs no script to
 * read. The timer stays outside the Angular zone, because a pending timer keeps the app from ever turning stable.
 * The words are decorative here: the parent names the current value for screen readers.
 */
@Component({
  selector: 'fa-rotating-words',
  template: `
    <span class="fa-rotating-words__window" aria-hidden="true">
      <span class="fa-rotating-words__track" [style.transform]="transform()">
        @for (word of words(); track word) {
          <span class="fa-rotating-words__word">{{ word }}</span>
        }
      </span>
    </span>
  `,
  styleUrls: ['./fa-rotating-words.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaRotatingWordsComponent {
  readonly words = input.required<readonly string[]>();
  readonly intervalMs = input(2400);
  /** Waits this long before the timer starts, so two sentences on one screen take turns instead of moving together. */
  readonly startDelayMs = input(0);
  /** Holds the current word, for example while the person hovers or a picker is open. */
  readonly paused = input(false);
  readonly index = model(0);

  readonly transform = computed(() => {
    const count = this.words().length;
    return count ? `translateY(-${(this.index() * 100) / count}%)` : 'none';
  });

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      let timer: ReturnType<typeof setInterval> | undefined;
      const start = this.zone.runOutsideAngular(() => setTimeout(() => {
        timer = setInterval(() => this.advance(), this.intervalMs());
      }, this.startDelayMs()));
      this.destroyRef.onDestroy(() => {
        clearTimeout(start);
        clearInterval(timer);
      });
    });
  }

  private advance(): void {
    const count = this.words().length;
    if (this.paused() || count < 2) return;
    this.index.set((this.index() + 1) % count);
  }
}
