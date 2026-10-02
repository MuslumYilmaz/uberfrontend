import { DestroyRef, Directive, DOCUMENT, Input, inject } from '@angular/core';
import { Dialog } from 'primeng/dialog';

/** Restore the opener after a modal closes, without stealing a newer focus. */
@Directive({ selector: '[faDialogVisible]' })
export class FaDialogFocusDirective {
  private readonly document = inject(DOCUMENT);
  private readonly dialog = inject(Dialog, { self: true });
  private opener: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private visible = false;

  @Input() set faDialogVisible(value: boolean) {
    if (value && !this.visible) this.opener = this.document.activeElement as HTMLElement | null;
    this.visible = value;
  }

  constructor() {
    const show = this.dialog.onShow.subscribe(() => { this.container = this.dialog.container() ?? null; });
    const hide = this.dialog.onHide.subscribe(() => {
      const active = this.document.activeElement;
      if (!this.visible && this.opener?.isConnected && this.opener.getClientRects().length
        && (active === this.document.body || !active || this.container?.contains(active))) {
        this.opener.focus({ preventScroll: true });
      }
      this.opener = null;
      this.container = null;
    });
    inject(DestroyRef).onDestroy(() => { show.unsubscribe(); hide.unsubscribe(); });
  }
}
