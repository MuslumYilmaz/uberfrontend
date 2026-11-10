import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';

/** `guest`: not saved yet; `personalize`: saved, the plan questions not answered; `saved`: saved. */
export type PostPassCard = 'guest' | 'personalize' | 'saved';

/**
 * What comes after a pass, inside the results instead of a dialog over the work. A component of its own so its
 * styles arrive with the first pass instead of being inlined into every prerendered task page.
 */
@Component({
  selector: 'app-coding-post-pass',
  imports: [CommonModule, FaButtonComponent, FaGlyphComponent],
  templateUrl: './coding-post-pass.component.html',
  styleUrls: ['./coding-post-pass.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingPostPassComponent {
  @Input({ required: true }) card!: PostPassCard;
  /** "Next: Throttle"; null where Next has nowhere to go. */
  @Input() nextLabel: string | null = null;
  /** Under the framework checks the card spans the preview column. */
  @Input() place: 'results' | 'framework' = 'results';
  @Output() readonly signUp = new EventEmitter<void>();
  @Output() readonly signIn = new EventEmitter<void>();
  @Output() readonly next = new EventEmitter<void>();
  @Output() readonly personalize = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
}
