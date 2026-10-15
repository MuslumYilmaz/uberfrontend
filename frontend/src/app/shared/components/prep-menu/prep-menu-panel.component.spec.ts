import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PREP_MENU_ROUTES, PREP_MENU_SECTIONS } from '../../../core/content/prep-menu';
import {
  PrepMenuPanelComponent,
  PrepMenuSelection,
  prepMenuPanelCenter,
} from './prep-menu-panel.component';

describe('PrepMenuPanelComponent', () => {
  let fixture: ComponentFixture<PrepMenuPanelComponent>;

  async function render(inputs: Record<string, unknown> = {}): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PrepMenuPanelComponent],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(PrepMenuPanelComponent);
    fixture.componentRef.setInput('panelId', 'test-menu');
    fixture.componentRef.setInput('testIdPrefix', 'test-menu');
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => fixture?.nativeElement?.remove());

  const panel = (host: HTMLElement) => host.querySelector('nav#test-menu') as HTMLElement;
  const hrefs = (host: HTMLElement) =>
    Array.from(host.querySelectorAll('a[href]')).map((link) => link.getAttribute('href') || '');
  const tab = (host: HTMLElement, id: string) =>
    host.querySelector(`[data-testid="test-menu-tab-${id}"]`) as HTMLButtonElement;
  const section = (host: HTMLElement, id: string) => host.querySelector(`#test-menu-${id}`) as HTMLElement;

  it('renders every catalog route once inside a hidden navigation landmark while closed', async () => {
    const host = await render({ open: false });
    const nav = panel(host);

    expect(nav.getAttribute('aria-label')).toBe('Interview prep');
    expect(nav.hasAttribute('hidden')).toBeTrue();
    expect(getComputedStyle(nav).display).toBe('none');
    expect(hrefs(host).sort()).toEqual([...PREP_MENU_ROUTES].sort());
    expect(hrefs(host).filter((href) => /[?#]/.test(href))).toEqual([]);
    expect(host.querySelectorAll('a a').length).toBe(0);
  });

  it('shows the panel when open without changing its links', async () => {
    const host = await render({ open: true });

    expect(panel(host).hasAttribute('hidden')).toBeFalse();
    expect(getComputedStyle(panel(host)).display).not.toBe('none');
    expect(hrefs(host).length).toBe(PREP_MENU_ROUTES.length);
  });

  it('switches sections by toggling hidden only', async () => {
    const host = await render({ open: true });
    const [first, second] = PREP_MENU_SECTIONS;
    const linkCount = hrefs(host).length;

    expect(tab(host, first.id).getAttribute('aria-selected')).toBe('true');
    expect(section(host, first.id).hasAttribute('hidden')).toBeFalse();
    expect(section(host, second.id).hasAttribute('hidden')).toBeTrue();
    expect(getComputedStyle(section(host, second.id)).display).toBe('none');

    tab(host, second.id).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeSection()).toBe(second.id);
    expect(tab(host, second.id).getAttribute('aria-selected')).toBe('true');
    expect(tab(host, first.id).getAttribute('aria-selected')).toBe('false');
    expect(section(host, first.id).hasAttribute('hidden')).toBeTrue();
    expect(section(host, second.id).hasAttribute('hidden')).toBeFalse();
    expect(hrefs(host).length).toBe(linkCount);
  });

  it('moves between sections with arrow, Home and End keys and keeps focus on the selected tab', async () => {
    const host = await render({ open: true });
    const ids = PREP_MENU_SECTIONS.map((entry) => entry.id);
    const press = (target: HTMLElement, key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    tab(host, ids[0]).focus();
    expect(press(tab(host, ids[0]), 'ArrowDown').defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.activeSection()).toBe(ids[1]);
    expect(document.activeElement).toBe(tab(host, ids[1]));
    expect(tab(host, ids[1]).getAttribute('tabindex')).toBe('0');
    expect(tab(host, ids[0]).getAttribute('tabindex')).toBe('-1');

    press(tab(host, ids[1]), 'End');
    expect(fixture.componentInstance.activeSection()).toBe(ids[ids.length - 1]);
    press(tab(host, ids[ids.length - 1]), 'ArrowRight');
    expect(fixture.componentInstance.activeSection()).toBe(ids[0]);
    press(tab(host, ids[0]), 'ArrowUp');
    expect(fixture.componentInstance.activeSection()).toBe(ids[ids.length - 1]);
    press(tab(host, ids[ids.length - 1]), 'Home');
    expect(fixture.componentInstance.activeSection()).toBe(ids[0]);
    expect(press(tab(host, ids[0]), 'Enter').defaultPrevented).toBeFalse();
  });

  it('switches sections on hover only for mouse pointers', async () => {
    const host = await render({ open: true });
    const [first, second, third] = PREP_MENU_SECTIONS;

    tab(host, second.id).dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeSection()).toBe(first.id);

    tab(host, third.id).dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeSection()).toBe(third.id);
  });

  it('marks only the current route with aria-current', async () => {
    const host = await render({ open: true, currentPath: '/coding' });
    const current = Array.from(host.querySelectorAll('a[aria-current="page"]')).map((link) => link.getAttribute('href'));

    expect(current).toEqual(['/coding']);

    fixture.componentRef.setInput('currentPath', '/react/interview-questions');
    fixture.detectChanges();
    expect(Array.from(host.querySelectorAll('a[aria-current="page"]')).map((link) => link.getAttribute('href')))
      .toEqual(['/react/interview-questions']);
  });

  it('emits the item, chip, section and route of the clicked link', async () => {
    const host = await render({ open: true });
    const selections: PrepMenuSelection[] = [];
    fixture.componentInstance.itemSelected.subscribe((selection) => selections.push(selection));

    (host.querySelector('[data-testid="test-menu-question_library"]') as HTMLAnchorElement).click();
    (host.querySelector('[data-testid="test-menu-chip-css"]') as HTMLAnchorElement).click();

    expect(selections).toEqual([
      { key: 'question_library', chip: null, section: 'practice', route: '/coding' },
      { key: 'interview_questions', chip: 'css', section: 'practice', route: '/css/interview-questions' },
    ]);
  });

  it('highlights the keyboard-selected card and hides sections while searching', async () => {
    const host = await render({ open: true, highlightKey: 'essential_60' });
    const highlighted = host.querySelector('.pm-card--highlight [data-testid^="test-menu-"]') as HTMLAnchorElement;

    expect(highlighted.getAttribute('data-testid')).toBe('test-menu-essential_60');

    fixture.componentRef.setInput('searching', true);
    fixture.detectChanges();
    expect((host.querySelector('.pm-body') as HTMLElement).hasAttribute('hidden')).toBeTrue();
    expect(hrefs(host).length).toBe(PREP_MENU_ROUTES.length);
  });

  it('keeps the panel center inside the viewport and as close to the trigger as possible', () => {
    expect(prepMenuPanelCenter(1440, 300)).toBe(442);
    expect(prepMenuPanelCenter(1440, 720)).toBe(720);
    expect(prepMenuPanelCenter(1440, 1400)).toBe(998);
    expect(prepMenuPanelCenter(390, 40)).toBe(191);
    expect(prepMenuPanelCenter(390, null)).toBe(195);
  });
});
