// Wrong (round agent 03, with the task's fake latency): cleans up the debounce timer only, with no request identity
// and no abort.
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const CITIES: string[] = [
  'Amsterdam', 'Ankara', 'Athens', 'Austin',
  'Barcelona', 'Berlin', 'Boston', 'Brussels',
  'Chicago', 'Copenhagen',
  'Dubai',
  'Edinburgh',
  'Frankfurt',
  'Hamburg',
  'Istanbul', 'Izmir',
  'London', 'Los Angeles',
  'Madrid', 'Miami', 'Milan', 'Munich',
  'New York',
  'Oslo',
  'Paris', 'Prague',
  'Rome',
  'San Diego', 'San Francisco', 'San Jose', 'Seattle', 'Seoul',
  'Tokyo',
  'Vienna',
  'Zurich'
];

type Status = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export default function App() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestSeqRef = useRef(0);
  const skipNextSearchRef = useRef(false);

  const listboxId = 'autocomplete-listbox';
  const labelId = 'autocomplete-label';

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setStatus('idle');
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setResults([]);
    setStatus('loading');
    setIsOpen(true);
    setActiveIndex(-1);

    // "Tempting wrong" version: debounce cleanup only, no request id, no abort.
    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchCities(trimmed, new AbortController().signal);
        setResults(matches);
        setStatus(matches.length ? 'success' : 'empty');
      } catch (err) {
        setResults([]);
        setStatus('error');
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      const target = event.target as Node | null;
      if (!root || !target || root.contains(target)) return;
      setIsOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown);
  }, []);

  function handleInputChange(value: string) {
    // Invalidate first so an old async continuation cannot win between this event and effect cleanup.
    requestSeqRef.current += 1;
    skipNextSearchRef.current = false;
    setQuery(value);
    setResults([]);
    setActiveIndex(-1);

    if (value.trim()) {
      setStatus('loading');
      setIsOpen(true);
    } else {
      setStatus('idle');
      setIsOpen(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = visibleResults.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!count) return;
      setActiveIndex((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!count) return;
      setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && visibleResults[activeIndex]) {
        event.preventDefault();
        selectOption(visibleResults[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function selectOption(value: string) {
    if (status !== 'success' || !results.includes(value)) return;
    requestSeqRef.current += 1;
    skipNextSearchRef.current = value !== query;
    setQuery(value);
    setResults([]);
    setStatus('idle');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  async function searchCities(rawQuery: string, signal: AbortSignal): Promise<string[]> {
    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(resolve, rawQuery.trim().toLowerCase() === 'san' ? 900 : 50);
      signal.addEventListener('abort', () => {
        window.clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
    if (rawQuery.toLowerCase() === 'error') throw new Error('Search failed');
    return CITIES.filter((city) => city.toLowerCase().includes(rawQuery.toLowerCase())).slice(0, 8);
  }

  function optionId(item: string): string {
    return 'autocomplete-option-' + item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderHighlighted(item: string, rawQuery: string) {
    const q = rawQuery.trim();
    if (!q) return item;
    const start = item.toLowerCase().indexOf(q.toLowerCase());
    if (start === -1) return item;
    return (
      <>
        {item.slice(0, start)}
        <mark>{item.slice(start, start + q.length)}</mark>
        {item.slice(start + q.length)}
      </>
    );
  }

  const visibleResults = status === 'success' ? results : [];
  const activeId = activeIndex >= 0 && visibleResults[activeIndex]
    ? optionId(visibleResults[activeIndex])
    : undefined;

  return (
    <main className="page">
      <section className="card" aria-labelledby="autocomplete-title">
        <div className="heading">
          <p className="eyebrow">React autocomplete interview question</p>
          <h1 id="autocomplete-title" className="title">Autocomplete search</h1>
          <p className="intro">Build debounce, stale-response handling, keyboard navigation, ARIA, and tests.</p>
        </div>

        <div ref={rootRef} className="combo">
          <label id={labelId} className="label" htmlFor="autocomplete-query">Search cities</label>
          <input
            ref={inputRef}
            id="autocomplete-query"
            className="input"
            role="combobox"
            aria-labelledby={labelId}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            type="text"
            autoComplete="off"
            placeholder="Type san, sea, lon, or error"
            value={query}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          {isOpen && (
            <ul className="list" id={listboxId} role="listbox" aria-label="City suggestions">
              {visibleResults.map((item, index) => (
                <li
                  key={item}
                  id={optionId(item)}
                  className={index === activeIndex ? 'option active' : 'option'}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectOption(item);
                  }}
                >
                  {renderHighlighted(item, query)}
                </li>
              ))}
              {status === 'loading' && <li className="status">Loading suggestions for "{query.trim()}"...</li>}
              {status === 'empty' && <li className="status">No results</li>}
              {status === 'error' && <li className="status status--error">Search failed. Try a different query.</li>}
            </ul>
          )}
        </div>

        <p className="hint">Keep focus on the input. Use ArrowUp, ArrowDown, Enter, and Escape.</p>
      </section>
    </main>
  );
}
