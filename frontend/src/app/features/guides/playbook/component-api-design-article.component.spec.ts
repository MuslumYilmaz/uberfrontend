import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ComponentApiDesignArticle } from './component-api-design-article.component';

describe('ComponentApiDesignArticle', () => {
  let fixture: ComponentFixture<ComponentApiDesignArticle>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/api-design');

    await TestBed.configureTestingModule({
      imports: [ComponentApiDesignArticle],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentApiDesignArticle);
    fixture.componentInstance.readerPromise = 'Custom API guide promise.';
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    window.history.pushState({}, '', originalPath || '/');
  });

  function text(): string {
    return (fixture.nativeElement.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hrefs(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .map((anchor) => anchor.getAttribute('href') || '');
  }

  it('renders the component API practice map shell, freshness, and proof CTA band', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const h1 = host.querySelector('h1') as HTMLHeadingElement | null;
    const freshness = host.querySelector('[data-testid="api-guide-freshness"]');
    const proof = host.querySelector('[data-testid="api-guide-practice-proof"]') as HTMLElement | null;
    const links = Array.from(proof?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    const proofText = proof?.textContent || '';

    expect(h1?.textContent?.trim()).toBe('Component API Design for Frontend Interviews: Props, Events, and Trade-offs');
    expect(freshness?.textContent || '').toContain('Last updated: June 2026');
    expect(freshness?.textContent || '').toContain('Author: FrontendAtlas Editorial');
    expect(hostText).toContain('Custom API guide promise.');
    expect(hostText).toContain('Component API design is the contract');
    expect(hostText).toContain('frontend component API design interview practice map');
    expect(hostText).toContain('Quick answer: how to design a component API');
    expect(hostText).toContain('Start by naming the consumer and the state owner.');
    expect(hostText).toContain('Score signal');
    expect(hostText).toContain('How this guide was reviewed');
    expect(hostText).toContain('reviewed against our UI component drill set');
    expect(hostText).toContain('live coding editor checks');
    expect(hostText).toContain('interview blueprint scoring rubrics');
    expect(hostText).toContain('official component library patterns');
    expect(hostText).toContain('timed decision checklist');
    expect(proofText).toContain('500+');
    expect(proofText).toContain('practice questions');
    expect(proofText).toContain('Component API');
    expect(proofText).toContain('drills');
    expect(proofText).toContain('Live');
    expect(proofText).toContain('editor + checks');
    expect(proofText).toContain('Props/events/a11y');
    expect(proofText).toContain('contracts');
    expect(links[0]?.getAttribute('href') || '').toContain('/coding?view=formats&category=ui');
    expect(links[1]?.getAttribute('href') || '').toBe('/guides/interview-blueprint/ui-interviews');
  });

  it('renders the decision matrix and interactive API surface trade-off demo', () => {
    const host = fixture.nativeElement as HTMLElement;
    let hostText = text();
    const matrix = host.querySelector('[data-testid="api-decision-matrix"]') as HTMLElement | null;
    const tradeoff = host.querySelector('[data-testid="api-surface-tradeoff"]') as HTMLElement | null;
    const buttons = Array.from(tradeoff?.querySelectorAll('.tradeoff-tab') || []) as HTMLButtonElement[];

    expect(hostText).toContain('Component API decision matrix');
    expect(matrix?.textContent || '').toContain('Consumer need');
    expect(matrix?.textContent || '').toContain('State ownership');
    expect(matrix?.textContent || '').toContain('Composition model');
    expect(matrix?.textContent || '').toContain('Event payload');
    expect(matrix?.textContent || '').toContain('A11y and styling');
    expect(matrix?.textContent || '').toContain('Escape hatch');
    expect(hostText).toContain('Try the API surface trade-off');
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Prop-heavy', 'Composed', 'Controlled']);
    expect(hostText).toContain('The caller owns custom content while the component keeps button semantics and focus behavior.');
    expect(hostText).toContain('Composition needs clear a11y guidance');

    buttons[0].click();
    fixture.detectChanges();
    hostText = text();
    expect(hostText).toContain('iconName="download"');
    expect(hostText).toContain('every new variation becomes another top-level prop');
    expect(hostText).toContain('boolean soup');

    buttons[2].click();
    fixture.detectChanges();
    hostText = text();
    expect(hostText).toContain('pressed={isExporting}');
    expect(hostText).toContain('parent flows can coordinate loading, analytics, and reset');
    expect(hostText).toContain('Controlled APIs add callback and sync edge cases');
  });

  it('renders 10 component API prompt cards with direct practice links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const hostText = text();
    const cards = host.querySelectorAll('[data-testid="api-prompt-cards"] .prompt-card');
    const linkTargets = hrefs();

    expect(hostText).toContain('Component API design patterns interviewers ask about');
    expect(cards.length).toBe(10);
    expect(hostText).toContain('Modal / Confirm Dialog');
    expect(hostText).toContain('Public surface');
    expect(hostText).toContain('Tabs');
    expect(hostText).toContain('State model');
    expect(hostText).toContain('Accordion');
    expect(hostText).toContain('Autocomplete / Combobox');
    expect(hostText).toContain('Consumer API');
    expect(hostText).toContain('Contact Form');
    expect(hostText).toContain('Props/events');
    expect(hostText).toContain('Data Table / Pagination');
    expect(hostText).toContain('Dynamic Table');
    expect(hostText).toContain('Nested Checkbox Tree');
    expect(hostText).toContain('Star Rating');
    expect(hostText).toContain('Progress Bar');
    expect(hostText).toContain('A11y contract');
    expect(hostText).toContain('Trade-off/test focus');
    expect(linkTargets).toContain('/html/coding/html-dialog-confirm-a11y');
    expect(linkTargets).toContain('/react/coding/react-tabs-switcher');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
    expect(linkTargets).toContain('/react/coding/react-contact-form-starter');
    expect(linkTargets).toContain('/react/coding/react-pagination-table');
    expect(linkTargets).toContain('/react/coding/react-nested-checkboxes');
  });

  it('renders API decision sections for contracts and trade-offs', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Component API decision framework');
    expect(hostText).toContain('Controlled vs uncontrolled');
    expect(hostText).toContain('value/defaultValue/onValueChange');
    expect(hostText).toContain('open/defaultOpen/onOpenChange');
    expect(hostText).toContain('state ownership');
    expect(hostText).toContain('Composition vs configuration');
    expect(hostText).toContain('children');
    expect(hostText).toContain('named slots');
    expect(hostText).toContain('compound components');
    expect(hostText).toContain('Prop explosion is a smell');
    expect(hostText).toContain('Event naming and payloads');
    expect(hostText).toContain('onSelect({ value, item, reason })');
    expect(hostText).toContain('raw DOM events');
    expect(hostText).toContain('Styling surface');
    expect(hostText).toContain('variant');
    expect(hostText).toContain('size');
    expect(hostText).toContain('className');
    expect(hostText).toContain('CSS variables');
    expect(hostText).toContain('Escape hatches');
    expect(hostText).toContain('ref');
    expect(hostText).toContain('asChild');
    expect(hostText).toContain('slotProps');
    expect(hostText).toContain('render hooks');
    expect(hostText).toContain('Accessibility as API');
    expect(hostText).toContain('ARIA linkage');
    expect(hostText).toContain('focus restore');
    expect(hostText).toContain('focus trap');
    expect(hostText).toContain('Weak vs strong component API');
    expect(hostText).toContain('Practice note from FrontendAtlas drills');
    expect(hostText).toContain('weak answers often add one prop per requested variation');
    expect(hostText).toContain('state ownership, composition boundaries, and event payloads');
    expect(hostText).toContain('Button icon');
    expect(hostText).toContain('iconName');
    expect(hostText).toContain('renderIcon');
    expect(hostText).toContain('Modal actions');
    expect(hostText).toContain('Data Table columns');
    expect(hostText).toContain('TypeScript API guardrails');
    expect(hostText).toContain('ComponentPropsWithoutRef');
    expect(hostText).toContain('Controlled/uncontrolled union');
    expect(hostText).toContain('Mutually exclusive props');
    expect(hostText).toContain('Discriminated unions');
    expect(hostText).toContain('forwardRef');
    expect(hostText).toContain('Library patterns interviewers recognize');
    expect(hostText).toContain('The official docs below are references for the pattern vocabulary');
    expect(hostText).toContain('React controlled/uncontrolled');
    expect(hostText).toContain('Radix asChild');
    expect(hostText).toContain('MUI slotProps');
    expect(hostText).toContain('React Aria hooks');
    expect(hostText).toContain('Headless UI render props');
    expect(linkTargets).toContain('https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components');
    expect(linkTargets).toContain('https://www.radix-ui.com/primitives/docs/guides/composition');
    expect(linkTargets).toContain('https://mui.com/material-ui/customization/overriding-component-structure/');
    expect(linkTargets).toContain('https://react-spectrum.adobe.com/react-aria/hooks.html');
    expect(linkTargets).toContain('https://headlessui.com/react/menu#using-render-props');
  });

  it('renders worked examples for Modal, Tabs, and Autocomplete API contracts', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('Worked examples: API contracts interviewers can score');
    expect(hostText).toContain('Modal/Dialog API');
    expect(hostText).toContain('open/defaultOpen/onOpenChange');
    expect(hostText).toContain('slots for header/body/footer');
    expect(hostText).toContain('Escape policy');
    expect(hostText).toContain('a11y contract');
    expect(hostText).toContain('Tabs API');
    expect(hostText).toContain('controlled active value');
    expect(hostText).toContain('item ids');
    expect(hostText).toContain('roving tabindex');
    expect(hostText).toContain('disabled tab policy');
    expect(hostText).toContain('Autocomplete API');
    expect(hostText).toContain('inputValue');
    expect(hostText).toContain('selected value');
    expect(hostText).toContain('async loading/error/empty states');
    expect(hostText).toContain('stale response policy');
    expect(hostText).toContain('renderOption');
    expect(linkTargets).toContain('/html/coding/html-dialog-confirm-a11y');
    expect(linkTargets).toContain('/react/coding/react-tabs-switcher');
    expect(linkTargets).toContain('/react/coding/react-autocomplete-search-starter');
  });

  it('renders round flow, scoring rubric, skip/prioritize guidance, format links, and FAQ', () => {
    const hostText = text();
    const linkTargets = hrefs();

    expect(hostText).toContain('45/60-minute component API round flow');
    expect(hostText).toContain('Spend the first minutes clarifying consumers and state ownership.');
    expect(hostText).toContain('Clarify consumers, data shape, ownership, keyboard expectations, and required customization.');
    expect(hostText).toContain('Define contract: props, events, slots, state ownership, accessibility labels, and styling surface.');
    expect(hostText).toContain('What interviewers score');
    expect(hostText).toContain('Clear contract');
    expect(hostText).toContain('State ownership');
    expect(hostText).toContain('Event payloads');
    expect(hostText).toContain('A11y contract');
    expect(hostText).toContain('What to skip vs prioritize');
    expect(hostText).toContain('Prioritize the contract, a11y, state ownership, event payloads, and one dry run.');
    expect(hostText).toContain('Prioritize');
    expect(hostText).toContain('Skip unless asked');
    expect(hostText).toContain('Component API design FAQ');
    expect(hostText).toContain('What is component API design?');
    expect(hostText).toContain('How do I practice component API design for frontend interviews?');
    expect(hostText).toContain('What is the controlled vs uncontrolled component API pattern?');
    expect(hostText).toContain('When should I use compound components or slots?');
    expect(hostText).toContain('How should component APIs expose events and accessibility?');
    expect(hostText).toContain('How should TypeScript shape a component API?');
    expect(hostText).toContain('Which real library patterns help in component API interviews?');
    expect(hostText).toContain('How is this component API design guide reviewed?');
    expect(hostText).toContain('How do I choose between prop-heavy, composed, and controlled component APIs?');
    expect(linkTargets.some((href) => href.includes('/coding?view=formats&category=ui'))).toBeTrue();
    expect(linkTargets).toContain('/guides/interview-blueprint/ui-interviews');
    expect(linkTargets).toContain('/guides/interview-blueprint/coding-interviews');
  });
});
