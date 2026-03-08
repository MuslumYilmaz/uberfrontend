import { TestBed } from '@angular/core/testing';
import { DecisionGraphCodeBlockComponent } from './decision-graph-code-block.component';

describe('DecisionGraphCodeBlockComponent', () => {
  const baseNodes = [
    {
      id: 'd1',
      title: 'Leading gate',
      anchor: { lineStart: 2, lineEnd: 2 },
      why: 'Prevent repeated immediate calls in one burst.',
      alternative: 'Use a timestamp gate.',
      tradeoff: 'Simpler branch logic but less timing control.',
    },
    {
      id: 'd2',
      title: 'Timer reset',
      anchor: { lineStart: 4, lineEnd: 4 },
      why: 'Keep only the latest intent.',
      alternative: 'Keep first timer and ignore the rest.',
      tradeoff: 'Great for search UX, not first-click semantics.',
    },
  ];

  async function createFixture(width?: number) {
    if (typeof width === 'number') {
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(width);
    }

    await TestBed.configureTestingModule({
      imports: [DecisionGraphCodeBlockComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DecisionGraphCodeBlockComponent);
    fixture.componentInstance.code = [
      'export default function debounce(fn, wait) {',
      '  const shouldCallNow = true;',
      '  if (timer) clearTimeout(timer);',
      '  timer = setTimeout(run, wait);',
      '}',
    ].join('\n');
    fixture.componentInstance.nodes = baseNodes as any;
    fixture.detectChanges();
    return fixture;
  }

  it('emits nodeOpened when clicking a highlighted line', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;

    const openedSpy = jasmine.createSpy('opened');
    component.nodeOpened.subscribe(openedSpy);

    const lineButtons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.dg-line--interactive'),
    );

    lineButtons[0].click();
    fixture.detectChanges();

    expect(openedSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      nodeId: 'd1',
      lineStart: 2,
      lineEnd: 2,
    }));
  });

  it('emits branchViewed only on first branch expansion and increments completion depth', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;

    const viewedSpy = jasmine.createSpy('viewed');
    component.branchViewed.subscribe(viewedSpy);

    const toggles: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.dg-branch__toggle'),
    );

    toggles[0].click();
    fixture.detectChanges();
    toggles[0].click();
    fixture.detectChanges();
    toggles[1].click();
    fixture.detectChanges();

    expect(viewedSpy.calls.count()).toBe(2);
    expect(viewedSpy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({
      nodeId: 'd1',
      branch: 'why',
      completionDepth: 1,
    }));
    expect(viewedSpy.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({
      nodeId: 'd1',
      branch: 'alternative',
      completionDepth: 2,
    }));
  });

  it('supports keyboard selection on line buttons', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const openedSpy = jasmine.createSpy('opened');
    component.nodeOpened.subscribe(openedSpy);

    const lineButtons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.dg-line--interactive'),
    );

    const event = new KeyboardEvent('keydown', { key: ' ' });
    lineButtons[0].dispatchEvent(event);
    fixture.detectChanges();

    expect(openedSpy).toHaveBeenCalled();
  });

  it('switches to mobile layout class on narrow viewports', async () => {
    const fixture = await createFixture(760);
    const root: HTMLElement = fixture.nativeElement.querySelector('[data-testid="decision-graph-code-block"]');

    expect(root.classList.contains('dg-mobile')).toBeTrue();
  });
});
