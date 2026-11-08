import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RehearsalDefinition } from '../../../core/models/rehearsal.model';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { rehearsalHeading } from './rehearsal-panel.component';

/**
 * The rehearsals of a problem that is part of several, one row each with its summary a click away, so the problem's
 * description stays in view. Rendered only in the browser, so its styles stay out of every task page's HTML.
 */
@Component({
  selector: 'app-rehearsal-offers',
  imports: [FaButtonComponent],
  templateUrl: './rehearsal-offers.component.html',
  styleUrls: ['./rehearsal-offers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalOffersComponent {
  @Input({ required: true }) offers!: readonly RehearsalDefinition[];
  /** Premium starts a rehearsal from its row; anyone else gets the card's one way to pricing. */
  @Input() canStart = false;
  @Output() readonly start = new EventEmitter<RehearsalDefinition>();
  readonly heading = rehearsalHeading;
}
