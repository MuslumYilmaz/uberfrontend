import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FaRotatingWordsComponent } from './fa-rotating-words.component';

@Component({
  imports: [FaRotatingWordsComponent],
  template: `<fa-rotating-words [words]="words" [intervalMs]="1000" [paused]="paused()" [(index)]="index"></fa-rotating-words>`,
})
class HostComponent {
  readonly words = ['Agoda', 'Stripe', 'Walmart'];
  readonly paused = signal(false);
  readonly index = signal(0);
}

@Component({
  imports: [FaRotatingWordsComponent],
  template: `
    <fa-rotating-words [words]="words" [intervalMs]="1000" [(index)]="first"></fa-rotating-words>
    <fa-rotating-words [words]="words" [intervalMs]="1000" [startDelayMs]="500" [(index)]="second"></fa-rotating-words>
  `,
})
class TwoSentencesHostComponent {
  readonly words = ['Agoda', 'Stripe', 'Walmart'];
  readonly first = signal(0);
  readonly second = signal(0);
}

describe('FaRotatingWordsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function setup(reducedMotion = false) {
    spyOn(window, 'matchMedia').and.returnValue({ matches: reducedMotion } as MediaQueryList);
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  }

  it('draws every word and shows the first, hidden from screen readers', () => {
    setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(Array.from(host.querySelectorAll('.fa-rotating-words__word')).map((word) => word.textContent)).toEqual(['Agoda', 'Stripe', 'Walmart']);
    expect(host.querySelector('.fa-rotating-words__window')?.getAttribute('aria-hidden')).toBe('true');
    expect((host.querySelector('.fa-rotating-words__track') as HTMLElement).style.transform).toBe('translateY(0%)');
    fixture.destroy();
  });

  it('moves on a timer, wraps around and moves the track by a full word', fakeAsync(() => {
    setup();
    tick(1000);
    expect(fixture.componentInstance.index()).toBe(1);
    fixture.detectChanges();
    const track = (fixture.nativeElement as HTMLElement).querySelector('.fa-rotating-words__track') as HTMLElement;
    expect(track.style.transform).toContain('33.3');
    tick(2000);
    expect(fixture.componentInstance.index()).toBe(0);
    fixture.destroy();
  }));

  it('holds the word while paused and carries on after', fakeAsync(() => {
    setup();
    fixture.componentInstance.paused.set(true);
    fixture.detectChanges();
    tick(3000);
    expect(fixture.componentInstance.index()).toBe(0);
    fixture.componentInstance.paused.set(false);
    fixture.detectChanges();
    tick(1000);
    expect(fixture.componentInstance.index()).toBe(1);
    fixture.destroy();
  }));

  it('takes turns with another sentence when its start is delayed', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const pair = TestBed.createComponent(TwoSentencesHostComponent);
    pair.detectChanges();
    const indexes = () => [pair.componentInstance.first(), pair.componentInstance.second()];
    tick(1000);
    expect(indexes()).toEqual([1, 0]);
    tick(500);
    expect(indexes()).toEqual([1, 1]);
    tick(500);
    expect(indexes()).toEqual([2, 1]);
    pair.destroy();
  }));

  it('never moves for someone who prefers reduced motion', fakeAsync(() => {
    setup(true);
    tick(5000);
    expect(fixture.componentInstance.index()).toBe(0);
    fixture.destroy();
  }));

  it('stops the timer when it leaves the page', fakeAsync(() => {
    setup();
    fixture.destroy();
    tick(5000);
    expect(fixture.componentInstance.index()).toBe(0);
  }));
});
