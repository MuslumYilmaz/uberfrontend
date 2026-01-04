import { TestBed } from '@angular/core/testing';
import { ConsoleLoggerComponent } from './console-logger.component';

describe('ConsoleLoggerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsoleLoggerComponent],
    }).compileComponents();
  });

  it('coalesces consecutive duplicate entries', () => {
    const fixture = TestBed.createComponent(ConsoleLoggerComponent);
    const component = fixture.componentInstance;
    component.entries = [
      { level: 'log', message: 'hello', timestamp: 1 },
      { level: 'log', message: 'hello', timestamp: 2 },
      { level: 'error', message: 'boom', timestamp: 3 },
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.processed.length).toBe(2);
    expect(component.processed[0].message).toBe('hello');
    expect(component.processed[0].repeat).toBe(2);
    expect(component.processed[1].level).toBe('error');
  });

  it('renders a single-line error with optional details', () => {
    const fixture = TestBed.createComponent(ConsoleLoggerComponent);
    const component = fixture.componentInstance;
    component.showDetails = true;
    component.entries = [
      {
        level: 'error',
        message: 'Error: Boom\n    at line1',
        stack: 'Error: Boom\n    at line1\n    at line2',
        timestamp: 1,
      },
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.processed.length).toBe(1);
    expect(component.processed[0].message).toBe('Error: Boom');

    const details = fixture.nativeElement.querySelector('details');
    expect(details).not.toBeNull();
    expect(details.textContent).toContain('line2');
  });

  it('dedupes identical messages within a short window', () => {
    const fixture = TestBed.createComponent(ConsoleLoggerComponent);
    const component = fixture.componentInstance;
    component.dedupeWindowMs = 200;
    component.entries = [
      { level: 'error', message: 'boom', timestamp: 100 },
      { level: 'log', message: 'other', timestamp: 150 },
      { level: 'error', message: 'boom', timestamp: 250 },
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.processed.length).toBe(2);
    expect(component.processed[0].message).toBe('boom');
    expect(component.processed[0].repeat).toBe(2);
  });

  it('respects the max entry cap', () => {
    const fixture = TestBed.createComponent(ConsoleLoggerComponent);
    const component = fixture.componentInstance;
    component.max = 2;
    component.entries = [
      { level: 'log', message: 'a', timestamp: 1 },
      { level: 'log', message: 'b', timestamp: 2 },
      { level: 'log', message: 'c', timestamp: 3 },
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.processed.length).toBe(2);
    expect(component.processed[0].message).toBe('b');
    expect(component.processed[1].message).toBe('c');
  });
});
