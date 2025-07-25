import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [],
  template: `<p>trivia-detail works!</p>`,
  styleUrl: './trivia-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriviaDetailComponent { }
