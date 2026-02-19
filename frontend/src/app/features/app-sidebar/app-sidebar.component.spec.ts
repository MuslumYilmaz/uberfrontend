import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BugReportService } from '../../core/services/bug-report.service';
import { AppSidebarComponent } from './app-sidebar.component';

describe('AppSidebarComponent', () => {
  it('opens bug report flow from sidebar action', async () => {
    const bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);

    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent, RouterTestingModule],
      providers: [{ provide: BugReportService, useValue: bugReport }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[aria-label="Report a bug"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    button.click();

    expect(bugReport.open).toHaveBeenCalled();
    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'sidebar',
      route: '/',
    }));
  });
});
