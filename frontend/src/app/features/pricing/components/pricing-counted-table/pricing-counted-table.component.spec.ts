import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PRICING_COUNTS, PricingCounts } from '../../../../generated/pricing-counts';
import { isPremiumRoute } from '../../../../core/utils/premium-route.util';
import {
  buildCountedRows,
  formatCountsMonth,
  PricingCountedExampleClick,
  PricingCountedTableComponent,
} from './pricing-counted-table.component';

const area = (free: number, premium: number, premiumHard = 0) => ({ total: free + premium, free, premium, premiumHard });
const example = (route: string, label: string) => ({ route, label });

const FIXTURE: PricingCounts = {
  updatedMonth: '2026-11',
  companyGuides: 30,
  premiumRehearsals: 1,
  areas: {
    react: area(6, 33, 3),
    angular: area(4, 23),
    vue: area(4, 22),
    javascript: area(44, 52, 11),
    debug: area(10, 3, 1),
    htmlCss: area(19, 1),
    systemDesign: area(7, 20, 11),
    trivia: area(239, 3, 1),
    tradeoffBattles: area(10, 23, 4),
    incidents: area(5, 1),
  },
  examples: {
    react: [example('/react/coding/react-pagination-table', 'Paginated Data Table'), example('/react/coding/react-shopping-cart', 'Shopping Cart')],
    angular: [example('/angular/coding/angular-star-rating', 'Star Rating')],
    vue: [example('/vue/coding/vue-tabs-switcher', 'Tabs')],
    javascript: [example('/javascript/coding/js-throttle', 'Throttle')],
    debug: [example('/javascript/debug/js-debug-bug-squash-invoices', 'Invoicing repo bug squash')],
    systemDesign: [example('/system-design/hotel-search-page-frontend', 'Hotel Search')],
    tradeoffsIncidents: [example('/incidents/context-rerender-storm', 'Context rerender storm')],
    companyGuides: [{ route: '/react/coding/react-chat-streaming-ui', label: 'OpenAI streaming chat UI', company: 'openai' }],
    formats: [{ route: '/companies/meta/preview', label: 'Meta coding round', company: 'meta' }],
  },
};

describe('PricingCountedTableComponent', () => {
  let fixture: ComponentFixture<PricingCountedTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingCountedTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PricingCountedTableComponent);
    fixture.componentRef.setInput('counts', FIXTURE);
    fixture.detectChanges();
  });

  const text = (selector: string) =>
    ((fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  // The commas between examples are drawn by CSS, so the examples cell reads as its links joined here.
  const cells = (row: string) => {
    const tr = (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="pricing-counted-row-${row}"]`)!;
    const [area, free, premium, examples] = Array.from(tr.querySelectorAll('th, td'));
    const read = (cell: Element) => (cell.textContent || '').replace(/\s+/g, ' ').trim();
    return [read(area), read(free), read(premium), Array.from(examples.querySelectorAll('a')).map(read).join(', ')];
  };

  it('reads the area, free and Premium counts and the locked examples from the counts, in reading order', () => {
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'))
      .map((row) => row.getAttribute('data-testid'));
    expect(rows).toEqual([
      'pricing-counted-row-react',
      'pricing-counted-row-angular',
      'pricing-counted-row-vue',
      'pricing-counted-row-javascript',
      'pricing-counted-row-debug',
      'pricing-counted-row-systemDesign',
      'pricing-counted-row-tradeoffsIncidents',
      'pricing-counted-row-companyGuides',
      'pricing-counted-row-formats',
    ]);
    expect(text('.pct__title')).toBe('What you get, counted');
    expect(cells('react')).toEqual(['React coding', '6 tasks', '33 tasks, 3 Hard', 'Paginated Data Table, Shopping Cart']);
    // A row without Hard Premium tasks does not mention the difficulty.
    expect(cells('angular')).toEqual(['Angular coding', '4 tasks', '23 tasks', 'Star Rating']);
    expect(cells('javascript')).toEqual(['JavaScript coding', '44 tasks', '52 tasks, 11 Hard', 'Throttle']);
    expect(cells('debug')).toEqual(['Debug tasks', '10 tasks', '3 tasks', 'Invoicing repo bug squash']);
    expect(cells('systemDesign')).toEqual(['System design', '7 full walkthroughs', '20 walkthroughs', 'Hotel Search']);
    expect(cells('tradeoffsIncidents')).toEqual([
      'Tradeoff battles and incidents', '10 battles, 5 incidents', '23 battles, 1 incident', 'Context rerender storm',
    ]);
    expect(cells('companyGuides')).toEqual([
      'Company guides', 'All 30, with their sources cited', 'The Premium prompts inside them', 'OpenAI streaming chat UI',
    ]);
    expect(cells('formats')[2]).toBe(
      '1 timed rehearsal of company rounds, the merge request review, find-the-bug and bug squash formats, Pressure Mode on Premium tasks',
    );
    // What the rows leave out is named under the table, so every Premium item is accounted for.
    expect(text('[data-testid="pricing-counted-note"]')).toBe(
      'Counts from the catalog, updated November 2026. HTML and CSS: 19 of 20 tasks free. Concept questions: 239 of 242 free.',
    );
  });

  it('links every locked example and reports which row it came from', () => {
    const emitted: PricingCountedExampleClick[] = [];
    fixture.componentInstance.exampleClick.subscribe((click) => emitted.push(click));
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.pct__examples a')) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toContain('/javascript/debug/js-debug-bug-squash-invoices');
    const throttle = links.find((link) => link.textContent?.trim() === 'Throttle')!;
    throttle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(emitted).toEqual([{ previewType: 'counted_javascript', destination: '/javascript/coding/js-throttle' }]);
  });

  it('names a month, not a raw stamp', () => {
    expect(formatCountsMonth('2026-11')).toBe('November 2026');
    expect(formatCountsMonth('2027-01')).toBe('January 2027');
    expect(formatCountsMonth('soon')).toBe('soon');
  });

  it('only names locked examples that a free visitor finds locked', () => {
    // The generator checks every example against the practice registry; this checks the published counts against the
    // route list the paywall itself uses, for the question pages it covers.
    const rows = buildCountedRows(PRICING_COUNTS);
    const questionExamples = rows
      .filter((row) => row.key !== 'formats' && row.key !== 'tradeoffsIncidents')
      .flatMap((row) => row.examples);
    expect(questionExamples.length).toBeGreaterThan(0);
    for (const item of questionExamples) {
      expect(isPremiumRoute(item.route)).withContext(item.route).toBeTrue();
    }
    for (const item of rows.find((row) => row.key === 'formats')!.examples) {
      expect(item.route).toMatch(/^\/companies\/[a-z0-9-]+\/preview$/);
    }
  });
});
