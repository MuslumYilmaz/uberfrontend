// Wrong (round agent 08, with the task's fake latency): no request identity and no abort, so a late san response
// replaces newer results.
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

  const listboxId = 'autocomplete-listbox';
  const labelId = 'autocomplete-label';

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
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

    const timer = window.setTimeout(async () => {
      try {
        const items = await searchCities(trimmed, new AbortController().signal);
        setResults(items);
        setStatus(items.length ? 'success' : 'empty');
      } catch {
        setStatus('error');
      }
    }, 250);
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
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (status !== 'success' || visibleResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectOption(visibleResults[activeIndex]);
    }
  }

  function selectOption(value: string) {
    if (status !== 'success' || !results.includes(value)) return;
    setQuery(value);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  async function searchCities(rawQuery: string, signal: AbortSignal): Promise<string[]> {
    void signal;
    await new Promise((resolve) => setTimeout(resolve, rawQuery.trim().toLowerCase() === 'san' ? 900 : 50));
    if (rawQuery.toLowerCase() === 'error') throw new Error('Search failed');
    return CITIES.filter((city) => city.toLowerCase().includes(rawQuery.toLowerCase())).slice(0, 8);
  }

  function optionId(item: string): string {
    return 'autocomplete-option-' + item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderHighlighted(item: string, rawQuery: string) {
    const q = rawQuery.trim().toLowerCase();
    const at = q ? item.toLowerCase().indexOf(q) : -1;
    if (at < 0) return item;
    return (<>{item.slice(0, at)}<mark>{item.slice(at, at + q.length)}</mark>{item.slice(at + q.length)}</>);
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
