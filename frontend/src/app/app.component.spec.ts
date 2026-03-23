import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { AppSidebarDrawerService } from './core/services/app-sidebar-drawer.service';
import { BugReportService } from './core/services/bug-report.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, NoopAnimationsModule, HttpClientTestingModule],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the brand name in the shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('FrontendAtlas');
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

  it('mounts the drawer sidebar only after the mobile drawer is opened', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeNull();

    const drawer = TestBed.inject(AppSidebarDrawerService);
    drawer.open();
    fixture.detectChanges();

    expect(compiled.querySelector('app-sidebar')).not.toBeNull();
  });
});
