import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

type FaDialogStyle = {
  width?: string;
  maxWidth?: string;
};

@Component({
  selector: 'fa-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="modal"
      [closable]="closable"
      [dismissableMask]="dismissableMask"
      [draggable]="draggable"
      [resizable]="resizable"
      [blockScroll]="blockScroll"
      [closeOnEscape]="closeOnEscape"
      [showHeader]="showHeader"
      [styleClass]="dialogClassName"
      [appendTo]="appendTo"
      [contentStyle]="contentStyle"
      [style]="dialogStyle">
      <ng-template pTemplate="header">
        <div class="fa-dialog__header" *ngIf="showHeader">
          <span *ngIf="header">{{ header }}</span>
          <ng-content select="[faDialogHeader]"></ng-content>
        </div>
      </ng-template>

      <ng-content></ng-content>

      <ng-template pTemplate="footer">
        <div *ngIf="showFooter" class="fa-dialog__footer" [class.fa-dialog__footer--start]="actionsAlign === 'start'" [class.fa-dialog__footer--between]="actionsAlign === 'between'">
          <ng-content select="[faDialogFooter]"></ng-content>
        </div>
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaDialogComponent {
  @Input({ transform: booleanAttribute }) visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header?: string;
  @Input({ transform: booleanAttribute }) modal = true;
  @Input({ transform: booleanAttribute }) closable = true;
  @Input({ transform: booleanAttribute }) dismissableMask = true;
  @Input({ transform: booleanAttribute }) draggable = false;
  @Input({ transform: booleanAttribute }) resizable = false;
  @Input({ transform: booleanAttribute }) blockScroll = true;
  @Input({ transform: booleanAttribute }) closeOnEscape = true;
  @Input({ transform: booleanAttribute }) showHeader = true;
  @Input({ transform: booleanAttribute }) showFooter = false;

  @Input() width = '';
  @Input() maxWidth = '';
  @Input() styleClass = '';
  @Input() appendTo: any = 'body';
  @Input() contentStyle: Record<string, string> | null = null;
  @Input() actionsAlign: 'start' | 'end' | 'between' = 'end';

  get dialogStyle(): FaDialogStyle | null {
    if (!this.width && !this.maxWidth) {
      return null;
    }
    const out: FaDialogStyle = {};
    if (this.width) {
      out.width = this.width;
    }
    if (this.maxWidth) {
      out.maxWidth = this.maxWidth;
    }
    return out;
  }

  get dialogClassName(): string {
    const extra = this.styleClass?.trim();
    return extra ? `fa-dialog ${extra}` : 'fa-dialog';
  }
}
