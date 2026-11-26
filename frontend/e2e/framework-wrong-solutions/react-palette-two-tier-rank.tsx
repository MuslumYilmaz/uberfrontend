// Wrong (task 1): only titles that start with the query rank first; a word that starts with it counts as any other match.
import React, { useEffect, useState } from 'react';
import './App.css';

export interface Command {
  id: string;
  title: string;
}

export interface DocumentHit {
  id: string;
  title: string;
}

/** The app's commands, in the order the palette lists equal matches. */
export const COMMANDS: Command[] = [
  { id: 'new-page', title: 'New page' },
  { id: 'rename-page', title: 'Rename page' },
  { id: 'duplicate-page', title: 'Duplicate page' },
  { id: 'add-tag', title: 'Add new tag' },
  { id: 'new-database', title: 'New database' },
  { id: 'dark-mode', title: 'Toggle dark mode' },
  { id: 'settings', title: 'Settings' },
  { id: 'export-pdf', title: 'Export as PDF' },
  { id: 'renew', title: 'Renew subscription' },
];

/** How long typing must pause before the palette searches documents, in milliseconds. */
export const DEBOUNCE_MS = 150;

/** "Today" for the date phrases: Thursday, 12 March 2026, in local time. */
export const TODAY = new Date(2026, 2, 12);

const DOCUMENTS: DocumentHit[] = [
  { id: 'doc-planning', title: 'Planning notes' },
  { id: 'doc-plugins', title: 'Plugin list' },
  { id: 'doc-launch-plan', title: 'Launch plan' },
  { id: 'doc-launch-retro', title: 'Launch retro' },
  { id: 'doc-pricing', title: 'Pricing page draft' },
  { id: 'doc-playbook', title: 'Team playbook' },
  { id: 'doc-today', title: 'Notes for today' },
];

/**
 * The document search API. A query of one or two characters takes 500 ms and a longer one 120 ms, so answers can
 * arrive in a different order from the requests. A query containing `pdf` fails. An aborted request rejects with an
 * `AbortError`.
 */
export function searchDocuments(query: string, signal?: AbortSignal): Promise<DocumentHit[]> {
  return new Promise((resolve, reject) => {
    const aborted = () => reject(new DOMException('The search was aborted', 'AbortError'));
    if (signal?.aborted) {
      aborted();
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      const needle = query.trim().toLowerCase();
      if (needle.includes('pdf')) reject(new Error('Search is unavailable'));
      else resolve(DOCUMENTS.filter((hit) => hit.title.toLowerCase().includes(needle)));
    }, query.trim().length <= 2 ? 500 : 120);
    const onAbort = () => {
      window.clearTimeout(timer);
      aborted();
    };
    signal?.addEventListener('abort', onAbort);
  });
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The date a phrase names, counted from `today`: `today`, `tomorrow`, `in N days` or `next <weekday>`. */
export function parseDate(phrase: string, today: Date): Date | null {
  const text = phrase.trim().toLowerCase();
  if (text === 'today') return today;
  if (text === 'tomorrow') return addDays(today, 1);
  const inDays = /^in (\d{1,3}) days?$/.exec(text);
  if (inDays) return addDays(today, Number(inDays[1]));
  const next = /^next ([a-z]+)$/.exec(text);
  if (next) {
    const day = WEEKDAYS.indexOf(next[1]);
    // The first such weekday after today: on a Thursday, `next thursday` is a week away.
    if (day >= 0) return addDays(today, (day - today.getDay() + 7) % 7 || 7);
  }
  return null;
}

/** 0 for a prefix match, 1 for a word that starts with the query, 2 for a match anywhere else, -1 for none. */
function rank(title: string, query: string): number {
  const text = title.toLowerCase();
  if (text.startsWith(query)) return 0;
  return text.includes(query) ? 2 : -1;
}

type Option = { id: string; source: 'command' | 'date' | 'document'; label: string; action: string };
type Documents = { status: 'idle' | 'loading' | 'done' | 'error'; hits: DocumentHit[] };

const pad = (value: number) => String(value).padStart(2, '0');

export default function App() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [documents, setDocuments] = useState<Documents>({ status: 'idle', hits: [] });
  const [lastAction, setLastAction] = useState('');

  const needle = query.trim().toLowerCase();

  // One document search per pause in typing. The cleanup cancels the timer and the request, so only the
  // latest query can set the results.
  useEffect(() => {
    if (!needle) {
      setDocuments({ status: 'idle', hits: [] });
      return undefined;
    }
    setDocuments({ status: 'loading', hits: [] });
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchDocuments(needle, controller.signal).then(
        (hits) => setDocuments({ status: 'done', hits }),
        (error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setDocuments({ status: 'error', hits: [] });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [needle]);

  const commands: Option[] = needle
    ? COMMANDS.map((command, order) => ({ command, order, score: rank(command.title, needle) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score || a.order - b.order)
      .map(({ command }) => ({ id: `option-command-${command.id}`, source: 'command', label: command.title, action: `Ran: ${command.title}` }))
    : [];
  const date = needle ? parseDate(needle, TODAY) : null;
  const dates: Option[] = date
    ? [{
      id: 'option-date',
      source: 'date',
      label: `Jump to ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
      action: `Jumped to ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    }]
    : [];
  const hits: Option[] = documents.hits.map((hit) => ({ id: `option-document-${hit.id}`, source: 'document', label: hit.title, action: `Opened: ${hit.title}` }));
  const options = [...commands, ...dates, ...hits];
  const current = options.length ? options[Math.min(active, options.length - 1)] : null;

  const choose = (option: Option) => setLastAction(option.action);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const count = options.length;
    if (event.key === 'Escape') {
      setQuery('');
      setActive(0);
    } else if (!count) {
      return;
    } else if (event.key === 'ArrowDown') {
      setActive((index) => (Math.min(index, count - 1) + 1) % count);
    } else if (event.key === 'ArrowUp') {
      setActive((index) => (Math.min(index, count - 1) - 1 + count) % count);
    } else if (event.key === 'Home') {
      setActive(0);
    } else if (event.key === 'End') {
      setActive(count - 1);
    } else if (event.key === 'Enter' && current) {
      choose(current);
    } else {
      return;
    }
    event.preventDefault();
  };

  const section = (source: Option['source'], heading: string, list: Option[]) => (list.length > 0 && (
    <div className="palette-section" data-source={source} role="group" aria-label={heading}>
      <p className="palette-heading" aria-hidden="true">{heading}</p>
      {list.map((option) => (
        <div
          key={option.id}
          id={option.id}
          className="palette-option"
          role="option"
          data-source={option.source}
          aria-selected={option.id === current?.id}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => choose(option)}
        >
          {option.label}
        </div>
      ))}
    </div>
  ));

  return (
    <main className="palette">
      <label className="palette-label" htmlFor="palette-input">Search commands, dates and documents</label>
      <input
        id="palette-input"
        className="palette-input"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls="palette-list"
        aria-autocomplete="list"
        aria-activedescendant={current?.id}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      {options.length > 0 && (
        <div id="palette-list" className="palette-list" role="listbox" aria-label="Results">
          {section('command', 'Commands', commands)}
          {section('date', 'Dates', dates)}
          {section('document', 'Documents', hits)}
        </div>
      )}
      {documents.status === 'loading' && <p className="palette-loading" role="status">Searching documents…</p>}
      {documents.status === 'error' && <p className="palette-error" role="alert">Could not search documents</p>}
      {documents.status === 'done' && options.length === 0 && <p className="palette-empty">No results</p>}
      <p className="last-action" role="status">{lastAction}</p>
    </main>
  );
}
