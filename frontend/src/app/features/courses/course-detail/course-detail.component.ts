import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Course } from '../../../core/models/course.model';
import { CoursesService } from '../../../core/services/course.service';

@Component({
  standalone: true,
  selector: 'app-course-detail',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-5xl mx-auto p-6" *ngIf="course">

      <h1 class="text-3xl font-bold mt-2">{{ course.title }}</h1>
      <div class="opacity-80" *ngIf="course.subtitle">{{ course.subtitle }}</div>
      <p class="mt-4 opacity-80 whitespace-pre-wrap" *ngIf="course.description">{{ course.description }}</p>

      <div class="mt-8 space-y-6">
        <section *ngFor="let t of course.topics" class="rounded-lg border border-white/10 bg-neutral-900">
          <header class="px-4 py-3 border-b border-white/10 font-semibold">{{ t.title }}</header>
          <ul class="p-2">
            <li *ngFor="let l of t.lessons">
              <a
                class="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5"
                [routerLink]="['/courses', course!.id, t.id, l.id]"
              >
                <span class="text-xs px-2 py-0.5 rounded border border-white/10 opacity-70">
                  {{ l.type }}
                </span>
                <span>{{ l.title }}</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div class="p-6 opacity-70" *ngIf="!course">Loading…</div>
  `,
})
export class CourseDetailComponent {
  course?: Course;

  constructor(route: ActivatedRoute, cs: CoursesService) {
    route.paramMap.subscribe(pm => {
      const id = pm.get('courseId')!;
      cs.get(id).subscribe(c => (this.course = c));
    });
  }
}