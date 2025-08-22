import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

type Mode = 'practice' | 'course';

type OutlineLesson = {
  id: string;
  title: string;
  type: 'reading' | 'coding';
  ref?: string | null;
};

type OutlineTopic = {
  id: string;
  title: string;
  lessons: OutlineLesson[];
};

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [CommonModule, TooltipModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  // General
  @Input() mode: Mode = 'practice';

  // Practice (coding-list / coding-detail)
  @Input() progressText?: string | null;
  @Input() showPrevNext = false;
  @Input() prevDisabled = false;
  @Input() nextDisabled = false;
  @Input() nextDisabledTooltip: string | null = null;

  // Course (reading/coding with breadcrumb)
  @Input() backLabel?: string | null;           // “Back to course”
  @Input() breadcrumbLabel?: string | null;     // Course title
  @Input() middleSuffixLabel?: string | null;   // “Reading lesson”, “Coding task”, ...
  @Input() coursePrevLabel?: string | null;
  @Input() courseNextLabel?: string | null;

  // Optional right-side submit/action (used by reading lessons)
  @Input() showSubmit = false;
  @Input() submitLabel = 'Submit';

  // Left-side course-outline menu (courses only)
  @Input() leftCourseLabel?: string | null;     // “1. Basic functions”
  @Input() outline?: OutlineTopic[] | null;     // topics + lessons
  @Input() currentLessonId?: string | null;     // to highlight current

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() coursePrev = new EventEmitter<void>();
  @Output() courseNext = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();  // reading “Mark as complete”
  @Output() selectLesson = new EventEmitter<{ topicId: string; lessonId: string }>();

  menuOpen = signal(false);
  menuVisible = signal(false);

  private readonly DRAWER_MS = 180;

  openMenu() {
    if (this.mode !== 'course' || !this.outline?.length) return;
    this.menuVisible.set(true);
    requestAnimationFrame(() => this.menuOpen.set(true));
  }

  closeMenu() {
    this.menuOpen.set(false);
    setTimeout(() => this.menuVisible.set(false), this.DRAWER_MS);
  }

  onSelect(topicId: string, lessonId: string) {
    // close first (animate), then emit so the parent navigates after fade/slide
    this.menuOpen.set(false);
    setTimeout(() => {
      this.menuVisible.set(false);
      this.selectLesson.emit({ topicId, lessonId });
    }, this.DRAWER_MS);
  }

  trackTopic(_: number, t: OutlineTopic) { return t.id; }
  trackLesson(_: number, l: OutlineLesson) { return l.id; }
}