import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input,
  OnChanges, OnDestroy, PLATFORM_ID, SimpleChanges, ViewChild, inject, signal,
} from '@angular/core';

let nextPaneId = 0;

@Component({
  selector: 'fa-split-pane',
  standalone: true,
  template: `
    <div #container class="split-pane">
      <div class="split-pane__top" [id]="paneId" [style.flex-basis.px]="topHeight()">
        <ng-content select="[splitTop]"></ng-content>
      </div>
      <div #separator class="split-pane__separator" role="separator" tabindex="0"
        aria-orientation="horizontal" [attr.aria-label]="label"
        [attr.aria-controls]="paneId" [attr.aria-valuemin]="minimumPercent()"
        [attr.aria-valuemax]="maximumPercent()" [attr.aria-valuenow]="currentPercent()"
        [attr.aria-valuetext]="currentPercent() + '% editor height'"
        [class.split-pane__separator--dragging]="dragging()"
        (keydown)="onKeydown($event)" (pointerdown)="startDrag($event)"
        (pointermove)="moveDrag($event)" (pointerup)="stopDrag($event)"
        (pointercancel)="stopDrag($event)" (lostpointercapture)="clearDrag()">
        <span aria-hidden="true"></span>
      </div>
      <div class="split-pane__bottom"><ng-content select="[splitBottom]"></ng-content></div>
    </div>
  `,
  styleUrls: ['./split-pane.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitPaneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() initialRatio = 0.65;
  @Input() minimumTop = 240;
  @Input() minimumBottom = 160;
  @Input() label = 'Resize code editor and check results';
  @Input() paneId = `split-pane-${++nextPaneId}`;
  @ViewChild('container', { static: true }) private container!: ElementRef<HTMLElement>;
  @ViewChild('separator', { static: true }) private separator!: ElementRef<HTMLElement>;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: ResizeObserver;
  private drag: { id: number; y: number; height: number } | null = null;
  readonly ratio = signal(0.65);
  readonly availableHeight = signal(588);
  readonly dragging = signal(false);
  topHeight(): number { return this.clamp(this.availableHeight() * this.ratio()); }
  currentPercent(): number { return this.percent(this.topHeight()); }
  // Inputs are read by methods so changes to minimum heights are reflected as well.
  minimumPercent(): number { return this.percent(this.minimum()); }
  maximumPercent(): number { return this.percent(this.maximum()); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialRatio']) this.ratio.set(this.initialRatio);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.observer = new ResizeObserver(() => {
      this.availableHeight.set(Math.max(1, this.container.nativeElement.clientHeight - 12));
      if (!this.resizable()) this.clearDrag();
    });
    this.observer.observe(this.container.nativeElement);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.resizable()) return;
    const height = this.topHeight();
    const step = this.availableHeight() * 0.05;
    const target = event.key === 'ArrowUp' ? height - step
      : event.key === 'ArrowDown' ? height + step
      : event.key === 'Home' ? this.minimum()
      : event.key === 'End' ? this.maximum() : null;
    if (target === null) return;
    event.preventDefault();
    this.setHeight(target);
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary || !this.resizable()) return;
    event.preventDefault();
    this.drag = { id: event.pointerId, y: event.clientY, height: this.topHeight() };
    this.dragging.set(true);
    this.separator.nativeElement.focus({ preventScroll: true });
    this.separator.nativeElement.setPointerCapture(event.pointerId);
  }

  moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.id !== event.pointerId) return;
    this.setHeight(this.drag.height + event.clientY - this.drag.y);
  }

  stopDrag(event: PointerEvent): void {
    if (this.drag?.id === event.pointerId) this.clearDrag();
  }

  clearDrag(): void {
    const id = this.drag?.id;
    this.drag = null;
    this.dragging.set(false);
    const handle = this.separator?.nativeElement;
    if (id !== undefined && handle?.hasPointerCapture(id)) handle.releasePointerCapture(id);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.clearDrag();
  }

  private resizable(): boolean { return this.isBrowser && window.matchMedia('(min-width: 768px)').matches; }
  private minimum(): number { return Math.min(this.minimumTop, this.availableHeight()); }
  private maximum(): number { return Math.max(this.minimum(), this.availableHeight() - this.minimumBottom); }
  private clamp(height: number): number { return Math.min(this.maximum(), Math.max(this.minimum(), height)); }
  private percent(height: number): number { return Math.round(height / this.availableHeight() * 100); }
  private setHeight(height: number): void { this.ratio.set(this.clamp(height) / this.availableHeight()); }
}
