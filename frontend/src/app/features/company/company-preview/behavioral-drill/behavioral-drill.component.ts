import { ChangeDetectionStrategy, Component, Input, afterNextRender, computed, signal } from '@angular/core';
import { BehavioralDrill, BehavioralDrillQuestion } from '../../../../shared/company-previews/authored-company-preview.model';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaFieldComponent } from '../../../../shared/ui/field/fa-field.component';

export type BehavioralDrillShape = 'star' | 'car';
type Part = 'situation' | 'task' | 'context' | 'action' | 'result' | 'answer';
type Story = Partial<Record<Part, string>> & { readonly checked?: readonly number[] };

/** What the reader wrote for one company: the question last picked, the shape, and a story per question. */
export type BehavioralDrillDraft = {
  readonly question: string;
  readonly shape: BehavioralDrillShape;
  readonly stories: Readonly<Record<string, Story>>;
};

const PART_KEYS: readonly Part[] = ['situation', 'task', 'context', 'action', 'result', 'answer'];
const ACTION_HINT = 'What you did, step by step, in the first person.';
const RESULT_HINT = 'What changed, with a number if there is one, and what you learned.';
const PARTS: Readonly<Record<BehavioralDrillShape, readonly { key: Part; label: string; hint: string }[]>> = {
  star: [
    { key: 'situation', label: 'Situation', hint: 'One or two sentences: where you were and what was at stake.' },
    { key: 'task', label: 'Task', hint: 'What you had to achieve, and why it fell to you.' },
    { key: 'action', label: 'Action', hint: ACTION_HINT },
    { key: 'result', label: 'Result', hint: RESULT_HINT },
  ],
  car: [
    { key: 'context', label: 'Context', hint: 'The situation and your goal, in two or three sentences.' },
    { key: 'action', label: 'Action', hint: ACTION_HINT },
    { key: 'result', label: 'Result', hint: RESULT_HINT },
  ],
};

// A view or a reason has no situation to tell; its answer leads with the view and backs it with examples.
const VIEW_PARTS: readonly { key: Part; label: string; hint: string }[] = [
  { key: 'answer', label: 'Your answer', hint: 'Your view in a sentence, then two reasons, each with an example from your own work.' },
];

/** The checks every story gets, before the company's own. */
export const BEHAVIORAL_DRILL_CHECKS: readonly string[] = [
  'It is one situation, and it answers the question asked.',
  'The actions say what I did; “we” only where the team acted.',
  'The result says what changed, and what I learned.',
  'I can answer “what would you do differently?”',
];

/** The checks every view or reason gets, before the company's own. */
export const BEHAVIORAL_DRILL_VIEW_CHECKS: readonly string[] = [
  'The first sentence answers the question.',
  'Each reason comes with an example from my own work.',
  'It names something specific to this company or team.',
];

// A relaxed speaking pace, so the estimate errs long.
const WORDS_PER_MINUTE = 130;

export function behavioralDrillKey(company: string): string {
  return `fa:behavioral-drill:v1:${company}`;
}

/** The saved draft for a company, or null when there is none or it cannot be read. */
export function readBehavioralDrill(company: string): BehavioralDrillDraft | null {
  try {
    const value = JSON.parse(localStorage.getItem(behavioralDrillKey(company)) ?? 'null');
    if (!value || typeof value !== 'object' || typeof value.question !== 'string') return null;
    const stories: Record<string, Story> = {};
    for (const [id, story] of Object.entries((value.stories ?? {}) as Record<string, unknown>)) {
      if (!story || typeof story !== 'object') continue;
      const raw = story as Record<string, unknown>;
      const parts = Object.fromEntries(PART_KEYS.filter((key) => typeof raw[key] === 'string').map((key) => [key, raw[key] as string]));
      const checked = Array.isArray(raw['checked']) ? raw['checked'].filter((index): index is number => Number.isInteger(index)) : [];
      stories[id] = { ...parts, checked };
    }
    return { question: value.question, shape: value.shape === 'car' ? 'car' : 'star', stories };
  } catch {
    return null;
  }
}

const times = (count: number) => (count === 0 ? 'not at all' : count === 1 ? 'once' : `${count} times`);
const minutesLabel = (minutes: number) => {
  if (minutes <= 0.5) return 'half a minute';
  if (minutes === 1) return 'a minute';
  if (minutes === 1.5) return 'a minute and a half';
  return Number.isInteger(minutes) ? `${minutes} minutes` : `${Math.floor(minutes)} and a half minutes`;
};

/**
 * A behavioural question practised in writing: pick one of the company's questions, tell one story in the STAR or
 * CAR parts (or, for a question that asks for a view, answer in one field), read what the text itself shows (length,
 * "we" against "I", a number in the result), then tick the checks. On a gated guide a visitor without an account practises the first question; the page projects its free
 * account card under the list ([drillGate]). The draft stays on this device and is read once the page is in the
 * browser, so the server HTML and the first render match.
 */
@Component({
  selector: 'app-behavioral-drill',
  imports: [FaButtonComponent, FaFieldComponent],
  templateUrl: './behavioral-drill.component.html',
  styleUrls: ['./behavioral-drill.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehavioralDrillComponent {
  private readonly drillSignal = signal<BehavioralDrill | null>(null);
  private readonly open = signal(Number.POSITIVE_INFINITY);

  @Input({ required: true }) set drill(value: BehavioralDrill) {
    this.drillSignal.set(value);
  }
  /** The guide's slug: ids on the page and the draft's key. */
  @Input({ required: true }) company!: string;
  /** How many questions this reader can pick, in order; the rest show under the blur. */
  @Input() set openQuestions(value: number) {
    this.open.set(value);
  }

  private readonly picked = signal<string | null>(null);
  readonly shape = signal<BehavioralDrillShape>('star');
  private readonly stories = signal<Readonly<Record<string, Story>>>({});

  readonly questions = computed(() => this.drillSignal()?.questions ?? []);
  readonly note = computed(() => this.drillSignal()?.note ?? '');

  /** The picked question while it is open to this reader, otherwise the first one. */
  readonly question = computed<BehavioralDrillQuestion | null>(() => {
    const questions = this.questions();
    const index = questions.findIndex((question) => question.id === this.picked());
    return questions[index >= 0 && !this.locked(index) ? index : 0] ?? null;
  });

  /** A view or a reason is answered in one field; a story in the parts of the shape picked. */
  readonly isView = computed(() => this.question()?.kind === 'view');
  readonly parts = computed(() => (this.isView() ? VIEW_PARTS : PARTS[this.shape()]));
  readonly checks = computed(() => [
    ...(this.isView() ? BEHAVIORAL_DRILL_VIEW_CHECKS : BEHAVIORAL_DRILL_CHECKS),
    ...(this.drillSignal()?.checks ?? []),
  ]);
  readonly story = computed<Story>(() => this.stories()[this.question()?.id ?? ''] ?? {});

  /** What the text itself shows, for the reader to weigh; nothing here is a score. */
  readonly notes = computed(() => {
    const story = this.story();
    const words = this.parts().map((part) => story[part.key] ?? '').join(' ').split(/\s+/).filter(Boolean).length;
    if (!words) return [];
    const notes = [`About ${words} ${words === 1 ? 'word' : 'words'}: about ${minutesLabel(Math.max(0.5, Math.round((words / WORDS_PER_MINUTE) * 2) / 2))} out loud.`];
    const action = story.action ?? '';
    const we = (action.match(/\b(we|our|us)\b/gi) ?? []).length;
    const me = (action.match(/\bI\b|\b(my|me)\b/g) ?? []).length;
    if (we >= 2 && we > me) notes.push(`The actions say “we” ${times(we)} and “I” ${times(me)}: say what you did.`);
    const result = (story.result ?? '').trim();
    if (result.split(/\s+/).length >= 4 && !/\d/.test(result)) {
      notes.push('The result has no number yet: a time saved, a count or a percentage makes it concrete.');
    }
    return notes;
  });

  constructor() {
    afterNextRender(() => {
      const draft = readBehavioralDrill(this.company);
      if (!draft) return;
      this.picked.set(draft.question);
      this.shape.set(draft.shape);
      this.stories.set(draft.stories);
    });
  }

  locked(index: number): boolean {
    return index >= this.open();
  }

  id(suffix: string): string {
    return `${this.company}-drill-${suffix}`;
  }

  pick(id: string): void {
    this.picked.set(id);
    this.save();
  }

  setShape(shape: BehavioralDrillShape): void {
    this.shape.set(shape);
    this.save();
  }

  setPart(key: Part, event: Event): void {
    this.update({ [key]: (event.target as HTMLTextAreaElement).value });
  }

  checked(index: number): boolean {
    return this.story().checked?.includes(index) ?? false;
  }

  toggleCheck(index: number): void {
    const checked = this.story().checked ?? [];
    this.update({ checked: checked.includes(index) ? checked.filter((item) => item !== index) : [...checked, index].sort((a, b) => a - b) });
  }

  /** Clears the story for the picked question only; the other questions keep theirs. */
  clear(): void {
    const id = this.question()?.id;
    if (!id) return;
    this.stories.update((current) => {
      const rest = { ...current };
      delete rest[id];
      return rest;
    });
    this.save();
  }

  private update(change: Partial<Story>): void {
    const id = this.question()?.id;
    if (!id) return;
    this.stories.update((current) => ({ ...current, [id]: { ...current[id], ...change } }));
    this.save();
  }

  private save(): void {
    const question = this.question();
    if (!question) return;
    const draft: BehavioralDrillDraft = { question: question.id, shape: this.shape(), stories: this.stories() };
    try {
      localStorage.setItem(behavioralDrillKey(this.company), JSON.stringify(draft));
    } catch {
      // A full or blocked storage keeps the story for this visit only.
    }
  }
}
