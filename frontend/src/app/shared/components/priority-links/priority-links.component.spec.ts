import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import type { PriorityLinkGroup } from '../../../core/content/priority-links';
import { PriorityLinksComponent } from './priority-links.component';

const GROUPS: PriorityLinkGroup[] = [
  {
    id: 'react',
    title: 'React',
    links: [
      { label: 'Stale closures', route: '/react/trivia/react-stale-state-closures' },
      { label: 'StrictMode effects', route: '/react/trivia/react-strictmode-double-invoke-effects' },
    ],
  },
  { id: 'vue', title: 'Vue', links: [{ label: 'Reactivity', route: '/vue/trivia/vue-reactivity-system' }] },
];

describe('PriorityLinksComponent', () => {
  let fixture: ComponentFixture<PriorityLinksComponent>;

  function render(inputs: Partial<PriorityLinksComponent> = {}): HTMLElement {
    fixture = TestBed.createComponent(PriorityLinksComponent);
    Object.assign(fixture.componentInstance, { groups: GROUPS, testId: 'priority-links', ...inputs });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityLinksComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('renders every link as a clean anchor inside a content section, never a navigation landmark', () => {
    const host = render({ heading: 'Concept questions' });
    const section = host.querySelector('[data-testid="priority-links"]') as HTMLElement;

    expect(section.tagName).toBe('SECTION');
    // The link audits only credit anchors outside navigation zones.
    expect(host.querySelector('nav, aside, header, footer, [role="navigation"], [role="complementary"]')).toBeNull();
    const anchors = Array.from(section.querySelectorAll('a'));
    expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
      '/react/trivia/react-stale-state-closures',
      '/react/trivia/react-strictmode-double-invoke-effects',
      '/vue/trivia/vue-reactivity-system',
    ]);
    expect(anchors.map((anchor) => anchor.textContent?.trim())).toEqual(['Stale closures', 'StrictMode effects', 'Reactivity']);
    expect(anchors.every((anchor) => !anchor.hasAttribute('rel'))).toBeTrue();
  });

  it('labels the section with its own heading and nests group headings one level below', () => {
    const host = render({ heading: 'Concept questions', kicker: 'Concepts', description: 'Review the reasoning.' });
    const section = host.querySelector('section') as HTMLElement;
    const heading = host.querySelector('h2') as HTMLElement;

    expect(heading.textContent?.trim()).toBe('Concept questions');
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(Array.from(host.querySelectorAll('h3'), (item) => item.textContent?.trim())).toEqual(['React', 'Vue']);
    expect(host.textContent).toContain('Concepts');
    expect(host.textContent).toContain('Review the reasoning.');
  });

  it('defers to a host-provided heading and keeps the outline consistent at level three', () => {
    const host = render({ headingLevel: 3, labelledBy: 'host-title' });
    const section = host.querySelector('section') as HTMLElement;

    expect(section.getAttribute('aria-labelledby')).toBe('host-title');
    expect(host.querySelector('h2, h3')).toBeNull();
    expect(Array.from(host.querySelectorAll('h4'), (item) => item.textContent?.trim())).toEqual(['React', 'Vue']);
  });

  it('widens only a group holding at least twice the links of the shortest one', () => {
    const groupOf = (id: string, linkCount: number): PriorityLinkGroup => ({
      id,
      title: id,
      links: Array.from({ length: linkCount }, (_, index) => ({ label: `${id} ${index + 1}`, route: `/${id}/${index + 1}` })),
    });
    const host = render({
      groups: [groupOf('system-design', 6), groupOf('react', 4), groupOf('vue', 3)],
      heading: 'Concept questions',
    });

    const wideTitles = Array.from(
      host.querySelectorAll('.priority-links__group--wide .priority-links__group-title'),
      (item) => item.textContent?.trim(),
    );
    expect(wideTitles).toEqual(['system-design']);
  });
});
