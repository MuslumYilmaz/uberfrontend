import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { FaButtonComponent } from '../../shared/ui/button/fa-button.component';
import { FaRotatingWordsComponent } from '../../shared/ui/rotating-words/fa-rotating-words.component';

type PracticeTopic = { readonly label: string; readonly sub: string; readonly path: string; readonly query: Params | null };

/** What the sentence offers, in the order it rotates. Each one opens a page where solving starts at once. */
const TOPICS: readonly PracticeTopic[] = [
  { label: 'JavaScript', sub: 'Async, closures and utilities, checked in your browser.', path: '/coding', query: { tech: 'javascript' } },
  { label: 'React', sub: 'Hooks, state and components in a live workspace.', path: '/coding', query: { tech: 'react' } },
  { label: 'Angular', sub: 'RxJS, forms and components in a live workspace.', path: '/coding', query: { tech: 'angular' } },
  { label: 'Vue', sub: 'Reactivity and components in a live workspace.', path: '/coding', query: { tech: 'vue' } },
  { label: 'System design', sub: 'Frontend architecture: state, APIs, caching and performance.', path: '/system-design', query: null },
  { label: 'Tradeoffs', sub: 'Choose between real options and defend the choice.', path: '/tradeoffs', query: null },
  { label: 'Incidents', sub: 'Debug production-style failures step by step.', path: '/incidents', query: null },
];

const PLAN_PATH = '/tracks/foundations-30d/preview';

/** The home page card that sends someone straight to practice: a sentence that rotates through topics, and a list. */
@Component({
  selector: 'app-showcase-practice-card',
  imports: [RouterLink, FaButtonComponent, FaRotatingWordsComponent],
  templateUrl: './showcase-practice-card.component.html',
  styleUrls: ['./showcase-practice-card.component.css'],
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ShowcasePracticeCardComponent {
  readonly topics = TOPICS;
  readonly labels = TOPICS.map((topic) => topic.label);
  readonly planPath = PLAN_PATH;

  readonly index = signal(0);
  readonly open = signal(false);
  readonly hovering = signal(false);
  readonly focused = signal(false);
  /** The sentence holds still while the person points at the card, works in it or reads the list. */
  readonly paused = computed(() => this.hovering() || this.focused() || this.open());
  readonly topic = computed(() => TOPICS[this.index()]);

  private readonly analytics = inject(AnalyticsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly slotButton = viewChild<ElementRef<HTMLButtonElement>>('slotButton');

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(returnFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.slotButton()?.nativeElement.focus();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.querySelector('.practice-slot')?.contains(event.target as Node)) this.close(false);
  }

  started(topic: PracticeTopic, surface: 'practice_card' | 'topic_menu'): void {
    this.open.set(false);
    const route = topic.query ? `${topic.path}?tech=${topic.query['tech']}` : topic.path;
    this.analytics.track('lp_primary_cta_clicked', { src: 'lp_hero', surface, route });
  }

  planClicked(): void {
    this.analytics.track('lp_secondary_cta_clicked', { src: 'lp_hero', destination: 'foundations_30d_preview', route: PLAN_PATH });
  }
}
