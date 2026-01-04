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
