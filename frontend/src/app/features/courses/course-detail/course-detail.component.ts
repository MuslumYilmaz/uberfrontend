import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Course } from '../../../core/models/course.model';
import { CoursesService } from '../../../core/services/course.service';

@Component({
  standalone: true,
  selector: 'app-course-detail',
  imports: [CommonModule, RouterModule],
  styles: [`
    :host { display:block; }

    .wrap {
      --accent: #6aa3ff;
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }

    /* ---------- Header / hero ---------- */
    .hero {
      position: relative;
      padding: 20px 18px 22px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 8px 24px rgba(0,0,0,.22);
    }
    .hero::before{
      content:"";
      position:absolute; inset:0; border-radius:16px;
      padding:1px; pointer-events:none; mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);
      -webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);
      -webkit-mask-composite: xor; mask-composite: exclude;
      background: linear-gradient(135deg, var(--accent), rgba(255,255,255,.08));
      opacity:.25;
    }
    .title{ font-size:32px; line-height:1.15; font-weight:800; letter-spacing:.2px; margin:2px 0 4px; }
    .subtitle{ color:#cfd3da; font-size:14px; margin-bottom:8px; }
    .blurb{ color:#aeb6bf; font-size:14px; margin-top:8px; max-width:70ch; }

    .tags{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .tag{
      font-size:12px; padding:4px 10px; border-radius:999px;
      border:1px solid rgba(255,255,255,.16); color:#dbe1e8;
      background:rgba(255,255,255,.04);
    }

    /* ---------- Topics ---------- */
    .topics{ margin-top:22px; display:grid; gap:14px; }

    .topic{
      border:1px solid rgba(255,255,255,.10);
      border-radius:14px; overflow:hidden;
      background:#0f1012;
    }
    .topic-head{
      padding:10px 14px; font-weight:700; color:#e9eef4;
      background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border-bottom:1px solid rgba(255,255,255,.08);
    }

    .topic-list{ list-style:none; margin:0; padding:6px; }
    .row{
      display:grid; grid-template-columns: auto 1fr auto;
      align-items:center; gap:10px;
      padding:10px 10px; border-radius:10px;
      color:inherit; text-decoration:none; outline:0;
      border:1px solid transparent;
    }
    .row:hover{
      background:rgba(255,255,255,.04);
      border-color: rgba(255,255,255,.08);
    }
    .row:active{ transform: translateY(1px); }

    .pill{
      font-size:11px; padding:3px 8px; border-radius:999px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.04); color:#dbe1e8;
      text-transform: lowercase;
    }
    .pill.code{
      background: color-mix(in srgb, var(--accent) 16%, transparent);
      border-color: color-mix(in srgb, var(--accent) 28%, rgba(255,255,255,.12));
      color:#eaf1ff;
    }

    .row-title{ min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chev{ opacity:.65; padding:0 4px; font-weight:700; }
    .row:hover .chev{ opacity:.95; transform:translateX(3px); transition:.16s; }

    /* ---------- Responsive ---------- */
    @media (max-width: 720px){
      .title{ font-size:26px; }
      .hero{ padding:16px; }
    }
  `],
  template: `
    <div class="wrap" *ngIf="course" [style.--accent]="accent">
      <section class="hero">
        <h1 class="title">{{ course.title }}</h1>
        <div class="subtitle" *ngIf="course.subtitle">{{ course.subtitle }}</div>
        <p class="blurb" *ngIf="course.description">{{ course.description }}</p>

        <div class="tags">
          <span class="tag" *ngIf="course.topics?.length as tCount">{{ tCount }} topic{{ tCount>1 ? 's':'' }}</span>
          <span class="tag" *ngIf="lessonCount>0">{{ lessonCount }} lesson{{ lessonCount>1 ? 's':'' }}</span>
        </div>
      </section>

      <div class="topics">
        <section class="topic" *ngFor="let t of course.topics">
          <header class="topic-head">{{ t.title }}</header>
          <ul class="topic-list">
            <li *ngFor="let l of t.lessons">
              <a class="row"
                 [routerLink]="['/courses', course!.id, t.id, l.id]"
                 [attr.aria-label]="l.title">
                <span class="pill" [class.code]="l.type==='coding'">{{ l.type }}</span>
                <span class="row-title">{{ l.title }}</span>
                <span class="chev">→</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div class="wrap" *ngIf="!course">
      <section class="hero"><div class="subtitle">Loading…</div></section>
    </div>
  `,
})
export class CourseDetailComponent {
  course?: Course;
  lessonCount = 0;
  accent = '#6aa3ff';

  constructor(route: ActivatedRoute, cs: CoursesService) {
    route.paramMap
      .pipe(switchMap(pm => cs.get(pm.get('courseId')!)))
      .subscribe(c => {
        this.course = c || undefined;
        this.lessonCount = c?.topics?.reduce((n, t) => n + (t.lessons?.length ?? 0), 0) ?? 0;
        this.accent = this.pickAccent(c);
      });
  }

  private pickAccent(c?: Course): string {
    // Prefer a color coming from data if present
    const hc = (c as any)?.heroColor as string | undefined;
    if (hc) return hc;
    // Simple heuristics per course id
    if (c?.id?.includes('javascript')) return '#ffd300';
    if (c?.id?.includes('program')) return '#ff7a18';
    return '#6aa3ff';
  }
}