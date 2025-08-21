import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import type { Course } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private cache$?: Observable<Course[]>;

  constructor(private http: HttpClient) { }

  list(): Observable<Course[]> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<Course[]>('/assets/courses/courses.json')
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }

  get(courseId: string): Observable<Course | undefined> {
    return this.list().pipe(map(cs => cs.find(c => c.id === courseId)));
  }
}
