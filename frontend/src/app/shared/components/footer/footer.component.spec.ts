import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent practice links', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FooterComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    fixture.componentInstance.prevHref = '/system-design/notification-toast-system';
    fixture.componentInstance.nextHref = '/system-design/infinite-scroll-list';
    fixture.detectChanges();
  });

  it('exposes real URLs and delegates ordinary link activation exactly once to the parent', () => {
    for (const direction of ['prev', 'next'] as const) {
      const emit = spyOn(fixture.componentInstance[direction], 'emit');
      const link = fixture.debugElement.query(By.css(`[data-testid="footer-${direction}"]`));
      expect(link.nativeElement.tagName).toBe('A');
      expect(link.nativeElement.getAttribute('href')).toBe(fixture.componentInstance[`${direction}Href`]);
      const event = new MouseEvent('click', { button: 0, cancelable: true });
      link.triggerEventHandler('click', event);
      expect(event.defaultPrevented).toBeTrue();
      expect(emit).toHaveBeenCalledTimes(1);
    }
  });

  it('leaves modified and middle clicks to the browser without changing the current practice session', () => {
    const emit = spyOn(fixture.componentInstance.next, 'emit');
    const link = fixture.debugElement.query(By.css('[data-testid="footer-next"]'));
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = new MouseEvent('click', { cancelable: true, ...options });
      link.triggerEventHandler('click', event);
      expect(event.defaultPrevented).toBeFalse();
    }
    const cancelled = new MouseEvent('click', { cancelable: true });
    cancelled.preventDefault();
    link.triggerEventHandler('click', cancelled);
    expect(emit).not.toHaveBeenCalled();
  });

  it('keeps disabled or non-public targets as buttons and preserves legacy actions', () => {
    const component = fixture.componentInstance;
    component.prevDisabled = true;
    component.nextHref = null;
    fixture.detectChanges();
    const previous = fixture.nativeElement.querySelector('[data-testid="footer-prev"]') as HTMLButtonElement;
    const next = fixture.nativeElement.querySelector('[data-testid="footer-next"]') as HTMLButtonElement;
    expect(previous.tagName).toBe('BUTTON');
    expect(previous.disabled).toBeTrue();
    expect(previous.hasAttribute('href')).toBeFalse();
    expect(next.tagName).toBe('BUTTON');
    const emit = spyOn(component.next, 'emit');
    next.click();
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('does not apply practice links to course navigation', () => {
    fixture.componentInstance.mode = 'course';
    fixture.componentInstance.courseNextLabel = 'Next lesson';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cluster a')).toBeNull();
    const emit = spyOn(fixture.componentInstance.courseNext, 'emit');
    const next = Array.from(fixture.nativeElement.querySelectorAll('.cluster button'))
      .find((element: any) => element.textContent.includes('Next lesson')) as HTMLButtonElement;
    next.click();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
