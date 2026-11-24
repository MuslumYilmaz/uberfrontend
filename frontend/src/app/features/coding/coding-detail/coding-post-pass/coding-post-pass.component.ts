import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';

/** `guest`: not saved yet; `personalize`: saved, the plan questions not answered; `saved`: saved. */
export type PostPassCard = 'guest' | 'personalize' | 'saved';

/** What a recorded solve earned: XP (0 when the task was solved before) and the current streak in days. */
export type PostPassReward = { xp: number; streak: number };

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
  /** Shown beside "Saved as solved" for an account; null until the solve is recorded. */
  @Input() reward: PostPassReward | null = null;
  @Output() readonly signUp = new EventEmitter<void>();
  @Output() readonly signIn = new EventEmitter<void>();
  @Output() readonly next = new EventEmitter<void>();
  @Output() readonly personalize = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();

  /** "+20 XP · 3-day streak"; empty for a guest and for a solve that earned nothing new. */
  rewardText(): string {
    if (this.card === 'guest' || !this.reward) return '';
    const parts: string[] = [];
    if (this.reward.xp > 0) parts.push(`+${this.reward.xp} XP`);
    if (this.reward.xp > 0 && this.reward.streak > 0) parts.push(`${this.reward.streak}-day streak`);
    return parts.join(' · ');
  }
}
