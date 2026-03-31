import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { BugReportService } from './core/services/bug-report.service';

@Component({
  standalone: true,
  template: '',
})
class DummyDashboardComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([{ path: 'dashboard', component: DummyDashboardComponent }]),
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();
  });

  it('does not mount bug report dialog until requested', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bug-report-dialog')).toBeNull();

    const bugReport = TestBed.inject(BugReportService);
    bugReport.open({ source: 'spec', url: '/spec' });
    fixture.detectChanges();
    expect(bugReport.visible()).toBeTrue();
  });

  it('switches from marketing header to app header on non-marketing routes', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-marketing-header')).not.toBeNull();
    expect(compiled.querySelector('app-header')).toBeNull();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-marketing-header')).toBeNull();
    expect(compiled.querySelector('app-header')).not.toBeNull();
  });
});
