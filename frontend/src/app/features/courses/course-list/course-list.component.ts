import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Course } from '../../../core/models/course.model';
import { CoursesService } from '../../../core/services/course.service';

@Component({
  standalone: true,
  selector: 'app-course-list',
  imports: [CommonModule, RouterModule],
  styleUrls: ['./course-list.component.css'],
  template: `
    <div class="wrap">
      <h1 class="title">Courses</h1>

      <div class="grid">
        <a *ngFor="let c of courses"
           class="card"
           [routerLink]="['/courses', c.id]"
           [attr.aria-label]="c.title">

          <!-- HERO ICON -->
          <div class="hero" [ngClass]="heroClass(c.id)">
            <!-- JavaScript tile -->
            <svg *ngIf="c.id === 'javascript-basics'" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
              <rect x="6" y="6" width="32" height="32" rx="6" fill="#111" opacity=".08"></rect>
              <text x="22" y="27" text-anchor="middle"
                    font-size="16" font-weight="800"
                    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
                    fill="#111">JS</text>
            </svg>

            <!-- Learn Programming tile (default) -->
            <svg *ngIf="c.id !== 'javascript-basics'" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
              <text x="22" y="28" text-anchor="middle"
                    font-size="18" font-weight="800"
                    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
                    fill="#fff">&lt;/&gt;</text>
            </svg>
          </div>

          <!-- BODY -->
          <div class="body">
            <div class="name">{{ c.title }}</div>
            <div class="subtitle" *ngIf="c.subtitle">{{ c.subtitle }}</div>
            <div class="blurb clamp-2">{{ c.description }}</div>
          </div>

          <!-- CHEVRON -->
          <div class="chev">→</div>
        </a>
      </div>
    </div>
  `,
})
export class CourseListComponent {
  courses: Course[] = [];
  constructor(cs: CoursesService) { cs.list().subscribe(list => (this.courses = list)); }

  heroClass(id: string) {
    return id === 'javascript-basics' ? ['hero', 'hero--js'] : ['hero', 'hero--learn'];
  }
}
