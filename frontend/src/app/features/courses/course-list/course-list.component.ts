import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoursesService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

@Component({
  standalone: true,
  selector: 'app-course-list',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-4">Courses</h1>

      <div class="grid gap-4 md:grid-cols-2">
        <a *ngFor="let c of courses"
           [routerLink]="['/courses', c.id]"
           class="block rounded-lg border border-white/10 bg-neutral-900 p-5 hover:border-white/30">
          <div class="text-lg font-semibold">{{ c.title }}</div>
          <div class="opacity-70" *ngIf="c.subtitle">{{ c.subtitle }}</div>
          <div class="mt-2 text-sm opacity-70 line-clamp-2">{{ c.description }}</div>
        </a>
      </div>
    </div>
  `,
})
export class CourseListComponent {
  courses: Course[] = [];
  constructor(cs: CoursesService) {
    cs.list().subscribe(list => (this.courses = list));
  }
}
