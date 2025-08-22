// src/app/features/courses/course-player/course-player.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Course, Lesson } from '../../../core/models/course.model';
import { CoursesService } from '../../../core/services/course.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

type FlatEntry = { tId: string; lesson: Lesson; topicTitle: string };

@Component({
  standalone: true,
  selector: 'app-course-player',
  imports: [CommonModule, RouterModule, FooterComponent],
  template: `
    <div class="max-w-6xl mx-auto p-4">
      <div class="mt-3" *ngIf="lesson; else loading">
        <h1 class="text-2xl font-bold mb-2">{{ lesson.title }}</h1>

        <!-- Reading content -->
        <div *ngIf="lesson.type === 'reading'" class="opacity-80">
          This is a reading lesson. Put your markdown/HTML content here.
        </div>
      </div>
      <ng-template #loading>Loading…</ng-template>
    </div>

    <!-- Footer (reading only; coding lessons redirect to coding page) -->
<app-footer
  mode="course"
  [backLabel]="course?.title || 'Back to course'"
  [breadcrumbLabel]="course?.title || 'Course'"
  [middleSuffixLabel]="'Reading lesson'"
  [coursePrevLabel]="prevLabel"
  [courseNextLabel]="nextLabel"
  [leftCourseLabel]="currentTopicTitle"
  [outline]="course?.topics || []"
  [currentLessonId]="lesson?.id || null"
  (back)="backToCourse()"
  (coursePrev)="goPrev()"
  (courseNext)="goNext()"
  (submit)="markComplete()"
  (selectLesson)="navigateTo($event.topicId, $event.lessonId)"
/>
  `,
})
export class CoursePlayerComponent {
  courseId = '';
  topicId = '';
  lessonId = '';

  course?: Course;
  lesson?: Lesson;

  private flat: FlatEntry[] = [];
  private idx = -1;

  get currentTopicTitle(): string | null {
    const t = this.course?.topics.find(tt => tt.id === this.topicId);
    return t?.title ?? null;
  }
  get prevLabel(): string | null {
    const p = this.prevEntry();
    return p ? p.lesson.title : null;
  }
  get nextLabel(): string | null {
    const n = this.nextEntry();
    return n ? n.lesson.title : null;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cs: CoursesService
  ) {
    this.route.paramMap
      .pipe(
        switchMap(pm => {
          this.courseId = pm.get('courseId')!;
          this.topicId = pm.get('topicId')!;
          this.lessonId = pm.get('lessonId')!;
          return this.cs.get(this.courseId);
        })
      )
      .subscribe(courseData => {
        if (!courseData) return;
        this.course = courseData;

        // Flatten lessons for prev/next resolution
        this.flat = courseData.topics.flatMap(t =>
          t.lessons.map(lesson => ({ tId: t.id, lesson, topicTitle: t.title }))
        );

        this.idx = this.flat.findIndex(x => x.tId === this.topicId && x.lesson.id === this.lessonId);
        this.lesson = this.flat[this.idx]?.lesson;

        if (!this.lesson) return;

        // Coding lessons still redirect to coding detail with breadcrumb + neighbors
        if (this.lesson.type === 'coding' && this.lesson.ref) {
          const state = this.buildCourseNavState(this.idx, courseData);
          this.router.navigate(['/javascript/coding', this.lesson.ref], {
            replaceUrl: true,
            state,
          });
        }
      });
  }

  // Drawer “select lesson”
  navigateTo(topicId: string, lessonId: string) {
    const targetIdx = this.flat.findIndex(x => x.tId === topicId && x.lesson.id === lessonId);
    if (targetIdx < 0) return;
    const target = this.flat[targetIdx];

    // Reading → navigate within course; Coding → navigate to coding detail with state
    if (target.lesson.type === 'reading') {
      this.router.navigate(['/courses', this.courseId, topicId, lessonId]);
    } else if (target.lesson.type === 'coding' && target.lesson.ref) {
      const state = this.buildCourseNavState(targetIdx, this.course!);
      this.router.navigate(['/javascript/coding', target.lesson.ref], { state });
    }
  }

  backToCourse() { this.router.navigate(['/courses', this.courseId]); }
  goPrev() {
    const p = this.prevEntry();
    if (!p) return;
    this.navigateTo(p.tId, p.lesson.id);
  }
  goNext() {
    const n = this.nextEntry();
    if (!n) return;
    this.navigateTo(n.tId, n.lesson.id);
  }
  markComplete() {
    console.log('Marked lesson as complete:', this.lesson?.id);
  }

  private prevEntry(): FlatEntry | null {
    return this.idx > 0 ? this.flat[this.idx - 1] : null;
  }
  private nextEntry(): FlatEntry | null {
    return this.idx >= 0 && this.idx + 1 < this.flat.length ? this.flat[this.idx + 1] : null;
  }

  // ✨ Return a richer state for coding pages
  private buildCourseNavState(idx: number, course: Course) {
    const prev = idx > 0 ? this.flat[idx - 1] : null;
    const next = idx + 1 < this.flat.length ? this.flat[idx + 1] : null;

    const toFor = (e: FlatEntry) => ['/courses', this.courseId, e.tId, e.lesson.id];

    // Outline (lightweight shape for the drawer)
    const outline = course.topics.map(t => ({
      id: t.id,
      title: t.title,
      lessons: t.lessons.map(l => ({
        id: l.id, title: l.title, type: l.type, ref: l.ref ?? null
      })),
    }));

    const here = this.flat[idx];

    return {
      courseId: this.courseId,
      currentTopicId: here?.tId ?? null,
      currentLessonId: here?.lesson.id ?? null,
      leftCourseLabel: here?.topicTitle ?? null,
      outline,
      courseNav: {
        breadcrumb: { to: ['/courses', this.courseId], label: course.title },
        prev: prev ? { to: toFor(prev), label: prev.lesson.title } : null,
        next: next ? { to: toFor(next), label: next.lesson.title } : null,
      },
    };
  }

}