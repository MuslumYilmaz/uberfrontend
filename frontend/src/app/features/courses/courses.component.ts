import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [],
  template: `<p>courses works!</p>`,
  styleUrl: './courses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent { }
