import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { CompanyInterviewProcessComponent } from './company-interview-process.component';
import type { CompanyInterviewProcess } from '../../company-previews/company-interview-processes';

const FIXTURE: CompanyInterviewProcess = {
  summary: 'An assessment, a screen and a final loop.',
  caveat: 'Loops differ by team and level.',
  checkedAt: '2026-10-20',
  variants: [
    {
      title: 'Experienced hires',
      note: 'Two reports describe the same order.',
      stages: [
        {
          stage: 'Online assessment',
          format: 'Coding in a browser IDE.',
          appliesTo: 'All levels',
          sources: [{ label: 'Acme hiring guide', url: 'https://jobs.acme.example/guide', kind: 'official', date: '2026-10' }],
          practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
        },
        {
          stage: 'System design',
          format: 'A frontend design round.',
          appliesTo: 'Senior roles',
          sources: [
            { label: 'Taro, Sunnyvale', url: 'https://reports.example/one', kind: 'report', date: '2023-04' },
            { label: 'Blind, US', url: 'https://reports.example/two', kind: 'report', date: '2025-01' },
          ],
        },
      ],
    },
    {
      title: 'Internships',
      stages: [
        {
          stage: 'Technical round',
          format: 'React fundamentals.',
          appliesTo: 'Interns',
          sources: [{ label: 'Taro, Fremont', url: 'https://reports.example/three', kind: 'report', date: '2025-03' }],
        },
      ],
    },
  ],
};

describe('CompanyInterviewProcessComponent', () => {
  async function render(process: CompanyInterviewProcess | null) {
    await TestBed.configureTestingModule({
      imports: [CompanyInterviewProcessComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', process);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one labelled table per variant with a row per stage', async () => {
    const host = await render(FIXTURE);
    const section = host.querySelector('[data-testid="company-interview-process"]');
    expect(section?.getAttribute('aria-labelledby')).toBe('acme-interview-process');
    expect(host.querySelector('#acme-interview-process')?.textContent?.trim()).toBe('Acme frontend interview process');
    expect(host.textContent).toContain('Sources last checked Oct 2026.');

    const tables = Array.from(host.querySelectorAll('table'));
    expect(tables.map((table) => table.getAttribute('aria-labelledby'))).toEqual([
      'acme-interview-process-1',
      'acme-interview-process-2',
    ]);
    expect(host.querySelector('#acme-interview-process-1')?.textContent?.trim()).toBe('Experienced hires');
    expect(tables.map((table) => table.querySelectorAll('tbody tr').length)).toEqual([2, 1]);
    expect(tables[0].querySelector('tbody th[scope="row"]')?.textContent?.trim()).toBe('Online assessment');
    expect(tables[0].querySelector('tbody tr')?.id).toBe('acme-interview-process-1-stage-online-assessment');
  });

  it('labels evidence strength and keeps report links nofollow while official pages stay followed', async () => {
    const host = await render(FIXTURE);
    const strengths = Array.from(host.querySelectorAll('.interview-process__strength')).map((node) => node.textContent?.trim());
    expect(strengths).toEqual(['Official page', '2 public reports, 2023–2025', 'One public report, 2025']);

    const official = host.querySelector('a[href="https://jobs.acme.example/guide"]');
    expect(official?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(official?.getAttribute('target')).toBe('_blank');
    const report = host.querySelector('a[href="https://reports.example/one"]');
    expect(report?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(report?.parentElement?.textContent).toContain('Apr 2023');
  });

  it('keeps each source list behind a toggle for stacked rows, open on request', async () => {
    await TestBed.configureTestingModule({ imports: [CompanyInterviewProcessComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', FIXTURE);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const rows = Array.from(host.querySelectorAll('tbody tr')) as HTMLElement[];
    const toggle = (row: HTMLElement) => row.querySelector('.interview-process__toggle') as HTMLButtonElement;
    const list = (row: HTMLElement) => row.querySelector('.interview-process__sources') as HTMLElement;

    // Every row starts closed, with its links still in the page.
    expect(toggle(rows[0]).textContent?.trim()).toBe('Show the sources');
    expect(toggle(rows[0]).getAttribute('aria-expanded')).toBe('false');
    expect(list(rows[0]).classList).toContain('interview-process__sources--collapsed');
    expect(list(rows[0]).querySelectorAll('a').length).toBeGreaterThan(0);

    // A tap opens that row alone; a second tap closes it.
    toggle(rows[0]).click();
    fixture.detectChanges();
    expect(toggle(rows[0]).textContent?.trim()).toBe('Hide the sources');
    expect(toggle(rows[0]).getAttribute('aria-expanded')).toBe('true');
    expect(list(rows[0]).classList).not.toContain('interview-process__sources--collapsed');
    expect(list(rows[1]).classList).toContain('interview-process__sources--collapsed');
    toggle(rows[0]).click();
    fixture.detectChanges();
    expect(list(rows[0]).classList).toContain('interview-process__sources--collapsed');
  });

  it('links the matching practice page through the router', async () => {
    const host = await render(FIXTURE);
    const practice = host.querySelector('.interview-process__practice a');
    expect(practice?.getAttribute('href')).toBe('/javascript/coding/js-debounce');
    expect(practice?.textContent?.trim()).toBe('Debounce');
  });

  it('sends a practice link with the way back the guide hands it, so a locked task page can return', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyInterviewProcessComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    const returnState = { returnToUrl: '/companies/acme/preview', returnLabel: 'Back to the Acme guide' };
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', FIXTURE);
    fixture.componentRef.setInput('returnState', returnState);
    fixture.detectChanges();
    const practice = fixture.debugElement.query(By.css('.interview-process__practice a'));
    expect(practice.injector.get(RouterLink).state).toEqual(returnState);
    expect(practice.nativeElement.getAttribute('href')).toBe('/javascript/coding/js-debounce');
  });

  it('links a section of the company guide when the round is answered on the page itself', async () => {
    const [experienced, ...rest] = FIXTURE.variants;
    const [assessment, design] = experienced.stages;
    const host = await render({
      ...FIXTURE,
      variants: [
        { ...experienced, stages: [assessment, { ...design, practice: { label: 'Acme values questions', path: '/companies/acme/preview', fragment: 'acme-values' } }] },
        ...rest,
      ],
    });
    const links = [...host.querySelectorAll('.interview-process__practice a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/javascript/coding/js-debounce', '/companies/acme/preview#acme-values']);
  });

  it('names the timed rehearsal of a round as an open link with a Premium tag, for a visitor too, with the way back', async () => {
    const [experienced, ...rest] = FIXTURE.variants;
    const [assessment, design] = experienced.stages;
    const rehearsal = { label: 'Acme coding round, 2 problems in 40 minutes', path: '/javascript/coding/js-debounce' };
    await TestBed.configureTestingModule({ imports: [CompanyInterviewProcessComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    const returnState = { returnToUrl: '/companies/acme/preview', returnLabel: 'Back to the Acme guide' };
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('process', { ...FIXTURE, variants: [{ ...experienced, stages: [{ ...assessment, rehearsal }, design] }, ...rest] });
    fixture.componentRef.setInput('lockPremium', true);
    fixture.componentRef.setInput('returnState', returnState);
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css('[data-testid="company-interview-process-rehearsal"]'));
    expect(lines.length).toBe(1);
    expect(lines[0].nativeElement.textContent.trim()).toMatch(/^Timed rehearsal: /);
    expect(lines[0].query(By.css('.interview-process__tag')).nativeElement.textContent).toBe('Premium');
    const link = lines[0].query(By.css('a'));
    expect(link.nativeElement.textContent).toBe('Acme coding round, 2 problems in 40 minutes');
    // The rehearsal names no Premium task, so it stays readable and followable for a visitor.
    expect(link.nativeElement.getAttribute('href')).toBe('/javascript/coding/js-debounce');
    expect(link.nativeElement.hasAttribute('inert')).toBeFalse();
    expect(link.query(By.css('.premium-locked'))).toBeNull();
    expect(link.injector.get(RouterLink).state).toEqual(returnState);

    // A rehearsal that opens on a Premium page keeps its name but loses its link for a visitor, who reads no link
    // to a Premium page by name; an account follows it.
    const premiumStart = { label: 'Acme coding interview, 2 problems in 45 minutes', path: '/javascript/coding/js-add-strings' };
    fixture.componentRef.setInput('process', { ...FIXTURE, variants: [{ ...experienced, stages: [{ ...assessment, rehearsal: premiumStart }, design] }, ...rest] });
    fixture.detectChanges();
    const plain = fixture.debugElement.query(By.css('[data-testid="company-interview-process-rehearsal"]'));
    expect(plain.query(By.css('a'))).toBeNull();
    expect(plain.nativeElement.textContent).toContain('Timed rehearsal: Acme coding interview, 2 problems in 45 minutes');
    fixture.componentRef.setInput('lockPremium', false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-testid="company-interview-process-rehearsal"] a')).nativeElement.getAttribute('href'))
      .toBe('/javascript/coding/js-add-strings');
  });

  it('uses the title override when the company names the role', async () => {
    const host = await render({ ...FIXTURE, title: 'Acme Front End Engineer interview process' });
    expect(host.querySelector('#acme-interview-process')?.textContent?.trim()).toBe('Acme Front End Engineer interview process');
  });

  it('renders nothing for a company without a process entry', async () => {
    const host = await render(null);
    expect(host.querySelector('[data-testid="company-interview-process"]')).toBeNull();
    expect(host.textContent?.trim()).toBe('');
  });

  it('keeps the name of a Premium practice page under a blur for a viewer without Premium, and free ones open', async () => {
    const premium: CompanyInterviewProcess = {
      ...FIXTURE,
      variants: [{
        ...FIXTURE.variants[0],
        stages: [
          { ...FIXTURE.variants[0].stages[0], practice: { label: 'Chips input in React', path: '/react/coding/react-chips-input-autocomplete' } },
          { ...FIXTURE.variants[0].stages[1], practice: { label: 'Closures', path: '/javascript/trivia/js-closures' } },
        ],
      }],
    };
    await TestBed.configureTestingModule({ imports: [CompanyInterviewProcessComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('process', premium);
    fixture.componentRef.setInput('lockPremium', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const locked = host.querySelector('.interview-process__locked') as HTMLAnchorElement;
    expect(locked.textContent?.trim()).toBe('Chips input in React');
    expect(locked.hasAttribute('inert')).toBeTrue();
    expect(locked.querySelector('.premium-locked')?.hasAttribute('data-nosnippet')).toBeTrue();
    expect(host.querySelector('.interview-process__tag')?.textContent).toBe('Premium task for this round');
    expect(host.querySelectorAll('.interview-process__locked').length).toBe(1);

    fixture.componentRef.setInput('lockPremium', false);
    fixture.detectChanges();
    expect(host.querySelector('.interview-process__locked')).toBeNull();
    expect(Array.from(host.querySelectorAll('.interview-process__practice a')).map((link) => link.textContent?.trim()))
      .toEqual(['Chips input in React', 'Closures']);
  });

  it('keeps the Premium tag beside a Premium name a free account reads, and drops it for a member', async () => {
    const premium: CompanyInterviewProcess = {
      ...FIXTURE,
      variants: [{
        ...FIXTURE.variants[0],
        stages: [
          { ...FIXTURE.variants[0].stages[0], practice: { label: 'Chips input in React', path: '/react/coding/react-chips-input-autocomplete' } },
          { ...FIXTURE.variants[0].stages[1], practice: { label: 'Closures', path: '/javascript/trivia/js-closures' } },
        ],
      }],
    };
    await TestBed.configureTestingModule({ imports: [CompanyInterviewProcessComponent], providers: [provideRouter([])] }).compileComponents();
    const auth = TestBed.inject(AuthService);
    const user = { _id: 'free-user', username: 'free_user', email: 'free@example.com', role: 'user', accessTier: 'free' } as unknown as User;
    auth.user.set(user);
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('process', premium);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.interview-process__locked')).toBeNull();
    const cells = Array.from(host.querySelectorAll('.interview-process__practice'));
    expect(cells.map((cell) => cell.querySelector('a')?.textContent?.trim())).toEqual(['Chips input in React', 'Closures']);
    expect(cells.map((cell) => cell.querySelector('.interview-process__tag')?.textContent ?? null)).toEqual(['Premium task for this round', null]);

    auth.user.set({ ...user, accessTier: 'premium' } as unknown as User);
    fixture.detectChanges();
    expect(host.querySelectorAll('.interview-process__tag').length).toBe(0);
  });

  it('behind the gate, keeps what every round asks open and replaces the evidence links with their counts and a tag', async () => {
    await TestBed.configureTestingModule({ imports: [CompanyInterviewProcessComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('process', FIXTURE);
    fixture.componentRef.setInput('showSourceLinks', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    // Every "What happens" cell reads in full; nothing in the table sits under a blur.
    expect(host.textContent).toContain('Coding in a browser IDE.');
    expect(host.textContent).toContain('React fundamentals.');
    expect(host.textContent).toContain('A frontend design round.');
    expect(host.querySelector('.premium-locked')).toBeNull();
    // The counts stay with a "Free account" tag, the links go, the practice link stays.
    const strengths = Array.from(host.querySelectorAll('.interview-process__strength'));
    expect(strengths.length).toBe(3);
    expect(strengths.every((cell) => cell.nextElementSibling?.classList.contains('interview-process__tag'))).toBeTrue();
    expect(host.querySelector('.interview-process__tag')?.textContent).toBe('Free account');
    expect(host.querySelector('.interview-process__sources')).toBeNull();
    expect(host.querySelector('a[href="https://reports.example/one"]')).toBeNull();
    expect(host.querySelector('.interview-process__practice a')?.getAttribute('href')).toBe('/javascript/coding/js-debounce');

    fixture.componentRef.setInput('showSourceLinks', true);
    fixture.detectChanges();
    expect(host.querySelector('.interview-process__tag')).toBeNull();
    expect(host.querySelectorAll('.interview-process__sources a').length).toBe(4);
  });
});
