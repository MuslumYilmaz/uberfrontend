import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [],
  template: `<p>coding-detail works!</p>`,
  styleUrl: './coding-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingDetailComponent { }
