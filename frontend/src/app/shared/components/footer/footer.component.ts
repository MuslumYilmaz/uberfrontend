import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Params, RouterModule } from '@angular/router';
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
    selector: 'app-footer',
    imports: [CommonModule, RouterModule, TooltipModule],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  // General
  @Input() mode: Mode = 'practice';

  // Practice (coding/trivia lists & detail)
  @Input() progressText?: string | null;
  @Input() prevDisabled = false;
  @Input() nextDisabled = false;
  @Input() prevHref: string | null = null;
  @Input() nextHref: string | null = null;
  @Input() nextDisabledTooltip: string | null = null;
  @Input() practiceLeftLabel?: string | null;
  @Input() practiceLeftRoute?: string | any[] | null;
  @Input() practiceLeftQueryParams?: Params | null;

  // Course (reading/coding with breadcrumb)
  @Input() backLabel?: string | null;                // (optional) not shown in center cluster, used for back()
  @Input() breadcrumbLabel?: string | null;          // clickable breadcrumb in center
  @Input() middleSuffixLabel?: string | null;        // "Coding task" / "Reading lesson"
  @Input() coursePrevLabel?: string | null;          // label for prev lesson
  @Input() courseNextLabel?: string | null;          // label for next lesson

  // Optional right-side submit/action (reading lessons)
  @Input() showSubmit = false;
  @Input() submitLabel = 'Submit';
  @Input() submitDisabled = false;

  // Left-side course-outline menu (courses only)
  @Input() leftCourseLabel?: string | null;
  @Input() outline?: OutlineTopic[] | null;
  @Input() currentLessonId?: string | null;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() coursePrev = new EventEmitter<void>();
  @Output() courseNext = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
  @Output() selectLesson = new EventEmitter<{ topicId: string; lessonId: string }>();

  menuOpen = signal(false);
  menuVisible = signal(false);
  private readonly DRAWER_MS = 180;

  // Explicit mode checks (avoid over-smart detection)
  get isCourse(): boolean { return this.mode === 'course'; }
  get isPractice(): boolean { return this.mode === 'practice'; }
  get hasOutline(): boolean { return (this.outline?.length ?? 0) > 0; }

  activatePracticeLink(event: MouseEvent, direction: 'prev' | 'next'): void {
    if (direction === 'prev' ? this.prevDisabled : this.nextDisabled) {
      event.preventDefault();
      return;
    }
    // Preserve native new-tab/window actions; ordinary clicks retain parent session state.
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    (direction === 'prev' ? this.prev : this.next).emit();
  }

  openMenu() {
    if (!this.isCourse || !this.hasOutline || !this.leftCourseLabel) return;
    this.menuVisible.set(true);
    requestAnimationFrame(() => this.menuOpen.set(true));
  }

  closeMenu() {
    this.menuOpen.set(false);
    setTimeout(() => this.menuVisible.set(false), this.DRAWER_MS);
  }

  onSelect(topicId: string, lessonId: string) {
    this.menuOpen.set(false);
    setTimeout(() => {
      this.menuVisible.set(false);
      this.selectLesson.emit({ topicId, lessonId });
    }, this.DRAWER_MS);
  }

  trackTopic(_: number, t: OutlineTopic) { return t.id; }
  trackLesson(_: number, l: OutlineLesson) { return l.id; }
}
