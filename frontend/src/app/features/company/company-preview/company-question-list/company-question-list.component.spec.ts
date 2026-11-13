import { TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import type { CompanyInterviewProcess, InterviewProcessSource } from '../../../../shared/company-previews/company-interview-processes';
import { summariseQuestionList } from '../../../../shared/company-previews/company-question-list';
import { COMPANY_GUIDE_FEATURES, type CompanyGuideFeatures } from '../company-guide-features';
import type { FreeUnlock } from '../../../../core/models/free-unlock.model';
import { CompanyQuestionListComponent, type CompanyGuideViewer, type FreeUnlockState } from './company-question-list.component';

const account = (id: string, date: string): InterviewProcessSource => ({
  label: 'Taro',
  url: `https://www.jointaro.com/interviews/companies/acme/experiences/frontend-engineer-united-states-march-3-2026-no-offer-neutral-${id}/`,
  kind: 'report',
  date,
});

function acme(rows: number): CompanyInterviewProcess {
  return {
    summary: '',
    caveat: '',
    checkedAt: '2026-11-01',
    variants: [{ title: 'Engineers', stages: [{ stage: 'Coding round', format: 'f', appliesTo: 'a', sources: [] }] }],
    questions: [
      { id: 'open-one', round: 'Coding round', kind: 'React build', topic: 'Open widget', question: 'Build the open widget.', sources: [account('0000000a', '2026-10')] },
      { id: 'with-task', round: 'Coding round', kind: 'React debugging', topic: 'Locked widget fix', question: 'Fix the locked widget.', sources: [account('0000000b', '2024-03')], practice: { label: 'Fix it', path: '/react/coding/react-x' } },
      { id: 'bare', kind: 'Algorithm', topic: 'Bare puzzle', question: 'Solve the bare puzzle.', sources: [account('0000000c', '2025-01')] },
      ...Array.from({ length: rows - 3 }, (_, i) => ({ id: `extra-${i}`, kind: 'Algorithm' as const, topic: `Extra puzzle ${i}`, question: `Extra ${i}.`, sources: [account(`000001${String(i).padStart(2, '0')}`, '2023-01')] })),
    ],
    behaviouralQuestions: [{ id: 'why-acme', question: 'Why Acme?', sources: [account('0000000d', '2025-06')] }],
  };
}

describe('CompanyQuestionListComponent', () => {
  let fixture: ComponentFixture<CompanyQuestionListComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  function create(
    viewer: CompanyGuideViewer,
    options: { features?: Partial<CompanyGuideFeatures>; rows?: number; today?: string; freeUnlock?: FreeUnlock; unlockState?: FreeUnlockState } = {},
  ) {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    TestBed.configureTestingModule({
      imports: [CompanyQuestionListComponent],
      providers: [provideRouter([]), { provide: AnalyticsService, useValue: analytics }],
    });
    // The prerender's day travels with the page; the list reads it instead of the reader's clock.
    if (options.today) TestBed.inject(TransferState).set(makeStateKey<string>('company-guide-today'), options.today);
    const process = acme(options.rows ?? 4);
    fixture = TestBed.createComponent(CompanyQuestionListComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', process);
    fixture.componentRef.setInput('summary', summariseQuestionList(process));
    fixture.componentRef.setInput('viewer', viewer);
    fixture.componentRef.setInput('features', { ...COMPANY_GUIDE_FEATURES, ...options.features });
    fixture.componentRef.setInput('offer', { price: '$24', priceNote: 'lower prices in many countries' });
    fixture.componentRef.setInput('pricingSource', 'company_preview_acme_list');
    if (options.freeUnlock) fixture.componentRef.setInput('freeUnlock', options.freeUnlock);
    if (options.unlockState) fixture.componentRef.setInput('unlockState', options.unlockState);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLElement>('[data-testid="company-question-row"]'));
  const choose = (host: HTMLElement, index: number) => {
    (rows(host)[index].querySelector('.cq-row__locked') as HTMLButtonElement).click();
    fixture.detectChanges();
    return rows(host)[index].querySelector('[data-testid="company-question-choice"]') as HTMLElement;
  };

  it('offers a visitor the free unlock only on a row with a practice task or answer guide, beside Premium', () => {
    const host = create('guest');
    const unlockable = choose(host, 1);
    const links = Array.from(unlockable.querySelectorAll('a')).map((a) => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Open this one free with an account', '/auth/signup?redirectTo=%2Fcompanies%2Facme%2Fpreview'],
      ['Unlock all 3 with Premium', '/pricing?src=company_preview_acme_list'],
    ]);
    expect(analytics.track).toHaveBeenCalledWith('company_question_locked_clicked', jasmine.objectContaining({ question_id: 'with-task', unlockable: true }));

    const bare = choose(host, 2);
    expect(bare.textContent).not.toContain('Open this one free');
    expect(bare.textContent).toContain('the free unlock does not apply to it');
  });

  it('lets an account spend its free unlock on the row, through the parent', () => {
    const host = create('account');
    const spent: string[] = [];
    fixture.componentInstance.unlock.subscribe((id) => spent.push(id));
    const choice = choose(host, 1);
    (choice.querySelector('button') as HTMLButtonElement).click();
    expect(spent).toEqual(['with-task']);
    expect(analytics.track).toHaveBeenCalledWith('company_question_choice', jasmine.objectContaining({ question_id: 'with-task', choice: 'free_unlock' }));
  });

  it('opens every row with the locked-questions switch off, the SEO rollback', () => {
    const host = create('guest', { features: { lockedQuestions: false } });
    expect(host.querySelectorAll('.premium-locked').length).toBe(0);
    expect(rows(host).every((row) => row.querySelector('.cq-row__title'))).toBeTrue();
    expect(host.querySelector('[data-testid="company-question-offer"]')).toBeNull();
  });

  it('keeps the lock but drops counts, NEW, the free unlock and the offer with the Premium-pull switch off', () => {
    const host = create('guest', { features: { premiumPull: false }, today: '2026-11-13' });
    expect(host.querySelectorAll('.cq-row--locked').length).toBe(3);
    expect(host.querySelector('[data-testid="company-question-new"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-question-allowance"]')).toBeNull();
    expect(host.querySelector('[data-testid="company-question-offer"]')).toBeNull();
    expect(choose(host, 1).textContent).not.toContain('Open this one free');
  });

  it('tags a question NEW until 60 days after its newest account month, by the prerender date', () => {
    expect(create('guest', { today: '2026-12-30' }).querySelectorAll('[data-testid="company-question-new"]').length).toBe(1);
    TestBed.resetTestingModule();
    expect(create('guest', { today: '2026-12-31' }).querySelectorAll('[data-testid="company-question-new"]').length).toBe(0);
  });

  it('shows the first eight rows until the reader asks for all, with every row in the page', () => {
    const host = create('guest', { rows: 11 });
    expect(rows(host).length).toBe(11);
    expect(rows(host).filter((row) => row.classList.contains('cq-row--hidden')).length).toBe(3);
    (host.querySelector('[data-testid="company-question-more"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows(host).filter((row) => row.classList.contains('cq-row--hidden')).length).toBe(0);
  });

  it('names each locked question by its topic, outside the lock, and keeps the wording locked', () => {
    const host = create('guest');
    const row = host.querySelectorAll<HTMLElement>('[data-testid="company-question-row"]')[1];
    const topic = row.querySelector('[data-testid="company-question-topic"]') as HTMLElement;
    expect(topic.textContent?.trim()).toBe('Locked widget fix');
    expect(topic.closest('.premium-locked')).toBeNull();
    expect(row.querySelector('.cq-row__question.premium-locked')?.textContent?.trim()).toBe('Fix the locked widget.');
    expect(row.querySelector('.cq-row__locked')?.getAttribute('aria-label')).toContain('Locked widget fix');
    // The open row shows its own title, not a second topic line.
    expect(host.querySelector('[data-testid="company-question-row"]')?.querySelector('[data-testid="company-question-topic"]')).toBeNull();
  });

  it('shows the behavioural questions open, with how often they were reported', () => {
    const host = create('guest');
    const group = host.querySelector('[data-testid="company-question-behavioural"]') as HTMLElement;
    expect(group.querySelector('.premium-locked')).toBeNull();
    expect(group.textContent).toContain('Why Acme?');
    expect(group.textContent).toContain('Reported in 1 account · Jun 2025');
    // One account behind the group reads as one source, not as "the same reports".
    expect(group.querySelector('.cq-behavioural__intro')?.textContent?.trim()).toBe('Open to everyone: 1 question from one public source.');
  });

  describe('the free unlock', () => {
    const spent = (company: string, questionId: string): FreeUnlock => ({ company, questionId, practiceId: 'react-x', unlockedAt: '2026-11-13T10:00:00.000Z' });

    it('passes a visitor\'s choice up, so it can be kept until they have an account, and says the choice is final', () => {
      const host = create('guest');
      const chosen: string[] = [];
      fixture.componentInstance.unlock.subscribe((id) => chosen.push(id));
      const choice = choose(host, 1);
      expect(choice.textContent).toContain('cannot be moved later');
      (choice.querySelector('a') as HTMLAnchorElement).dispatchEvent(new MouseEvent('click', { cancelable: true }));
      expect(chosen).toEqual(['with-task']);
    });

    it('opens the row an account unlocked, tags it, and stops offering the unlock anywhere else', () => {
      const host = create('account', { freeUnlock: spent('acme', 'with-task') });
      const row = rows(host)[1];
      expect(row.classList).not.toContain('cq-row--locked');
      expect(row.querySelector('[data-testid="company-question-unlocked"]')).not.toBeNull();
      expect(row.querySelector('.premium-locked')).toBeNull();
      expect(row.querySelector('.cq-row__practice a')?.getAttribute('href')).toBe('/react/coding/react-x');
      expect(host.querySelector('[data-testid="company-question-allowance"]')?.textContent).toContain('You opened question 2 with your free unlock');
      expect(host.querySelector('[data-testid="company-question-offer"] .cq-offer__title')?.textContent).toContain('Unlock all 2 Acme questions');
    });

    it('names the guide where an account already spent it and offers only Premium', () => {
      const host = create('account', { freeUnlock: spent('elevenlabs', 'some-question') });
      expect(host.querySelector('[data-testid="company-question-allowance"]')?.textContent).toContain('You used your free unlock in the ElevenLabs guide');
      const choice = choose(host, 1);
      expect(choice.querySelector('button')).toBeNull();
      expect(choice.textContent).toContain('Your free unlock is already used in the ElevenLabs guide');
    });

    it('shows the unlock running and failing on its row', () => {
      let host = create('account', { unlockState: { questionId: 'with-task', status: 'pending' } });
      let button = choose(host, 1).querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
      expect(button.textContent?.trim()).toBe('Opening…');
      TestBed.resetTestingModule();
      host = create('account', { unlockState: { questionId: 'with-task', status: 'error' } });
      expect(choose(host, 1).querySelector('[data-testid="company-question-unlock-error"]')).not.toBeNull();
    });
  });
});
