import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplitPaneComponent } from './split-pane.component';

describe('SplitPaneComponent', () => {
  let fixture: ComponentFixture<SplitPaneComponent>;
  let component: SplitPaneComponent;
  let handle: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SplitPaneComponent] });
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    fixture = TestBed.createComponent(SplitPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.availableHeight.set(600);
    handle = fixture.nativeElement.querySelector('[role="separator"]');
  });

  afterEach(() => fixture.destroy());

  function key(value: string): void {
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('resizes by keyboard and clamps both panes to their minimum heights', () => {
    key('ArrowDown');
    expect(component.topHeight()).toBe(420);
    key('End');
    expect(component.topHeight()).toBeCloseTo(440, 5);
    key('ArrowDown');
    expect(component.topHeight()).toBeCloseTo(440, 5);
    key('Home');
    expect(component.topHeight()).toBe(240);
    key('ArrowUp');
    expect(component.topHeight()).toBe(240);
    expect(handle.getAttribute('aria-valuenow')).toBe(handle.getAttribute('aria-valuemin'));
  });

  it('honors framework minimum height and re-clamps after a viewport resize', () => {
    fixture.componentRef.setInput('minimumTop', 320);
    fixture.detectChanges();
    key('Home');
    expect(component.topHeight()).toBe(320);
    component.availableHeight.set(508);
    key('End');
    expect(component.topHeight()).toBe(348);
    expect(component.availableHeight() - component.topHeight()).toBe(160);
  });

  it('uses pointer deltas, ignores other pointers and stops resizing after cancellation', () => {
    spyOn(handle, 'setPointerCapture');
    spyOn(handle, 'hasPointerCapture').and.returnValue(true);
    const release = spyOn(handle, 'releasePointerCapture');
    const pointer = (type: string, y: number, id = 7) => new PointerEvent(type, {
      pointerId: id, clientY: y, button: 0, isPrimary: true, bubbles: true,
    });
    handle.dispatchEvent(pointer('pointerdown', 400));
    handle.dispatchEvent(pointer('pointermove', 350, 8));
    expect(component.topHeight()).toBe(390);
    handle.dispatchEvent(pointer('pointermove', 350));
    expect(component.topHeight()).toBe(340);
    handle.dispatchEvent(pointer('pointercancel', 350));
    handle.dispatchEvent(pointer('pointermove', 300));
    expect(component.topHeight()).toBe(340);
    expect(component.dragging()).toBeFalse();
    expect(release).toHaveBeenCalledWith(7);
  });

  it('does not intercept keys or start a drag in the mobile stacked layout', () => {
    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: false } as MediaQueryList);
    const event = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    component.onKeydown(event);
    component.startDrag(new PointerEvent('pointerdown', { button: 0, isPrimary: true }));
    expect(event.defaultPrevented).toBeFalse();
    expect(component.topHeight()).toBe(390);
    expect(component.dragging()).toBeFalse();
  });

  it('releases pointer capture on destruction', () => {
    spyOn(handle, 'setPointerCapture');
    spyOn(handle, 'hasPointerCapture').and.returnValue(true);
    const release = spyOn(handle, 'releasePointerCapture');
    component.startDrag(new PointerEvent('pointerdown', { pointerId: 3, button: 0, isPrimary: true }));
    component.ngOnDestroy();
    expect(release).toHaveBeenCalledWith(3);
  });
});
