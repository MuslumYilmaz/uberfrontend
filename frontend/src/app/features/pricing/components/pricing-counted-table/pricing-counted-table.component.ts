import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRICING_COUNTS, PricingCountedExample, PricingCounts } from '../../../../generated/pricing-counts';

export type PricingCountedExampleClick = { previewType: string; destination: string };

export type PricingCountedRow = {
  key: string;
  label: string;
  free: string;
  premium: string;
  examples: readonly PricingCountedExample[];
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11" reads "November 2026"; anything else is shown as it came. */
export function formatCountsMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : value;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const tasks = (n: number) => count(n, 'task', 'tasks');
// "Hard" is the coding lists' own difficulty label; a row without Hard Premium tasks does not mention it.
const tasksWithHard = (n: number, hard: number) => (hard > 0 ? `${tasks(n)}, ${hard} Hard` : tasks(n));

/** The table's rows, in reading order, from the generated counts; every figure and example comes from the catalog. */
export function buildCountedRows(counts: PricingCounts): PricingCountedRow[] {
  const { areas, examples } = counts;
  const coding = (key: 'react' | 'angular' | 'vue' | 'javascript', label: string): PricingCountedRow => ({
    key,
    label,
    free: tasks(areas[key].free),
    premium: tasksWithHard(areas[key].premium, areas[key].premiumHard),
    examples: examples[key],
  });
  return [
    coding('react', 'React coding'),
    coding('angular', 'Angular coding'),
    coding('vue', 'Vue coding'),
    coding('javascript', 'JavaScript coding'),
    {
      key: 'debug',
      label: 'Debug tasks',
      free: tasks(areas.debug.free),
      premium: tasks(areas.debug.premium),
      examples: examples.debug,
    },
    {
      key: 'systemDesign',
      label: 'System design',
      free: count(areas.systemDesign.free, 'full walkthrough', 'full walkthroughs'),
      premium: count(areas.systemDesign.premium, 'walkthrough', 'walkthroughs'),
      examples: examples.systemDesign,
    },
    {
      key: 'tradeoffsIncidents',
      label: 'Tradeoff battles and incidents',
      free: `${count(areas.tradeoffBattles.free, 'battle', 'battles')}, ${count(areas.incidents.free, 'incident', 'incidents')}`,
      premium: `${count(areas.tradeoffBattles.premium, 'battle', 'battles')}, ${count(areas.incidents.premium, 'incident', 'incidents')}`,
      examples: examples.tradeoffsIncidents,
    },
    {
      key: 'companyGuides',
      label: 'Company guides',
      free: `All ${counts.companyGuides}, with their sources cited`,
      premium: 'The Premium prompts inside them',
      examples: examples.companyGuides,
    },
    {
      key: 'formats',
      label: 'Interview formats',
      // The timer lives in the JavaScript workspace only; framework tasks have none yet.
      free: 'Timed practice on any JavaScript task you can open, Pressure Mode on some free framework tasks',
      premium: `${count(counts.premiumRehearsals, 'timed rehearsal', 'timed rehearsals')} of company rounds, the merge request review, find-the-bug and bug squash formats, Pressure Mode on Premium tasks`,
      examples: examples.formats,
    },
  ];
}

/**
 * The pricing page's "What you get, counted" table. It lives with the page, not with the shared plans section, so
 * the homepage, which shows only the plans, does not ship the counts.
 */
@Component({
  selector: 'app-pricing-counted-table',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./pricing-counted-table.component.css'],
  template: `
    <section class="pct" aria-labelledby="pricing-counted-title" data-testid="pricing-counted-table">
      <h2 id="pricing-counted-title" class="pct__title">What you get, counted</h2>
      <div class="pct__frame">
        <table class="pct__table" aria-labelledby="pricing-counted-title">
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Free</th>
              <th scope="col">Premium</th>
              <th scope="col">Locked examples</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.key) {
              <tr [attr.data-testid]="'pricing-counted-row-' + row.key">
                <th scope="row">{{ row.label }}</th>
                <td data-label="Free">{{ row.free }}</td>
                <td class="pct__premium" data-label="Premium">{{ row.premium }}</td>
                <td data-label="Locked examples">
                  <ul class="pct__examples">
                    @for (example of row.examples; track example.route + example.label) {
                      <li>
                        <a
                          [routerLink]="example.route"
                          (click)="exampleClick.emit({ previewType: 'counted_' + row.key, destination: example.route })">{{ example.label }}</a>
                      </li>
                    }
                  </ul>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="pct__note" data-testid="pricing-counted-note">{{ note }}</p>
    </section>
  `,
})
export class PricingCountedTableComponent {
  @Input() set counts(value: PricingCounts) {
    this.rows = buildCountedRows(value);
    const { htmlCss, trivia } = value.areas;
    this.note = `Counts from the catalog, updated ${formatCountsMonth(value.updatedMonth)}. `
      + `HTML and CSS: ${htmlCss.free} of ${htmlCss.total} tasks free. Concept questions: ${trivia.free} of ${trivia.total} free.`;
  }
  @Output() exampleClick = new EventEmitter<PricingCountedExampleClick>();

  rows: PricingCountedRow[] = [];
  note = '';

  constructor() {
    this.counts = PRICING_COUNTS;
  }
}
