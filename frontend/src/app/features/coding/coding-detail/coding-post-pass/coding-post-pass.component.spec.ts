import { TestBed } from '@angular/core/testing';
import { CodingPostPassComponent, type PostPassCard, type PostPassReward } from './coding-post-pass.component';

describe('CodingPostPassComponent', () => {
  const render = (card: PostPassCard, reward: PostPassReward | null) => {
    const fixture = TestBed.createComponent(CodingPostPassComponent);
    fixture.componentRef.setInput('card', card);
    fixture.componentRef.setInput('reward', reward);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CodingPostPassComponent] }).compileComponents();
  });

  it('tells an account what the solve earned beside "Saved as solved"', () => {
    const host = render('saved', { xp: 20, streak: 3 });

    expect(host.querySelector('[role="status"]')?.textContent).toContain('Saved as solved.');
    expect(host.querySelector('[data-testid="coding-post-pass-reward"]')?.textContent?.trim()).toBe('+20 XP · 3-day streak');
  });

  it('shows no reward to a guest, or for a task solved before', () => {
    expect(render('guest', { xp: 20, streak: 1 }).querySelector('[data-testid="coding-post-pass-reward"]')).toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CodingPostPassComponent] });
    expect(render('saved', { xp: 0, streak: 4 }).querySelector('[data-testid="coding-post-pass-reward"]')).toBeNull();
  });
});
