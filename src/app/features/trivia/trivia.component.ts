import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trivia',
  standalone: true,
  imports: [],
  template: `<p>trivia works!</p>`,
  styleUrl: './trivia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriviaComponent { }
