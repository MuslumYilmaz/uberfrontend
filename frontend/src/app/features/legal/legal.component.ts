import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [],
  template: `<p>legal works!</p>`,
  styleUrl: './legal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalComponent { }
