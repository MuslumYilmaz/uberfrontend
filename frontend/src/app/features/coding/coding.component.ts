import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-coding',
  standalone: true,
  imports: [],
  template: `<p>coding works!</p>`,
  styleUrl: './coding.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingComponent { }
